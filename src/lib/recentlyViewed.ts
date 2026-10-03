const KEY = "moe_recently_viewed";
const MAX = 10;

function parseIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const v of raw) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

export function getRecentlyViewedIds(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return parseIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(productId: number): number[] {
  if (!Number.isFinite(productId) || productId <= 0) return getRecentlyViewedIds();
  try {
    const next = [
      productId,
      ...getRecentlyViewedIds().filter((id) => id !== productId),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecentlyViewedIds();
  }
}
