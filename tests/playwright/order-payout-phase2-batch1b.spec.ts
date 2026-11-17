import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 2 Batch 1B — initial artisan payout & Start Work (UI contracts, mocked API).
 * Local app only.
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

test.describe("Order payout Phase 2 Batch 1B", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("artisan shows awaiting payout and hides Start Work until eligible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);

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
              id: 701,
              productName: "Ready Gown",
              productImage: "",
              providerId: 9,
              providerName: "Ada Atelier",
              customerId: 2,
              productId: 1,
              status: "confirmed",
              price: 45000,
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
                assignedAt: new Date().toISOString(),
                responseDeadline: null,
                msRemaining: null,
              },
              production: {
                payoutStatus: "requested",
                fundingRequired: true,
                requestedAmount: 12000,
                approvedAmount: null,
                currency: "NGN",
                verifiedTotal: 0,
                disputeFlag: false,
                productionStartedAt: null,
                productionDeadline: null,
                productionDurationDays: null,
                awaitingInitialPayout: true,
                readyToStart: false,
                displayLabel: "Approved — Awaiting Initial Payout",
              },
            },
          ],
          summary: { new: 1, pending: 1, completed: 0, all: 1 },
          total: 1,
        }),
      });
    });

    await page.goto("/artisan/dashboard?tab=orders&orderView=new", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("artisan-awaiting-payout")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("artisan-readiness-status")).toContainText(
      /Approved — Awaiting Initial Payout/i,
    );
    await expect(page.getByTestId("artisan-start-work-701")).toHaveCount(0);
  });

  test("admin payout panel separates requested vs approved and start eligibility", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.route(/\/admin\/orders\/readiness/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: 801,
              productName: "Custom Jacket",
              providerName: "Kemi Studio",
              readiness: {
                workflowStatus: "approved",
                assessmentType: "detailed",
                assignedAt: new Date().toISOString(),
                responseDeadline: null,
                msRemaining: null,
              },
              production: {
                payoutStatus: "amount_approved",
                fundingRequired: true,
                requestedAmount: 15000,
                approvedAmount: 12000,
                currency: "NGN",
                verifiedTotal: 0,
                disputeFlag: false,
                productionStartedAt: null,
                productionDeadline: null,
                productionDurationDays: null,
                awaitingInitialPayout: true,
                readyToStart: false,
                displayLabel: "Approved — Awaiting Initial Payout",
              },
            },
          ],
        }),
      });
    });

    await page.route(/\/orders\/801\/readiness$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          orderId: 801,
          readiness: {
            workflowStatus: "approved",
            assessmentType: "detailed",
            assignedAt: new Date().toISOString(),
            responseDeadline: null,
            msRemaining: null,
          },
          customerRequirements: {
            productName: "Custom Jacket",
            productImage: null,
            quantity: 1,
            price: 80000,
            currency: "NGN",
            isCustomOrder: true,
            customisationData: { colour: "navy" },
            estimatedDelivery: null,
            rushOrder: false,
            shipping: { city: "Lagos", state: "LA", country: "NG" },
          },
          assessments: [
            {
              id: 3,
              version: 1,
              type: "detailed",
              status: "approved",
              payload: { estimatedMaterialCost: 15000, proposedProductionDays: 5 },
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

    await page.route(/\/orders\/801\/artisan-payout$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          orderId: 801,
          readinessWorkflowStatus: "approved",
          productionStartedAt: null,
          productionDeadline: null,
          customerPaymentStatus: "paid",
          startWork: {
            eligible: false,
            reason: "Transfers are recorded but not yet independently verified",
            code: "PAYOUT_NOT_VERIFIED",
            alreadyStarted: false,
          },
          limitPolicy: { configured: false, currencyRule: null },
          payout: {
            id: 1,
            status: "recorded",
            currency: "NGN",
            requestedAmount: 15000,
            approvedAmount: 12000,
            amountApprovedById: 1,
            amountApprovedAt: new Date().toISOString(),
            amountApprovalReason: null,
            exceptionApproved: true,
            exceptionReason: "policy missing",
            limitPolicyStatus: "missing",
            fundingRequired: true,
            disputeFlag: false,
            disputeNotes: null,
            verifiedTotal: 0,
            transfers: [
              {
                id: 55,
                amount: 12000,
                currency: "NGN",
                transferDate: new Date().toISOString(),
                payeeName: "Kemi Studio",
                payeeDetails: null,
                externalReference: "TRX-801-1",
                status: "recorded",
                recordedById: 1,
                recordedAt: new Date().toISOString(),
                verifiedById: null,
                verifiedAt: null,
                verificationNotes: null,
                rejectionReason: null,
                evidence: [],
              },
            ],
            events: [],
          },
        }),
      });
    });

    await page.goto("/admin/orders?readiness=1&orderId=801", { waitUntil: "domcontentloaded" });
    await page.getByTestId("admin-orders-section-readiness").click();
    await expect(page.getByTestId("admin-readiness-panel")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("admin-readiness-row-801").click();
    await expect(page.getByTestId("admin-payout-panel")).toBeVisible();
    await expect(page.getByTestId("admin-payout-requested")).toContainText("15,000");
    await expect(page.getByTestId("admin-payout-approved")).toContainText("12,000");
    await expect(page.getByTestId("admin-start-eligibility")).toContainText(/Not eligible/i);
    await expect(page.getByTestId("admin-payout-limit-missing")).toBeVisible();
    await expect(page.getByTestId("admin-payout-record-transfer")).toBeVisible();
    await expect(page.getByTestId("admin-payout-verify-55")).toBeVisible();
  });
});
