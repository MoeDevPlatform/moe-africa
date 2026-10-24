import type { Provider } from "@/data/mockData";

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";
}

/**
 * Same identity as the backend catalogue filter. Incomplete profiles stay
 * separate. When copies exist, the lowest id is the storefront listings keep.
 */
function storefrontKey(row: Provider): string | null {
  const brand = normalize(row.brandName) || normalize((row as Provider & { businessName?: string }).businessName);
  const about = normalize(row.about);
  const city = normalize(row.city);
  const state = normalize(row.state);
  const category = normalize(row.category);
  if (!brand || !about || !city || !state || !category) return null;
  return JSON.stringify([
    brand,
    about,
    city,
    state,
    category,
    normalize(row.firstName),
    normalize(row.lastName),
    normalize((row as Provider & { country?: string }).country),
  ]);
}

/** Collapse repeated IDs and later copies of the same public storefront. */
export function uniqueArtisanListings<T extends Provider>(rows: T[]): T[] {
  const canonical = new Map<string, number>();
  for (const row of rows) {
    const key = storefrontKey(row);
    const id = Number(row.id);
    if (!key || !Number.isFinite(id)) continue;
    const current = canonical.get(key);
    if (current == null || id < current) canonical.set(key, id);
  }
  const seenIds = new Set<string>();
  return rows.filter((row) => {
    const id = row.id == null ? "" : String(row.id);
    if (id !== "" && seenIds.has(id)) return false;
    if (id) seenIds.add(id);
    const key = storefrontKey(row);
    if (!key) return true;
    return canonical.get(key) === Number(row.id);
  });
}