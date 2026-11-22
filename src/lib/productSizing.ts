import type { ProductAudience } from "@/lib/productAudience";

export type MeasurementKind = "body" | "garment";
export type MeasurementValue = number | { min: number; max: number };
export type SizingMode = "standard" | "made_to_measure" | "one_size";

export interface SizeMeasurementDefinition {
  key: string;
  label: string;
  kind: MeasurementKind;
  required: boolean;
  guidance?: string;
}

export interface ProductSizeOption {
  id?: string;
  label: string;
  measurements: Record<string, MeasurementValue>;
  position?: number;
}

export interface ProductFitChoice {
  id?: string;
  label: string;
  description: string;
  illustrationUrl?: string | null;
  position?: number;
}

export interface ProductSizeProfile {
  id?: string;
  audience: ProductAudience;
  productType: string;
  sizingSystem: string;
  unit: "cm" | "in";
  measurementDefinitions: SizeMeasurementDefinition[];
  isMadeToMeasure: boolean;
  instructions?: string | null;
  illustrationUrl?: string | null;
  version?: number;
  sizes: ProductSizeOption[];
  fitChoices: ProductFitChoice[];
}

export interface ProductSizingSelection {
  audience: ProductAudience;
  profileId: string;
  sizeId?: string;
  fitChoiceId?: string;
}

export interface ProductSizingSnapshot {
  audience: ProductAudience;
  profileId: string;
  profileVersion: number;
  productType: string;
  sizingSystem: string;
  unit: "cm" | "in";
  measurementDefinitions: SizeMeasurementDefinition[];
  size: { id: string; label: string; measurements: Record<string, MeasurementValue> } | null;
  fitChoice: { id: string; label: string; description: string; illustrationUrl?: string | null } | null;
}

export interface ProductTypeOption {
  value: string;
  label: string;
  /** Whether this type needs Size & Fit configuration at all. */
  sizingApplicable: boolean;
  allowsStandard: boolean;
  allowsMadeToMeasure: boolean;
  allowsOneSize: boolean;
  /** Adult visual fit choices are useful for this type. */
  allowsFitGuide: boolean;
  suggestedSizeLabels: string[];
}

const def = (
  key: string,
  label: string,
  kind: MeasurementKind,
  guidance: string,
  required = true,
): SizeMeasurementDefinition => ({ key, label, kind, guidance, required });

const M = {
  chest: def("chest", "Chest", "body", "Measure around the fullest part of the chest."),
  bust: def("bust", "Bust", "body", "Measure around the fullest part of the bust."),
  waist: def("waist", "Waist", "body", "Measure around the natural waist."),
  hips: def("hips", "Hips", "body", "Measure around the fullest part of the hips."),
  seat: def("seat", "Seat / hips", "body", "Measure around the fullest part of the seat."),
  shoulder: def("shoulder", "Shoulder width", "body", "Measure shoulder point to shoulder point."),
  sleeve: def("sleeve", "Sleeve length", "garment", "Measure from the shoulder point to the intended cuff."),
  neck: def("neck", "Neck", "body", "Measure comfortably around the base of the neck.", false),
  shirt_length: def("shirt_length", "Shirt length", "garment", "Measure from the highest shoulder point to the hem."),
  blouse_length: def("blouse_length", "Blouse length", "garment", "Measure from the highest shoulder point to the hem."),
  dress_length: def("dress_length", "Dress length", "garment", "Measure from the highest shoulder point to the hem."),
  skirt_length: def("skirt_length", "Skirt length", "garment", "Measure from the waist to the intended hem."),
  jacket_length: def("jacket_length", "Jacket length", "garment", "Measure from the highest shoulder point to the hem."),
  garment_length: def("garment_length", "Garment length", "garment", "Measure the finished garment from its highest point to the hem."),
  inseam: def("inseam", "Inseam", "body", "Measure from the crotch to the intended trouser hem."),
  outseam: def("outseam", "Outseam", "garment", "Measure from the waist to the outside hem.", false),
  height: def("height", "Height", "body", "Measure standing height without shoes."),
  age_range: def("age_range", "Age range (years)", "body", "Enter the applicable age range as minimum and maximum years.", false),
  foot_length: def("foot_length", "Foot length", "body", "Measure heel to longest toe while standing."),
  foot_width: def("foot_width", "Foot width", "body", "Measure across the widest part of the foot.", false),
};

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FOOTWEAR_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const CHILD_SIZES = ["2–3 yrs", "4–5 yrs", "6–7 yrs", "8–9 yrs", "10–12 yrs"];

