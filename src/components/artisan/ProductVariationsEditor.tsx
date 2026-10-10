import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import {
  catalogForCategory,
  type ProductVariationTypeDef,
  type VariationOptionDef,
} from "@/lib/productVariations";

interface ProductVariationsEditorProps {
  category: string;
  value: ProductVariationTypeDef[];
  onChange: (next: ProductVariationTypeDef[]) => void;
}

const ProductVariationsEditor = ({
  category,
  value,
  onChange,
}: ProductVariationsEditorProps) => {
  const catalog = useMemo(() => catalogForCategory(category), [category]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [colorDrafts, setColorDrafts] = useState<Record<string, string>>({});

  const byName = useMemo(() => {
    const m = new Map<string, ProductVariationTypeDef>();
    for (const t of value) m.set(t.typeName, t);
    return m;
  }, [value]);

  const enabledCount = value.filter((t) => t.isEnabled).length;

  const upsertType = (typeName: string, patch: Partial<ProductVariationTypeDef>) => {
    const existing = byName.get(typeName);
    const catalogItem = catalog.find((c) => c.typeName === typeName);
    if (existing) {
      onChange(
        value.map((t) => (t.typeName === typeName ? { ...t, ...patch } : t)),
      );
      return;
    }
    onChange([
      ...value,
      {
        typeName,
        isEnabled: true,
        isRequired: false,
        options: catalogItem?.defaultOptions ? [...catalogItem.defaultOptions] : [],
        ...patch,
      },
    ]);
  };

  const toggleType = (typeName: string, enabled: boolean) => {
    if (!enabled) {
      const existing = byName.get(typeName);
      if (existing) {
        onChange(
          value.map((t) =>
            t.typeName === typeName ? { ...t, isEnabled: false } : t,
          ),
        );
      }
      return;
    }
    upsertType(typeName, { isEnabled: true });
  };

  const addOption = (typeName: string) => {
    const label = (drafts[typeName] || "").trim();
    if (!label) return;
    const catalogItem = catalog.find((c) => c.typeName === typeName);
    const isSwatch = catalogItem?.kind === "swatch";
    const priceRaw = priceDrafts[typeName]?.trim();
    const stockRaw = stockDrafts[typeName]?.trim();
    const opt: VariationOptionDef = {
      label,
      value: label.toLowerCase().replace(/\s+/g, "_"),
      colorHex: isSwatch ? colorDrafts[typeName] || "#000000" : null,
      priceOverride: priceRaw ? Number(priceRaw) : null,
      stockCount: stockRaw === "" ? null : Number(stockRaw),
      isAvailable: true,
      position: (byName.get(typeName)?.options.length ?? 0),
    };
    const existing = byName.get(typeName);
    if (existing) {
      onChange(
        value.map((t) =>
          t.typeName === typeName
            ? { ...t, isEnabled: true, options: [...t.options, opt] }
            : t,
        ),
      );
    } else {
      upsertType(typeName, { isEnabled: true, options: [opt] });
    }
    setDrafts((d) => ({ ...d, [typeName]: "" }));
    setPriceDrafts((d) => ({ ...d, [typeName]: "" }));
    setStockDrafts((d) => ({ ...d, [typeName]: "" }));
  };

  const removeOption = (typeName: string, index: number) => {
    onChange(
      value.map((t) =>
        t.typeName === typeName
          ? { ...t, options: t.options.filter((_, i) => i !== index) }
          : t,
      ),
    );
  };

  const updateOptionStock = (typeName: string, index: number, stock: string) => {
    onChange(
      value.map((t) => {
        if (t.typeName !== typeName) return t;
        const options = t.options.map((o, i) =>
          i === index
            ? {
                ...o,
                stockCount: stock.trim() === "" ? null : Number(stock),
              }
            : o,
        );
        return { ...t, options };
      }),
    );
  };

  if (!category) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a category to configure product variations.
      </p>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/20" data-testid="product-variations-editor">
      <div>
        <h3 className="text-sm font-semibold">Product Variations</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Optional. Enable only the types that apply to this product.
        </p>
      </div>

      {enabledCount === 0 && (
        <p className="text-sm text-muted-foreground italic" data-testid="no-variations-note">
          This product has no variations. Customers will add it to cart directly.
        </p>
      )}

      <div className="space-y-4">
        {catalog.map((item) => {
          const current = byName.get(item.typeName);
          const enabled = !!current?.isEnabled;
          return (
            <div
              key={item.typeName}
              className="space-y-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor={`var-toggle-${item.typeName}`}
                  className="text-sm font-medium"
                >
                  {item.label}
                </Label>
                <Switch
                  id={`var-toggle-${item.typeName}`}
                  data-testid={`variation-toggle-${item.typeName}`}
                  checked={enabled}
                  onCheckedChange={(v) => toggleType(item.typeName, v)}
                />
              </div>

              {enabled && (
                <div
                  className="space-y-3 pl-1"
                  data-testid={`variation-options-${item.typeName}`}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Required</Label>
                    <Switch
                      checked={!!current?.isRequired}
                      onCheckedChange={(v) =>
                        upsertType(item.typeName, { isRequired: v })
                      }
                    />
                  </div>

                  {!item.freeText && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {(current?.options ?? []).map((opt, idx) => (
                          <Badge
                            key={`${opt.value}-${idx}`}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {opt.label}
                            {opt.priceOverride != null
                              ? ` · ₦${opt.priceOverride.toLocaleString()}`
                              : ""}
                            {opt.stockCount === 0 ? " · sold out" : ""}
                            <button
                              type="button"
                              aria-label={`Remove ${opt.label}`}
                              className="ml-1 rounded-full p-0.5 hover:bg-muted"
                              onClick={() => removeOption(item.typeName, idx)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {(current?.options ?? []).map((opt, idx) => (
                        <div
                          key={`stock-${opt.value}-${idx}`}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-24 truncate">{opt.label} stock</span>
                          <Input
                            type="number"
                            min={0}
                            className="h-8 w-24"
                            placeholder="—"
                            value={
                              opt.stockCount == null ? "" : String(opt.stockCount)
                            }
                            onChange={(e) =>
                              updateOptionStock(item.typeName, idx, e.target.value)
                            }
                          />
                        </div>
                      ))}

                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="flex-1 min-w-[120px]">
                          <Label className="text-xs">Option label</Label>
                          <Input
                            data-testid={`variation-option-input-${item.typeName}`}
                            value={drafts[item.typeName] ?? ""}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [item.typeName]: e.target.value,
                              }))
                            }
                            placeholder="e.g. Small"
                          />
                        </div>
                        {item.kind === "swatch" && (
                          <div>
                            <Label className="text-xs">Colour</Label>
                            <Input
                              type="color"
                              className="h-9 w-14 p-1"
                              value={colorDrafts[item.typeName] ?? "#1e3a5f"}
                              onChange={(e) =>
                                setColorDrafts((d) => ({
                                  ...d,
                                  [item.typeName]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                        <div className="w-28">
                          <Label className="text-xs">Price override</Label>
                          <Input
                            type="number"
                            min={0}
                            value={priceDrafts[item.typeName] ?? ""}
                            onChange={(e) =>
                              setPriceDrafts((d) => ({
                                ...d,
                                [item.typeName]: e.target.value,
                              }))
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Stock</Label>
                          <Input
                            type="number"
                            min={0}
                            value={stockDrafts[item.typeName] ?? ""}
                            onChange={(e) =>
                              setStockDrafts((d) => ({
                                ...d,
                                [item.typeName]: e.target.value,
                              }))
                            }
                            placeholder="—"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          data-testid={`add-variation-option-${item.typeName}`}
                          onClick={() => addOption(item.typeName)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </>
                  )}

                  {item.freeText && (
                    <p className="text-xs text-muted-foreground">
                      Customers enter free text for this field at checkout — no fixed
                      option list.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductVariationsEditor;
