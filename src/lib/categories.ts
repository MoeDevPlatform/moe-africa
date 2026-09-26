import {
  Scissors,
  Footprints,
  Palette,
  Sparkles,
  Briefcase,
  Gem,
  Home as HomeIcon,
  Package,
  type LucideIcon,
} from "lucide-react";

/** Canonical category shape from GET /categories */
export interface CategoryDef {
  id?: string;
  /** Canonical slug used as the API `category` value. */
  value: string;
  /** Display label shown to users. */
  label: string;
  /** Lucide icon key from the API. */
  iconKey?: string | null;
  icon?: LucideIcon;
  order?: number;
  /** Static product-type suggestions for the mega menu "Shop by Type" column. */
  types?: string[];
}

/**
 * Canonical product/service category options.
 * `value` is the snake_case slug sent to the API; `label` is UI-only.
 */
export const PRODUCT_CATEGORIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "tailoring", label: "Tailoring" },
  { value: "arts_and_crafts", label: "Arts & Crafts" },
  { value: "shoemaking", label: "Shoemaking" },
  { value: "beauty", label: "Beauty" },
  { value: "leatherwork", label: "Leatherwork" },
  { value: "jewellery", label: "Jewellery" },
  { value: "home_and_decor", label: "Home & Decor" },
  { value: "paintings_and_canvas", label: "Paintings and Canvas" },
] as const;

/** Legacy API slugs → current canonical values. */
const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  canvas: "paintings_and_canvas",
  crafts: "arts_and_crafts",
  art: "arts_and_crafts",
  accessories: "jewellery",
  furniture: "home_and_decor",
  "arts & crafts": "arts_and_crafts",
  "home & decor": "home_and_decor",
  "paintings and canvas": "paintings_and_canvas",
  "canvas & painting": "paintings_and_canvas",
};

/** Normalize any label, slug, or legacy alias to the snake_case API value. */
export function toCategoryValue(input: string | null | undefined): string {
  if (!input?.trim()) return "";
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  const byValue = PRODUCT_CATEGORIES.find((c) => c.value === lower || c.value === trimmed);
  if (byValue) return byValue.value;

  const byLabel = PRODUCT_CATEGORIES.find((c) => c.label.toLowerCase() === lower);
  if (byLabel) return byLabel.value;

  if (LEGACY_CATEGORY_ALIASES[lower]) return LEGACY_CATEGORY_ALIASES[lower];

  // Slugify free-form labels (e.g. "Paintings and Canvas" → paintings_and_canvas)
  return lower
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Map a snake_case API value (or legacy alias) back to a display label. */
export function toCategoryLabel(input: string | null | undefined): string {
  if (!input?.trim()) return "";
  const value = toCategoryValue(input);
  const found = PRODUCT_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? input.replace(/_/g, " ");
}

/** Map API iconKey strings to Lucide components. */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Scissors,
  Palette,
  Footprints,
  Sparkles,
  Briefcase,
  Gem,
  Home: HomeIcon,
  Package,
};

export const getCategoryIcon = (iconKey?: string | null): LucideIcon =>
  (iconKey && CATEGORY_ICON_MAP[iconKey]) || Package;

/** Default mega-menu type suggestions keyed by slug (optional fallback). */
export const DEFAULT_CATEGORY_TYPES: Record<string, string[]> = {
  tailoring: ["Kaftans", "Agbada", "Ankara Dresses", "Corporate Suits", "Traditional Wear"],
  arts_and_crafts: ["Paintings", "Sculptures", "Handmade Cards", "Woven Baskets"],
  shoemaking: ["Men's Shoes", "Women's Shoes", "Sandals", "Boots", "Custom Sneakers"],
  beauty: ["Skincare", "Hair Products", "Makeup", "Natural Oils"],
  leatherwork: ["Bags", "Belts", "Wallets", "Shoes", "Jackets"],
  jewellery: ["Necklaces", "Earrings", "Bracelets", "Rings", "Anklets"],
  home_and_decor: ["Wall Art", "Throw Pillows", "Table Decor", "Candles", "Rugs"],
  paintings_and_canvas: ["Canvas Paintings", "Printed Canvas", "Portraits", "Abstract Art"],
};

export const getCategory = (
  value: string,
  categories: CategoryDef[],
): CategoryDef | undefined => {
  const canonical = toCategoryValue(value);
  return (
    categories.find((c) => c.value === canonical || c.value === value) ??
    (canonical
      ? {
          value: canonical,
          label: toCategoryLabel(canonical),
          icon: Package,
          types: DEFAULT_CATEGORY_TYPES[canonical] ?? [],
        }
      : undefined)
  );
};
