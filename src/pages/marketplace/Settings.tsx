import { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  User, Shield, Bell, Settings as SettingsIcon, MapPin, CreditCard,
  ArrowLeft, Mail, Phone, MessageSquare, Plus, Pencil, Trash2, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: number;
  type: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

// ─── Initial state ───────────────────────────────────────────────────────────
const initialAddresses: Address[] = [
  { id: 1, label: "Home", street: "15 Marina Road, Victoria Island", city: "Lagos", state: "Lagos", country: "Nigeria", isDefault: true },
  { id: 2, label: "Office", street: "45 Broad Street, Lagos Island", city: "Lagos", state: "Lagos", country: "Nigeria", isDefault: false },
];

const initialPayments: PaymentMethod[] = [
  { id: 1, type: "VISA", last4: "4242", expiry: "12/25", isDefault: true },
];

// ─── Address Modal ────────────────────────────────────────────────────────────
interface AddressModalProps {
  open: boolean;
  address?: Address | null;
  onClose: () => void;
  onSave: (data: Omit<Address, "id" | "isDefault">) => void;
}

const AddressModal = ({ open, address, onClose, onSave }: AddressModalProps) => {
  const [form, setForm] = useState({
    label: address?.label ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    country: address?.country ?? "Nigeria",
  });

  // sync when address changes (edit vs add)
  useState(() => {
    setForm({
      label: address?.label ?? "",
      street: address?.street ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      country: address?.country ?? "Nigeria",
    });
  });

  const handleSave = () => {
    if (!form.label || !form.street || !form.city) return;
    onSave(form);
    onClose();
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
          <div className="space-y-2">
            <Label>Street Address</Label>
            <Input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lagos" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Lagos" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.label || !form.street || !form.city}>Save Address</Button>
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
  onSave: (data: Omit<PaymentMethod, "id" | "isDefault">) => void;
}

const PaymentModal = ({ open, payment, onClose, onSave }: PaymentModalProps) => {
  const [form, setForm] = useState({
    type: payment?.type ?? "VISA",
    last4: payment?.last4 ?? "",
    expiry: payment?.expiry ?? "",
  });

  const handleSave = () => {
    if (!form.last4 || !form.expiry) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Card Type</Label>
            <Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="VISA / Mastercard" />
          </div>
          <div className="space-y-2">
            <Label>Last 4 Digits</Label>
            <Input
              value={form.last4}
              onChange={e => setForm(f => ({ ...f, last4: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
              placeholder="4242"
              maxLength={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Expiry (MM/YY)</Label>
            <Input
              value={form.expiry}
              onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              placeholder="12/26"
              maxLength={5}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground px-1">Your payment information is securely stored and encrypted.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={form.last4.length !== 4 || !form.expiry}>Save Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Settings Page ───────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    inApp: true, email: true, sms: false, push: true,
    orderUpdates: true, promotions: false, wishlistAlerts: true, newMessages: true,
  });
  const handleToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [addressModal, setAddressModal] = useState<{ open: boolean; address?: Address | null }>({ open: false });

  const openAddAddress = () => setAddressModal({ open: true, address: null });
  const openEditAddress = (a: Address) => setAddressModal({ open: true, address: a });

  const handleSaveAddress = (data: Omit<Address, "id" | "isDefault">) => {
    if (addressModal.address) {
      setAddresses(prev => prev.map(a => a.id === addressModal.address!.id ? { ...a, ...data } : a));
      toast({ title: "Address updated", description: "Your address has been updated." });
    } else {
      const newAddr: Address = { id: Date.now(), ...data, isDefault: addresses.length === 0 };
      setAddresses(prev => [...prev, newAddr]);
      toast({ title: "Address added", description: "New address saved successfully." });
    }
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(prev => {
      const updated = prev.filter(a => a.id !== id);
      if (updated.length > 0 && !updated.some(a => a.isDefault)) {
        updated[0].isDefault = true;
      }
      return updated;
    });
    toast({ title: "Address removed", description: "The address has been deleted." });
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    toast({ title: "Default updated", description: "Default address has been changed." });
  };

  // Payment Methods
  const [payments, setPayments] = useState<PaymentMethod[]>(initialPayments);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; payment?: PaymentMethod | null }>({ open: false });

  const openAddPayment = () => setPaymentModal({ open: true, payment: null });
  const openEditPayment = (p: PaymentMethod) => setPaymentModal({ open: true, payment: p });

  const handleSavePayment = (data: Omit<PaymentMethod, "id" | "isDefault">) => {
    if (paymentModal.payment) {
      setPayments(prev => prev.map(p => p.id === paymentModal.payment!.id ? { ...p, ...data } : p));
      toast({ title: "Payment method updated" });
    } else {
      const newPm: PaymentMethod = { id: Date.now(), ...data, isDefault: payments.length === 0 };
      setPayments(prev => [...prev, newPm]);
      toast({ title: "Payment method added" });
    }
  };

  const handleDeletePayment = (id: number) => {
    setPayments(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (updated.length > 0 && !updated.some(p => p.isDefault)) {
        updated[0].isDefault = true;
      }
      return updated;
    });
    toast({ title: "Payment method removed" });
  };

  const handleSetDefaultPayment = (id: number) => {
    setPayments(prev => prev.map(p => ({ ...p, isDefault: p.id === id })));
    toast({ title: "Default payment updated" });
  };

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
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john.doe@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+234 801 234 5678" />
                </div>
                <Button className="w-full sm:w-auto" onClick={() => toast({ title: "Changes saved", description: "Your account information has been updated." })}>Save Changes</Button>
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
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <Button className="w-full sm:w-auto" onClick={() => toast({ title: "Password updated", description: "Your password has been changed successfully." })}>Update Password</Button>
              </CardContent>
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

          {/* Addresses — full CRUD */}
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
                {addresses.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">No addresses saved yet. Add one to get started.</p>
                )}
                {addresses.map((address) => (
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
                ))}
                <Button variant="outline" className="w-full gap-2" onClick={openAddAddress}>
                  <Plus className="h-4 w-4" /> Add New Address
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods — full CRUD */}
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
                {payments.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">No payment methods saved yet.</p>
                )}
                {payments.map((pm) => (
                  <div key={pm.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-8 bg-muted rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {pm.type}
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
      />
      <PaymentModal
        open={paymentModal.open}
        payment={paymentModal.payment}
        onClose={() => setPaymentModal({ open: false })}
        onSave={handleSavePayment}
      />
    </div>
  );
};

export default Settings;
