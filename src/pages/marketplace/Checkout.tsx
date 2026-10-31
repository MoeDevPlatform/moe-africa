import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Plus } from "lucide-react";
import { ordersService, paymentsService, paymentMethodsService, type PaymentGatewayAvailability, type PaymentMethodApi } from "@/lib/apiServices";

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
type CheckoutPaymentChoice = "card" | "paystack" | "flutterwave" | "bank_transfer" | "cod";

function isGatewayCheckoutUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return (
      host === "paystack.com" ||
      host.endsWith(".paystack.com") ||
      host === "flutterwave.com" ||
      host.endsWith(".flutterwave.com")
    );
  } catch {
    return false;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentChoice>("paystack");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethodApi[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [unpaidOrderId, setUnpaidOrderId] = useState<string | null>(null);
  const [gateways, setGateways] = useState<PaymentGatewayAvailability>({
    paystack: false,
    flutterwave: false,
    mode: "test",
  });
  const [gatewaysLoaded, setGatewaysLoaded] = useState(false);
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

  const cardGateway: "paystack" | "flutterwave" | null = gateways.paystack
    ? "paystack"
    : gateways.flutterwave
      ? "flutterwave"
      : null;

  useEffect(() => {
    let cancelled = false;
    paymentsService
      .gateways()
      .then((availability) => {
        if (!cancelled) setGateways(availability);
      })
      .catch(() => {
        if (!cancelled) {
          setGateways({ paystack: false, flutterwave: false, mode: "test" });
        }
      })
      .finally(() => {
        if (!cancelled) setGatewaysLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gatewaysLoaded) return;
    setPaymentMethod((current) => {
      if (current === "paystack" && !gateways.paystack) {
        return gateways.flutterwave ? "flutterwave" : "bank_transfer";
      }
      if (current === "flutterwave" && !gateways.flutterwave) {
        return gateways.paystack ? "paystack" : "bank_transfer";
      }
      if (current === "card" && !cardGateway) return "bank_transfer";
      return current;
    });
  }, [gatewaysLoaded, gateways.paystack, gateways.flutterwave, cardGateway]);

  useEffect(() => {
    if (paymentMethod !== "card") return;
    let cancelled = false;
    setCardsLoading(true);
    paymentMethodsService
      .list()
      .then((cards) => {
        if (!cancelled) setSavedCards(cards);
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
  const onlineChoice =
    paymentMethod === "paystack" || paymentMethod === "flutterwave" || paymentMethod === "card";

  const placeOrder = async (
    values: CheckoutFormValues,
    gatewayOverride?: "paystack" | "flutterwave",
  ) => {
    if (cartItems.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }
    const choice: CheckoutPaymentChoice = gatewayOverride ?? paymentMethod;
    const onlineGateway: "paystack" | "flutterwave" | null =
      choice === "paystack"
        ? "paystack"
        : choice === "flutterwave"
          ? "flutterwave"
          : choice === "card"
            ? cardGateway
            : null;
    if ((choice === "paystack" || choice === "flutterwave" || choice === "card") && !onlineGateway) {
      toast({ title: "That payment method is unavailable", variant: "destructive" });
      return;
    }
    if (onlineGateway === "paystack" && !gateways.paystack) {
      toast({ title: "Paystack is unavailable", variant: "destructive" });
      return;
    }
    if (onlineGateway === "flutterwave" && !gateways.flutterwave) {
      toast({ title: "Flutterwave is unavailable", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let orderId = unpaidOrderId;
      if (!orderId) {
        const order = await ordersService.create({
          items: cartItems.map((item) => ({
            productId: String(item.productId),
            quantity: item.quantity,
            selectedVariations: item.selectedVariations ?? item.selectedVariants,
            selectedVariants: item.selectedVariants,
            customisation: item.customisation,
            rushOrder: item.rushOrder === true,
          })),
          shippingAddress: {
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            address: values.address,
            addressLine1: values.address,
            city: values.city,
            state: values.state,
            country: values.country,
          },
          paymentMethod: onlineGateway ?? (choice === "bank_transfer" ? "bank_transfer" : "cod"),
          currency: "NGN",
        });
        orderId = String(order.id);
        if (onlineGateway) setUnpaidOrderId(orderId);
      }

      if (!onlineGateway) {
        clearCart();
        navigate(`/marketplace/order-confirmation/${orderId}`);
        return;
      }

      const started = await paymentsService.initialize({
        orderId,
        gateway: onlineGateway,
        saveCard,
        cardOnly: choice === "card" || gatewayOverride != null,
      });
      if (started.alreadyPaid || started.status === "success") {
        clearCart();
        setUnpaidOrderId(null);
        navigate(`/marketplace/order-confirmation/${orderId}`);
        return;
      }
      if (!started.paymentUrl || !isGatewayCheckoutUrl(started.paymentUrl)) {
        setUnpaidOrderId(orderId);
        throw new Error("Secure checkout link was not returned.");
      }
      sessionStorage.setItem(
        "moe_payment",
        JSON.stringify({
          orderId,
          gateway: onlineGateway,
          reference: started.reference ?? "",
        }),
      );
      clearCart();
      window.location.assign(started.paymentUrl);
    } catch (err: unknown) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Could not place order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit((values) => placeOrder(values))} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => {
                    setUnpaidOrderId(null);
                    setPaymentMethod(value as CheckoutPaymentChoice);
                  }}
                  aria-label="Payment method options"
                >
                  <div className={`flex items-center space-x-2 border rounded-lg p-4 ${!cardGateway ? "opacity-60" : ""}`} data-testid="payment-method-card">
                    <RadioGroupItem value="card" id="card" disabled={!cardGateway} />
                    <Label htmlFor="card" className={`flex-1 ${cardGateway ? "cursor-pointer" : "cursor-not-allowed"}`}>
                      Credit/Debit Card
                      {!cardGateway && gatewaysLoaded ? <span className="block text-xs text-muted-foreground">Unavailable</span> : null}
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-4 ${!gateways.paystack ? "opacity-60" : ""}`} data-testid="payment-method-paystack">
                    <RadioGroupItem value="paystack" id="paystack" disabled={!gateways.paystack} />
                    <Label htmlFor="paystack" className={`flex-1 ${gateways.paystack ? "cursor-pointer" : "cursor-not-allowed"}`}>
                      Pay with Paystack
                      {!gateways.paystack && gatewaysLoaded ? <span className="block text-xs text-muted-foreground">Unavailable</span> : null}
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-4 ${!gateways.flutterwave ? "opacity-60" : ""}`} data-testid="payment-method-flutterwave">
                    <RadioGroupItem value="flutterwave" id="flutterwave" disabled={!gateways.flutterwave} />
                    <Label htmlFor="flutterwave" className={`flex-1 ${gateways.flutterwave ? "cursor-pointer" : "cursor-not-allowed"}`}>
                      Pay with Flutterwave
                      {!gateways.flutterwave && gatewaysLoaded ? <span className="block text-xs text-muted-foreground">Unavailable</span> : null}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4" data-testid="payment-method-bank">
                    <RadioGroupItem value="bank_transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      Bank Transfer
                      <span className="block text-xs text-muted-foreground font-normal">Order stays unpaid until the transfer is confirmed.</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4" data-testid="payment-method-cod">
                    <RadioGroupItem value="cod" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      Pay on Delivery
                      <span className="block text-xs text-muted-foreground font-normal">Pay when your order arrives.</span>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && cardGateway && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Card details are entered on the secure {cardGateway === "paystack" ? "Paystack" : "Flutterwave"} page. MOE never sees the card number or CVV.
                    </p>
                    {cardsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading saved cards…</p>
                    ) : savedCards.length > 0 ? (
                      <div className="space-y-2" aria-label="Saved cards">
                        {savedCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center gap-3 border rounded-lg p-3 opacity-60"
                            aria-disabled="true"
                          >
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {card.brand} •••• {card.last4}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Not available for this checkout
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      data-testid="pay-with-new-card"
                      disabled={isSubmitting || cartItems.length === 0}
                      onClick={() => {
                        if (!cardGateway) return;
                        void handleSubmit((values) => placeOrder(values, cardGateway))();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Pay with a new card
                    </Button>
                  </div>
                )}

                {onlineChoice && (paymentMethod === "card" ? !!cardGateway : true) && (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="save-card"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(checked === true)}
                    />
                    <Label htmlFor="save-card" className="text-sm font-normal leading-snug">
                      Save this card for future payments after a successful payment. Only the provider token is stored.
                    </Label>
                  </div>
                )}

                {gatewaysLoaded && gateways.mode === "test" && onlineChoice && (
                  <p className="text-xs text-muted-foreground">Test mode — no live charge will be made.</p>
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

                <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
                  <p>🔒 Secure Checkout — Your payment details are encrypted.</p>
                  <p>📦 Order Protection — Covered if something goes wrong.</p>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    cartItems.length === 0 ||
                    (paymentMethod === "paystack" && !gateways.paystack) ||
                    (paymentMethod === "flutterwave" && !gateways.flutterwave) ||
                    (paymentMethod === "card" && !cardGateway)
                  }
                  className="w-full bg-primary hover:bg-primary-dark mt-4"
                  aria-label="Place your order"
                  data-testid="checkout-submit"
                >
                  {isSubmitting
                    ? onlineChoice
                      ? "Redirecting to secure checkout…"
                      : "Placing order…"
                    : paymentMethod === "card"
                      ? "Pay with a new card"
                      : paymentMethod === "paystack"
                        ? "Continue to Paystack"
                        : paymentMethod === "flutterwave"
                          ? "Continue to Flutterwave"
                          : "Place Order"}
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
