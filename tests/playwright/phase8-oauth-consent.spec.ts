import { test, expect } from "@playwright/test";

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || process.env.MOE_API_BASE_URL || "http://localhost:3000";
}

test.describe("OAuth signup cannot skip consent", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("a new Google signup is blocked until consent, and sign-in does not require it", async ({ page, request }) => {
    const api = apiBase();
    expect((await request.post(`${api}/auth/oauth-consent`, { data: { acceptedTerms: false } })).status()).toBe(400);
    expect((await request.post(`${api}/auth/oauth-consent`, { data: {} })).status()).toBe(400);
    const issued = await request.post(`${api}/auth/oauth-consent`, { data: { acceptedTerms: true } });
    expect(issued.status()).toBe(200);
    const ticket = await issued.json();
    expect(typeof ticket.state).toBe("string");
    expect(ticket.state.length).toBeGreaterThan(10);

    const direct = await request.get(`${api}/auth/google`, { maxRedirects: 0 });
    expect(direct.status()).toBeGreaterThanOrEqual(300);
    expect(direct.status()).toBeLessThan(400);
    const location = direct.headers().location ?? "";
    expect(location).toContain("accounts.google.com");
    expect(location).not.toContain("state=");

    await page.goto("/auth?tab=signup");
    const signupGoogle = page.getByTestId("signup-google").first();
    await expect(signupGoogle).toBeVisible();
    await signupGoogle.click();
    await expect(page.getByTestId("signup-consent-error")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\?tab=signup/);

    const startedUrls: string[] = [];
    page.on("request", (req) => startedUrls.push(req.url()));
    await page.route(/accounts\.google\.com|accounts\.dev|\/auth\/google/, (route) => route.abort());
    await page.getByTestId("signup-consent").click();
    await signupGoogle.click();
    await expect.poll(() => startedUrls.some((url) => /\/auth\/google|accounts\.google\.com|accounts\.dev|oauth/i.test(url)), {
      timeout: 15_000,
    }).toBe(true);
    const start = startedUrls.find((url) => /\/auth\/google|accounts\.google\.com|accounts\.dev|oauth/i.test(url)) ?? "";
    if (start.includes("/auth/google")) expect(start).toContain("state=");
    await expect(page.getByTestId("signup-consent-error")).toHaveCount(0);

    await page.unroute(/accounts\.google\.com|accounts\.dev|\/auth\/google/);
    await page.goto("/auth");
    await expect(page.getByTestId("signin-google")).toBeEnabled();
    await page.route(/accounts\.google\.com|accounts\.dev|\/auth\/google/, (route) => route.abort());
    let consentPosted = false;
    page.on("request", (req) => {
      if (req.url().includes("/auth/oauth-consent")) consentPosted = true;
    });
    const signInUrls: string[] = [];
    page.on("request", (req) => signInUrls.push(req.url()));
    await page.getByTestId("signin-google").click();
    await expect.poll(() => signInUrls.some((url) => /\/auth\/google|accounts\.google\.com|accounts\.dev|oauth/i.test(url)), {
      timeout: 15_000,
    }).toBe(true);
    expect(consentPosted).toBe(false);
    expect(signInUrls.some((url) => url.includes("/auth/oauth-consent"))).toBe(false);
    await expect(page.getByTestId("signup-consent-error")).toHaveCount(0);
  });
});
