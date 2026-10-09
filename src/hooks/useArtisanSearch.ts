import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/moeApi";
import { providersService, artisanReviewsService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";
import { DEFAULT_ARTISAN_FILTERS, type FilterState } from "@/components/marketplace/FilterDrawer";

export const ARTISAN_PAGE_SIZE = 12;
const DEFAULT_MAX = DEFAULT_ARTISAN_FILTERS.priceRange[1];

/** Real average from the artisan's reviews (server aggregate is not maintained). */
async function realAverage(id: number): Promise<number | null> {
  const res = await artisanReviewsService.list(id);
  const rows = Array.isArray(res) ? res : res?.data ?? [];
  if (!rows.length) return null;
  return rows.reduce((s, r) => s + Number(r.rating ?? 0), 0) / rows.length;
}

/** Provider IDs that have at least one product inside the price range (server-side price filter). */
async function providersInPriceRange(min: number, max: number | null): Promise<Set<number>> {
  const ids = new Set<number>();
  let page = 1;
  for (;;) {
    const q: Record<string, unknown> = { page, pageSize: 100 };
    if (min > 0) q.minPrice = min;
    if (max !== null) q.maxPrice = max;
    const res = await apiGet<{ data: { providerId?: number }[]; pagination?: { totalPages?: number } }>("/products", q);
    const rows = Array.isArray(res?.data) ? res.data : [];
    rows.forEach((p) => typeof p.providerId === "number" && ids.add(p.providerId));
    if (page >= (res?.pagination?.totalPages ?? 1) || !rows.length) break;
    page += 1;
  }
  return ids;
}

/**
 * Filters the FULL artisan dataset before paginating.
 * - country/state/category/featured: sent to the server
 * - price: server-filtered products → artisans owning a matching product
 * - rating: averaged from real reviews
 * - hasProducts: server-computed productCount
 */
export function useArtisanSearch(base: { category?: string | null; featured?: boolean }, filters: FilterState) {
  const [all, setAll] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const reqId = useRef(0);

  const key = JSON.stringify([
    base.category ?? null,
    !!base.featured,
    filters.country,
    filters.state,
    filters.city,
    filters.priceRange,
    filters.minRating,
    filters.availableOnly,
  ]);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    setPage(1);
    setAll([]); // never show stale results while a new request is pending
    (async () => {
      const q: Record<string, unknown> = {};
      if (base.category) q.category = base.category;
      if (base.featured) q.featured = true;
      if (filters.country) q.country = filters.country;
      if (filters.state) q.state = filters.state;
      if (filters.city) q.city = filters.city;
      let list = await providersService.searchAll(q);

      if (filters.availableOnly) list = list.filter((p) => Number((p as Provider & { productCount?: number }).productCount ?? 0) > 0);

      const min = Number(filters.priceRange[0]) || 0;
      const maxRaw = Number(filters.priceRange[1]);
      const max = Number.isFinite(maxRaw) && maxRaw < DEFAULT_MAX ? maxRaw : null;
      if (min > 0 || max !== null) {
        const ids = await providersInPriceRange(min, max);
        list = list.filter((p) => ids.has(Number(p.id)));
      }

      if (filters.minRating) {
        const threshold = Number(filters.minRating);
        const avgs = await Promise.all(list.map((p) => realAverage(Number(p.id)).catch(() => null)));
        list = list.filter((_, i) => avgs[i] !== null && (avgs[i] as number) >= threshold);
      }
      return list;
    })()
      .then((list) => { if (id === reqId.current) setAll(list); })
      .catch((e) => { if (id === reqId.current) setError(e instanceof Error ? e.message : "Could not load artisans"); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const totalPages = Math.max(1, Math.ceil(all.length / ARTISAN_PAGE_SIZE));
  const pageItems = all.slice((page - 1) * ARTISAN_PAGE_SIZE, page * ARTISAN_PAGE_SIZE);
  return { results: pageItems, total: all.length, page, totalPages, setPage, loading, error };
}
