import { test, expect, type Page } from "@playwright/test";

function apiBase(): string {
  return process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3000";
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  const login = page.waitForResponse(
    (response) => response.url().includes("/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const res = await login;
  expect(res.ok()).toBeTruthy();
}

test.describe("Phase 7 message, enquiry, and signup consent (local)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("Message Us and Make an Enquiry use the product and artisan already on the page", async ({ page, request }) => {
    const api = apiBase();
    const productRes = await request.get(`${api}/products/1`);
    expect(productRes.ok()).toBeTruthy();
    const product = await productRes.json();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/marketplace/product/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
    const artisanName = (await page.locator("a[href*='/marketplace/provider/'] span.font-medium").first().innerText()).trim();
    expect(artisanName.length).toBeGreaterThan(0);
    const message = page.getByRole("button", { name: "Message Us" });
    await expect(message).toBeVisible();
    await expect(message).toHaveText(/Message Us/);
    const border = await message.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(parseFloat(border)).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
    await page.getByRole("button", { name: "Add to Wishlist" }).click();
    await expect(page.getByText("Please sign in to save items to your wishlist")).toBeVisible();

    await message.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: `Re: ${artisanName}` })).toBeVisible();
    await page.keyboard.press("Escape");

    await signIn(page, "phase3.customer@local.test", "password123");
    await page.goto("/marketplace/product/1", { waitUntil: "domcontentloaded" });
    const addWishlist = page.getByRole("button", { name: "Add to wishlist" });
    const removeWishlist = page.getByRole("button", { name: "Remove from wishlist" });
    await expect(addWishlist.or(removeWishlist).first()).toBeVisible();
    if (await removeWishlist.count()) {
      await removeWishlist.first().click();
      await expect(addWishlist.first()).toBeVisible();
    }
    await addWishlist.first().click();
    await expect(removeWishlist.first()).toBeVisible();
    const sent = page.waitForResponse((response) => {
      if (response.request().method() !== "POST" || new URL(response.url()).port !== "3000") return false;
      return /\/conversations/.test(new URL(response.url()).pathname);
    });
    await page.getByRole("button", { name: "Message Us" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: `Re: ${artisanName}` })).toBeVisible();
    await page.getByPlaceholder("Type your message...").fill("Phase 7 message check");
    await page.getByPlaceholder("Type your message...").press("Enter");
    const sentRes = await sent;
    expect(sentRes.ok()).toBeTruthy();
    const sentUrl = new URL(sentRes.url());
    if (sentUrl.pathname === "/conversations") {
      const payload = sentRes.request().postDataJSON() as { providerId?: number };
      expect(Number(payload.providerId)).toBe(Number(product.providerId));
    }
    await page.keyboard.press("Escape");

    await page.goto(`/marketplace/artisan/${product.providerId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: artisanName })).toBeVisible();
    await expect(page.getByText("Contact Us About This Artisan")).toHaveCount(0);
    await expect(page.getByTestId("make-enquiry-btn")).toHaveText(/Make an Enquiry/);
    await expect(page.getByTestId("make-enquiry-sidebar-btn")).toHaveText(/Make an Enquiry/);
    await page.getByTestId("make-enquiry-btn").click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: `Re: ${artisanName}` })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/marketplace/artisan/${product.providerId}`, { waitUntil: "domcontentloaded" });
    const mobileEnquiry = page.getByTestId("make-enquiry-btn");
    await expect(mobileEnquiry).toBeVisible();
    const box = await mobileEnquiry.boundingBox();
    expect(box && box.width).toBeLessThanOrEqual(390);
    await mobileEnquiry.click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: `Re: ${artisanName}` })).toBeVisible();
  });

  test("signup consent is required in the form and on the register API", async ({ page, request }) => {
    const api = apiBase();
    const email = `phase7.consent.${Date.now()}@local.test`;
    const password = "Phase7!pass";

    await page.goto("/auth?tab=signup", { waitUntil: "domcontentloaded" });
    const consent = page.getByTestId("signup-consent");
    await expect(consent).not.toBeChecked();
    await page.getByRole("link", { name: "Terms of Service" }).first().click();
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await page.goto("/auth?tab=signup", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Privacy Policy" }).first().click();
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();

    await page.goto("/auth?tab=signup", { waitUntil: "domcontentloaded" });
    await page.locator("#firstname").fill("Phase7");
    await page.locator("#lastname").fill("Consent");
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-password").fill("short");
    await page.locator("#confirm-password").fill("short");
    await page.getByTestId("signup-consent").click();
    await page.getByTestId("signup-btn").click();
    await expect(page.getByText(/at least 8 characters|uppercase|special character/i).first()).toBeVisible();

    await page.locator("#signup-password").fill(password);
    await page.locator("#confirm-password").fill(password);
    await page.getByTestId("signup-consent").click();
    await expect(page.getByTestId("signup-consent")).not.toBeChecked();
    let posted = false;
    const onRequest = (req: { url: () => string; method: () => string }) => {
      if (req.method() === "POST" && req.url().includes("/auth/register")) posted = true;
    };
    page.on("request", onRequest);
    await page.getByTestId("signup-btn").click();
    await expect(page.getByTestId("signup-consent-error")).toBeVisible();
    expect(posted).toBe(false);
    page.off("request", onRequest);

    const missing = await request.post(`${api}/auth/register`, {
      data: { name: "Phase7 Consent", email, password, role: "customer" },
    });
    expect(missing.status()).toBe(400);

    await page.getByTestId("signup-consent").click();
    const created = page.waitForResponse(
      (response) => response.url().includes("/auth/register") && response.request().method() === "POST",
    );
    await page.getByTestId("signup-btn").click();
    const createdRes = await created;
    expect(createdRes.status()).toBe(201);
    const createdBody = createdRes.request().postDataJSON() as { acceptedTerms?: boolean; email?: string };
    expect(createdBody.acceptedTerms).toBe(true);
    expect(createdBody.email).toBe(email);
    await expect(page).toHaveURL(/\/marketplace/);

    await page.evaluate(() => {
      localStorage.removeItem("moe_access_token");
      localStorage.removeItem("moe_refresh_token");
    });
    await page.goto("/auth?tab=signup", { waitUntil: "domcontentloaded" });
    await page.locator("#firstname").fill("Phase7");
    await page.locator("#lastname").fill("Consent");
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-password").fill(password);
    await page.locator("#confirm-password").fill(password);
    await page.getByTestId("signup-consent").click();
    const duplicate = page.waitForResponse(
      (response) => response.url().includes("/auth/register") && response.request().method() === "POST",
    );
    await page.getByTestId("signup-btn").click();
    const duplicateRes = await duplicate;
    expect(duplicateRes.status()).toBe(409);
    await expect(page.getByTestId("auth-error")).toBeVisible();
  });
});
