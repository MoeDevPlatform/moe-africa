import type { AdminArtisanRow, PaginatedResponse } from "./apiServices";
import { countries } from "../data/countryStateData";

/** Load every server page before exposing a searchable directory. */
export async function loadArtisanDirectory(
  fetchPage: (page: number) => Promise<PaginatedResponse<AdminArtisanRow>>,
): Promise<AdminArtisanRow[]> {
  const first = await fetchPage(1);
  const rows = [...(first.data ?? [])];
  const totalPages = first.pagination?.totalPages ?? 1;
  // Limit concurrent requests rather than requesting the entire catalogue at once.
  for (let page = 2; page <= totalPages; page += 4) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(4, totalPages - page + 1) }, (_, i) => fetchPage(page + i)),
    );
    for (const result of pages) rows.push(...(result.data ?? []));
  }
  return sortArtisanDirectory([...new Map(rows.map((row) => [row.id, row])).values()]);
}

function artisanSortLabel(row: AdminArtisanRow) {
  return (row.name || row.brandName || row.businessName || "").trim();
}

/** Case-insensitive A–Z by the Name column, then brand, then id. */
export function sortArtisanDirectory(rows: AdminArtisanRow[]) {
  return [...rows].sort((a, b) => {
    const byName = artisanSortLabel(a).localeCompare(artisanSortLabel(b), undefined, {
      sensitivity: "base",
    });
    if (byName !== 0) return byName;
    const byBrand = (a.brandName || a.businessName || "").localeCompare(
      b.brandName || b.businessName || "",
      undefined,
      { sensitivity: "base" },
    );
    if (byBrand !== 0) return byBrand;
    return a.id - b.id;
  });
}

export function searchArtisanDirectory(rows: AdminArtisanRow[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) =>
    [
      row.name,
      row.email,
      row.brandName,
      row.businessName,
      row.category,
      row.country,
      row.state,
      row.city,
      row.location,
      ...(row.serviceCategories ?? []),
    ].some((value) => value?.toLowerCase().includes(query)),
  );
}

export function filterArtisanDirectory(
  rows: AdminArtisanRow[],
  filters: {
    search?: string;
    category?: string;
    country?: string;
    state?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
  },
) {
  let out = searchArtisanDirectory(rows, filters.search ?? "");
  const category = filters.category?.trim().toLowerCase();
  if (category) {
    out = out.filter(
      (row) =>
        (row.category || "").toLowerCase() === category ||
        (row.serviceCategories ?? []).some((value) => value.toLowerCase() === category),
    );
  }
  const country = filters.country?.trim().toLowerCase();
  if (country) {
    const known = countries.find(
      (item) => item.name.toLowerCase() === country || item.code.toLowerCase() === country,
    );
    const accepted = new Set(
      [country, known?.name.toLowerCase(), known?.code.toLowerCase()].filter(Boolean) as string[],
    );
    out = out.filter((row) => accepted.has((row.country || "").toLowerCase()));
  }
  const state = filters.state?.trim().toLowerCase();
  if (state) {
    out = out.filter((row) => (row.state || "").toLowerCase() === state);
  }
  const city = filters.city?.trim().toLowerCase();
  if (city) {
    out = out.filter((row) => (row.city || "").toLowerCase().includes(city));
  }
  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00`);
    if (!Number.isNaN(from.getTime())) {
      out = out.filter((row) => new Date(row.createdAt) >= from);
    }
  }
  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999`);
    if (!Number.isNaN(to.getTime())) {
      out = out.filter((row) => new Date(row.createdAt) <= to);
    }
  }
  return sortArtisanDirectory(out);
}