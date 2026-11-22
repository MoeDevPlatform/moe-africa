import type { ProductAudience } from "@/lib/productAudience";

export type MeasurementKind = "body" | "garment";
export type MeasurementValue = number | { min: number; max: number };

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

const def = (
  key: string,
  label: string,
  kind: MeasurementKind,
  guidance: string,
): SizeMeasurementDefinition => ({ key, label, kind, guidance, required: true });

const TAILORING_DEFINITIONS: Record<ProductAudience, SizeMeasurementDefinition[]> = {
  men: [
    def("chest", "Chest", "body", "Measure around the fullest part of the chest."),
    def("waist", "Waist", "body", "Measure around the natural waist."),
    def("shoulder", "Shoulder", "body", "Measure shoulder point to shoulder point."),
    def("sleeve", "Sleeve", "garment", "Measure from shoulder point to the intended cuff."),
    def("neck", "Neck", "body", "Measure comfortably around the base of the neck."),
    def("inseam", "Inseam", "body", "Measure from crotch to the intended trouser hem."),
    def("garment_length", "Garment length", "garment", "Measure the finished garment from its highest shoulder point."),
  ],
  women: [
    def("bust", "Bust", "body", "Measure around the fullest part of the bust."),
    def("waist", "Waist", "body", "Measure around the natural waist."),
    def("hips", "Hips", "body", "Measure around the fullest part of the hips."),
    def("shoulder", "Shoulder", "body", "Measure shoulder point to shoulder point."),
    def("sleeve", "Sleeve", "garment", "Measure from shoulder point to the intended cuff."),
    def("garment_length", "Garment length", "garment", "Measure the finished garment from its highest shoulder point."),
  ],
  children: [
    def("height", "Height", "body", "Measure standing height without shoes."),
    def("age_range", "Age range", "body", "Enter the applicable age range as minimum and maximum years."),
    def("chest", "Chest", "body", "Measure around the fullest part of the chest."),
    def("waist", "Waist", "body", "Measure around the natural waist."),
    def("garment_length", "Garment length", "garment", "Measure the finished garment length."),
  ],
  unisex: [
    def("chest", "Chest", "body", "Measure around the fullest part of the chest."),
    def("waist", "Waist", "body", "Measure around the natural waist."),
    def("garment_length", "Garment length", "garment", "Measure the finished garment length."),
  ],
};

const FOOTWEAR_DEFINITIONS: Record<ProductAudience, SizeMeasurementDefinition[]> = {
  men: [
    def("foot_length", "Foot length", "body", "Measure heel to longest toe while standing."),
    def("foot_width", "Foot width", "body", "Measure across the widest part of the foot."),
  ],
  women: [
    def("foot_length", "Foot length", "body", "Measure heel to longest toe while standing."),
    def("foot_width", "Foot width", "body", "Measure across the widest part of the foot."),
  ],
  children: [
    def("foot_length", "Foot length", "body", "Measure heel to longest toe while standing."),
    def("foot_width", "Foot width", "body", "Measure across the widest part of the foot."),
  ],
  unisex: [
    def("foot_length", "Foot length", "body", "Measure heel to longest toe while standing."),
    def("foot_width", "Foot width", "body", "Measure across the widest part of the foot."),
  ],
};

export const isSizingCategory = (category?: string | null) =>
  category === "tailoring" || category === "shoemaking";

export function createSizeProfile(category: string, audience: ProductAudience): ProductSizeProfile {
  const footwear = category === "shoemaking";
  return {
    audience,
    productType: footwear ? "footwear" : "apparel",
    sizingSystem: "",
    unit: "cm",
    measurementDefinitions: (footwear ? FOOTWEAR_DEFINITIONS : TAILORING_DEFINITIONS)[audience].map((item) => ({ ...item })),
    isMadeToMeasure: false,
    instructions: "",
    sizes: [],
    fitChoices: [],
  };
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
  for (const audience of audiences) {
    const profile = profiles.find((item) => item.audience === audience);
    if (!profile) return `Configure Size & Fit for ${audience}.`;
    if (!profile.sizingSystem.trim()) return `Enter a sizing system for ${audience}.`;
    if (profile.isMadeToMeasure) continue;
    if (!profile.sizes.length) return `Add at least one offered size for ${audience}.`;
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
  return null;
}
