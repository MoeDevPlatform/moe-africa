import { test, expect } from "@playwright/test";

/**
 * Google button UI plus the OAuth start request.
 * Does not complete Google's account chooser or MFA.
 */

const API = process.env.MOE_API_BASE_URL || "http://localhost:3000";

test.describe("Google sign-in button and OAuth start", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("sign-in and sign-up buttons use the Google mark and stay in the card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/auth", { waitUntil: "domcontentloaded" });

    const signIn = page.getByTestId("signin-google");
    await expect(signIn).toBeVisible();
    await expect(signIn).toBeEnabled();
    await expect(signIn).toContainText("Continue with Google");
    await expect(signIn.getByTestId("google-mark")).toBeVisible();
    await expect(signIn.locator('path[fill="#4285F4"]')).toHaveCount(1);
    await expect(signIn.locator('path[fill="#EA4335"]')).toHaveCount(1);
    await expect(signIn.locator('path[fill="#FBBC05"]')).toHaveCount(1);
    await expect(signIn.locator('path[fill="#34A853"]')).toHaveCount(1);
    await expect(signIn.locator("svg")).toHaveCount(1);

    const metrics = await signIn.evaluate((el) => {
      const parent = el.parentElement as HTMLElement;
      const button = el.getBoundingClientRect();
      const card = parent.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        buttonWidth: button.width,
        parentWidth: card.width,
        height: button.height,
        background: style.backgroundColor,
        radius: style.borderRadius,
      };
    });
    expect(metrics.height).toBeGreaterThanOrEqual(40);
    expect(Math.abs(metrics.buttonWidth - metrics.parentWidth)).toBeLessThanOrEqual(2);
    expect(metrics.background).toBe("rgb(255, 255, 255)");

    const before = metrics.background;
    await signIn.hover();
    const hovered = await signIn.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(hovered).not.toBe(before);

    await signIn.focus();
    const shadow = await signIn.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe("none");

    await page.getByRole("tab", { name: "Sign Up" }).click();
    const signUp = page.getByTestId("signup-google");
    await expect(signUp).toBeVisible();
    await expect(signUp).toContainText("Continue with Google");
    await expect(signUp.getByTestId("google-mark")).toBeVisible();

    await signUp.click();
    await expect(page.getByTestId("signup-consent-error")).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);

    await page.getByRole("tab", { name: "Sign In" }).click();
    await expect(page.getByTestId("signin-google")).toBeVisible();
    await expect(page.getByTestId("signin-google")).toBeEnabled();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/auth?tab=signup", { waitUntil: "domcontentloaded" });
    const mobile = page.getByTestId("signup-google");
    await expect(mobile).toBeVisible();
    const box = await mobile.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeLessThanOrEqual(390);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await expect(page.getByRole("tab", { name: "Sign In" })).toBeVisible();
  });

  test("OAuth start does not send the placeholder client id", async ({ page, request }) => {
    const start = await request.get(`${API}/auth/google`, { maxRedirects: 0 });
    expect(start.status()).toBe(302);
    const location = start.headers().location || "";
    expect(location).not.toContain("client_id=disabled");
    expect(location).not.toContain("accounts.google.com");
    expect(location).toContain("error=google_unavailable");

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    const seen: string[] = [];
    await page.route(/accounts\.google\.com|accounts\.dev|\/auth\/google/, async (route) => {
      seen.push(route.request().url());
      await route.abort();
    });
    await page.getByTestId("signin-google").click();
    await expect
      .poll(() => seen.length, { timeout: 15_000 })
      .toBeGreaterThan(0);
    const oauthUrl = seen.find((url) => /accounts\.google\.com|accounts\.dev|\/auth\/google/.test(url)) ?? "";
    expect(oauthUrl).not.toContain("client_id=disabled");
    if (oauthUrl.includes("accounts.google.com")) {
      const clientId = new URL(oauthUrl).searchParams.get("client_id") || "";
      expect(clientId.endsWith(".apps.googleusercontent.com")).toBe(true);
      const redirectUri = new URL(oauthUrl).searchParams.get("redirect_uri") || "";
      expect(redirectUri).not.toBe("");
      console.log(
        JSON.stringify({
          authHost: new URL(oauthUrl).host,
          redirectHost: new URL(redirectUri).host,
          clientIdLooksGoogle: true,
        }),
      );
    } else {
      console.log(JSON.stringify({ startedHost: new URL(oauthUrl).host, path: new URL(oauthUrl).pathname }));
    }
  });

  test("email and password sign-in still reaches the marketplace", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.locator("#signin-email").fill("phase3.customer@local.test");
    await page.locator("#signin-password").fill("password123");
    const login = page.waitForResponse(
      (response) => response.url().includes("/auth/login") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^sign in$/i }).click();
    const res = await login;
    expect(res.ok(), `login ${res.status()}`).toBeTruthy();
    await page.waitForURL(/\/marketplace/, { timeout: 30_000 });
  });
});
