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
    [row.name, row.email, row.brandName, row.businessName].some((value) =>
      value?.toLowerCase().includes(query),
    ),
  );
}