export const PRODUCT_TYPES_BY_CATEGORY: Record<string, ProductTypeOption[]> = {
  tailoring: [
    { value: "shirt", label: "Shirt / blouse", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "trousers", label: "Trousers / pants", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "dress", label: "Dress", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "skirt", label: "Skirt", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "suit", label: "Suit", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "jacket", label: "Jacket", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "traditional_wear", label: "Traditional wear", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "other_apparel", label: "Other clothing", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
  ],
  shoemaking: [
    { value: "sneakers", label: "Sneakers", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: FOOTWEAR_SIZES },
    { value: "formal_shoes", label: "Formal shoes", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: FOOTWEAR_SIZES },
    { value: "sandals", label: "Sandals", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: FOOTWEAR_SIZES },
    { value: "slippers", label: "Slippers", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: FOOTWEAR_SIZES },
    { value: "boots", label: "Boots", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: FOOTWEAR_SIZES },
    { value: "other_footwear", label: "Other footwear", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: FOOTWEAR_SIZES },
  ],
  leatherwork: [
    { value: "bags", label: "Bags", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "belts", label: "Belts", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: false, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: ["S", "M", "L", "XL"] },
    { value: "wallets", label: "Wallets", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "leather_jacket", label: "Leather jacket", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: true, allowsOneSize: false, allowsFitGuide: true, suggestedSizeLabels: APPAREL_SIZES },
    { value: "other_leather", label: "Other leather goods", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
  ],
  jewellery: [
    { value: "necklaces", label: "Necklaces", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "earrings", label: "Earrings", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "bracelets", label: "Bracelets", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "rings", label: "Rings", sizingApplicable: true, allowsStandard: true, allowsMadeToMeasure: false, allowsOneSize: false, allowsFitGuide: false, suggestedSizeLabels: ["5", "6", "7", "8", "9", "10"] },
    { value: "other_jewellery", label: "Other jewellery", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
  ],
  home_and_decor: [
    { value: "tables", label: "Tables", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "chairs", label: "Chairs", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "sofas", label: "Sofas", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "beds", label: "Beds", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
    { value: "other_home", label: "Other home & decor", sizingApplicable: false, allowsStandard: false, allowsMadeToMeasure: false, allowsOneSize: true, allowsFitGuide: false, suggestedSizeLabels: ["One Size"] },
  ],
};

const TYPE_MEASUREMENTS: Record<string, Partial<Record<ProductAudience, SizeMeasurementDefinition[]>>> = {
  shirt: {
    men: [M.chest, M.shoulder, M.sleeve, M.shirt_length, M.neck],
    women: [M.bust, M.shoulder, M.sleeve, M.blouse_length],
    children: [M.height, M.chest, M.garment_length, M.age_range],
    unisex: [M.chest, M.shoulder, M.sleeve, M.shirt_length],
  },
  trousers: {
    men: [M.waist, M.seat, M.inseam, M.outseam],
    women: [M.waist, M.hips, M.inseam, M.outseam],
    children: [M.height, M.waist, M.inseam, M.age_range],
    unisex: [M.waist, M.hips, M.inseam],
  },
  dress: {
    women: [M.bust, M.waist, M.hips, M.dress_length],
    children: [M.height, M.chest, M.waist, M.dress_length, M.age_range],
    unisex: [M.bust, M.waist, M.hips, M.dress_length],
    men: [M.chest, M.waist, M.garment_length],
  },
  skirt: {
    women: [M.waist, M.hips, M.skirt_length],
    children: [M.height, M.waist, M.skirt_length, M.age_range],
    unisex: [M.waist, M.hips, M.skirt_length],
    men: [M.waist, M.hips, M.skirt_length],
  },
  suit: {
    men: [M.chest, M.waist, M.shoulder, M.sleeve, M.inseam, M.garment_length],
    women: [M.bust, M.waist, M.hips, M.shoulder, M.sleeve, M.garment_length],
    children: [M.height, M.chest, M.waist, M.garment_length, M.age_range],
    unisex: [M.chest, M.waist, M.shoulder, M.garment_length],
  },
  jacket: {
    men: [M.chest, M.shoulder, M.sleeve, M.jacket_length],
    women: [M.bust, M.shoulder, M.sleeve, M.jacket_length],
    children: [M.height, M.chest, M.jacket_length, M.age_range],
    unisex: [M.chest, M.shoulder, M.sleeve, M.jacket_length],
  },
  leather_jacket: {
    men: [M.chest, M.shoulder, M.sleeve, M.jacket_length],
    women: [M.bust, M.shoulder, M.sleeve, M.jacket_length],
    children: [M.height, M.chest, M.jacket_length, M.age_range],
    unisex: [M.chest, M.shoulder, M.sleeve, M.jacket_length],
  },
  traditional_wear: {
    men: [M.chest, M.shoulder, M.sleeve, M.garment_length],
    women: [M.bust, M.waist, M.hips, M.garment_length],
    children: [M.height, M.chest, M.garment_length, M.age_range],
    unisex: [M.chest, M.waist, M.garment_length],
  },
  other_apparel: {
    men: [M.chest, M.waist, M.shoulder, M.garment_length],
    women: [M.bust, M.waist, M.hips, M.garment_length],
    children: [M.height, M.chest, M.waist, M.garment_length, M.age_range],
    unisex: [M.chest, M.waist, M.garment_length],
  },
  sneakers: { men: [M.foot_length, M.foot_width], women: [M.foot_length, M.foot_width], children: [M.foot_length, M.foot_width], unisex: [M.foot_length, M.foot_width] },
  formal_shoes: { men: [M.foot_length, M.foot_width], women: [M.foot_length, M.foot_width], children: [M.foot_length, M.foot_width], unisex: [M.foot_length, M.foot_width] },
  sandals: { men: [M.foot_length, M.foot_width], women: [M.foot_length, M.foot_width], children: [M.foot_length, M.foot_width], unisex: [M.foot_length, M.foot_width] },
  slippers: { men: [M.foot_length], women: [M.foot_length], children: [M.foot_length], unisex: [M.foot_length] },
  boots: { men: [M.foot_length, M.foot_width], women: [M.foot_length, M.foot_width], children: [M.foot_length, M.foot_width], unisex: [M.foot_length, M.foot_width] },
  other_footwear: { men: [M.foot_length, M.foot_width], women: [M.foot_length, M.foot_width], children: [M.foot_length, M.foot_width], unisex: [M.foot_length, M.foot_width] },
  belts: {
    men: [def("waist", "Belt waist", "body", "Measure around the waist where the belt will sit.")],
    women: [def("waist", "Belt waist", "body", "Measure around the waist where the belt will sit.")],
    children: [def("waist", "Belt waist", "body", "Measure around the waist where the belt will sit.")],
    unisex: [def("waist", "Belt waist", "body", "Measure around the waist where the belt will sit.")],
  },
  rings: {
    men: [def("ring_size", "Ring size", "body", "Use a ring sizer or measure the inner circumference.")],
    women: [def("ring_size", "Ring size", "body", "Use a ring sizer or measure the inner circumference.")],
    children: [def("ring_size", "Ring size", "body", "Use a ring sizer or measure the inner circumference.")],
    unisex: [def("ring_size", "Ring size", "body", "Use a ring sizer or measure the inner circumference.")],
  },
};

/** Categories that may show the Size & Fit guided editor (including non-apparel types that skip charts). */
export const isSizingCategory = (category?: string | null) => {
  const value = (category ?? "").toLowerCase();
  return (
    value === "tailoring" ||
    value === "shoemaking" ||
    value === "leatherwork" ||
    value === "jewellery" ||
    value === "home_and_decor"
  );
};

export function productTypesForCategory(category?: string | null): ProductTypeOption[] {
  const value = (category ?? "").toLowerCase();
  return PRODUCT_TYPES_BY_CATEGORY[value] ?? [];
}

/** Map legacy free-text / generic productType values onto guided templates. */
export function normalizeProductType(category: string | null | undefined, productType?: string | null) {
  const raw = (productType ?? "").trim();
  if (!raw) return productTypesForCategory(category)[0]?.value ?? "";
  if (raw === "apparel") return "other_apparel";
  if (raw === "footwear") return "other_footwear";
  const known = productTypesForCategory(category).some((item) => item.value === raw);
  return known ? raw : raw;
}

export function getProductTypeOption(category: string | null | undefined, productType: string | null | undefined) {
  const normalized = normalizeProductType(category, productType);
  return productTypesForCategory(category).find((item) => item.value === normalized) ?? null;
}

export function productTypeLabel(productType?: string | null) {
  if (!productType) return "";
  for (const options of Object.values(PRODUCT_TYPES_BY_CATEGORY)) {
    const match = options.find((item) => item.value === productType);
    if (match) return match.label;
  }
  if (productType === "apparel") return "Clothing";
  if (productType === "footwear") return "Footwear";
  return productType.replace(/_/g, " ");
}

export function measurementsFor(productType: string, audience: ProductAudience): SizeMeasurementDefinition[] {
  const byAudience = TYPE_MEASUREMENTS[productType];
  if (!byAudience) {
    return audience === "children"
      ? [M.height, M.chest, M.waist, M.garment_length, M.age_range]
      : [M.chest, M.waist, M.garment_length];
  }
  return (byAudience[audience] ?? byAudience.unisex ?? Object.values(byAudience)[0] ?? []).map((item) => ({ ...item }));
}

export function suggestedSizeLabelsFor(
  category: string,
  productType: string,
  audience: ProductAudience,
): string[] {
  const option = getProductTypeOption(category, productType);
  if (!option) return audience === "children" ? CHILD_SIZES : APPAREL_SIZES;
  if (audience === "children" && category === "tailoring") return CHILD_SIZES;
  return option.suggestedSizeLabels;
}

export function createSizeProfile(
  category: string,
  audience: ProductAudience,
  productType?: string,
): ProductSizeProfile {
  const types = productTypesForCategory(category);
  const normalized = normalizeProductType(category, productType);
  const resolvedType =
    normalized && types.some((item) => item.value === normalized)
      ? normalized
      : types[0]?.value ?? (category === "shoemaking" ? "other_footwear" : "other_apparel");
  const typeOption = getProductTypeOption(category, resolvedType);
  const sizingApplicable = typeOption?.sizingApplicable !== false;
  return {
    audience,
    productType: resolvedType,
    sizingSystem: typeOption ? `${typeOption.label} chart` : "House size chart",
    unit: "cm",
    measurementDefinitions: sizingApplicable ? measurementsFor(resolvedType, audience) : [],
    isMadeToMeasure: false,
    instructions: "",
    sizes: [],
    fitChoices: [],
  };
}

export function deriveSizingMode(profile: ProductSizeProfile): SizingMode {
  if (profile.isMadeToMeasure) return "made_to_measure";
  if (
    profile.sizes.length === 1 &&
    /^one\s*size$/i.test(profile.sizes[0]?.label?.trim() ?? "")
  ) {
    return "one_size";
  }
  return "standard";
}

export function applySizingMode(
  profile: ProductSizeProfile,
  mode: SizingMode,
  freshId: () => string,
): ProductSizeProfile {
  if (mode === "made_to_measure") {
    return { ...profile, isMadeToMeasure: true, sizes: [] };
  }
  if (mode === "one_size") {
    const existing = profile.sizes.find((size) => /^one\s*size$/i.test(size.label.trim()));
    return {
      ...profile,
      isMadeToMeasure: false,
      sizes: [
        existing ?? {
          id: freshId(),
          label: "One Size",
          measurements: {},
          position: 0,
        },
      ],
    };
  }
  return {
    ...profile,
    isMadeToMeasure: false,
    sizes: profile.sizes.filter((size) => !/^one\s*size$/i.test(size.label.trim())),
  };
}

export function applyProductTypeToProfile(
  profile: ProductSizeProfile,
  category: string,
  productType: string,
): ProductSizeProfile {
  const typeOption = getProductTypeOption(category, productType);
  const sizingApplicable = typeOption?.sizingApplicable !== false;
  const nextDefs = sizingApplicable ? measurementsFor(productType, profile.audience) : [];
  const allowedKeys = new Set(nextDefs.map((item) => item.key));
  return {
    ...profile,
    productType,
    sizingSystem: profile.sizingSystem.trim()
      ? profile.sizingSystem
      : typeOption
        ? `${typeOption.label} chart`
        : profile.sizingSystem,
    measurementDefinitions: nextDefs,
    sizes: sizingApplicable
      ? profile.sizes.map((size) => ({
          ...size,
          measurements: Object.fromEntries(
            Object.entries(size.measurements).filter(([key]) => allowedKeys.has(key)),
          ),
        }))
      : [],
    fitChoices: !sizingApplicable || typeOption?.allowsFitGuide === false || profile.audience === "children"
      ? []
      : profile.fitChoices,
  };
}

export function isProfileComplete(profile: ProductSizeProfile): boolean {
  if (!profile.productType.trim() || !profile.sizingSystem.trim()) return false;
  if (profile.isMadeToMeasure) return true;
  if (!profile.sizes.length) return false;
  for (const size of profile.sizes) {
    if (!size.label.trim()) return false;
    for (const definition of profile.measurementDefinitions.filter((item) => item.required)) {
      const value = size.measurements[definition.key];
      const valid = typeof value === "number"
        ? Number.isFinite(value) && value > 0
        : !!value && Number(value.min) > 0 && Number(value.max) >= Number(value.min);
      if (!valid) return false;
    }
  }
  return true;
}

export function sizingSummary(profiles: ProductSizeProfile[], audiences: ProductAudience[]): string[] {
  return audiences.map((audience) => {
    const profile = profiles.find((item) => item.audience === audience);
    if (!profile) return `${audience}: not started`;
    if (profile.isMadeToMeasure) return `${audience}: Made to measure`;
    if (deriveSizingMode(profile) === "one_size") return `${audience}: One size`;
    const labels = profile.sizes.map((size) => size.label).filter(Boolean);
    return labels.length
      ? `${audience}: ${labels.join(", ")}`
      : `${audience}: sizes needed`;
  });
}

export const CURATED_FIT_CHOICES: Record<ProductAudience, Array<Omit<ProductFitChoice, "id">>> = {
  men: [
    { label: "Close fit", description: "A closer silhouette with less ease." },
    { label: "Regular fit", description: "Balanced ease for everyday movement." },
    { label: "Relaxed fit", description: "Additional ease through the garment." },
  ],
  women: [
    { label: "Close fit", description: "A closer silhouette with less ease." },
    { label: "Regular fit", description: "Balanced ease for everyday movement." },
    { label: "Relaxed fit", description: "Additional ease through the garment." },
  ],
  children: [],
  unisex: [
    { label: "Close fit", description: "A closer silhouette with less ease." },
    { label: "Regular fit", description: "Balanced ease for everyday movement." },
    { label: "Relaxed fit", description: "Additional ease through the garment." },
  ],
};

export function validateSizeProfiles(
  category: string,
  audiences: ProductAudience[],
  profiles: ProductSizeProfile[],
): string | null {
  if (!isSizingCategory(category)) return null;
  const types = productTypesForCategory(category);
  const sharedType =
    profiles.find((profile) => audiences.includes(profile.audience))?.productType ??
    profiles[0]?.productType ??
    "";
  const typeOption = getProductTypeOption(category, sharedType);
  if (typeOption && !typeOption.sizingApplicable) return null;
  if (typeOption?.sizingApplicable && audiences.length === 0) {
    return "Select who the product is for before saving size charts.";
  }

  for (const audience of audiences) {
    const profile = profiles.find((item) => item.audience === audience);
    if (!profile) return `Configure sizing for ${audience}.`;
    if (!profile.productType.trim()) return `Choose what you are selling before configuring ${audience} sizing.`;
    const option = getProductTypeOption(category, profile.productType);
    if (option && !option.sizingApplicable) continue;
    if (!profile.sizingSystem.trim()) return `Enter a sizing system name for ${audience}.`;
    if (profile.isMadeToMeasure) continue;
    if (!profile.sizes.length) {
      return option?.allowsOneSize
        ? `Add One Size or standard sizes for ${audience}.`
        : `Add at least one offered size for ${audience}.`;
    }
    for (const size of profile.sizes) {
      if (!size.label.trim()) return `Every ${audience} size needs a label.`;
      for (const definition of profile.measurementDefinitions.filter((item) => item.required)) {
        const value = size.measurements[definition.key];
        const valid = typeof value === "number"
          ? Number.isFinite(value) && value > 0
          : !!value && Number(value.min) > 0 && Number(value.max) >= Number(value.min);
        if (!valid) return `${audience} ${size.label} needs a valid ${definition.label} measurement.`;
      }
    }
  }
  // Keep types list referenced for future category-specific rules.
  void types;
  return null;
}
