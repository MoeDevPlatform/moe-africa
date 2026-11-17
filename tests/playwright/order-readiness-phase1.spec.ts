import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 1 order readiness — local app only.
 * Uses API mocks for controllable deadlines and review decisions.
 */

const ARTISAN_EMAIL = "phase3.artisan@local.test";
const ARTISAN_PASSWORD = "password123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@moe-africa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";

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
  await page.waitForURL(/\/(marketplace|artisan|admin)/, { timeout: 30_000 });
}

test.describe("Order readiness Phase 1", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("artisan New Orders shows readiness card and standard form", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);

    const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    await page.route(/\/orders(\?.*)?$/, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const url = new URL(route.request().url());
      if (url.pathname !== "/orders" && !url.pathname.endsWith("/orders")) {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: 501,
              productName: "Ready Tee",
              productImage: "/placeholder.svg",
              providerId: 2,
              providerName: "Local Artisan",
              customerId: 1,
              isCustomOrder: false,
              status: "pending",
              price: 12000,
              currency: "NGN",
              shippingAddress: {
                firstName: "Ada",
                lastName: "Okafor",
                phone: "080",
                addressLine1: "1 Road",
                city: "Lagos",
                state: "Lagos",
                country: "NG",
              },
              paymentMethod: "paystack",
              paymentStatus: "paid",
              customisationData: { size: "M", colour: "Indigo" },
              estimatedDelivery: "7 days",
              readiness: {
                workflowStatus: "awaiting_response",
                assessmentType: "standard",
                assignedAt: new Date().toISOString(),
                responseDeadline: deadline,
                msRemaining: 12 * 60 * 60 * 1000,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          summary: { new: 1, pending: 1, completed: 0, all: 1 },
        }),
      });
    });

    await page.route(/\/orders\/501\/readiness$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          orderId: 501,
          readiness: {
            workflowStatus: "awaiting_response",
            assessmentType: "standard",
            assignedAt: new Date().toISOString(),
            responseDeadline: deadline,
            msRemaining: 12 * 60 * 60 * 1000,
          },
          customerRequirements: {
            productName: "Ready Tee",
            productImage: null,
            quantity: 1,
            price: 12000,
            currency: "NGN",
            isCustomOrder: false,
            customisationData: { size: "M", colour: "Indigo" },
            estimatedDelivery: "7 days",
            rushOrder: false,
            shipping: { city: "Lagos", state: "Lagos", country: "NG" },
          },
          assessments: [],
          events: [],
        }),
      });
    });

    await page.goto("/artisan/dashboard?tab=orders&orderView=new", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("artisan-order-501")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("artisan-readiness-status")).toContainText(/awaiting response/i);
    await expect(page.getByTestId("artisan-readiness-accept-501")).toBeVisible();
    await page.getByTestId("artisan-readiness-accept-501").click();
    await expect(page.getByTestId("readiness-dialog")).toBeVisible();
    await expect(page.getByTestId("readiness-requirements")).toContainText("Indigo");
    await expect(page.getByTestId("readiness-standard-form")).toBeVisible();
  });

  test("admin readiness approve does not imply payout or production", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.route(/\/admin\/orders\/readiness/, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: 601,
              productName: "Custom Gown",
              providerName: "Local Artisan",
              readiness: {
                workflowStatus: "submitted",
                assessmentType: "detailed",
                assignedAt: new Date().toISOString(),
                responseDeadline: new Date().toISOString(),
                msRemaining: 0,
              },
              latestAssessment: { id: 9, version: 1, status: "submitted" },
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
        }),
      });
    });

    await page.route(/\/orders\/601\/readiness$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          orderId: 601,
          readiness: {
            workflowStatus: "submitted",
            assessmentType: "detailed",
            assignedAt: new Date().toISOString(),
            responseDeadline: new Date().toISOString(),
            msRemaining: 0,
          },
          customerRequirements: {
            productName: "Custom Gown",
            productImage: null,
            quantity: 1,
            price: 200000,
            currency: "NGN",
            isCustomOrder: true,
            customisationData: { bust: "36" },
            estimatedDelivery: "21 days",
            rushOrder: false,
            shipping: { city: "Abuja", state: "FCT", country: "NG" },
          },
          assessments: [
            {
              id: 9,
              version: 1,
              type: "detailed",
              status: "submitted",
              payload: { workDescription: "Sew gown", materialsRequired: "Ankara" },
              cannotFulfil: false,
              cannotFulfilReason: null,
              acknowledgedRequirements: true,
              submittedAt: new Date().toISOString(),
              evidence: [],
              reviews: [],
            },
          ],
          events: [],
        }),
      });
    });

    let decided = false;
    await page.route(/\/admin\/orders\/601\/readiness\/assessments\/9\/decide$/, async (route) => {
      decided = true;
      const body = route.request().postDataJSON() as { decision?: string };
      expect(body.decision).toBe("approve");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workflowStatus: "approved",
          decision: "approve",
        }),
      });
    });

    await page.goto("/admin/orders?readiness=1&orderId=601", { waitUntil: "domcontentloaded" });
    await page.getByTestId("admin-orders-section-readiness").click();
    await expect(page.getByTestId("admin-readiness-panel")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("admin-readiness-row-601").click();
    await expect(page.getByTestId("admin-readiness-detail")).toContainText("Custom Gown");
    await page.getByTestId("admin-readiness-approve").click();
    await expect(page.getByText(/awaiting initial payout/i)).toBeVisible({ timeout: 10_000 });
    expect(decided).toBe(true);
  });
});
