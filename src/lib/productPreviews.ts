export interface ProductPreview { imageUrl: string; name: string }
export function normalizeProductPreviews(raw: { productPreviews?: unknown; products?: unknown }): ProductPreview[] {
  const rows = Array.isArray(raw.productPreviews) ? raw.productPreviews : Array.isArray(raw.products) ? raw.products : [];
  return rows.filter((row) => row && (!row.status || row.status === "approved")).map((row) => {
    const first = row.images?.[0];
    return { imageUrl: row.imageUrl || (typeof first === "string" ? first : first?.url || first?.imageUrl), name: row.name || "Artisan product" };
  }).filter((row): row is ProductPreview => typeof row.imageUrl === "string" && row.imageUrl.length > 0).slice(0, 3);
}