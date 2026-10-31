import { expect, test } from "@playwright/test";

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3000";
}

test.describe("Email verification (local only)", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("customer and artisan signup stay unverified until the link is used", async ({ page, request }) => {
    const api = apiBase();
    const password = "Verify1!pass";
    const customerEmail = `verify.customer.${Date.now()}@local.test`;

    await page.goto("/auth?tab=signup", { waitUntil: "domcontentloaded" });
    await page.locator("#firstname").fill("Verify");
    await page.locator("#lastname").fill("Customer");
    await page.locator("#signup-email").fill(customerEmail);
    await page.locator("#signup-password").fill(password);
    await page.locator("#confirm-password").fill(password);
    await page.getByTestId("signup-consent").click();
    const created = page.waitForResponse(
      (response) => response.url().includes("/auth/register") && response.request().method() === "POST",
    );
    await page.getByTestId("signup-btn").click();
    const createdRes = await created;
    expect(createdRes.status()).toBe(201);
    const createdBody = await createdRes.json();
    expect(createdBody.verificationRequired).toBe(true);
    expect(createdBody.token).toBeUndefined();
    await expect(page.getByTestId("verify-email-pending")).toBeVisible();
    await expect(page.getByTestId("resend-verification")).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem("moe_access_token"))).toBeNull();

    await page.goto("/artisan/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth/);

    const login = await request.post(`${api}/auth/login`, {
      data: { email: customerEmail, password },
    });
    expect(login.status()).toBe(403);
    const loginBody = await login.json();
    expect(loginBody.code).toBe("EMAIL_NOT_VERIFIED");

    const profile = await request.get(`${api}/auth/profile`, {
      headers: { Authorization: "Bearer not-a-session" },
    });
    expect(profile.status()).toBe(401);

    const resend = await request.post(`${api}/auth/resend-verification`, {
      data: { email: customerEmail },
    });
    const unknown = await request.post(`${api}/auth/resend-verification`, {
      data: { email: `missing.${Date.now()}@local.test` },
    });
    expect(resend.status()).toBe(200);
    expect(unknown.status()).toBe(200);
    expect(await resend.json()).toEqual(await unknown.json());

    const artisanEmail = `verify.artisan.${Date.now()}@local.test`;
    const artisan = await request.post(`${api}/auth/register`, {
      data: {
        name: "Verify Artisan",
        email: artisanEmail,
        password,
        role: "artisan",
        serviceCategories: ["Tailoring"],
        acceptedTerms: true,
      },
    });
    expect(artisan.status()).toBe(201);
    const artisanBody = await artisan.json();
    expect(artisanBody.verificationRequired).toBe(true);
    expect(artisanBody.token).toBeUndefined();
    const artisanLogin = await request.post(`${api}/auth/login`, {
      data: { email: artisanEmail, password },
    });
    expect(artisanLogin.status()).toBe(403);
  });

  test("an invalid verification link is rejected and offers sign in", async ({ page, request }) => {
    const api = apiBase();
    const token = "a".repeat(64);
    const rejected = await request.post(`${api}/auth/verify-email`, { data: { token } });
    expect(rejected.status()).toBe(400);
    expect((await rejected.json()).message).toMatch(/invalid/i);

    await page.goto(`/auth/verify-email?token=${token}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("verify-email-invalid")).toBeVisible();
    await expect(page.getByTestId("verify-sign-in")).toBeVisible();
  });
});
