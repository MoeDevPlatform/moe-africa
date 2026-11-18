import { test, expect } from "@playwright/test";
import {
  authenticateOrderUi,
  skipUnlessLocalOrCiApp,
} from "../helpers/orderUiAuth";

const ARTISAN_EMAIL = "phase3.artisan@local.test";
const ARTISAN_PASSWORD = "password123";

test.describe("Production & quality UI", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    test.skip(skipUnlessLocalOrCiApp(), "Local/CI app only");
  });

  test("artisan pending order shows countdown and quality submit controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await authenticateOrderUi(page, {
      role: "artisan",
      email: ARTISAN_EMAIL,
      password: ARTISAN_PASSWORD,
    });

    const deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const started = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

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
              id: 901,
              productName: "In Progress Gown",
              productImage: "",
              providerId: 9,
              providerName: "Studio",
              customerId: 2,
              productId: 1,
              status: "in_progress",
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
              readiness: {
                workflowStatus: "approved",
                assessmentType: "detailed",
                assignedAt: started,
                responseDeadline: null,
                msRemaining: null,
              },
              production: {
                payoutStatus: "verified",
                fundingRequired: true,
                requestedAmount: 10000,
                approvedAmount: 10000,
                currency: "NGN",
                verifiedTotal: 10000,
                disputeFlag: false,
                productionStartedAt: started,
                productionDeadline: deadline,
                productionOriginalDeadline: deadline,
                productionDurationDays: 3,
                msElapsed: 86400000,
                msRemaining: 172800000,
                overdue: false,
                qualityReviewStatus: "in_production",
                fulfillmentStatus: null,
                awaitingInitialPayout: false,
                readyToStart: false,
                displayLabel: "In production",
              },
            },
          ],
          summary: { new: 0, pending: 1, completed: 0, all: 1 },
          total: 1,
        }),
      });
    });

    await page.goto("/artisan/dashboard?tab=orders&orderView=pending", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("artisan-production-countdown")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("artisan-production-progress-submit-901")).toBeVisible();
    await expect(page.getByTestId("artisan-quality-submit-901")).toBeVisible();
  });
});
