import { describe, expect, test } from "bun:test";
import { loadArtisanDirectory, searchArtisanDirectory } from "../src/lib/adminArtisanDirectory";
import type { AdminArtisanRow } from "../src/lib/apiServices";

const artisan = (id: number, name: string): AdminArtisanRow => ({
  id, name, email: `${id}@example.test`, brandName: name,
  businessName: name, status: "approved", createdAt: "2026-10-16",
});

describe("Admin artisan directory search", () => {
  test("search finds john across all four pages, not just the current page", async () => {
    const calls: number[] = [];
    const directory = await loadArtisanDirectory(async (page) => {
      calls.push(page);
      return {
        data: [artisan(page, page === 4 ? "john appeased" : `Artisan ${page}`)],
        pagination: { page, pageSize: 1, totalPages: 4, totalItems: 4 },
      };
    });
    expect(calls.sort()).toEqual([1, 2, 3, 4]);
    expect(searchArtisanDirectory(directory, "john").map((row) => row.id)).toEqual([4]);
    expect(searchArtisanDirectory(directory, "")).toHaveLength(4);
  });

  test("matches name, email and business names regardless of case or outside spaces", () => {
    const row = { ...artisan(1, "Ada"), brandName: "Weaving", businessName: "Loom Studio" };
    for (const query of [" ADA ", "1@example", "WEAVING", "loom"]) {
      expect(searchArtisanDirectory([row], query)).toEqual([row]);
    }
    expect(searchArtisanDirectory([row], "john")).toEqual([]);
  });

  test("a failed later page rejects rather than presenting incomplete search results", async () => {
    await expect(loadArtisanDirectory(async (page) => {
      if (page === 2) throw new Error("Page unavailable");
      return { data: [artisan(1, "Ada")], pagination: { page, pageSize: 1, totalPages: 2, totalItems: 2 } };
    })).rejects.toThrow("Page unavailable");
  });
});