export type CustomCategory = "tailoring" | "shoemaking" | "jewellery" | "leatherwork" | "home" | "other";
export function customCategory(category: string): CustomCategory {
  const value = category.toLowerCase();
  if (/tailor|clothing|fashion/.test(value)) return "tailoring";
  if (/shoe|footwear/.test(value)) return "shoemaking";
  if (/jewel|jewell/.test(value)) return "jewellery";
  if (/leather/.test(value)) return "leatherwork";
  if (/home|decor|arts|craft|canvas|furniture|painting/.test(value) || value === "art") return "home";
  return "other";
}
export function minimumDeadline(today = new Date()): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export interface CustomOrderFields {
  description: string; budgetMin: string; budgetMax: string; deadline: string;
  details: Record<string, string>; imageCount: number;
}

/** Description is required (non-empty) and capped at 200 characters. No 50-char minimum. */
export const DESCRIPTION_MAX = 200;

export function validateCustomOrder(fields: CustomOrderFields, today = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  const desc = fields.description.trim();
  if (!desc) {
    errors.description = "Please describe your project.";
  } else if (desc.length > DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX} characters.`;
  }
  if (fields.imageCount > 3) errors.images = "Choose no more than 3 reference images.";
  for (const key of ["budgetMin", "budgetMax"] as const) {
    if (fields[key] && (!Number.isFinite(Number(fields[key])) || Number(fields[key]) < 0)) errors[key] = "Enter a valid non-negative budget.";
  }
  if (fields.budgetMin && fields.budgetMax && Number(fields.budgetMax) < Number(fields.budgetMin)) errors.budgetMax = "Maximum budget must be at least the minimum.";
  if (fields.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(fields.deadline) || fields.deadline < minimumDeadline(today))) errors.deadline = "Choose a deadline at least 7 days from today.";
  if ((fields.details.engraving ?? "").length > 30) errors.engraving = "Engraving must be 30 characters or fewer.";
  for (const key of ["chest", "waist", "hips", "shoulderWidth", "sleeveLength", "trouserLength", "footSize", "size", "width", "height", "depth"]) {
    if (fields.details[key] && (!Number.isFinite(Number(fields.details[key])) || Number(fields.details[key]) <= 0)) errors[key] = "Enter a positive measurement.";
  }
  return errors;
}
