import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import BodyTypeSelector from "@/components/marketplace/BodyTypeSelector";
import {
  type ProductVariationTypeDef,
  type VariationOptionDef,
  type VariationSelection,
  enabledTypes,
  isOptionSoldOut,
  kindForTypeName,
  labelForTypeName,
  requiredTypeNames,
  resolveDisplayPrice,
} from "@/lib/productVariations";

export type { VariationSelection };

interface ProductVariationSelectorProps {
  category: string;
  /** When provided, drives the selector. Empty enabled list = no variations (cart ready). */
  variationTypes?: ProductVariationTypeDef[] | null;
  basePrice: number;
  onSelectionChange: (
    selection: VariationSelection,
    allRequiredSelected: boolean,
    displayPrice: number,
  ) => void;
}

function optionTestId(typeName: string, opt: VariationOptionDef, soldOut: boolean): string {
  if (soldOut) return "variation-option-sold-out";
  const slug = (opt.value || opt.label).toLowerCase().replace(/\s+/g, "-");
  if (typeName === "size" || typeName === "shoe_size") {
    if (/^(l|large)$/i.test(opt.value) || /large/i.test(opt.label)) {
      return "variation-option-large";
    }
    return `size-chip-${opt.label}`;
  }
  if (kindForTypeName(typeName) === "swatch") {
    return `colour-swatch-${opt.label}`;
  }
  return `variation-option-${typeName}-${slug}`;
}

const ProductVariationSelector = ({
  category: _category,
  variationTypes,
  basePrice,
  onSelectionChange,
}: ProductVariationSelectorProps) => {
  const types = useMemo(() => enabledTypes(variationTypes ?? []), [variationTypes]);
  const [selection, setSelection] = useState<VariationSelection>({});

  const required = useMemo(() => requiredTypeNames(types), [types]);

  useEffect(() => {
    // Reset selection when product variation config changes.
    setSelection({});
  }, [variationTypes]);

  useEffect(() => {
    if (types.length === 0) {
      onSelectionChange({}, true, basePrice);
      return;
    }
    const ok = required.every((k) => Boolean(selection[k]?.trim()));
    const { displayPrice } = resolveDisplayPrice(basePrice, types, selection);
    onSelectionChange(selection, ok, displayPrice);
  }, [selection, required, types, basePrice, onSelectionChange]);

  const setValue = (key: string, value: string) => {
    setSelection((prev) => ({ ...prev, [key]: value }));
  };

  if (types.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5" data-testid="variation-selector">
      {types.map((type) => {
        const kind = kindForTypeName(type.typeName);
        const label = labelForTypeName(type.typeName);

        if (kind === "body_type") {
          return (
            <div key={type.typeName} data-testid={`variation-selector-${type.typeName}`}>
              <BodyTypeSelector
                value={selection[type.typeName]}
                onChange={(v) => setValue(type.typeName, v)}
                required={type.isRequired}
              />
            </div>
          );
        }

        return (
          <div
            key={type.typeName}
            className="space-y-2"
            data-testid={`variation-selector-${type.typeName}`}
          >
            <Label className="text-sm font-medium">
              {label}
              {type.isRequired ? <span className="text-destructive"> *</span> : null}
            </Label>

            {(kind === "swatch" || kind === "chip") && (
              <div className="flex flex-wrap gap-2">
                {type.options.map((opt) => {
                  const soldOut = isOptionSoldOut(opt);
                  const selected =
                    selection[type.typeName] === opt.value ||
                    selection[type.typeName] === opt.label;
                  const testId = optionTestId(type.typeName, opt, soldOut);

                  if (kind === "swatch") {
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={testId}
                        aria-label={opt.label}
                        aria-pressed={selected}
                        disabled={soldOut}
                        onClick={() => {
                          if (!soldOut) setValue(type.typeName, opt.value);
                        }}
                        className={cn(
                          "h-10 w-10 rounded-full border-2 transition-all relative overflow-hidden",
                          selected ? "border-primary scale-105 selected" : "border-transparent",
                          soldOut && "variation-option--sold-out",
                        )}
                        style={{ backgroundColor: opt.colorHex || "#ccc" }}
                        title={soldOut ? `${opt.label} — Sold out` : opt.label}
                      />
                    );
                  }

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={testId}
                      aria-pressed={selected}
                      disabled={soldOut}
                      onClick={() => {
                        if (!soldOut) setValue(type.typeName, opt.value);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm border transition-colors relative overflow-hidden",
                        selected
                          ? "bg-primary text-primary-foreground border-primary selected"
                          : "bg-background text-foreground border-border hover:border-primary/50",
                        soldOut && "variation-option--sold-out",
                      )}
                    >
                      {opt.label}
                      {soldOut ? (
                        <span className="block text-[10px] opacity-80">Sold out</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {kind === "text" && (
              <Input
                value={selection[type.typeName] ?? ""}
                onChange={(e) => setValue(type.typeName, e.target.value)}
                placeholder={
                  type.typeName === "engraving"
                    ? "Up to 20 characters"
                    : "Chest, waist, length…"
                }
              />
            )}

            {kind === "number" && (
              <div className="flex items-center gap-2 max-w-[180px]">
                <Input
                  type="number"
                  min={0}
                  value={selection[type.typeName] ?? ""}
                  onChange={(e) => setValue(type.typeName, e.target.value)}
                />
                <span className="text-sm text-muted-foreground">cm</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductVariationSelector;
