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
  const created = normalizeCreatedBounds(filters.dateFrom, filters.dateTo);
  if (created.from) {
    out = out.filter((row) => new Date(row.createdAt) >= created.from!);
  }
  if (created.to) {
    out = out.filter((row) => new Date(row.createdAt) <= created.to!);
  }
  return sortArtisanDirectory(out);
}

export type CreatedPreset = "any" | "today" | "7" | "30" | "month" | "custom";

function localDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Turns a preset, or a custom from/to, into an inclusive local-day range. One date means that day. */
export function resolveCreatedRange(
  preset: CreatedPreset,
  from = "",
  to = "",
  now = new Date(),
) {
  if (preset === "today") {
    const day = localDay(now);
    return { dateFrom: day, dateTo: day };
  }
  if (preset === "7" || preset === "30") {
    const start = new Date(now);
    start.setDate(start.getDate() - (preset === "7" ? 6 : 29));
    return { dateFrom: localDay(start), dateTo: localDay(now) };
  }
  if (preset === "month") {
    return {
      dateFrom: localDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateTo: localDay(now),
    };
  }
  if (preset === "custom") {
    return { dateFrom: from, dateTo: to };
  }
  return { dateFrom: "", dateTo: "" };
}

function dayStart(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dayEnd(value: string) {
  const parsed = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** A single bound is that calendar day. A reversed pair is swapped. */
export function normalizeCreatedBounds(dateFrom?: string, dateTo?: string) {
  let fromValue = dateFrom?.trim() ?? "";
  let toValue = dateTo?.trim() ?? "";
  if (fromValue && !toValue) toValue = fromValue;
  if (!fromValue && toValue) fromValue = toValue;
  if (fromValue && toValue && fromValue > toValue) {
    [fromValue, toValue] = [toValue, fromValue];
  }
  return { from: fromValue ? dayStart(fromValue) : null, to: toValue ? dayEnd(toValue) : null };
}

export function describeCreatedRange(dateFrom: string, dateTo: string) {
  const bounds = normalizeCreatedBounds(dateFrom, dateTo);
  if (!bounds.from || !bounds.to) return "";
  const label = (date: Date) =>
    date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const start = label(bounds.from);
  const end = label(bounds.to);
  return start === end ? `Created on ${start}` : `Created from ${start} to ${end}`;
}