import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * Focused check for the floating expandable messages panel.
 * Local app only — uses the existing conversations API, not a second inbox.
 */

const CUSTOMER_EMAIL = "phase3.customer@local.test";
const CUSTOMER_PASSWORD = "password123";
const ARTISAN_EMAIL = "phase3.artisan@local.test";
const ARTISAN_PASSWORD = "password123";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  const login = page.waitForResponse(
    (response) => response.url().includes("/auth/login") && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const res = await login;
  expect(res.ok(), `login failed ${res.status()}`).toBeTruthy();
  await page.waitForURL(/\/(marketplace|artisan)/, { timeout: 30_000 });
}

async function fulfillList(route: Route, body: string, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body,
  });
}

test.describe("Floating expandable messages panel", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("welcome page has no chat button and the navbar icon is gone", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Let's Go" })).toBeVisible();
    await expect(page.getByTestId("floating-messages-btn")).toHaveCount(0);
    await expect(page.getByTestId("messages-panel")).toHaveCount(0);

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "View messages" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Explore" })).toBeVisible();
    const fab = page.getByTestId("floating-messages-btn");
    await expect(fab).toBeVisible();
    await fab.click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByTestId("floating-messages-btn")).toHaveCount(0);
  });

  test("panel opens, lists conversations, and sends through the existing API", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "View messages" })).toHaveCount(0);

    const listPattern = /\/conversations\/?(\?.*)?$/;
    await page.route(listPattern, async (route) => {
      if (route.request().method() === "GET") {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.getByTestId("floating-messages-btn").click();
    const panel = page.getByTestId("messages-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByTestId("messages-panel-error")).toBeVisible();
    await page.unroute(listPattern);

    await page.route(listPattern, async (route) => {
      if (route.request().method() === "GET") {
        await fulfillList(route, "[]");
        return;
      }
      await route.continue();
    });
    await page.getByTestId("messages-panel-close").click();
    await expect(page.getByTestId("floating-messages-btn")).toBeVisible();
    await page.getByTestId("floating-messages-btn").click();
    await expect(page.getByTestId("messages-panel-empty")).toBeVisible();
    await page.unroute(listPattern);
    await page.getByTestId("messages-panel-close").click();

    await page.goto("/marketplace/product/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Message Us" }).first()).toBeVisible({ timeout: 20_000 });
    const artisanName = (
      await page.locator("a[href*='/marketplace/provider/'] span.font-medium").first().innerText()
    ).trim();
    expect(artisanName.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Message Us" }).first().click();
    await expect(panel.getByRole("heading", { name: `Re: ${artisanName}` })).toBeVisible();
    await expect(page.getByTestId("messages-thread")).toBeVisible();

    const unique = `Floating chat ${Date.now()}`;
    const sent = page.waitForResponse((response) => {
      if (response.request().method() !== "POST") return false;
      return /\/conversations(\/\d+\/messages)?$/.test(new URL(response.url()).pathname);
    });
    await page.getByTestId("messages-panel-input").fill(unique);
    await page.getByTestId("messages-panel-send").click();
    const sentRes = await sent;
    expect(sentRes.ok(), await sentRes.text()).toBeTruthy();
    await expect(panel.getByText(unique)).toBeVisible();

    await page.getByTestId("messages-panel-back").click();
    await expect(panel.getByRole("heading", { name: "Messages" })).toBeVisible();
    const row = page.getByTestId("messages-panel-conversation").filter({ hasText: artisanName }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    const unreadInList = await page.getByTestId("messages-panel-unread").count();
    if (unreadInList > 0) {
      await expect(page.getByTestId("messages-panel-unread").first()).toBeVisible();
    }
    await row.click();
    await expect(panel.getByRole("heading", { name: `Re: ${artisanName}` })).toBeVisible();
    await expect(panel.getByText(unique)).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("messages-panel-close").click();
    await expect(page.getByTestId("messages-panel")).toHaveCount(0);
    await expect(page.getByTestId("floating-messages-btn")).toBeVisible();
  });

  test("layout fits desktop and mobile, and enquiry opens the same panel", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/marketplace/artisan/1", { waitUntil: "domcontentloaded" });
    const enquiry = page.getByTestId("make-enquiry-btn");
    await expect(enquiry).toBeVisible({ timeout: 20_000 });
    await enquiry.click();
    const panel = page.getByTestId("messages-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: /^Re: / })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Let's Go" })).toBeVisible();
    await expect(page.getByTestId("floating-messages-btn")).toHaveCount(0);

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View messages" })).toHaveCount(0);
    await page.getByTestId("floating-messages-btn").click();
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844 + 1);
    const header = page.getByRole("banner");
    const headerBox = await header.boundingBox();
    expect(headerBox).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
    const scrolls = await panel.evaluate((el) =>
      Array.from(el.querySelectorAll("*")).some((node) => {
        const overflow = getComputedStyle(node).overflowY;
        return overflow === "auto" || overflow === "scroll";
      }),
    );
    expect(scrolls).toBe(true);
    await page.getByTestId("messages-panel-close").click();
    await expect(page.getByTestId("floating-messages-btn")).toBeVisible();
  });

  test("artisan dashboard keeps the floating button and no navbar icon", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);
    await page.goto("/artisan/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /dashboard/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/artisan\/dashboard/);
    await expect(page.getByRole("button", { name: "View messages" })).toHaveCount(0);
    await expect(page.getByTestId("floating-messages-btn")).toBeVisible();
    await page.getByTestId("floating-messages-btn").click();
    await expect(page.getByTestId("messages-panel")).toBeVisible();
    await expect(page.getByTestId("messages-panel").getByRole("heading", { name: "Messages" })).toBeVisible();
  });
});
