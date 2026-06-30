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
};

export const getCategory = (
  value: string,
  categories: CategoryDef[],
): CategoryDef | undefined =>
  categories.find((c) => c.value === value);
