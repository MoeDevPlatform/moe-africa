import { test, expect } from "@playwright/test";
import { adminLogin } from "../helpers/authFlows";

function isLocalBase(): boolean {
  const base = process.env.PLAYWRIGHT_BASE_URL || "";
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
}

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3000";
}

test.describe("Phase 4 discovery (local)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    test.skip(
      !isLocalBase(),
      "Refusing Phase 4 suite unless PLAYWRIGHT_BASE_URL is localhost.",
    );
  });

  test("All Products defaults to A–Z and category filter changes the result set", async ({ page }) => {
    const first = page.waitForResponse(
      (res) => res.url().includes("/products") && res.request().method() === "GET" && res.ok(),
    );
    await page.goto("/marketplace/products", { waitUntil: "domcontentloaded" });
    const res = await first;
    const url = new URL(res.url());
    expect(url.searchParams.get("sort")).toBe("name_asc");
    const body = await res.json();
    const names: string[] = (body.data ?? []).map((row: { name: string }) => row.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    expect(names).toEqual(sorted);

    const filtered = page.waitForResponse((response) => {
      if (!response.url().includes("/products") || response.request().method() !== "GET") return false;
      return new URL(response.url()).searchParams.get("category") === "tailoring";
    });
    await page.getByTestId("product-category").click();
    await page.getByRole("option", { name: "Tailoring" }).click();
    const filteredRes = await filtered;
    expect(filteredRes.ok()).toBeTruthy();
    const filteredBody = await filteredRes.json();
    for (const row of filteredBody.data ?? []) {
      expect(String(row.category || "").toLowerCase()).toBe("tailoring");
    }

    await page.getByTestId("product-filters-clear").click();
    await expect(page).not.toHaveURL(/category=/);
  });

  test("All Artisans defaults to A–Z and Featured uses the featured query", async ({ page }) => {
    const first = page.waitForResponse(
      (res) =>
        res.url().includes("/service-providers/public-info") &&
        res.request().method() === "GET" &&
        res.ok(),
    );
    await page.goto("/marketplace/artisans", { waitUntil: "domcontentloaded" });
    const res = await first;
    expect(new URL(res.url()).searchParams.get("sort")).toBe("name");
    await expect(page.getByTestId("artisans-total-count")).toContainText(/artisans found/);

    const names = await page.getByTestId("artisan-name").allTextContents();
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    expect(names).toEqual(sorted);

    const featured = page.waitForResponse((response) => {
      if (!response.url().includes("/service-providers/public-info")) return false;
      return new URL(response.url()).searchParams.get("featured") === "true";
    });
    await page.getByTestId("artisan-view-featured").click();
    const featuredRes = await featured;
    expect(featuredRes.ok()).toBeTruthy();
    const featuredBody = await featuredRes.json();
    for (const row of featuredBody.data ?? []) {
      expect(row.featured).toBe(true);
    }
    await expect(page).toHaveURL(/view=featured/);
  });

  test("Admin artisan filters combine and the product artisan field saves the selected id", async ({
    page,
  }) => {
    await adminLogin(page);
    await page.goto("/admin/artisans", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-artisan-filters")).toBeVisible();
    await page.getByTestId("admin-artisan-search").fill("zzzz-no-such-artisan");
    await expect(page.getByText("No artisans match these filters.")).toBeVisible();
    await page.getByTestId("admin-artisan-clear").click();
    await expect(page.getByTestId("admin-artisan-search")).toHaveValue("");

    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await page.getByTestId("add-product-btn").click();
    await expect(page.getByTestId("admin-product-name")).toHaveAttribute("placeholder", /Handwoven/);
    await expect(page.getByText(/Placeholders are examples only/)).toBeVisible();

    const artisans = await page.request.get(`${apiBase()}/service-providers/public-info?pageSize=5&sort=name`);
    expect(artisans.ok()).toBeTruthy();
    const artisanBody = await artisans.json();
    const target = (artisanBody.data ?? [])[0];
    test.skip(!target?.brandName && !target?.businessName, "No public artisan available locally");
    const label = target.businessName || target.brandName;

    await page.getByTestId("admin-product-artisan").click();
    await page.getByTestId("admin-product-artisan-search").fill(label.slice(0, 4));
    const option = page.locator(`[data-testid="admin-product-artisan-option-${target.id}"]`);
    await expect(option).toBeVisible();
    await option.click();

    const unique = `Phase4 Filter ${Date.now()}`;
    await page.getByTestId("admin-product-name").fill(unique);
    await page.getByTestId("admin-product-description").fill("Phase 4 local verification product.");
    await page.getByTestId("admin-product-category").click();
    await page.getByRole("option", { name: "Tailoring" }).click();
    await page.getByTestId("admin-product-price-min").fill("1500");
    await page.getByTestId("admin-product-eta").fill("5 days");

    const created = page.waitForResponse(
      (response) =>
        response.url().includes("/admin/products") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /create product/i }).click();
    const createdRes = await created;
    expect(createdRes.ok()).toBeTruthy();
    const payload = createdRes.request().postDataJSON() as { artisanId?: number; name?: string };
    expect(payload.artisanId).toBe(target.id);
    expect(payload.name).toBe(unique);
    expect(String(payload.name)).not.toContain("Handwoven");
  });
});
