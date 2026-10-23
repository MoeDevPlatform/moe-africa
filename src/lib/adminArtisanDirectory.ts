import type { AdminArtisanRow, PaginatedResponse } from "./apiServices";

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
  return [...new Map(rows.map((row) => [row.id, row])).values()];
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
    out = out.filter((row) => (row.country || "").toLowerCase() === country);
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
  return out;
}