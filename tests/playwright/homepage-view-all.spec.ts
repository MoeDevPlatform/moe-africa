import { test, expect, type Locator, type Page } from "@playwright/test";

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

async function gridColumns(section: Locator): Promise<number> {
  const grid = section.locator(".grid").first();
  return grid.evaluate((element) => {
    return getComputedStyle(element)
      .gridTemplateColumns.split(" ")
      .map((part) => part.trim())
      .filter((part) => part && part !== "none" && part !== "0px").length;
  });
}

async function expectLinkInsideViewport(page: Page, link: Locator) {
  const box = await link.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
}

test.describe("Homepage view all", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Runs against the local app");
  });

  test("shows view all only when the preview is full and opens the matching listing", async ({ page, request }) => {
    const api = apiBase();
    const artisansRes = await request.get(`${api}/service-providers/public-info?pageSize=100`);
    expect(artisansRes.ok()).toBeTruthy();
    const artisansBody = await artisansRes.json();
    const artisanTotal = Number(artisansBody.pagination?.totalItems ?? 0);
    expect(artisanTotal).toBeGreaterThan(3);

    const dealsRes = await request.get(`${api}/products?collection=deals&pageSize=20`);
    expect(dealsRes.ok()).toBeTruthy();
    const dealsBody = await dealsRes.json();
    const dealsTotal = Number(dealsBody.pagination?.totalItems ?? 0);
    expect(dealsTotal).toBeGreaterThan(3);

    const stylesRes = await request.get(`${api}/products?collection=styles&pageSize=20`);
    expect(stylesRes.ok()).toBeTruthy();
    const stylesBody = await stylesRes.json();
    const stylesTotal = Number(stylesBody.pagination?.totalItems ?? 0);
    expect(stylesTotal).toBeGreaterThan(4);
    const styleNames = (stylesBody.data ?? []).map((row: { name: string }) => row.name);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });

    const services = page.getByTestId("services-for-you");
    await expect(services).toHaveAttribute("data-preview-ready", "true");
    const serviceColumns = await gridColumns(services);
    const serviceNames = await services.getByTestId("artisan-name").allTextContents();
    expect(serviceNames.length).toBe(Math.min(artisanTotal, serviceColumns));
    const servicesLink = services.getByTestId("services-view-all");
    if (artisanTotal > serviceColumns) await expect(servicesLink).toBeVisible();
    else await expect(servicesLink).toHaveCount(0);
    await expectLinkInsideViewport(page, servicesLink);
    await servicesLink.click();
    await expect(page).toHaveURL(/\/marketplace\/artisans\?collection=services/);
    await expect(page.getByRole("heading", { name: "Services For You" })).toBeVisible();
    await expect(page.getByTestId("artisans-total-count")).toContainText(`${artisanTotal} artisans found`);
    for (const name of serviceNames) {
      await expect(page.getByTestId("artisans-grid").getByText(name, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByTestId("artisans-grid").getByTestId("artisan-name")).not.toHaveCount(serviceNames.length);

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    const recommended = page.getByTestId("recommended-artisans");
    await expect(recommended).toHaveAttribute("data-preview-ready", "true");
    const recommendedLink = recommended.getByTestId("recommended-artisans-view-all");
    await expect(recommendedLink).toBeVisible();
    await expectLinkInsideViewport(page, recommendedLink);
    const recommendedResponse = page.waitForResponse((response) => {
      if (!isLocalApi(response.url()) || response.request().method() !== "GET") return false;
      const url = new URL(response.url());
      return url.pathname === "/service-providers/public-info";
    });
    await recommendedLink.click();
    const recommendedRes = await recommendedResponse;
    expect(recommendedRes.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/marketplace\/artisans\?collection=recommended/);
    await expect(page).toHaveURL(/sort=featured/);
    await expect(page.getByRole("heading", { name: "Recommended Artisans" })).toBeVisible();
    await expect(page.getByTestId("artisans-total-count")).toContainText(`${artisanTotal} artisans found`);

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    const deals = page.getByTestId("deals-for-you");
    await expect(deals).toHaveAttribute("data-preview-ready", "true");
    const dealColumns = await gridColumns(deals);
    const dealNames = await deals.getByRole("heading", { level: 3 }).allTextContents();
    expect(dealNames.length).toBe(Math.min(dealsTotal, dealColumns));
    expect(dealNames.length).toBeLessThan(dealsTotal);
    const dealsLink = deals.getByTestId("deals-view-all");
    await expect(dealsLink).toBeVisible();
    const dealsResponse = page.waitForResponse((response) => {
      if (!isLocalApi(response.url())) return false;
      const url = new URL(response.url());
      return url.pathname === "/products" && url.searchParams.get("collection") === "deals";
    });
    await dealsLink.click();
    const dealsPageRes = await dealsResponse;
    expect(dealsPageRes.status()).toBe(200);
    const dealsPageBody = await dealsPageRes.json();
    expect(dealsPageBody.pagination.totalItems).toBe(dealsTotal);
    await expect(page).toHaveURL(/\/marketplace\/products\?collection=deals$/);
    await expect(page.getByRole("heading", { name: "Deals For You" })).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText(`${dealsTotal} products found`);
    await expect(page.getByTestId("products-grid").getByRole("heading", { level: 3 }).first()).toHaveText(dealNames[0]);

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    const styles = page.getByTestId("styles-for-you");
    await expect(styles).toHaveAttribute("data-preview-ready", "true");
    const styleColumns = await gridColumns(styles);
    const previewStyleNames = await styles.getByRole("heading", { level: 3 }).allTextContents();
    expect(previewStyleNames.length).toBe(Math.min(stylesTotal, styleColumns));
    expect(previewStyleNames.length).toBeLessThan(stylesTotal);
    const hiddenStyle = styleNames.find((name: string) => !previewStyleNames.includes(name));
    expect(hiddenStyle).toBeTruthy();
    const stylesLink = styles.getByTestId("styles-view-all");
    await expect(stylesLink).toBeVisible();
    await stylesLink.click();
    await expect(page).toHaveURL(/\/marketplace\/products\?collection=styles$/);
    await expect(page.getByRole("heading", { name: "Styles For You" })).toBeVisible();
    await expect(page.getByTestId("products-total-count")).toContainText(`${stylesTotal} products found`);
    await expect(page.getByTestId("products-grid").getByRole("heading", { level: 3, name: hiddenStyle! })).toBeVisible();

    const best = page.getByTestId("home-best-sellers");
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(best).toHaveAttribute("data-preview-ready", "true");
    const bestCount = await best.locator("[data-product-id]").count();
    const bestFits = await best.evaluate((root) => {
      const viewport = root.querySelector(".overflow-hidden");
      const cards = [...root.querySelectorAll("[data-product-id]")];
      if (!viewport || cards.length === 0) return true;
      const view = viewport.getBoundingClientRect();
      return cards.every((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left >= view.left - 2 && rect.right <= view.right + 2;
      });
    });
    if (bestFits) await expect(best.getByTestId("home-best-sellers-view-all")).toHaveCount(0);
    else expect(bestCount).toBeGreaterThan(0);

    await expect(page.getByTestId("home-trending")).toHaveCount(0);
    await expect(page.getByTestId("home-trending-view-all")).toHaveCount(0);
    await expect(page.getByTestId("home-seasonal-picks-view-all")).toHaveCount(0);
    await expect(page.getByTestId("home-editors-picks-view-all")).toHaveCount(0);

    const picks = page.getByTestId("home-featured-picks");
    await expect(picks).toHaveAttribute("data-preview-ready", "true");
    const picksLink = picks.getByTestId("home-featured-picks-view-all");
    const picksFit = await picks.evaluate((root) => {
      const viewport = root.querySelector(".overflow-hidden");
      const cards = [...root.querySelectorAll("[data-product-id]")];
      if (!viewport || cards.length === 0) return true;
      const view = viewport.getBoundingClientRect();
      return cards.every((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left >= view.left - 2 && rect.right <= view.right + 2;
      });
    });
    if (picksFit) await expect(picksLink).toHaveCount(0);
    else await expect(picksLink).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(services).toHaveAttribute("data-preview-ready", "true");
    const mobileServiceColumns = await gridColumns(services);
    expect(mobileServiceColumns).toBeLessThan(serviceColumns);
    await expect(services.getByTestId("services-view-all")).toBeVisible();
    await expectLinkInsideViewport(page, services.getByTestId("services-view-all"));
    await expect(deals.getByTestId("deals-view-all")).toBeVisible();
    await expectLinkInsideViewport(page, deals.getByTestId("deals-view-all"));
    await expect(styles.getByTestId("styles-view-all")).toBeVisible();
    await expect(recommended.getByTestId("recommended-artisans-view-all")).toBeVisible();
    await expectLinkInsideViewport(page, recommended.getByTestId("recommended-artisans-view-all"));

    await expect(picks).toHaveAttribute("data-preview-ready", "true");
    const mobilePicks = picks.getByTestId("home-featured-picks-view-all");
    const mobilePicksFit = await picks.evaluate((root) => {
      const viewport = root.querySelector(".overflow-hidden");
      const cards = [...root.querySelectorAll("[data-product-id]")];
      if (!viewport || cards.length === 0) return true;
      const view = viewport.getBoundingClientRect();
      return cards.every((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left >= view.left - 2 && rect.right <= view.right + 2;
      });
    });
    if (!mobilePicksFit) {
      await expect(mobilePicks).toBeVisible();
      await mobilePicks.click();
      await expect(page).toHaveURL(/collection=featured_picks/);
      await expect(page.getByRole("heading", { name: "Featured Picks" })).toBeVisible();
    }

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("services-for-you")).toHaveAttribute("data-preview-ready", "true");
    await page.getByTestId("services-view-all").click();
    await expect(page).toHaveURL(/\/marketplace\/artisans\?collection=services/);
    await expect(page.getByRole("heading", { name: "Services For You" })).toBeVisible();
  });
});
