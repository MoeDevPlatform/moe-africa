export const PRODUCT_AUDIENCES = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "children", label: "Children" },
  { value: "unisex", label: "Unisex" },
] as const;

export type ProductAudience = (typeof PRODUCT_AUDIENCES)[number]["value"];

export const AUDIENCE_REQUIRED_CATEGORIES = new Set(["tailoring", "shoemaking"]);

export function requiresProductAudience(category?: string | null) {
  return AUDIENCE_REQUIRED_CATEGORIES.has((category ?? "").toLowerCase());
}

export function audienceLabel(value: string) {
  return PRODUCT_AUDIENCES.find((item) => item.value === value)?.label ?? value;
}
