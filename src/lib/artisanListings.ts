import type { Provider } from "@/data/mockData";

/** Collapse repeated IDs and duplicate public profiles without matching names alone. */
export function uniqueArtisanListings<T extends Provider>(rows: T[]): T[] {
  const ids = new Set<string>();
  const profiles = new Set<string>();
  const normalize = (value: unknown) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

  return rows.filter((row) => {
    const id = row.id == null ? "" : String(row.id);
    const fields = [row.brandName, row.about, row.city, row.state, row.category].map(normalize);
    // Incomplete profiles can only be deduplicated by ID, never by blank fields.
    const profile = fields.every(Boolean)
      ? JSON.stringify([...fields, normalize(row.firstName), normalize(row.lastName), normalize((row as Provider & { country?: string }).country)])
      : "";
    const duplicate = (id !== "" && ids.has(id)) || (profile !== "" && profiles.has(profile));
    if (id) ids.add(id);
    if (profile) profiles.add(profile);
    return !duplicate;
  });
}