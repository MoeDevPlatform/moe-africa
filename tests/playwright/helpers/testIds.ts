/**
 * Seed / fixture product & artisan IDs for variation + custom-order specs.
 * Override via PLAYWRIGHT_* env after backend seeds data.
 */
export const IDS = {
  variationPriceProduct:
    process.env.PLAYWRIGHT_VARIATION_PRICE_PRODUCT_ID || '',
  noVariationProduct: process.env.PLAYWRIGHT_NO_VARIATION_PRODUCT_ID || '',
  productWithVariations:
    process.env.PLAYWRIGHT_PRODUCT_WITH_VARIATIONS_ID || '',
  soldOutOptionProduct:
    process.env.PLAYWRIGHT_SOLD_OUT_OPTION_PRODUCT_ID || '',
  tailoringBodyTypeProduct:
    process.env.PLAYWRIGHT_TAILORING_BODY_TYPE_PRODUCT_ID || '',
  eligibleArtisan: process.env.PLAYWRIGHT_ELIGIBLE_ARTISAN_ID || '',
  ineligibleArtisan: process.env.PLAYWRIGHT_INELIGIBLE_ARTISAN_ID || '',
  adminToggleArtisan: process.env.PLAYWRIGHT_ADMIN_TOGGLE_ARTISAN_ID || '',
};

export function requireId(value: string, label: string): string {
  if (!value) {
    throw new Error(
      `Missing ${label}. Set the matching PLAYWRIGHT_* env in local .env after seeding.`,
    );
  }
  return value;
}
