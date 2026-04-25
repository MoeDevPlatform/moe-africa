import womanThrift from "@/assets/uploads/woman-thrift.jpg";
import africanBarista from "@/assets/uploads/african-barista.jpg";
import africanShoppers from "@/assets/uploads/african-shoppers.jpg";
import childrensClothes from "@/assets/uploads/childrens-clothes.jpg";
import secondhandMarket from "@/assets/uploads/secondhand-market.jpg";

/**
 * Curated fallback imagery used whenever a remote/uploaded image is missing
 * or fails to load. Replaces the generic gray /placeholder.svg.
 */
export const FALLBACK_IMAGES: string[] = [
  womanThrift,
  africanBarista,
  africanShoppers,
  childrensClothes,
  secondhandMarket,
];

/** Deterministic pick based on a seed (id, name, url) so the same item
 *  always falls back to the same image. */
export const getFallbackImage = (seed?: string | number): string => {
  if (seed === undefined || seed === null) return FALLBACK_IMAGES[0];
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
};

/** Default export — first image, used as a generic single fallback. */
export const FALLBACK_IMAGE = FALLBACK_IMAGES[0];