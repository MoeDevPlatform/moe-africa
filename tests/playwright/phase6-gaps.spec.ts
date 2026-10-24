import { test, expect } from "@playwright/test";

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3000";
}

test.describe("Phase 6 remaining checks (local)", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("best-seller sort stays inside the order-count set, and a category shortcut keeps that collection", async ({ page, request }) => {
    const api = apiBase();
    const best = await request.get(`${api}/products?collection=best-sellers&pageSize=20`);
    expect(best.ok()).toBeTruthy();
    const bestBody = await best.json();
    const rows = bestBody.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.isBestSeller === true || Number(row.orderCount) > 0).toBeTruthy();
    }
    const counts = rows.map((row: { orderCount?: number }) => Number(row.orderCount ?? 0));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));

    await page.setViewportSize({ width: 1280, height: 900 });
    const sorted = page.waitForResponse((response) => {
      if (response.request().method() !== "GET") return false;
      const url = new URL(response.url());
      return url.port === "3000" && url.pathname === "/products" && url.searchParams.get("collection") === "best-sellers" && url.searchParams.get("sort") === "name_desc";
    });
    await page.goto("/marketplace/products?collection=best-sellers", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();
    await page.getByTestId("product-sort").click();
    await page.getByRole("option", { name: "Name Z–A" }).click();
    const sortedRes = await sorted;
    const sortedBody = await sortedRes.json();
    expect(sortedBody.pagination.totalItems).toBe(bestBody.pagination.totalItems);
    const names = (sortedBody.data ?? []).map((row: { name: string }) => row.name);
    const nameSorted = [...names].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: "base" }));
    expect(names).toEqual(nameSorted);
    const ids = new Set((sortedBody.data ?? []).map((row: { id: number }) => row.id));
    for (const row of rows) expect(ids.has(row.id)).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Categories" }).hover();
    const menu = page.getByTestId("mega-menu");
    await expect(menu).toBeVisible();
    const categoryResponse = page.waitForResponse((response) => {
      if (response.request().method() !== "GET") return false;
      const url = new URL(response.url());
      return url.port === "3000" && url.pathname === "/products" && url.searchParams.get("collection") === "best-sellers" && Boolean(url.searchParams.get("category"));
    });
    await menu.getByRole("button", { name: "Best Sellers" }).click();
    await expect(page).toHaveURL(/collection=best-sellers/);
    await expect(page).toHaveURL(/category=/);
    const categoryRes = await categoryResponse;
    const category = new URL(page.url()).searchParams.get("category");
    expect(new URL(categoryRes.url()).searchParams.get("category")).toBe(category);
    const categoryBody = await categoryRes.json();
    for (const row of categoryBody.data ?? []) {
      expect(String(row.category).toLowerCase()).toBe(String(category).toLowerCase());
      expect(row.isBestSeller === true || Number(row.orderCount) > 0).toBeTruthy();
    }
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();
  });
});
