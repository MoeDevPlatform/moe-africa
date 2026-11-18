import { test, expect, type Page } from "@playwright/test";

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
  expect(res.ok()).toBeTruthy();
  await page.waitForURL(/\/(marketplace|artisan|admin)/, { timeout: 30_000 });
}

test.describe("Order ratings & reviews UI", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("customer sees Rate Your Order after acceptance and can submit stars + review", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, "phase3.customer@local.test", "password123");

    await page.route(/\/orders\/777(\/.*)?$/, async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === "GET" && url.includes("/tracking")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "delivered", history: [] }),
        });
        return;
      }
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 777,
            productName: "Accepted Gown",
            productImage: "",
            providerId: 9,
            providerName: "Studio",
            customerId: 2,
            productId: 1,
            status: "delivered",
            price: 50000,
            currency: "NGN",
            paymentMethod: "bank_transfer",
            paymentStatus: "paid",
            isCustomOrder: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            shippingAddress: {
              firstName: "C",
              lastName: "U",
              phone: "1",
              addressLine1: "a",
              city: "Lagos",
              state: "LA",
              country: "NG",
            },
            customerRating: null,
            customerReview: null,
            production: {
              payoutStatus: "verified",
              fundingRequired: true,
              requestedAmount: 10000,
              approvedAmount: 10000,
              currency: "NGN",
              verifiedTotal: 10000,
              disputeFlag: false,
              productionStartedAt: new Date().toISOString(),
              productionDeadline: new Date().toISOString(),
              productionDurationDays: 3,
              qualityReviewStatus: "approved",
              fulfillmentStatus: "customer_accepted",
              customerRating: null,
              customerReview: null,
              awaitingInitialPayout: false,
              readyToStart: false,
              displayLabel: "customer accepted",
            },
          }),
        });
        return;
      }
      if (method === "POST" && url.includes("/review") && !url.includes("/update")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            orderId: 777,
            rating: 5,
            review: "Loved it",
            productId: 1,
            artisanId: 9,
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/marketplace/orders/777", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("rate-your-order")).toBeVisible();
    await expect(page.getByText("Rate Your Order")).toBeVisible();
    await page.getByTestId("rate-star-5").click();
    await page.getByTestId("order-review-text").fill("Loved it");
    await page.getByTestId("submit-order-review").click();
    await expect(page.getByText(/thanks for your review/i)).toBeVisible({ timeout: 10_000 });
  });

  test("artisan completed orders show customer rating and comment", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, "phase3.artisan@local.test", "password123");

    await page.route(/\/orders(\?.*)?$/, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: 888,
              productName: "Rated Gown",
              productImage: "",
              providerId: 9,
              providerName: "Studio",
              customerId: 2,
              productId: 1,
              status: "delivered",
              price: 50000,
              currency: "NGN",
              paymentMethod: "bank_transfer",
              paymentStatus: "paid",
              isCustomOrder: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              shippingAddress: {
                firstName: "C",
                lastName: "U",
                phone: "1",
                addressLine1: "a",
                city: "Lagos",
                state: "LA",
                country: "NG",
              },
              customerRating: 5,
              customerReview: "Perfect finish",
              production: {
                payoutStatus: "verified",
                fundingRequired: false,
                requestedAmount: null,
                approvedAmount: null,
                currency: "NGN",
                verifiedTotal: 0,
                disputeFlag: false,
                productionStartedAt: new Date().toISOString(),
                productionDeadline: new Date().toISOString(),
                productionDurationDays: 2,
                qualityReviewStatus: "approved",
                fulfillmentStatus: "customer_accepted",
                customerRating: 5,
                customerReview: "Perfect finish",
                awaitingInitialPayout: false,
                readyToStart: false,
                displayLabel: "customer accepted",
              },
            },
          ],
          summary: { new: 0, pending: 0, completed: 1, all: 1 },
        }),
      });
    });

    await page.goto("/artisan?tab=orders&orderView=completed", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("artisan-order-review-888")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Perfect finish/)).toBeVisible();
  });
});
