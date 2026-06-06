import { useState, useMemo, useEffect } from "react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries, getStatesByCountry } from "@/data/countryStateData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ordersService, paymentsService, paymentMethodsService, type PaymentMethodApi } from "@/lib/apiServices";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Plus } from "lucide-react";

const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s\-()]+$/, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Street address is required").max(200),
  country: z.string().min(1, "Select a country"),
  state: z.string().min(1, "Select a state or province"),
  city: z.string().trim().min(1, "City is required").max(80),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethodApi[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("new");
  const [cardsLoading, setCardsLoading] = useState(false);
  const { items: cartItems, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      country: "",
      state: "",
      city: "",
    },
  });

  const selectedCountry = watch("country");
  const states = useMemo(
    () => (selectedCountry ? getStatesByCountry(selectedCountry) : []),
    [selectedCountry],
  );

  useEffect(() => {
    if (paymentMethod !== "card") return;
    let cancelled = false;
    setCardsLoading(true);
    paymentMethodsService
      .list()
      .then((cards) => {
        if (cancelled) return;
        setSavedCards(cards);
        const def = cards.find((c) => c.isDefault) ?? cards[0];
        setSelectedCardId(def ? def.id : "new");
      })
      .catch(() => {
        if (!cancelled) setSavedCards([]);
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentMethod]);

  const subtotal = getTotalPrice();
  const deliveryFee = 2500;
  const total = subtotal + deliveryFee;

  const onSubmit = async (_values: CheckoutFormValues) => {
    if (cartItems.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      toast({ title: "Order placed", description: "We'll be in touch shortly." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstname">First Name <span className="text-destructive">*</span></Label>
                    <Input id="firstname" required aria-required="true" aria-invalid={!!errors.firstName} {...register("firstName")} />
                    {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastname">Last Name <span className="text-destructive">*</span></Label>
                    <Input id="lastname" required aria-required="true" aria-invalid={!!errors.lastName} {...register("lastName")} />
                    {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                  <Input id="phone" type="tel" required placeholder="+234" aria-required="true" aria-invalid={!!errors.phone} {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="address">Street Address <span className="text-destructive">*</span></Label>
                  <Input id="address" required aria-required="true" aria-invalid={!!errors.address} {...register("address")} />
                  {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
                </div>
                
                {/* Country Selection */}
                <div>
                  <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          setValue("state", "", { shouldValidate: false });
                        }}
                      >
                        <SelectTrigger id="country" aria-label="Select country" aria-invalid={!!errors.country}>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent className="bg-card max-h-60">
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.country && <p className="text-xs text-destructive mt-1">{errors.country.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input id="city" required aria-required="true" aria-invalid={!!errors.city} {...register("city")} />
                    {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="state">State / Province <span className="text-destructive">*</span></Label>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!selectedCountry}
                        >
                          <SelectTrigger id="state" aria-label="Select state or province" aria-invalid={!!errors.state}>
                            <SelectValue placeholder={selectedCountry ? "Select state" : "Select country first"} />
                          </SelectTrigger>
                          <SelectContent className="bg-card max-h-60">
                            {states.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} aria-label="Payment method options">
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex-1 cursor-pointer">
                      Pay with Paystack
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="flutterwave" id="flutterwave" />
                    <Label htmlFor="flutterwave" className="flex-1 cursor-pointer">
                      Pay with Flutterwave
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="bank_transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      Bank Transfer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="pay_on_delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      Pay on Delivery
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">Choose a card</Label>
                    {cardsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading saved cards…</p>
                    ) : (
                      <RadioGroup
                        value={selectedCardId}
                        onValueChange={setSelectedCardId}
                        aria-label="Saved cards"
                        className="space-y-2"
                      >
                        {savedCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center space-x-3 border rounded-lg p-3"
                          >
                            <RadioGroupItem value={card.id} id={`card-${card.id}`} />
                            <Label
                              htmlFor={`card-${card.id}`}
                              className="flex-1 cursor-pointer flex items-center gap-3"
                            >
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {card.brand} •••• {card.last4}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                exp {card.expiry}
                                {card.isDefault ? " · default" : ""}
                              </span>
                            </Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-3 border border-dashed rounded-lg p-3">
                          <RadioGroupItem value="new" id="card-new" />
                          <Label
                            htmlFor="card-new"
                            className="flex-1 cursor-pointer flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add new card
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length > 0 ? cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.productName} ×{item.quantity}</span>
                    <span className="font-medium">₦{(item.finalPrice * item.quantity).toLocaleString()}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₦{total.toLocaleString()}</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full bg-primary hover:bg-primary-dark mt-4"
                  aria-label="Place your order"
                >
                  {isSubmitting ? "Placing order…" : "Place Order"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By placing your order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default Checkout;
