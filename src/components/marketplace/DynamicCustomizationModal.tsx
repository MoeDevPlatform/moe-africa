/**
 * Schema-driven customisation modal (handoff item 2).
 *
 * Fetches `/products/customisation-template?category=...` and renders fields
 * dynamically by `type` (select | multiselect | text | number).
 * Used for any product category that doesn't have a hardcoded step flow
 * (tailoring / shoemaking / canvas keep their bespoke flows).
 *
 * The submitted payload is added to the cart under the canonical
 * `customisation` key, keyed by each field's `key` value.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import {
  customisationTemplateService,
  type CustomisationField,
} from "@/lib/apiServices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  productId: number;
  productName: string;
  providerName: string;
  basePrice: number;
  category: string;
}

const DynamicCustomizationModal = ({
  open,
  onOpenChange,
  providerId,
  productId,
  productName,
  providerName,
  basePrice,
  category,
}: Props) => {
  const [fields, setFields] = useState<CustomisationField[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const { toast } = useToast();
  const { addItem } = useCart();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    customisationTemplateService.get(category).then((tpl) => {
      if (cancelled) return;
      setFields(tpl?.fields ?? []);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, category]);

  const setValue = (key: string, v: string | string[]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const canSubmit =
    fields !== null &&
    fields
      .filter((f) => f.required)
      .every((f) => {
        const v = values[f.key];
        return Array.isArray(v) ? v.length > 0 : !!v && String(v).trim() !== "";
      });

  const handleSubmit = () => {
    // Build customisation map keyed by field.key for the backend.
    const customisation: Record<string, string | string[]> = { ...values };
    addItem({
      id: Date.now().toString(),
      productId,
      productName,
      providerId,
      providerName,
      basePrice,
      finalPrice: basePrice,
      // Cart category type is narrow; cast harmlessly for non-canonical categories.
      category: (category as "tailoring" | "shoemaking" | "canvas") ?? "tailoring",
      selectedSize: typeof customisation.size === "string" ? customisation.size : undefined,
      selectedVariants: {},
      measurements: {},
      notes:
        typeof customisation.notes === "string"
          ? (customisation.notes as string)
          : "",
      quantity: 1,
      // Stash the raw payload so checkout/orders can forward it as `customisation`.
      ...(Object.keys(customisation).length
        ? ({ customisation } as unknown as Record<string, unknown>)
        : {}),
    } as never);
    toast({
      title: "Added to cart! 🎉",
      description: `${productName} has been customised and added to your cart.`,
    });
    onOpenChange(false);
    setValues({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Customise {productName}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && fields && fields.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">
            No customisation options are available for this product. You can add it
            to your cart as-is.
          </p>
        )}

        {!isLoading && fields && fields.length > 0 && (
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => {
              const v = values[field.key];
              if (field.type === "select") {
                return (
                  <div key={field.key} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Select
                      value={typeof v === "string" ? v : ""}
                      onValueChange={(val) => setValue(field.key, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder ?? "Select…"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {(field.options ?? []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              if (field.type === "multiselect") {
                const arr = Array.isArray(v) ? v : [];
                return (
                  <div key={field.key} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(field.options ?? []).map((opt) => {
                        const checked = arr.includes(opt);
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                const next = c
                                  ? [...arr, opt]
                                  : arr.filter((x) => x !== opt);
                                setValue(field.key, next);
                              }}
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // text / number
              return (
                <div key={field.key} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={typeof v === "string" ? v : ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setValue(field.key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (fields !== null && fields.length > 0 && !canSubmit)}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicCustomizationModal;