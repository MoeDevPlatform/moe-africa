/**
 * Product variation types — shared by PDP selector and artisan product forms.
 * Variations are optional per product; custom orders are a separate system.
 */

export type VariationTypeName =
  | "size"
  | "colour"
  | "color"
  | "fabric_colour"
  | "lining_colour"
  | "material"
  | "dimensions"
  | "shoe_size"
  | "metal_type"
  | "engraving"
  | "measurements"
  | "body_type"
  | "shade"
  | "width"
  | "height"
  | "depth"
  | "ring_size"
  | string;

export interface VariationOptionDef {
  id?: string;
  label: string;
  value: string;
  colorHex?: string | null;
  priceOverride?: number | null;
  stockCount?: number | null;
  isAvailable?: boolean;
  position?: number;
}

export interface ProductVariationTypeDef {
  id?: string;
  typeName: VariationTypeName;
  isEnabled: boolean;
  isRequired: boolean;
  options: VariationOptionDef[];
}

export type VariationSelection = Record<string, string>;

/** Catalog of variation types available for a category (artisan toggle list). */
export interface CategoryVariationCatalogItem {
  typeName: VariationTypeName;
  label: string;
  /** Default options suggested when the artisan enables this type. */
  defaultOptions?: VariationOptionDef[];
  kind?: "chip" | "swatch" | "text" | "number" | "body_type";
  unit?: string;
  /** When true, option list is free-text (e.g. engraving) — no chip builder. */
  freeText?: boolean;
}

const COLOUR_OPTS: VariationOptionDef[] = [
  { label: "Navy", value: "navy", colorHex: "#1e3a5f" },
  { label: "Black", value: "black", colorHex: "#111111" },
  { label: "White", value: "white", colorHex: "#f5f5f5" },
  { label: "Cream", value: "cream", colorHex: "#f5efe6" },
  { label: "Olive", value: "olive", colorHex: "#556b2f" },
  { label: "Burgundy", value: "burgundy", colorHex: "#6b1e2a" },
  { label: "Gold", value: "gold", colorHex: "#c9a227" },
  { label: "Brown", value: "brown", colorHex: "#6b4423" },
];

const SIZE_OPTS: VariationOptionDef[] = ["XS", "S", "M", "L", "XL", "XXL"].map((s) => ({
  label: s,
  value: s.toLowerCase(),
}));

const SHOE_OPTS: VariationOptionDef[] = ["38", "39", "40", "41", "42", "43", "44", "45"].map(
  (s) => ({ label: s, value: s }),
);

const MATERIAL_OPTS: VariationOptionDef[] = [
  "Cotton",
  "Linen",
  "Silk",
  "Wool",
  "Leather",
  "Ankara",
  "Lace",
].map((m) => ({ label: m, value: m.toLowerCase() }));

const BODY_TYPE_OPTS: VariationOptionDef[] = [
  { label: "Slim / Lean", value: "slim" },
  { label: "Athletic / Toned", value: "athletic" },
  { label: "Average / Regular", value: "average" },
  { label: "Curvy / Full Figure", value: "curvy" },
  { label: "Plus Size / Broad", value: "plus" },
];

export const BODY_TYPE_OPTIONS = BODY_TYPE_OPTS;

/** Category → available variation type catalog for artisan forms. */
export function catalogForCategory(category: string): CategoryVariationCatalogItem[] {
  const cat = (category || "").toLowerCase().replace(/_/g, " ");

  if (cat.includes("tailor")) {
    return [
      { typeName: "size", label: "Size", kind: "chip", defaultOptions: SIZE_OPTS },
      {
        typeName: "fabric_colour",
        label: "Colour / Fabric Colour",
        kind: "swatch",
        defaultOptions: COLOUR_OPTS,
      },
      { typeName: "material", label: "Material", kind: "chip", defaultOptions: MATERIAL_OPTS },
      {
        typeName: "lining_colour",
        label: "Lining Colour",
        kind: "swatch",
        defaultOptions: COLOUR_OPTS,
      },
      {
        typeName: "measurements",
        label: "Custom Measurements",
        kind: "text",
        freeText: true,
        defaultOptions: [],
      },
      {
        typeName: "body_type",
        label: "Body Type",
        kind: "body_type",
        defaultOptions: BODY_TYPE_OPTS,
      },
    ];
  }
  if (cat.includes("shoe")) {
    return [
      { typeName: "shoe_size", label: "Shoe Size", kind: "chip", defaultOptions: SHOE_OPTS },
      { typeName: "colour", label: "Colour", kind: "swatch", defaultOptions: COLOUR_OPTS },
      {
        typeName: "material",
        label: "Material",
        kind: "chip",
        defaultOptions: [
          { label: "Leather", value: "leather" },
          { label: "Suede", value: "suede" },
          { label: "Canvas", value: "canvas" },
        ],
      },
    ];
  }
  if (cat.includes("jewell") || cat.includes("jewel")) {
    return [
      {
        typeName: "metal_type",
        label: "Metal Type",
        kind: "chip",
        defaultOptions: ["Gold", "Silver", "Brass", "Beaded"].map((m) => ({
          label: m,
          value: m.toLowerCase(),
        })),
      },
      {
        typeName: "ring_size",
        label: "Ring / Bracelet Size",
        kind: "chip",
        defaultOptions: ["Small", "Medium", "Large"].map((s) => ({
          label: s,
          value: s.toLowerCase(),
        })),
      },
      {
        typeName: "engraving",
        label: "Engraving Text",
        kind: "text",
        freeText: true,
        defaultOptions: [],
      },
    ];
  }
  if (cat.includes("home") || cat.includes("decor")) {
    return [
      { typeName: "width", label: "Width", kind: "number", unit: "cm", freeText: true, defaultOptions: [] },
      { typeName: "height", label: "Height", kind: "number", unit: "cm", freeText: true, defaultOptions: [] },
      { typeName: "depth", label: "Depth", kind: "number", unit: "cm", freeText: true, defaultOptions: [] },
      { typeName: "colour", label: "Colour", kind: "swatch", defaultOptions: COLOUR_OPTS },
      { typeName: "material", label: "Material", kind: "chip", defaultOptions: MATERIAL_OPTS },
    ];
  }
  if (cat.includes("art") || cat.includes("craft") || cat.includes("canvas") || cat.includes("paint")) {
    return [
      { typeName: "width", label: "Width", kind: "number", unit: "cm", freeText: true, defaultOptions: [] },
      { typeName: "height", label: "Height", kind: "number", unit: "cm", freeText: true, defaultOptions: [] },
      { typeName: "colour", label: "Colour", kind: "swatch", defaultOptions: COLOUR_OPTS },
    ];
  }
  if (cat.includes("beauty")) {
    return [
      {
        typeName: "shade",
        label: "Shade / Variant",
        kind: "chip",
        defaultOptions: ["Light", "Medium", "Deep", "Rich"].map((s) => ({
          label: s,
          value: s.toLowerCase(),
        })),
      },
    ];
  }
  if (cat.includes("leather")) {
    return [
      { typeName: "colour", label: "Colour", kind: "swatch", defaultOptions: COLOUR_OPTS },
      {
        typeName: "size",
        label: "Size",
        kind: "chip",
        defaultOptions: ["S", "M", "L", "One size"].map((s) => ({
          label: s,
          value: s.toLowerCase().replace(/\s+/g, "_"),
        })),
      },
      {
        typeName: "material",
        label: "Material",
        kind: "chip",
        defaultOptions: [
          { label: "Leather", value: "leather" },
          { label: "Suede", value: "suede" },
          { label: "Vegan leather", value: "vegan_leather" },
        ],
      },
    ];
  }
  return [
    { typeName: "size", label: "Size", kind: "chip", defaultOptions: SIZE_OPTS },
    { typeName: "colour", label: "Colour", kind: "swatch", defaultOptions: COLOUR_OPTS },
  ];
}

export function isOptionSoldOut(opt: VariationOptionDef): boolean {
  if (opt.isAvailable === false) return true;
  if (opt.stockCount != null && opt.stockCount === 0) return true;
  return false;
}

/** Highest single priceOverride among selected options (MVP). */
export function resolveDisplayPrice(
  basePrice: number,
  types: ProductVariationTypeDef[],
  selection: VariationSelection,
): { displayPrice: number; overrideActive: boolean } {
  let highest: number | null = null;
  for (const t of types) {
    if (!t.isEnabled) continue;
    const selected = selection[t.typeName];
    if (!selected) continue;
    const opt = t.options.find(
      (o) => o.value === selected || o.label === selected,
    );
    if (opt?.priceOverride != null && Number.isFinite(opt.priceOverride)) {
      if (highest == null || opt.priceOverride > highest) {
        highest = opt.priceOverride;
      }
    }
  }
  if (highest != null) {
    return { displayPrice: highest, overrideActive: true };
  }
  return { displayPrice: basePrice, overrideActive: false };
}

export function requiredTypeNames(types: ProductVariationTypeDef[]): string[] {
  return types.filter((t) => t.isEnabled && t.isRequired).map((t) => t.typeName);
}

export function enabledTypes(types: ProductVariationTypeDef[] | undefined | null): ProductVariationTypeDef[] {
  if (!types?.length) return [];
  return types.filter((t) => t.isEnabled);
}

export function labelForTypeName(typeName: string): string {
  const map: Record<string, string> = {
    size: "Size",
    colour: "Colour",
    color: "Colour",
    fabric_colour: "Fabric Colour",
    lining_colour: "Lining Colour",
    material: "Material",
    shoe_size: "Shoe Size",
    metal_type: "Metal Type",
    engraving: "Engraving",
    measurements: "Custom Measurements",
    body_type: "Body Type",
    shade: "Shade / Variant",
    width: "Width",
    height: "Height",
    depth: "Depth",
    ring_size: "Ring / Bracelet Size",
    dimensions: "Dimensions",
  };
  return map[typeName] ?? typeName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Infer UI kind from typeName when API does not specify. */
export function kindForTypeName(
  typeName: string,
): "chip" | "swatch" | "text" | "number" | "body_type" {
  if (typeName === "body_type") return "body_type";
  if (
    typeName.includes("colour") ||
    typeName.includes("color") ||
    typeName === "shade"
  ) {
    return "swatch";
  }
  if (typeName === "engraving" || typeName === "measurements") return "text";
  if (typeName === "width" || typeName === "height" || typeName === "depth") {
    return "number";
  }
  return "chip";
}

/** Normalize raw API variationTypes payload onto a product. */
export function normalizeVariationTypes(raw: unknown): ProductVariationTypeDef[] | undefined {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) return undefined;
  return raw.map((t: Record<string, unknown>, i: number) => {
    const optionsRaw = Array.isArray(t.options) ? t.options : [];
    return {
      id: typeof t.id === "string" ? t.id : undefined,
      typeName: String(t.typeName ?? t.name ?? `type_${i}`),
      isEnabled: t.isEnabled !== false,
      isRequired: !!t.isRequired,
      options: optionsRaw.map((o: Record<string, unknown>, j: number) => ({
        id: typeof o.id === "string" ? o.id : undefined,
        label: String(o.label ?? o.value ?? `Option ${j + 1}`),
        value: String(o.value ?? o.label ?? `opt_${j}`),
        colorHex: typeof o.colorHex === "string" ? o.colorHex : o.colorHex ?? null,
        priceOverride:
          typeof o.priceOverride === "number"
            ? o.priceOverride
            : o.priceOverride == null
              ? null
              : Number(o.priceOverride) || null,
        stockCount:
          typeof o.stockCount === "number"
            ? o.stockCount
            : o.stockCount == null
              ? null
              : Number(o.stockCount),
        isAvailable: o.isAvailable !== false,
        position: typeof o.position === "number" ? o.position : j,
      })),
    };
  });
}
