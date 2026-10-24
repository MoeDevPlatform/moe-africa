import { test, expect, type Page, type Response } from "@playwright/test";
import { adminLogin } from "../helpers/authFlows";

function isLocalBase(): boolean {
  const base = process.env.PLAYWRIGHT_BASE_URL || "";
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
}

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3000";
}

function isProductList(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/products";
  } catch {
    return false;
  }
}

function isArtisanList(url: string): boolean {
  try {
    return new URL(url).pathname.includes("/service-providers/public-info");
  } catch {
    return false;
  }
}

async function productListResponse(page: Page, predicate: (url: URL) => boolean): Promise<Response> {
  return page.waitForResponse((response) => {
    if (response.request().method() !== "GET" || !isProductList(response.url())) return false;
    return predicate(new URL(response.url()));
  });
}

test.describe("Phase 4 discovery (local)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    test.skip(
      !isLocalBase(),
      "Refusing Phase 4 suite unless PLAYWRIGHT_BASE_URL is localhost.",
    );
  });

  test("public product filters, sorts, rankings, navigation, and error retry", async ({ page }) => {
    let slowed = false;
    await page.route("**/products?**", async (route) => {
      if (!slowed && route.request().method() === "GET") {
        slowed = true;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      await route.continue();
    });

    const first = productListResponse(page, (url) => url.searchParams.get("sort") === "name_asc");
    await page.goto("/marketplace/products", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("products-total-count")).toHaveText("Loading…");
    const res = await first;
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const names: string[] = (body.data ?? []).map((row: { name: string }) => row.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    expect(names.length).toBeGreaterThan(0);
    expect(names).toEqual(sorted);
    await expect(page.getByTestId("products-total-count")).toContainText(`${body.pagination.totalItems} products found`);
    await expect(page.getByTestId("product-name").first()).toHaveText(names[0]);

    const productHref = page.getByTestId("product-name").first();
    const productId = body.data[0].id;
    await productHref.click();
    await expect(page).toHaveURL(new RegExp(`/marketplace/product/${productId}$`));
    await page.goBack();
    await expect(page).toHaveURL(/\/marketplace\/products/);

    const beauty = productListResponse(page, (url) => url.searchParams.get("category") === "beauty");
    await page.getByTestId("product-category").click();
    await page.getByRole("option", { name: "Beauty" }).click();
    const beautyRes = await beauty;
    expect(beautyRes.ok()).toBeTruthy();
    const beautyBody = await beautyRes.json();
    expect(beautyBody.pagination.totalItems).toBeGreaterThan(0);
    expect(beautyBody.pagination.totalItems).toBeLessThan(body.pagination.totalItems);
    for (const row of beautyBody.data ?? []) {
      expect(String(row.category).toLowerCase()).toBe("beauty");
    }

    const priced = productListResponse(page, (url) => url.searchParams.get("minPrice") === "300000");
    await page.getByTestId("product-min-price").fill("300000");
    const pricedRes = await priced;
    const pricedBody = await pricedRes.json();
    expect(pricedBody.pagination.totalItems).toBeGreaterThan(0);
    expect(pricedBody.pagination.totalItems).toBeLessThan(beautyBody.pagination.totalItems);
    for (const row of pricedBody.data ?? []) {
      const price = row.priceRange?.min ?? row.price;
      expect(Number(price)).toBeGreaterThanOrEqual(300000);
    }

    await page.getByTestId("product-filters-clear").click();
    await expect(page).not.toHaveURL(/category=|minPrice=/);

    const fast = productListResponse(page, (url) => url.searchParams.get("maxDeliveryDays") === "3");
    await page.getByTestId("product-delivery").click();
    await page.getByRole("option", { name: "Within 3 days" }).click();
    const fastRes = await fast;
    const fastBody = await fastRes.json();
    expect(fastBody.pagination.totalItems).toBeGreaterThan(0);
    for (const row of fastBody.data ?? []) {
      expect(Number(row.estimatedDeliveryDays)).toBeLessThanOrEqual(3);
    }
    await page.getByTestId("product-filters-clear").click();

    const lowPrice = productListResponse(page, (url) => url.searchParams.get("sort") === "price_asc");
    await page.getByTestId("product-sort").click();
    await page.getByRole("option", { name: "Price: low to high" }).click();
    const lowRes = await lowPrice;
    const lowBody = await lowRes.json();
    const prices = (lowBody.data ?? []).map((row: { priceRange?: { min?: number } }) => Number(row.priceRange?.min ?? 0));
    const priceSorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(priceSorted);

    const newest = productListResponse(page, (url) => url.searchParams.get("sort") === "newest");
    await page.goto("/marketplace/products?sort=newest", { waitUntil: "domcontentloaded" });
    const newestRes = await newest;
    expect(newestRes.ok()).toBeTruthy();
    expect(new URL(newestRes.url()).searchParams.get("sort")).toBe("newest");

    const best = productListResponse(page, (url) => url.searchParams.get("collection") === "best-sellers");
    await page.goto("/marketplace/products?sort=bestSeller", { waitUntil: "domcontentloaded" });
    const bestRes = await best;
    const bestBody = await bestRes.json();
    expect(bestBody.pagination.totalItems).toBeGreaterThan(0);
    const counts = (bestBody.data ?? []).map((row: { orderCount?: number }) => Number(row.orderCount ?? 0));
    const countSorted = [...counts].sort((a, b) => b - a);
    expect(counts).toEqual(countSorted);
    await expect(page.getByRole("heading", { name: "Best Sellers" })).toBeVisible();

    const trending = productListResponse(page, (url) => url.searchParams.get("isTrending") === "true");
    await page.goto("/marketplace/products?sort=trending", { waitUntil: "domcontentloaded" });
    const trendingRes = await trending;
    const trendingBody = await trendingRes.json();
    expect(trendingBody.pagination.totalItems).toBe(0);
    for (const row of trendingBody.data ?? []) expect(row.isTrending).toBe(true);
    await expect(page.getByText("No products found")).toBeVisible();

    await page.unroute("**/products?**");
    await page.route("**/products?**", (route) => route.abort());
    await page.getByTestId("product-category").click();
    await page.getByRole("option", { name: "Beauty" }).click();
    await expect(page.getByTestId("products-error")).toBeVisible();
    await page.unroute("**/products?**");
    const recovered = productListResponse(page, (url) => url.searchParams.get("category") === "beauty");
    await page.getByTestId("products-retry").click();
    const recoveredRes = await recovered;
    expect(recoveredRes.ok()).toBeTruthy();
    await expect(page.getByTestId("products-error")).toHaveCount(0);
    await page.getByTestId("product-filters-clear").click();
    await expect(page.getByTestId("products-grid")).toBeVisible();
  });

  test("All Artisans discovery chips, delivery, and alphabetical default", async ({ page }) => {
    const first = page.waitForResponse(
      (response) => response.request().method() === "GET" && isArtisanList(response.url()) && response.ok(),
    );
    await page.goto("/marketplace/artisans", { waitUntil: "domcontentloaded" });
    const res = await first;
    expect(new URL(res.url()).searchParams.get("sort")).toBe("name");
    const body = await res.json();
    const apiNames: string[] = (body.data ?? []).map(
      (row: { businessName?: string; brandName?: string }) => row.businessName || row.brandName || "",
    );
    await expect(page.getByTestId("artisans-total-count")).toContainText(`${body.pagination.totalItems} artisans found`);
    const visible = await page.getByTestId("artisan-name").allTextContents();
    const sorted = [...visible].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    expect(visible).toEqual(sorted);
    expect(apiNames.filter(Boolean).length).toBe(visible.length);

    const featured = page.waitForResponse((response) => {
      if (!isArtisanList(response.url())) return false;
      return new URL(response.url()).searchParams.get("featured") === "true";
    });
    await page.getByTestId("artisan-view-featured").click();
    const featuredRes = await featured;
    const featuredBody = await featuredRes.json();
    expect(featuredBody.pagination.totalItems).toBe(0);
    for (const row of featuredBody.data ?? []) expect(row.featured).toBe(true);
    await expect(page.getByText("No artisans found. Try adjusting your filters.")).toBeVisible();
    await expect(page).toHaveURL(/view=featured/);

    const top = page.waitForResponse((response) => {
      if (!isArtisanList(response.url())) return false;
      return new URL(response.url()).searchParams.get("sort") === "rating";
    });
    await page.getByTestId("artisan-view-top-rated").click();
    const topRes = await top;
    expect(topRes.ok()).toBeTruthy();
    await expect(page.getByTestId("artisan-name")).toHaveCount(1);
    await expect(page.getByTestId("artisan-name")).toHaveText("Phase3 Eligible Studio");

    const custom = page.waitForResponse((response) => {
      if (!isArtisanList(response.url())) return false;
      return new URL(response.url()).searchParams.get("customOrderEligible") === "true";
    });
    await page.getByTestId("artisan-view-custom-orders").click();
    const customRes = await custom;
    const customBody = await customRes.json();
    expect(customBody.data.length).toBeGreaterThan(0);
    for (const row of customBody.data) expect(row.isCustomOrderEligible).toBe(true);
    await expect(page.getByTestId("artisan-name")).toHaveText(["Phase3 Eligible Studio"]);

    const sellers = page.waitForResponse((response) => {
      if (!isArtisanList(response.url())) return false;
      return new URL(response.url()).searchParams.get("hasBestSeller") === "true";
    });
    await page.getByTestId("artisan-view-best-sellers").click();
    const sellersRes = await sellers;
    const sellersBody = await sellersRes.json();
    expect(sellersBody.pagination.totalItems).toBe(0);
    await expect(page.getByText("No artisans found. Try adjusting your filters.")).toBeVisible();

    await page.getByTestId("artisan-view-all").click();
    await page.getByTestId("filter-btn").click();
    await page.getByText("Fastest delivery").click();
    const fast = page.waitForResponse((response) => {
      if (!isArtisanList(response.url())) return false;
      return new URL(response.url()).searchParams.get("maxDeliveryDays") === "3";
    });
    await page.getByTestId("apply-filters").click();
    const fastRes = await fast;
    const fastBody = await fastRes.json();
    expect(fastBody.pagination.totalItems).toBe(0);
    await expect(page.getByText("No artisans found. Try adjusting your filters.")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByTestId("artisans-total-count")).toContainText(`${body.pagination.totalItems} artisans found`);

    const firstArtisan = (body.data ?? [])[0] as { id: number; brandName?: string };
    await page.getByTestId("artisan-name").first().click();
    await expect(page).toHaveURL(new RegExp(`/marketplace/provider/${firstArtisan.id}$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(firstArtisan.brandName || "");
  });

  test("admin filters combine and clear, and the artisan selector saves the real id", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/artisans", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Artisans" })).toBeVisible();
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    const baseline = await rows.count();
    expect(baseline).toBeGreaterThan(1);

    await page.getByTestId("admin-artisan-status").click();
    await page.getByRole("option", { name: "Rejected" }).click();
    await expect(page.getByText("No artisans match these filters.")).toBeVisible();

    await page.getByTestId("admin-artisan-status").click();
    await page.getByRole("option", { name: "Approved" }).click();
    const emeka = page.locator("tbody tr", { hasText: "Emeka Artisan" });
    await expect(emeka).toHaveCount(1);

    await page.getByTestId("admin-artisan-search").fill("Emeka");
    await expect(emeka).toHaveCount(1);
    await expect(page.locator("tbody tr", { hasText: "Micheal Tayo" })).toHaveCount(0);

    await page.getByTestId("admin-artisan-category").click();
    await page.getByRole("option", { name: "tailoring", exact: true }).click();
    await page.getByTestId("admin-artisan-country").click();
    await page.getByRole("option", { name: "Nigeria", exact: true }).click();
    await page.getByTestId("admin-artisan-state").click();
    await page.getByRole("option", { name: "Lagos", exact: true }).click();
    await page.getByTestId("admin-artisan-city").fill("Lagos");
    await page.getByTestId("admin-artisan-date-from").fill("2026-04-01");
    await page.getByTestId("admin-artisan-date-to").fill("2026-04-30");

    await expect(emeka).toHaveCount(1);
    await expect(page.locator("tbody tr")).toHaveCount(1);

    await page.getByTestId("admin-artisan-clear").click();
    await expect(page.getByTestId("admin-artisan-search")).toHaveValue("");
    await expect(page.locator("tbody tr")).toHaveCount(baseline);

    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await page.getByTestId("add-product-btn").click();
    await expect(page.getByTestId("admin-product-name")).toHaveAttribute("placeholder", /Handwoven/);
    await expect(page.getByTestId("admin-product-description")).toHaveAttribute("placeholder", /materials/i);
    await expect(page.getByText(/Placeholders are examples only/)).toBeVisible();

    const artisans = await page.request.get(`${apiBase()}/service-providers/public-info?pageSize=20&sort=name`);
    expect(artisans.ok()).toBeTruthy();
    const artisanBody = await artisans.json();
    const target = (artisanBody.data ?? []).find(
      (row: { businessName?: string; brandName?: string }) =>
        (row.businessName || row.brandName || "").includes("Emeka"),
    );
    expect(target?.id).toBeTruthy();

    await page.getByTestId("admin-product-artisan").click();
    await page.getByTestId("admin-product-artisan-search").fill("Emek");
    const option = page.locator(`[data-testid="admin-product-artisan-option-${target.id}"]`);
    await expect(option).toBeVisible();
    await expect(option).toContainText(/Emeka/i);
    await option.click();
    await expect(page.getByTestId("admin-product-artisan")).toContainText(/Emeka/i);

    const unique = `Phase4 Filter ${Date.now()}`;
    await page.getByTestId("admin-product-name").fill(unique);
    await page.getByTestId("admin-product-description").fill("Phase 4 local verification product.");
    await page.getByTestId("admin-product-category").click();
    await page.getByRole("option", { name: "Tailoring" }).click();
    await page.getByTestId("admin-product-price-min").fill("1500");
    await page.getByTestId("admin-product-eta").fill("5 days");

    const created = page.waitForResponse(
      (response) => response.url().includes("/admin/products") && response.request().method() === "POST",
    );
    await page.getByTestId("admin-product-create-submit").click();
    const createdRes = await created;
    expect(createdRes.ok()).toBeTruthy();
    const payload = createdRes.request().postDataJSON() as { artisanId?: number; name?: string; description?: string };
    expect(payload.artisanId).toBe(target.id);
    expect(payload.name).toBe(unique);
    expect(payload.description).toBe("Phase 4 local verification product.");
    expect(payload.name).not.toContain("Handwoven");
    const createdBody = await createdRes.json();
    const createdId = Number(createdBody.id ?? createdBody.data?.id);
    expect(createdId).toBeGreaterThan(0);

    const token = await page.evaluate(() => localStorage.getItem("moe_access_token"));
    const removed = await page.request.delete(`${apiBase()}/admin/products/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(removed.ok()).toBeTruthy();
  });
});
