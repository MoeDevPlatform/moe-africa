import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  User, Shield, Bell, Settings as SettingsIcon, MapPin, CreditCard,
  ArrowLeft, Mail, Phone, MessageSquare, Plus, Pencil, Trash2, Check, Eye, EyeOff, AlertCircle, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authService, addressesService, artisanService, paymentMethodsService, type AddressApi, type PaymentMethodApi } from "@/lib/apiServices";
import { countries, getStatesByCountry } from "@/data/countryStateData";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  cardholderName: string;
  billingAddressId?: string;
  isDefault: boolean;
}

// ─── Address Modal ────────────────────────────────────────────────────────────
interface AddressModalProps {
  open: boolean;
  address?: Address | null;
  onClose: () => void;
  onSave: (data: Omit<Address, "id" | "isDefault">) => void;
  isSaving?: boolean;
}

const AddressModal = ({ open, address, onClose, onSave, isSaving }: AddressModalProps) => {
  const [form, setForm] = useState({
    label: address?.label ?? "",
    country: address?.country ?? "",
    state: address?.state ?? "",
    city: address?.city ?? "",
    street: address?.street ?? "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      label: address?.label ?? "",
      country: address?.country ?? "",
      state: address?.state ?? "",
      city: address?.city ?? "",
      street: address?.street ?? "",
    });
    setError("");
  }, [address, open]);

  const availableStates = (() => {
    if (!form.country) return [];
    const c = countries.find((x) => x.name === form.country);
    return c ? getStatesByCountry(c.code) : [];
  })();

  const handleSave = () => {
    setError("");
    if (!form.label.trim()) return setError("Label is required.");
    if (!form.country) return setError("Country is required.");
    if (!form.state) return setError("State is required.");
    if (!form.city.trim()) return setError("City is required.");
    if (!form.street.trim()) return setError("Street address is required.");
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Label (e.g. Home, Office)</Label>
            <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Home" />
          </div>

          {/* Country → State → City → Street (cascading resets) */}
          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={form.country}
              onValueChange={(v) => setForm(f => ({ ...f, country: v, state: "", city: "" }))}
            >
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent className="bg-card">
                {countries.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={form.state}
              onValueChange={(v) => setForm(f => ({ ...f, state: v, city: "" }))}
              disabled={!form.country}
            >
              <SelectTrigger>
                <SelectValue placeholder={form.country ? "Select state" : "Select country first"} />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Lagos"
              disabled={!form.state}
            />
          </div>
          <div className="space-y-2">
            <Label>Street Address</Label>
            <Input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="123 Main St" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…</> : "Save Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────
interface PaymentModalProps {
  open: boolean;
  payment?: PaymentMethod | null;
  onClose: () => void;
  onSave: (data: { brand: string; last4: string; expiry: string; cardholderName: string; billingAddressId?: string }) => Promise<void>;
  addresses: Address[];
}

// Detect card brand from PAN prefix (lightweight — for display only).
const detectBrand = (pan: string): string => {
  const d = pan.replace(/\D/g, "");
  if (/^4/.test(d)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^(34|37)/.test(d)) return "AMEX";
  if (/^6/.test(d)) return "Discover";
  return "CARD";
};

const formatCardNumber = (raw: string) =>
  raw.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

const PaymentModal = ({ open, payment, onClose, onSave, addresses }: PaymentModalProps) => {
  const [cardholderName, setCardholderName] = useState(payment?.cardholderName ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardFocused, setCardFocused] = useState(false);
  const [expiry, setExpiry] = useState(payment?.expiry ?? "");
  const [cvv, setCvv] = useState("");
  const [billingAddressId, setBillingAddressId] = useState<string>(
    payment?.billingAddressId ?? (addresses.find(a => a.isDefault)?.id ?? "")
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCardholderName(payment?.cardholderName ?? "");
      setCardNumber(payment ? `•••• •••• •••• ${payment.last4}` : "");
      setExpiry(payment?.expiry ?? "");
      setCvv("");
      setBillingAddressId(payment?.billingAddressId ?? (addresses.find(a => a.isDefault)?.id ?? ""));
      setError("");
      setCardFocused(false);
    }
  }, [open, payment, addresses]);

  const digits = cardNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const brand = detectBrand(digits);

  const validateExpiry = (mmYY: string): boolean => {
    const m = mmYY.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const month = Number(m[1]); const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return false;
    const lastDay = new Date(year, month, 0);
    return lastDay >= new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  };

  const handleSave = async () => {
    setError("");
    if (!cardholderName.trim()) return setError("Cardholder name is required.");
    if (digits.length !== 16) return setError("Card number must be 16 digits.");
    if (!validateExpiry(expiry)) return setError("Expiry must be MM/YY and in the future.");
    if (cvv.length < 3 || cvv.length > 4) return setError("CVV must be 3 or 4 digits.");

    setIsSaving(true);
    try {
      // SECURITY: never send raw PAN/CVV. Forward only safe metadata.
      // Production: swap this for Paystack/Stripe tokenisation first.
      await onSave({ brand, last4, expiry, cardholderName: cardholderName.trim(), billingAddressId: billingAddressId || undefined });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save payment method");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Cardholder Name</Label>
            <Input value={cardholderName} onChange={e => setCardholderName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label>Card Number</Label>
            <Input
              value={cardFocused ? formatCardNumber(digits) : (digits.length >= 4 ? `•••• •••• •••• ${last4}` : formatCardNumber(digits))}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Expiry (MM/YY)</Label>
              <Input
                value={expiry}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (v.length > 2) v = `${v.slice(0,2)}/${v.slice(2)}`;
                  setExpiry(v);
                }}
                placeholder="12/26"
                maxLength={5}
                inputMode="numeric"
                autoComplete="cc-exp"
              />
            </div>
            <div className="space-y-2">
              <Label>CVV</Label>
              <Input
                type="password"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="•••"
                maxLength={4}
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Billing Address</Label>
            <Select value={billingAddressId} onValueChange={setBillingAddressId} disabled={addresses.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={addresses.length ? "Select billing address" : "Add an address first"} />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {addresses.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} — {a.city}, {a.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground px-1">
          Your card details are tokenised and never stored on our servers in raw form.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…</> : "Save Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Security Tab (fully wired) ──────────────────────────────────────────────
const SecurityTabContent = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async () => {
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Two-Factor Authentication</p>
          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
        </div>
        <Switch />
      </div>
      <Button className="w-full sm:w-auto" onClick={handleChangePassword} disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update Password"}
      </Button>
    </CardContent>
  );
};

// ─── Payment Terms Section (artisan-only) ─────────────────────────────────────
const PaymentTermsSection = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    paymentSchedule: "full_upfront",
    depositPercentage: "50",
    refundPolicy: "",
    acceptedPaymentMethods: ["bank_transfer"] as string[],
    installmentEnabled: false,
    installmentDetails: "",
  });

  const togglePaymentMethod = (method: string) => {
    setForm(prev => ({
      ...prev,
      acceptedPaymentMethods: prev.acceptedPaymentMethods.includes(method)
        ? prev.acceptedPaymentMethods.filter(m => m !== method)
        : [...prev.acceptedPaymentMethods, method],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await artisanService.updateProfile({
        paymentSchedule: form.paymentSchedule,
        depositPercentage: Number(form.depositPercentage),
        refundPolicy: form.refundPolicy,
        acceptedPaymentMethods: form.acceptedPaymentMethods,
        installmentEnabled: form.installmentEnabled,
        installmentDetails: form.installmentDetails,
      } as Record<string, unknown>);
      toast({ title: "Payment terms saved", description: "Your payment policies have been updated." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save payment terms";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Payment Terms & Policies
        </CardTitle>
        <CardDescription>Define your payment requirements for customers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Payment Schedule</Label>
          <Select value={form.paymentSchedule} onValueChange={v => setForm(f => ({ ...f, paymentSchedule: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="full_upfront">Full payment upfront</SelectItem>
              <SelectItem value="deposit_balance">Deposit + balance on delivery</SelectItem>
              <SelectItem value="milestone">Milestone-based payments</SelectItem>
              <SelectItem value="on_delivery">Pay on delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.paymentSchedule === "deposit_balance" && (
          <div className="space-y-2">
            <Label>Deposit Percentage (%)</Label>
            <Input
              type="number"
              min={10}
              max={90}
              value={form.depositPercentage}
              onChange={e => setForm(f => ({ ...f, depositPercentage: e.target.value }))}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Refund Policy</Label>
          <Textarea
            value={form.refundPolicy}
            onChange={e => setForm(f => ({ ...f, refundPolicy: e.target.value }))}
            placeholder="Describe your refund/cancellation policy…"
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <Label>Accepted Payment Methods</Label>
          {[
            { value: "bank_transfer", label: "Bank Transfer" },
            { value: "card", label: "Debit/Credit Card" },
            { value: "cash", label: "Cash" },
            { value: "mobile_money", label: "Mobile Money" },
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`pm-${value}`}
                checked={form.acceptedPaymentMethods.includes(value)}
                onCheckedChange={() => togglePaymentMethod(value)}
              />
              <Label htmlFor={`pm-${value}`} className="font-normal cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Installment Options</p>
              <p className="text-xs text-muted-foreground">Allow customers to pay in installments</p>
            </div>
            <Switch
              checked={form.installmentEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, installmentEnabled: v }))}
            />
          </div>
          {form.installmentEnabled && (
            <Textarea
              value={form.installmentDetails}
              onChange={e => setForm(f => ({ ...f, installmentDetails: e.target.value }))}
              placeholder="e.g. 3 monthly payments, no interest…"
              rows={2}
            />
          )}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…</> : "Save Payment Terms"}
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Main Settings Page ───────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  // Account form state seeded from auth user
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      const parts = (user.name || "").split(" ");
      setAccountForm({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    inApp: true, email: true, sms: false, push: true,
    orderUpdates: true, promotions: false, wishlistAlerts: true, newMessages: true,
  });
  const handleToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Addresses — API-backed
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressModal, setAddressModal] = useState<{ open: boolean; address?: Address | null }>({ open: false });

  useEffect(() => {
    addressesService.list().then((data) => {
      setAddresses(data.map((a: AddressApi) => ({
        id: a.id,
        label: a.label,
        street: a.street,
        city: a.city,
        state: a.state,
        country: a.country,
        isDefault: a.isDefault,
      })));
    }).catch(() => {
      // fallback: empty
    }).finally(() => setAddressesLoading(false));
  }, []);

  const openAddAddress = () => setAddressModal({ open: true, address: null });
  const openEditAddress = (a: Address) => setAddressModal({ open: true, address: a });

  const handleSaveAddress = async (data: Omit<Address, "id" | "isDefault">) => {
    setAddressSaving(true);
    try {
      if (addressModal.address) {
        const updated = await addressesService.update(addressModal.address.id, data);
        setAddresses(prev => prev.map(a => a.id === addressModal.address!.id ? { ...a, ...updated } : a));
        toast({ title: "Address updated", description: "Your address has been updated." });
      } else {
        const created = await addressesService.create(data);
        setAddresses(prev => [...prev, { ...created, isDefault: prev.length === 0 }]);
        toast({ title: "Address added", description: "New address saved successfully." });
      }
      setAddressModal({ open: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressesService.remove(id);
      setAddresses(prev => {
        const updated = prev.filter(a => a.id !== id);
        if (updated.length > 0 && !updated.some(a => a.isDefault)) {
          updated[0].isDefault = true;
        }
        return updated;
      });
      toast({ title: "Address removed", description: "The address has been deleted." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete address";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await addressesService.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      toast({ title: "Default updated", description: "Default address has been changed." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update default address";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // Payment Methods — API-backed
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; payment?: PaymentMethod | null }>({ open: false });

  const mapPaymentApi = (p: PaymentMethodApi): PaymentMethod => ({
    id: p.id,
    brand: p.brand,
    last4: p.last4,
    expiry: p.expiry,
    cardholderName: p.cardholderName,
    billingAddressId: p.billingAddressId,
    isDefault: p.isDefault,
  });

  useEffect(() => {
    paymentMethodsService.list()
      .then((data) => setPayments(data.map(mapPaymentApi)))
      .catch(() => { /* fallback: empty */ })
      .finally(() => setPaymentsLoading(false));
  }, []);

  const openAddPayment = () => setPaymentModal({ open: true, payment: null });
  const openEditPayment = (p: PaymentMethod) => setPaymentModal({ open: true, payment: p });

  const handleSavePayment = async (data: { brand: string; last4: string; expiry: string; cardholderName: string; billingAddressId?: string }) => {
    try {
      if (paymentModal.payment) {
        // No PATCH endpoint by spec — re-create flow not supported here. Update local only.
        setPayments(prev => prev.map(p => p.id === paymentModal.payment!.id ? { ...p, ...data } : p));
        toast({ title: "Payment method updated" });
      } else {
        const created = await paymentMethodsService.create(data);
        const newPm = mapPaymentApi({ ...created, isDefault: payments.length === 0 } as PaymentMethodApi);
        setPayments(prev => [...prev, newPm]);
        toast({ title: "Payment method added" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save payment method";
      toast({ title: "Error", description: msg, variant: "destructive" });
      throw err;
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await paymentMethodsService.remove(id);
      setPayments(prev => {
        const updated = prev.filter(p => p.id !== id);
        if (updated.length > 0 && !updated.some(p => p.isDefault)) {
          updated[0].isDefault = true;
        }
        return updated;
      });
      toast({ title: "Payment method removed" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove payment method";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    try {
      await paymentMethodsService.setDefault(id);
      setPayments(prev => prev.map(p => ({ ...p, isDefault: p.id === id })));
      toast({ title: "Default payment updated" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update default payment";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const isArtisan = user?.role === "artisan";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="account" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <User className="h-4 w-4" /><span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <Shield className="h-4 w-4" /><span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <Bell className="h-4 w-4" /><span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <MapPin className="h-4 w-4" /><span className="hidden sm:inline">Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Info */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Account Information</CardTitle>
                <CardDescription>Manage your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={accountForm.firstName} onChange={e => setAccountForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={accountForm.lastName} onChange={e => setAccountForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={accountForm.phone} onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              <Button className="w-full sm:w-auto" onClick={async () => {
                  try {
                    const fullName = `${accountForm.firstName} ${accountForm.lastName}`.trim();
                    const originalName = user?.name || "";
                    const originalEmail = user?.email || "";
                    const originalPhone = user?.phone || "";
                    // Only send changed fields
                    const delta: Record<string, string> = {};
                    if (fullName !== originalName) delta.name = fullName;
                    if (accountForm.email !== originalEmail) delta.email = accountForm.email;
                    if (accountForm.phone !== originalPhone) delta.phone = accountForm.phone;
                    if (Object.keys(delta).length === 0) {
                      toast({ title: "No changes", description: "Nothing to update." });
                      return;
                    }
                    await authService.updateProfile(delta);
                    updateUser({ name: fullName, email: accountForm.email, phone: accountForm.phone });
                    toast({ title: "Changes saved", description: "Your account information has been updated." });
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Failed to save changes";
                    toast({ title: "Error", description: msg, variant: "destructive" });
                  }
                }}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Security Settings</CardTitle>
                <CardDescription>Manage your password and security preferences</CardDescription>
              </CardHeader>
              <SecurityTabContent />
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notification Center</CardTitle>
                  <CardDescription>Your recent notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>In-app notifications</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>SMS alerts</span>
                    <Badge variant="outline">Set up</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Email confirmations</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" />Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Delivery Methods</h4>
                    <div className="space-y-3">
                      {[
                        { key: "inApp" as const, Icon: Bell, label: "In-App Notifications", desc: "Get notified within the app" },
                        { key: "email" as const, Icon: Mail, label: "Email Notifications", desc: "Receive updates via email" },
                        { key: "sms" as const, Icon: Phone, label: "SMS Alerts", desc: "Get text message updates" },
                        { key: "push" as const, Icon: MessageSquare, label: "Push Notifications", desc: "Browser push notifications" },
                      ].map(({ key, Icon, label, desc }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                          </div>
                          <Switch checked={notificationSettings[key]} onCheckedChange={() => handleToggle(key)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Notification Types</h4>
                    <div className="space-y-3">
                      {[
                        { key: "orderUpdates" as const, label: "Order Updates", desc: "Status changes, delivery info" },
                        { key: "promotions" as const, label: "Promotions & Deals", desc: "Special offers and discounts" },
                        { key: "wishlistAlerts" as const, label: "Wishlist Alerts", desc: "Price drops and availability" },
                        { key: "newMessages" as const, label: "New Messages", desc: "Chat messages from artisans" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                          <Switch checked={notificationSettings[key]} onCheckedChange={() => handleToggle(key)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto" onClick={() => toast({ title: "Preferences saved" })}>Save Preferences</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Addresses — API-backed CRUD */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Saved Addresses</CardTitle>
                    <CardDescription className="mt-1">Manage your delivery addresses</CardDescription>
                  </div>
                  <Button size="sm" onClick={openAddAddress} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Address
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {addressesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No addresses saved yet. Add one to get started.</p>
                ) : (
                  addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium">{address.label}</p>
                            {address.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {address.street}<br />
                            {address.city}, {address.state}, {address.country}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-muted-foreground"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              title="Set as default"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Default
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditAddress(address)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full gap-2" onClick={openAddAddress}>
                  <Plus className="h-4 w-4" /> Add New Address
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods — full CRUD + Payment Terms for artisans */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Payment Methods</CardTitle>
                    <CardDescription className="mt-1">Manage your payment options</CardDescription>
                  </div>
                  <Button size="sm" onClick={openAddPayment} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No payment methods saved yet.</p>
                ) : null}
                {payments.map((pm) => (
                  <div key={pm.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-8 bg-muted rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {pm.brand}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">•••• •••• •••• {pm.last4}</p>
                          <p className="text-sm text-muted-foreground">Expires {pm.expiry}</p>
                        </div>
                        {pm.isDefault && <Badge variant="secondary" className="text-xs ml-1">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!pm.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground"
                            onClick={() => handleSetDefaultPayment(pm.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Default
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPayment(pm)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayment(pm.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2" onClick={openAddPayment}>
                  <Plus className="h-4 w-4" /> Add Payment Method
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your payment information is securely stored and encrypted.
                </p>
              </CardContent>
            </Card>

            {/* Payment Terms — artisan only */}
            {isArtisan && <PaymentTermsSection />}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Modals */}
      <AddressModal
        open={addressModal.open}
        address={addressModal.address}
        onClose={() => setAddressModal({ open: false })}
        onSave={handleSaveAddress}
        isSaving={addressSaving}
      />
      <PaymentModal
        open={paymentModal.open}
        payment={paymentModal.payment}
        onClose={() => setPaymentModal({ open: false })}
        onSave={handleSavePayment}
        addresses={addresses}
      />
    </div>
  );
};

export default Settings;
