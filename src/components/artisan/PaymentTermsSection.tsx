import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { artisanService } from "@/lib/apiServices";

const PaymentTermsSection = () => {
  // Load previously saved terms so the relocated form never overwrites them with defaults.
  useEffect(() => {
    artisanService.getMyProfile().then((p) => {
      const r = p as unknown as Record<string, unknown>;
      setForm((f) => ({
        paymentSchedule: typeof r.paymentSchedule === "string" ? r.paymentSchedule : f.paymentSchedule,
        depositPercentage: r.depositPercentage != null ? String(r.depositPercentage) : f.depositPercentage,
        refundPolicy: typeof r.refundPolicy === "string" ? r.refundPolicy : f.refundPolicy,
        acceptedPaymentMethods: Array.isArray(r.acceptedPaymentMethods) ? (r.acceptedPaymentMethods as string[]) : f.acceptedPaymentMethods,
        installmentEnabled: typeof r.installmentEnabled === "boolean" ? r.installmentEnabled : f.installmentEnabled,
        installmentDetails: typeof r.installmentDetails === "string" ? r.installmentDetails : f.installmentDetails,
      }));
    }).catch(() => undefined);
  }, []);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Payment Terms & Policies
        </CardTitle>
        <CardDescription>Business preferences shown to customers. MOE payment, refund and payout controls still apply.</CardDescription>
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

export default PaymentTermsSection;
