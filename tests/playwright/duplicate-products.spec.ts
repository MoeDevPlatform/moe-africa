import { test, expect, type Page } from "@playwright/test";

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || process.env.MOE_API_BASE_URL || "http://localhost:3000";
}

function isLocalApi(url: string): boolean {
  try {
    return new URL(url).port === "3000";
  } catch {
    return false;
  }
}

function unique(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

async function listingIds(page: Page): Promise<string[]> {
  return page.locator("[data-product-id]").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-product-id") || "").filter(Boolean),
  );
}

test.describe("Product listings show each record once", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Runs against the local app");
  });

  test("catalogue pages, sections, and the next scroll page keep unique product ids", async ({ page }) => {
    const base = apiBase();
    const captured: { url: string; body: { data?: { id: number }[]; pagination?: { totalItems?: number } } }[] = [];
    page.on("response", async (response) => {
      if (!isLocalApi(response.url()) || response.status() !== 200) return;
      if (!response.url().includes("/products")) return;
      try {
        captured.push({ url: response.url(), body: await response.json() });
      } catch {
        /* non-json */
      }
    });

    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");

    const sectionKeys = ["featured_picks", "featured_styles", "seasonal_picks", "best-sellers"];
    for (const key of ["featured_picks", "featured_styles", "seasonal_picks"]) {
      const response = await page.request.get(`${base}/sections/${key}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      const ids = (body.items ?? []).map((item: { id: number }) => String(item.id));
      expect(unique(ids), `${key} ${ids.join(",")}`).toBe(true);
    }
    const sellers = await page.request.get(`${base}/products?collection=best-sellers&pageSize=100`);
    expect(sellers.status()).toBe(200);
    const sellerBody = await sellers.json();
    const sellerIds = (sellerBody.data ?? []).map((item: { id: number }) => String(item.id));
    expect(unique(sellerIds)).toBe(true);

    const listings = [
      "/marketplace/products",
      "/marketplace/products?sort=newest",
      "/marketplace/products?collection=best-sellers",
      "/marketplace/products?collection=deals",
      "/marketplace/products?collection=styles",
      "/marketplace/products?q=dress",
      "/marketplace/category/fashion/products",
    ];
    for (const path of listings) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const ids = await listingIds(page);
      expect(unique(ids), `${path} ${ids.join(",")}`).toBe(true);
    }

    await page.goto("/marketplace/products");
    await page.waitForSelector("[data-product-id]");
    const firstPage = await page.request.get(`${base}/products?page=1&pageSize=20&sort=name_asc`);
    const secondPage = await page.request.get(`${base}/products?page=2&pageSize=20&sort=name_asc`);
    expect(firstPage.status()).toBe(200);
    expect(secondPage.status()).toBe(200);
    const firstIds = ((await firstPage.json()).data ?? []).map((item: { id: number }) => item.id);
    const secondIds = ((await secondPage.json()).data ?? []).map((item: { id: number }) => item.id);
    expect(firstIds).toHaveLength(20);
    expect(secondIds.length).toBeGreaterThan(0);
    expect(unique([...firstIds, ...secondIds].map(String))).toBe(true);
    const overlap = firstIds.filter((id: number) => secondIds.includes(id));
    expect(overlap).toEqual([]);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(async () => (await listingIds(page)).length, { timeout: 15_000 }).toBeGreaterThan(20);
    const scrolled = await listingIds(page);
    expect(unique(scrolled)).toBe(true);
    expect(scrolled.slice(0, 20).map(Number)).toEqual(firstIds);

    const totals = await page.request.get(`${base}/products?pageSize=1`);
    const totalItems = (await totals.json()).pagination.totalItems;
    const full = await page.request.get(`${base}/products?pageSize=100`);
    const fullBody = await full.json();
    const fullIds = (fullBody.data ?? []).map((item: { id: number }) => item.id);
    expect(unique(fullIds.map(String))).toBe(true);
    expect(fullBody.pagination.totalItems).toBe(totalItems);
    expect(fullIds).toHaveLength(totalItems);

    const targetId = String(firstIds[0]);
    await page.goto("/marketplace/products");
    await page.locator(`[data-product-id="${targetId}"]`).first().getByRole("button", { name: "View Details" }).click();
    await expect(page).toHaveURL(new RegExp(`/marketplace/product/${targetId}(?:$|\\?)`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    expect(sectionKeys.length).toBeGreaterThan(0);
    expect(captured.every((entry) => isLocalApi(entry.url))).toBe(true);
  });
});
