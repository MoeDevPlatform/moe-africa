import { describe, expect, test } from "bun:test";
import { filterArtisanDirectory } from "../src/lib/adminArtisanDirectory";
import type { AdminArtisanRow } from "../src/lib/apiServices";

const rows: AdminArtisanRow[] = [
  {
    id: 1,
    status: "approved",
    name: "Zainab Ade",
    email: "zainab@example.com",
    brandName: "Zainab Studio",
    businessName: "Zainab Studio",
    category: "tailoring",
    serviceCategories: ["Tailoring"],
    country: "NG",
    state: "Lagos",
    city: "Ikeja",
    createdAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: 2,
    status: "pending",
    name: "Ada Okonkwo",
    email: "ada@example.com",
    brandName: "Aduke Atelier",
    businessName: "Aduke Atelier",
    category: "beauty",
    serviceCategories: ["Beauty"],
    country: "Nigeria",
    state: "Abia",
    city: "Aba",
    createdAt: "2026-03-15T00:00:00.000Z",
  },
];

describe("Admin artisan directory filters", () => {
  test("combines category, location, and date without dropping search", () => {
    const matched = filterArtisanDirectory(rows, {
      search: "ada",
      category: "Beauty",
      country: "Nigeria",
      state: "Abia",
      city: "aba",
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });
    expect(matched.map((row) => row.id)).toEqual([2]);
  });

  test("matches a stored country code when the filter uses the country name", () => {
    const matched = filterArtisanDirectory(rows, { country: "Nigeria", state: "Lagos" });
    expect(matched.map((row) => row.id)).toEqual([1]);
  });

  test("clearing filters returns the full directory", () => {
    expect(filterArtisanDirectory(rows, {}).map((row) => row.id)).toEqual([1, 2]);
  });
});
