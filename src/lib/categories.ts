import {
  Scissors,
  Footprints,
  Palette,
  Sparkle,
  Briefcase,
  Gem,
  Home as HomeIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Canonical category list — the single source of truth used across the app
 * (home grid, mega menu, signup, filters). Do not redefine these values
 * elsewhere; import from here.
 */
export interface CategoryDef {
  /** Canonical slug used as the API `category` value. */
  value: string;
  /** Display label shown to users. */
  label: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Static product-type suggestions for the mega menu "Shop by Type" column. */
  types: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    value: "tailoring",
    label: "Tailoring",
    icon: Scissors,
    types: ["Kaftans", "Agbada", "Ankara Dresses", "Corporate Suits", "Traditional Wear"],
  },
  {
    value: "arts_and_crafts",
    label: "Arts & Crafts",
    icon: Palette,
    types: ["Paintings", "Sculptures", "Handmade Cards", "Woven Baskets"],
  },
  {
    value: "shoemaking",
    label: "Shoemaking",
    icon: Footprints,
    types: ["Men's Shoes", "Women's Shoes", "Sandals", "Boots", "Custom Sneakers"],
  },
  {
    value: "beauty",
    label: "Beauty",
    icon: Sparkle,
    types: ["Skincare", "Hair Products", "Makeup", "Natural Oils"],
  },
  {
    value: "leatherwork",
    label: "Leatherwork",
    icon: Briefcase,
    types: ["Bags", "Belts", "Wallets", "Shoes", "Jackets"],
  },
  {
    value: "jewellery",
    label: "Jewellery",
    icon: Gem,
    types: ["Necklaces", "Earrings", "Bracelets", "Rings", "Anklets"],
  },
  {
    value: "home_and_decor",
    label: "Home & Decor",
    icon: HomeIcon,
    types: ["Wall Art", "Throw Pillows", "Table Decor", "Candles", "Rugs"],
  },
];

export const getCategory = (value: string): CategoryDef | undefined =>
  CATEGORIES.find((c) => c.value === value);