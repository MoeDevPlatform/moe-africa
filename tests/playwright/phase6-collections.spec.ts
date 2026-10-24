import { test, expect, type Page } from "@playwright/test";
import { adminLogin } from "../helpers/authFlows";

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

test.describe("Phase 6 collections (local)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Phase 6 runs against the local app");
  });

  test("catalogue definitions, navigation, view all, recent views, and curation", async ({ page, request }) => {
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      const url = response.url();
      if (!isLocalApi(url)) return;
      if (response.status() >= 500) failedRequests.push(`${response.status()} ${url}`);
    });

    const api = apiBase();
    const allRes = await request.get(`${api}/products?pageSize=20`);
    expect(allRes.ok()).toBeTruthy();
    const allBody = await allRes.json();
    const newestRes = await request.get(`${api}/products?sort=newest&pageSize=20`);
    expect(newestRes.ok()).toBeTruthy();
    const newestBody = await newestRes.json();
    const bestRes = await request.get(`${api}/products?collection=best-sellers&pageSize=20`);
    expect(bestRes.ok()).toBeTruthy();
    const bestBody = await bestRes.json();

    expect(allBody.pagination.totalItems).toBeGreaterThan(bestBody.pagination.totalItems);
    expect(newestBody.pagination.totalItems).toBe(allBody.pagination.totalItems);
    const newestDates = (newestBody.data ?? []).map((row: { createdAt?: string }) => row.createdAt ?? "");
    const newestSorted = [...newestDates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    expect(newestDates).toEqual(newestSorted);
    const allNames = (allBody.data ?? []).map((row: { name: string }) => row.name);
    const allSorted = [...allNames].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    expect(allNames).toEqual(allSorted);
    const counts = (bestBody.data ?? []).map((row: { orderCount?: number }) => Number(row.orderCount ?? 0));
    expect(counts.length).toBeGreaterThan(0);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(counts.every((count: number) => count > 0)).toBeTruthy();
    const bestIds = new Set((bestBody.data ?? []).map((row: { id: number }) => row.id));
    expect(bestIds.size).toBeLessThan(allBody.pagination.totalItems);

    await page.goto("/marketplace/products", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText(`${allBody.pagination.totalItems} products found`);

    await page.goto("/marketplace/products?sort=newest", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "New Arrivals" })).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText(`${newestBody.pagination.totalItems} products found`);

    await page.goto("/marketplace/products?collection=best-sellers", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText(`${bestBody.pagination.totalItems} products found`);
    const firstBest = bestBody.data[0];
    const bestCard = page.locator(`[data-product-id="${firstBest.id}"]`);
    await expect(bestCard).toBeVisible();
    await bestCard.click();
    await expect(page).toHaveURL(new RegExp(`/marketplace/product/${firstBest.id}$`));
    await expect(page.getByRole("heading", { name: firstBest.name })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Categories" }).hover();
    await page.getByTestId("mega-menu").locator('a[href="/marketplace/products?collection=best-sellers"]').click();
    await expect(page).toHaveURL(/\/marketplace\/products\?collection=best-sellers/);
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Open mobile menu" }).click();
    await page.getByRole("dialog").locator('a[href="/marketplace/products?collection=best-sellers"]').click();
    await expect(page).toHaveURL(/\/marketplace\/products\?collection=best-sellers/);
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("home-best-sellers")).toBeVisible();
    await page.getByTestId("home-best-sellers-view-all").click();
    await expect(page).toHaveURL(/collection=best-sellers/);
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await page.getByTestId("home-featured-picks-view-all").click();
    await expect(page).toHaveURL(/collection=featured_picks/);
    await expect(page.getByRole("heading", { name: "Featured Picks" })).toBeVisible();
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await page.getByTestId("featured-artisans-view-all").click();
    await expect(page).toHaveURL(/collection=featured_artisans/);
    await expect(page.getByRole("heading", { name: "Featured Artisans" })).toBeVisible();

    const featured = await request.get(`${api}/sections/featured_picks`);
    expect(featured.ok()).toBeTruthy();
    const featuredBody = await featured.json();
    const seasonal = await request.get(`${api}/sections/seasonal_picks`);
    expect(seasonal.ok()).toBeTruthy();
    const seasonalBody = await seasonal.json();
    const styles = await request.get(`${api}/sections/featured_styles`);
    expect(styles.ok()).toBeTruthy();
    const stylesBody = await styles.json();

    await page.goto("/marketplace/products?collection=featured_picks", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Featured Picks" })).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText(`${(featuredBody.items ?? []).length} products found`);

    await page.goto("/marketplace/products?collection=seasonal_picks", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Seasonal Picks" })).toBeVisible();
    if ((seasonalBody.items ?? []).length === 0) {
      await expect(page.getByText("No products found")).toBeVisible();
    } else {
      await expect(page.getByTestId("products-total-count")).toContainText(`${seasonalBody.items.length} products found`);
    }

    await page.goto("/marketplace/products?collection=featured_styles", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Editor's Recommendations" })).toBeVisible();
    if ((stylesBody.items ?? []).length === 0) {
      await expect(page.getByText("No products found")).toBeVisible();
    }

    await page.goto("/marketplace/products?sort=trending", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Trending Now" })).toBeVisible();
    await expect(page.getByText("No products found")).toBeVisible();

    await page.evaluate(() => {
      localStorage.removeItem("moe_recently_viewed");
      localStorage.removeItem("recentlyViewed");
    });
    await page.goto("/marketplace/products?collection=recently-viewed", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "You recently viewed" })).toBeVisible();
    await expect(page.getByText("No products found")).toBeVisible();

    await page.goto("/marketplace/product/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Ankara Midi Dress" })).toBeVisible();
    await page.goto("/marketplace/product/72", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Phase2 API Variation Probe" })).toBeVisible();
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    const recent = page.getByTestId("recently-viewed-section");
    await expect(recent).toBeVisible();
    await expect(recent).toContainText("Phase2 API Variation Probe");
    await expect(recent).toContainText("Ankara Midi Dress");
    await page.getByTestId("recently-viewed-view-all").click();
    await expect(page).toHaveURL(/collection=recently-viewed/);
    await expect(page.locator('[data-product-id="72"]')).toBeVisible();
    await expect(page.locator('[data-product-id="1"]')).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText("2 products found");

    await page.goto("/marketplace/artisan/14", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Phase2 Local Studio" })).toBeVisible();
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    const recentArtisans = page.getByTestId("recent-artisans-section");
    await expect(recentArtisans).toBeVisible();
    await page.getByTestId("recent-artisans-view-all").click();
    await expect(page).toHaveURL(/\/marketplace\/artisans\?collection=recent/);
    await expect(page.getByRole("heading", { name: "Recently Viewed Artisans" })).toBeVisible();
    await expect(page.getByTestId("artisans-total-count")).toContainText("1 artisans found");

    const high = page.waitForResponse((response) => {
      if (!isLocalApi(response.url()) || response.request().method() !== "GET") return false;
      const url = new URL(response.url());
      return url.pathname === "/products" && url.searchParams.get("collection") === "best-sellers" && url.searchParams.get("minPrice") === "99999999";
    });
    await page.goto("/marketplace/products?collection=best-sellers", { waitUntil: "domcontentloaded" });
    await page.getByTestId("product-min-price").fill("99999999");
    const highRes = await high;
    const highBody = await highRes.json();
    expect(highBody.pagination.totalItems).toBe(0);
    await expect(page.getByText("No products found")).toBeVisible();
    await page.getByTestId("product-filters-clear").click();
    await expect(page.getByTestId("products-total-count")).toContainText(`${bestBody.pagination.totalItems} products found`);

    await page.goto("/marketplace/products", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("products-total-count")).toContainText(`${allBody.pagination.totalItems} products found`);
    const grid = page.getByTestId("products-grid");
    await expect(grid.getByRole("heading", { level: 3 })).toHaveCount(20);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(async () => grid.getByRole("heading", { level: 3 }).count(), { timeout: 15_000 }).toBeGreaterThan(20);

    await adminLogin(page);
    const picksBefore = await request.get(`${api}/admin/sections/featured_picks`, {
      headers: { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("moe_access_token"))}` },
    });
    expect(picksBefore.ok()).toBeTruthy();
    const picksBeforeBody = await picksBefore.json();
    const picksCuratedBefore = (picksBeforeBody.items ?? []).map((item: { itemId: string }) => item.itemId);

    await page.goto("/admin/sections/featured_picks", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("algorithm-selection")).toBeVisible();
    const algorithmCount = await page.getByTestId("algorithm-item").count();
    if ((featuredBody.items ?? []).some((item: { selection?: string }) => item.selection === "algorithm")) {
      expect(algorithmCount).toBeGreaterThan(0);
    }

    await page.goto("/admin/sections/featured_styles", { waitUntil: "domcontentloaded" });
    const token = await page.evaluate(() => localStorage.getItem("moe_access_token"));
    for (const id of ["23", "25"]) {
      await request.delete(`${api}/admin/sections/featured_styles/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    await page.getByPlaceholder("Search products…").fill("Emeka Dress");
    await page.getByRole("button", { name: /^search$/i }).click();
    const dress = page.locator('[data-testid="search-result"][data-product-id="25"]');
    await expect(dress).toBeVisible();
    await expect(dress.getByTestId("curation-artisan-name")).toHaveText("Emeka Artisan");
    await dress.getByTestId("add-to-section").click();
    await expect(page.locator('[data-testid="curated-item"][data-item-id="25"]')).toBeVisible();

    await page.getByPlaceholder("Search products…").fill("Emeka Kaftan");
    await page.getByRole("button", { name: /^search$/i }).click();
    const kaftan = page.locator('[data-testid="search-result"][data-product-id="23"]');
    await expect(kaftan).toBeVisible();
    await kaftan.getByTestId("add-to-section").click();
    await expect(page.locator('[data-testid="curated-item"][data-item-id="23"]')).toBeVisible();
    await expect(page.locator('[data-testid="curated-item"][data-item-id="25"]')).toBeVisible();

    const picksAfter = await request.get(`${api}/admin/sections/featured_picks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const picksAfterBody = await picksAfter.json();
    expect((picksAfterBody.items ?? []).map((item: { itemId: string }) => item.itemId)).toEqual(picksCuratedBefore);

    await page.getByTestId("move-section-item-up-23").click();
    await expect(page.locator('[data-testid="curated-item"]').first()).toHaveAttribute("data-item-id", "23");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="curated-item"]').first()).toHaveAttribute("data-item-id", "23");
    await expect(page.locator('[data-testid="curated-item"]').nth(1)).toHaveAttribute("data-item-id", "25");

    const publicStyles = await request.get(`${api}/sections/featured_styles`);
    const publicStylesBody = await publicStyles.json();
    expect((publicStylesBody.items ?? []).map((item: { id: number }) => item.id)).toEqual([23, 25]);

    await page.getByTestId("remove-section-item-23").click();
    await page.getByTestId("remove-section-item-25").click();
    await expect(page.getByText("No curated items yet")).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("No curated items yet")).toBeVisible();

    const stylesAfter = await request.get(`${api}/sections/featured_styles`);
    const stylesAfterBody = await stylesAfter.json();
    expect(stylesAfterBody.items ?? []).toEqual([]);

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
    expect(failedRequests, failedRequests.join("\n")).toEqual([]);
  });
});
