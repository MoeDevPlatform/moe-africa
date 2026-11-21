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

const AUDIENCE_TERMS: Array<[Exclude<ProductAudience, "unisex">, string[]]> = [
  ["children", ["children's", "childrens", "children", "child", "kids", "kid's", "kid", "boys", "boy's", "boy", "girls", "girl's", "girl", "baby", "toddler"]],
  ["women", ["women's", "womens", "women", "woman", "ladies", "lady's", "lady", "female", "females"]],
  ["men", ["men's", "mens", "men", "man", "male", "males", "gents", "gentlemen"]],
];

/** Pull an audience word ("ladies shoes" → women + "shoes") out of a free-text search. */
export function parseAudienceQuery(query: string): { audience: Exclude<ProductAudience, "unisex"> | null; rest: string } {
  const words = query.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']/g, "");
    for (const [audience, terms] of AUDIENCE_TERMS) {
      if (terms.includes(w)) {
        return { audience, rest: words.filter((_, j) => j !== i).join(" ") };
      }
    }
  }
  return { audience: null, rest: query.trim() };
}

/** Men/Women include unisex; Children only explicit children (adult unisex never leaks in). */
export function matchesAudience(designedFor: readonly string[] | undefined, audience: string): boolean {
  const values = designedFor ?? [];
  if (audience === "children" || audience === "unisex") return values.includes(audience);
  return values.includes(audience) || values.includes("unisex");
}

export type AudienceSuggestion =
  | { status: "not_applicable"; designedFor: [] }
  | { status: "suggested"; designedFor: ProductAudience[] }
  | { status: "uncertain"; designedFor: [] };

/** Suggest only from clear text evidence; anything ambiguous is flagged for manual review. */
export function suggestProductAudience(p: { name?: string; description?: string; category?: string | null }): AudienceSuggestion {
  if (!requiresProductAudience(p.category)) return { status: "not_applicable", designedFor: [] };
  const text = `${p.name ?? ""} ${p.description ?? ""}`;
  const found = new Set<ProductAudience>();
  for (const word of text.split(/\s+/)) {
    const { audience } = parseAudienceQuery(word);
    if (audience) found.add(audience);
  }
  if (/\bunisex\b/i.test(text)) found.add("unisex");
  if (found.size === 0) return { status: "uncertain", designedFor: [] };
  const order = PRODUCT_AUDIENCES.map((a) => a.value);
  return { status: "suggested", designedFor: [...found].sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
}
