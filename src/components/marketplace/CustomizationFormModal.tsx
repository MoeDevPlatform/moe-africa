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
import { Loader2, ShoppingCart } from "lucide-react";
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
        description: `Your custom ${productName} has been added to your cart.`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
              return (
                <div key={field.key} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    min={field.type === "number" ? 0 : undefined}
                    value={typeof v === "string" ? v : ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    aria-label={field.label}
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
            aria-label={editingCartItemId ? "Update cart" : "Add to cart"}
          >
            <ShoppingCart className="h-4 w-4" />
            {editingCartItemId ? "Update Cart" : "Add to Cart"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationFormModal;
