import { normalizeProductPreviews } from "@/lib/productPreviews";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";

export default function ArtisanProductPreviews({ artisan }: { artisan: { productPreviews?: unknown; products?: unknown } }) {
  const previews = normalizeProductPreviews(artisan);
  if (!previews.length) return null;
  return <div className="flex gap-2 my-3" aria-label="Artisan product previews">{previews.map((preview, index) => <img key={`${preview.imageUrl}-${index}`} src={preview.imageUrl} alt={preview.name} loading="lazy" decoding="async" width={60} height={60} className="h-[60px] w-[60px] rounded-lg object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />)}</div>;
}