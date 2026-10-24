const KEY = "recentlyViewed";
const MAX = 10;

function parseIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const value of raw) {
    const id = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(id) && id > 0) out.push(id);
  }
  return out;
}

/** Artisan profile ids the browser has opened. Separate from product history. */
export function getRecentArtisanIds(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return parseIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function pushRecentArtisan(artisanId: number): number[] {
  if (!Number.isFinite(artisanId) || artisanId <= 0) return getRecentArtisanIds();
  try {
    const next = [artisanId, ...getRecentArtisanIds().filter((id) => id !== artisanId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecentArtisanIds();
  }
}
