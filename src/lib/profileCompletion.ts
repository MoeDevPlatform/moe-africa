export interface CompletionInput {
  businessName?: string | null;
  storeImageUrl?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  serviceCategories?: string | string[] | null;
  category?: string | null;
  productCount?: number;
}

const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : Boolean(v));

/** Equal-weight profile completeness; independent of document verification and never grants badges. */
export function profileCompletion(p: CompletionInput) {
  const checks: Array<{ label: string; done: boolean }> = [
    { label: "Business name", done: filled(p.businessName) },
    { label: "Profile image", done: filled(p.storeImageUrl) },
    { label: "Cover image", done: filled(p.coverImageUrl) },
    { label: "Business description", done: filled(p.description) },
    { label: "Location (city, state, country)", done: filled(p.city) && filled(p.state) && filled(p.country) },
    { label: "Contact information", done: filled(p.phone) || filled(p.email) },
    { label: "Categories", done: filled(p.serviceCategories) || filled(p.category) },
    { label: "Portfolio (at least one product)", done: (p.productCount ?? 0) > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c.done).map((c) => c.label), checks };
}
