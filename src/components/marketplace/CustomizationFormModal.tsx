/**
 * Category-aware, schema-driven customisation modal (Sprint Task 1).
 *
 * - Resolves the category by name keywords first, falling back to product.category.
 * - Fetches GET /products/customisation-template?category={category} on open.
 * - Renders fields dynamically by type (select | multiselect | text | number).
 * - Shows a spinner while loading and an empty-state message if no fields.
 * - Submits a keyed `customisation` object on the cart payload.
 *
 * The component keeps its original prop interface so existing call sites
 * (Cart, ProductDetail, ProviderDetail, Wishlist) work unchanged.
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShoppingCart, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import {
  customisationTemplateService,
  type CustomisationField,
} from "@/lib/apiServices";

interface CustomizationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  productId: number;
  productName: string;
  providerName: string;
  basePrice: number;
  estimatedDeliveryDays: number;
  category: string;
  productImage?: string;
  existingCustomization?: any;
  editingCartItemId?: string;
}

/**
 * Resolve a canonical customisation category from the product name first,
 * falling back to the product's category field. Simple keyword match — no
 * external dependencies, no over-engineering.
 */
function resolveCustomisationCategory(name: string | undefined, fallback: string | undefined): string {
  const lower = (name ?? "").toLowerCase();
  if (/(shoe|sneaker|boot|sandal|loafer|heel)/.test(lower)) return "shoemaking";
  if (/(kaftan|suit|dress|gown|agbada|skirt|trouser|shirt|blouse|jumpsuit)/.test(lower)) return "tailoring";
  if (/(bag|wallet|belt|holster|leather)/.test(lower)) return "leatherwork";
  if (/(ring|necklace|earring|bracelet|anklet|pendant|jewel)/.test(lower)) return "jewellery";
  if (/(makeup|wig|braid|hair|beauty|skincare)/.test(lower)) return "beauty";
  if (/(decor|vase|cushion|throw|rug|home)/.test(lower)) return "home_and_decor";
  return (fallback ?? "").trim() || "tailoring";
}

const CustomizationFormModal = ({
  open,
  onOpenChange,
  providerId,
  productId,
  productName,
  providerName,
  basePrice,
  estimatedDeliveryDays: _estimatedDeliveryDays,
  category,
  productImage,
  existingCustomization,
  editingCartItemId,
}: CustomizationFormModalProps) => {
  const { toast } = useToast();
  const { addItem, updateItem } = useCart();

  const [fields, setFields] = useState<CustomisationField[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [values, setValues] = useState<Record<string, string | string[]>>({});

  const resolvedCategory = useMemo(
    () => resolveCustomisationCategory(productName, category),
    [productName, category],
  );

  // Reset state whenever the modal opens / product changes.
  useEffect(() => {
    if (!open) return;
    setValues(existingCustomization && typeof existingCustomization === "object" ? { ...existingCustomization } : {});
    setFields(null);
    setLoadError(false);
    setIsLoading(true);
    let cancelled = false;
    customisationTemplateService
      .get(resolvedCategory)
      .then((tpl) => {
        if (cancelled) return;
        if (!tpl) {
          setLoadError(true);
          setFields([]);
        } else {
          setFields(Array.isArray(tpl.fields) ? tpl.fields : []);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, resolvedCategory, existingCustomization]);

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
    const customisation: Record<string, string | string[]> = { ...values };
    const cartCategory = (
      ["tailoring", "shoemaking", "canvas"].includes(resolvedCategory)
        ? resolvedCategory
        : "tailoring"
    ) as "tailoring" | "shoemaking" | "canvas";

    const cartItem = {
      id: editingCartItemId || Date.now().toString(),
      productId,
      productName,
      providerId,
      providerName,
      basePrice,
      finalPrice: basePrice,
      category: cartCategory,
      selectedSize: typeof customisation.size === "string" ? customisation.size : undefined,
      selectedVariants: {},
      measurements: {},
      notes:
        typeof customisation.notes === "string"
          ? (customisation.notes as string)
          : "",
      quantity: 1,
      imageUrl: productImage,
      // Forward the keyed customisation payload to the backend via cart/order.
      ...(Object.keys(customisation).length
        ? ({ customisation } as unknown as Record<string, unknown>)
        : {}),
    } as never;

    if (editingCartItemId) {
      updateItem(editingCartItemId, cartItem);
      toast({ title: "Cart updated! 🎉", description: "Your customisation has been updated." });
    } else {
      addItem(cartItem);
      toast({
        title: "Added to cart! 🎉",
        description: `Your custom ${productName ?? "item"} has been added to your cart.`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">Customise {productName}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading customisation options" />
          </div>
        )}

        {!isLoading && fields && fields.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {loadError
              ? "Could not load customisation options. Please try again."
              : "No customisation options available for this product."}
          </p>
        )}

        {!isLoading && fields && fields.length > 0 && (
          <div className="grid gap-6 py-2 lg:grid-cols-5">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 lg:col-span-3">
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
                      <SelectTrigger aria-label={field.label}>
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
                                const next = c ? [...arr, opt] : arr.filter((x) => x !== opt);
                                setValue(field.key, next);
                              }}
                              aria-label={`${field.label}: ${opt}`}
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (field.type === "number") {
                const numStr = typeof v === "string" ? v : "";
                const numVal = Number(numStr);
                const dec = () => setValue(field.key, String(Math.max(0, (Number.isFinite(numVal) ? numVal : 0) - 1)));
                const inc = () => setValue(field.key, String((Number.isFinite(numVal) ? numVal : 0) + 1));
                return (
                  <div key={field.key} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={dec} aria-label={`Decrease ${field.label}`}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={numStr}
                        placeholder={field.placeholder}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        aria-label={field.label}
                        className="text-center"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={inc} aria-label={`Increase ${field.label}`}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={field.key} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type="text"
                    value={typeof v === "string" ? v : ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    aria-label={field.label}
                  />
                </div>
              );
              })}
            </div>

            {/* Sticky summary panel — desktop only */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-2 rounded-xl border bg-muted/40 p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                  <p className="font-display font-semibold">{productName}</p>
                  <p className="text-xs text-muted-foreground">by {providerName}</p>
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {fields.map((f) => {
                    const v = values[f.key];
                    const display = Array.isArray(v) ? v.join(", ") : (v ?? "");
                    return (
                      <div
                        key={f.key}
                        className="flex items-start justify-between gap-3 text-sm transition-colors rounded-md px-2 py-1"
                      >
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-medium text-right truncate max-w-[55%]">
                          {display || <span className="text-muted-foreground/60">—</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starting at</span>
                    <span className="font-semibold">
                      ₦{(basePrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
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
            aria-label="Confirm customisation"
          >
            <ShoppingCart className="h-4 w-4" />
            Confirm Customisation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationFormModal;
