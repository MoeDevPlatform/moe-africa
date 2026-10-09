import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type VariationSelection = Record<string, string>;

type VariationField =
  | { key: string; label: string; kind: "swatch"; options: { value: string; color: string }[]; required?: boolean }
  | { key: string; label: string; kind: "chip"; options: string[]; required?: boolean }
  | { key: string; label: string; kind: "text"; placeholder?: string; required?: boolean }
  | { key: string; label: string; kind: "number"; unit?: string; required?: boolean };

const COLOURS = [
  { value: "Navy", color: "#1e3a5f" },
  { value: "Black", color: "#111111" },
  { value: "White", color: "#f5f5f5" },
  { value: "Cream", color: "#f5efe6" },
  { value: "Olive", color: "#556b2f" },
  { value: "Burgundy", color: "#6b1e2a" },
  { value: "Gold", color: "#c9a227" },
  { value: "Brown", color: "#6b4423" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];
const MATERIALS = ["Cotton", "Linen", "Silk", "Wool", "Leather", "Ankara", "Lace"];
const METALS = ["Gold", "Silver", "Brass", "Beaded"];

function fieldsForCategory(category: string): VariationField[] {
  const cat = (category || "").toLowerCase().replace(/_/g, " ");
  if (cat.includes("tailor")) {
    return [
      { key: "size", label: "Size", kind: "chip", options: SIZES, required: true },
      { key: "colour", label: "Colour", kind: "swatch", options: COLOURS, required: true },
      { key: "material", label: "Material", kind: "chip", options: MATERIALS, required: true },
      { key: "measurements", label: "Custom measurements (optional)", kind: "text", placeholder: "Chest, waist, length…" },
    ];
  }
  if (cat.includes("shoe")) {
    return [
      { key: "size", label: "Shoe size", kind: "chip", options: SHOE_SIZES, required: true },
      { key: "colour", label: "Colour", kind: "swatch", options: COLOURS, required: true },
      { key: "material", label: "Material", kind: "chip", options: ["Leather", "Suede", "Canvas"], required: true },
    ];
  }
  if (cat.includes("jewell") || cat.includes("jewel")) {
    return [
      { key: "metal", label: "Metal type", kind: "chip", options: METALS, required: true },
      { key: "size", label: "Size", kind: "chip", options: ["Small", "Medium", "Large"], required: true },
      { key: "engraving", label: "Engraving (optional)", kind: "text", placeholder: "Up to 20 characters" },
    ];
  }
  if (cat.includes("home") || cat.includes("decor")) {
    return [
      { key: "width", label: "Width", kind: "number", unit: "cm", required: true },
      { key: "height", label: "Height", kind: "number", unit: "cm", required: true },
      { key: "depth", label: "Depth", kind: "number", unit: "cm", required: true },
      { key: "colour", label: "Colour", kind: "swatch", options: COLOURS, required: true },
      { key: "material", label: "Material", kind: "chip", options: MATERIALS, required: true },
    ];
  }
  if (cat.includes("art") || cat.includes("craft") || cat.includes("canvas") || cat.includes("paint")) {
    return [
      { key: "width", label: "Width", kind: "number", unit: "cm", required: true },
      { key: "height", label: "Height", kind: "number", unit: "cm", required: true },
      { key: "colour", label: "Colour", kind: "swatch", options: COLOURS, required: true },
    ];
  }
  if (cat.includes("beauty")) {
    return [
      { key: "shade", label: "Shade / variant", kind: "chip", options: ["Light", "Medium", "Deep", "Rich"], required: true },
    ];
  }
  if (cat.includes("leather")) {
    return [
      { key: "colour", label: "Colour", kind: "swatch", options: COLOURS, required: true },
      { key: "size", label: "Size", kind: "chip", options: ["S", "M", "L", "One size"], required: true },
      { key: "material", label: "Material", kind: "chip", options: ["Leather", "Suede", "Vegan leather"], required: true },
    ];
  }
  return [
    { key: "size", label: "Size", kind: "chip", options: SIZES, required: true },
    { key: "colour", label: "Colour", kind: "swatch", options: COLOURS, required: true },
  ];
}

interface ProductVariationSelectorProps {
  category: string;
  onSelectionChange: (selection: VariationSelection, allRequiredSelected: boolean) => void;
}

const ProductVariationSelector = ({
  category,
  onSelectionChange,
}: ProductVariationSelectorProps) => {
  const fields = useMemo(() => fieldsForCategory(category), [category]);
  const [selection, setSelection] = useState<VariationSelection>({});

  const required = useMemo(
    () => fields.filter((f) => f.required).map((f) => f.key),
    [fields],
  );

  useEffect(() => {
    const ok = required.every((k) => Boolean(selection[k]?.trim()));
    onSelectionChange(selection, ok);
  }, [selection, required, onSelectionChange]);

  const setValue = (key: string, value: string) => {
    setSelection((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5" data-testid="variation-selector">
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </Label>

          {field.kind === "swatch" && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => {
                const selected = selection[field.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`colour-swatch-${opt.value}`}
                    aria-label={opt.value}
                    aria-pressed={selected}
                    onClick={() => setValue(field.key, opt.value)}
                    className={cn(
                      "h-10 w-10 rounded-full border-2 transition-all",
                      selected ? "border-primary scale-105" : "border-transparent",
                    )}
                    style={{ backgroundColor: opt.color }}
                  />
                );
              })}
            </div>
          )}

          {field.kind === "chip" && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => {
                const selected = selection[field.key] === opt;
                const testId =
                  field.key === "size" ? `size-chip-${opt}` : `${field.key}-chip-${opt}`;
                return (
                  <button
                    key={opt}
                    type="button"
                    data-testid={testId}
                    aria-pressed={selected}
                    onClick={() => setValue(field.key, opt)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm border transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {field.kind === "text" && (
            <Input
              value={selection[field.key] ?? ""}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}

          {field.kind === "number" && (
            <div className="flex items-center gap-2 max-w-[180px]">
              <Input
                type="number"
                min={0}
                value={selection[field.key] ?? ""}
                onChange={(e) => setValue(field.key, e.target.value)}
              />
              {field.unit && (
                <span className="text-sm text-muted-foreground">{field.unit}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductVariationSelector;
