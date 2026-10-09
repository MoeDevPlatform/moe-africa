import * as LucideIcons from "lucide-react";
import { Tag, type LucideIcon } from "lucide-react";

/** Curated Lucide names for category / icon picker UI. */
export const PICKER_ICON_NAMES: string[] = [
  "Tag",
  "Package",
  "Scissors",
  "Footprints",
  "Palette",
  "Sparkles",
  "Briefcase",
  "Gem",
  "Home",
  "Shirt",
  "ShoppingBag",
  "Heart",
  "Star",
  "Award",
  "Brush",
  "Hammer",
  "Wrench",
  "Layers",
  "Flower2",
  "Crown",
];

export function resolveLucideIcon(name?: string | null): LucideIcon {
  if (!name?.trim()) return Tag;
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[
    name.trim()
  ];
  return typeof Icon === "function" || (Icon && typeof Icon === "object")
    ? Icon
    : Tag;
}
