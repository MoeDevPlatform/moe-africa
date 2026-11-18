import { expect, type Page } from "@playwright/test";

export type MockRole = "customer" | "artisan" | "admin";

/**
 * UI-focused auth for order Playwright specs.
 * Prefer real login when a backend is available; in CI (PLAYWRIGHT_MOCK_AUTH=1)
 * stub auth/profile so route-mocked order screens can be exercised without a DB.
 */
export async function authenticateOrderUi(
  page: Page,
  opts: { role: MockRole; email: string; password: string },
) {
  const useMock =
    process.env.PLAYWRIGHT_MOCK_AUTH === "1" ||
    process.env.CI === "true";

  if (useMock) {
    const profile = {
      id: opts.role === "artisan" ? 9 : opts.role === "admin" ? 1 : 2,
      name: `Phase4 ${opts.role}`,
      email: opts.email,
      role: opts.role,
      artisanProfile:
        opts.role === "artisan"
          ? { id: 9, businessName: "Phase4 Studio", status: "approved" }
          : undefined,
    };

    await page.route(/\/auth\/(login|profile|refresh)(\?.*)?$/, async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (url.includes("/auth/login") && method === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            token: "ci-mock-access",
            refreshToken: "ci-mock-refresh",
            user: profile,
          }),
        });
        return;
      }
      if (url.includes("/auth/profile") && method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(profile),
        });
        return;
      }
      if (url.includes("/auth/refresh") && method === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            token: "ci-mock-access",
            refreshToken: "ci-mock-refresh",
          }),
        });
        return;
      }
      await route.continue();
    });

    // Artisan dashboard may hydrate artisan profile separately.
    if (opts.role === "artisan") {
      await page.route(/\/artisans\/me(\/.*)?$/, async (route) => {
        if (route.request().method() !== "GET") {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 9,
            businessName: "Phase4 Studio",
            status: "approved",
            pendingOrderCount: 1,
          }),
        });
      });
    }

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.locator("#signin-email").fill(opts.email);
    await page.locator("#signin-password").fill(opts.password);
    const login = page.waitForResponse(
      (response) =>
        response.url().includes("/auth/login") && response.request().method() === "POST",
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: /^sign in$/i }).click();
    const res = await login;
    expect(res.ok()).toBeTruthy();
    await page.waitForURL(/\/(marketplace|artisan|admin)/, { timeout: 30_000 });
    return;
  }

  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.locator("#signin-email").fill(opts.email);
  await page.locator("#signin-password").fill(opts.password);
  const login = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const res = await login;
  expect(res.ok()).toBeTruthy();
  await page.waitForURL(/\/(marketplace|artisan|admin)/, { timeout: 30_000 });
}

/** Specs that rely on Vite preview / local app (including GitHub Actions). */
export function skipUnlessLocalOrCiApp() {
  const base =
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.MOE_FRONTEND_URL ||
    "";
  const ok =
    process.env.CI === "true" ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
  return !ok;
}
