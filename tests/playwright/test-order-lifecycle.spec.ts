/**
 * Verified, real API-backed local simulator lifecycle.
 * No API mocks. Credentials come only from the gitignored backend
 * .env.simulator.local file sourced by the runbook command.
 */
import { expect, request as playwrightRequest, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { PrismaClient } = createRequire(import.meta.url)(path.resolve(process.env.SIM_BACKEND_PATH || path.resolve(process.cwd(), "../moe-backend"), "node_modules/@prisma/client"));

const WEB = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8080";
const API = process.env.SIM_API_BASE_URL || "http://127.0.0.1:3000";
const ARTIFACTS = process.env.SIM_ARTIFACT_DIR || path.resolve(process.cwd(), "test-results/lifecycle");

type Session = {
  browser: BrowserContext;
  page: Page;
  api: APIRequestContext;
  user: Record<string, unknown>;
};

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required local simulator variable ${name}`);
  return value;
};

async function body(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  const text = await response.text();
  let parsed: any = undefined;
  try { parsed = text ? JSON.parse(text) : undefined; } catch { parsed = text; }
  return { response, parsed, text };
}

async function ok(response: Awaited<ReturnType<APIRequestContext["get"]>>, label: string) {
  const result = await body(response);
  expect(response.ok(), `${label}: HTTP ${response.status()} ${result.text}`).toBeTruthy();
  return result.parsed;
}

async function session(browser: Browser, email: string, password: string, role: string): Promise<Session> {
  const loginApi = await playwrightRequest.newContext({ baseURL: API });
  const login = await ok(await loginApi.post("/auth/login", { data: { email, password } }), `${role} login`);
  await loginApi.dispose();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: path.join(ARTIFACTS, "videos"), size: { width: 1280, height: 900 } },
  });
  await context.addInitScript((auth) => {
    localStorage.setItem("moe_access_token", auth.token);
    localStorage.setItem("moe_refresh_token", auth.refreshToken);
    localStorage.setItem("moe_user", JSON.stringify(auth.user));
  }, login);
  const api = await playwrightRequest.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${login.token}` },
  });
  const page = await context.newPage();
  return { browser: context, page, api, user: login.user };
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS, name), fullPage: true });
}

test.describe("real safe test-order lifecycle", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test("enacts the complete workflow without API mocks or real money", async ({ browser }) => {
    test.skip(!/^(http:\/\/)(localhost|127\.0\.0\.1)/.test(WEB), "Local isolated stack only");
    await mkdir(path.join(ARTIFACTS, "videos"), { recursive: true });

    const prisma = new PrismaClient();
    const admin = await session(browser, required("SIM_ADMIN_EMAIL"), required("SIM_ADMIN_PASSWORD"), "admin");
    const recorder = await session(browser, required("SIM_RECORDER_EMAIL"), required("SIM_RECORDER_PASSWORD"), "finance recorder");
    const verifier = await session(browser, required("SIM_VERIFIER_EMAIL"), required("SIM_VERIFIER_PASSWORD"), "finance verifier");
    const artisan = await session(browser, required("SIM_ARTISAN_EMAIL"), required("SIM_ARTISAN_PASSWORD"), "artisan");
    const customer = await session(browser, required("SIM_CUSTOMER_EMAIL"), required("SIM_CUSTOMER_PASSWORD"), "customer");
    const sessions = [admin, recorder, verifier, artisan, customer];

    let orderId = 0;
    let testReference = "";
    try {
      // Admin uses the real simulator UI to create the order and simulated settlement.
      await admin.page.goto(`${WEB}/admin/test-orders`, { waitUntil: "domcontentloaded" });
      await expect(admin.page.getByTestId("test-orders-panel")).toBeVisible({ timeout: 30_000 });
      await admin.page.getByTestId("test-customer").click();
      await admin.page.getByRole("option", { name: new RegExp(required("SIM_CUSTOMER_EMAIL"), "i") }).click();
      await admin.page.getByTestId("test-artisan").click();
      await admin.page.getByRole("option", { name: /MOE Simulator Studio/i }).click();
      await admin.page.getByTestId("test-product").click();
      await admin.page.getByRole("option", { name: /MOE Simulator Test Garment/i }).click();
      const createdResponse = admin.page.waitForResponse((r) => {
        const url = new URL(r.url());
        return r.request().method() === "POST" && url.pathname === "/admin/test-orders";
      });
      await admin.page.getByTestId("create-test-order").click();
      const created = await ok(await createdResponse, "create simulated order");
      orderId = Number(created.id);
      testReference = String(created.testReference);
      expect(orderId).toBeGreaterThan(0);
      await expect(admin.page.getByText(testReference)).toBeVisible({ timeout: 30_000 });
      await shot(admin.page, "01-test-order-created.png");

      let dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { simulatedSettlement: true } });
      expect(dbOrder.isTestOrder).toBe(true);
      expect(dbOrder.paymentStatus).toBe("paid");
      expect(dbOrder.paymentReference).toBeNull();
      expect(dbOrder.simulatedSettlement?.status).toBe("succeeded");
      expect(await prisma.paymentAttempt.count({ where: { orderId } })).toBe(0);

      // Artisan New Orders and real readiness submission.
      await artisan.page.goto(`${WEB}/artisan/dashboard?tab=orders&orderView=new`, { waitUntil: "domcontentloaded" });
      await expect(artisan.page.getByTestId(`artisan-order-${orderId}`)).toBeVisible({ timeout: 30_000 });
      await shot(artisan.page, "02-artisan-new-orders.png");
      const readiness = await ok(await artisan.api.post(`/orders/${orderId}/readiness/assessments`, {
        data: {
          acknowledgedRequirements: true,
          payload: {
            productAvailable: true,
            exactSpecMatch: true,
            quantityConfirmed: true,
            canFulfil: true,
            estimatedDispatchDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          },
        },
      }), "submit readiness");
      const assessmentId = Number(readiness.id);
      await artisan.page.reload({ waitUntil: "domcontentloaded" });
      await shot(artisan.page, "03-readiness-assessment.png");

      // Admin approval alone must not unlock production.
      await ok(await admin.api.post(`/admin/orders/${orderId}/readiness/assessments/${assessmentId}/decide`, {
        data: { decision: "approve", reason: "Dedicated simulator fixture is ready" },
      }), "approve readiness");
      const earlyStart = await artisan.api.post(`/orders/${orderId}/start-work`);
      expect(earlyStart.ok()).toBeFalsy();
      await admin.page.goto(`${WEB}/admin/orders?readiness=1&orderId=${orderId}`, { waitUntil: "domcontentloaded" });
      await shot(admin.page, "04-admin-readiness-approved.png");

      // Amount approval, recording, self-verification rejection, then independent verification.
      await ok(await admin.api.post(`/admin/orders/${orderId}/artisan-payout/approve-amount`, {
        data: { approvedAmount: 15000, currency: "NGN", reason: "Simulated initial material funding" },
      }), "approve initial funding");
      const unverifiedStart = await artisan.api.post(`/orders/${orderId}/start-work`);
      expect(unverifiedStart.ok()).toBeFalsy();
      const initialTransfer = await ok(await recorder.api.post(`/admin/test-orders/${orderId}/payouts/record`, {
        data: { amount: 15000 },
      }), "record simulated initial payout");
      const selfVerify = await recorder.api.post(`/admin/test-orders/${orderId}/payouts/${initialTransfer.id}/verify`);
      expect(selfVerify.ok()).toBeFalsy();
      await ok(await verifier.api.post(`/admin/test-orders/${orderId}/payouts/${initialTransfer.id}/verify`), "independently verify initial payout");
      const verifiedInitial = await prisma.orderArtisanPayoutTransfer.findUniqueOrThrow({ where: { id: Number(initialTransfer.id) } });
      expect(verifiedInitial.isSimulated).toBe(true);
      expect(verifiedInitial.status).toBe("verified");
      expect(verifiedInitial.recordedById).not.toBe(verifiedInitial.verifiedById);
      await verifier.page.goto(`${WEB}/admin/test-orders`, { waitUntil: "domcontentloaded" });
      await shot(verifier.page, "05-initial-payout-verified.png");

      // Start production, countdown, and progress update.
      await ok(await artisan.api.post(`/orders/${orderId}/start-work`), "start work");
      await ok(await artisan.api.post(`/orders/${orderId}/production/progress`, {
        data: { note: "Cutting and assembly completed in the isolated simulator", percentComplete: 70 },
      }), "submit production progress");
      await artisan.page.goto(`${WEB}/artisan/dashboard?tab=orders&orderView=pending`, { waitUntil: "domcontentloaded" });
      await expect(artisan.page.getByTestId("artisan-production-countdown")).toBeVisible({ timeout: 30_000 });
      await shot(artisan.page, "06-production-countdown.png");

      // Local storage is intentionally disabled. Add marked test-only evidence in DB,
      // equivalent to the backend integration fixture, then use the real review API.
      const submission = await prisma.orderQualitySubmission.create({
        data: {
          orderId,
          version: 1,
          artisanId: Number(required("SIM_ARTISAN_ID")),
          status: "submitted",
          description: "TEST ORDER finished garment ready for quality review",
          specsConfirmed: true,
          evidence: { create: {
            attachmentPublicId: `test-simulation/${orderId}/quality`,
            attachmentResourceType: "image",
            attachmentName: "SAMPLE-quality-evidence.jpg",
            attachmentMimeType: "image/jpeg",
            attachmentBytes: 0,
            attachmentKind: "image",
          } },
        },
      });
      await prisma.order.update({ where: { id: orderId }, data: { qualityReviewStatus: "submitted", qualitySubmittedAt: new Date() } });
      await admin.page.goto(`${WEB}/admin/orders?production=1&quality=1&orderId=${orderId}`, { waitUntil: "domcontentloaded" });
      await shot(admin.page, "07-quality-review.png");
      const payoutBeforeQuality = await prisma.orderArtisanPayout.findUniqueOrThrow({ where: { orderId } });
      await ok(await admin.api.post(`/admin/orders/${orderId}/quality/submissions/${submission.id}/decide`, { data: { decision: "approve" } }), "approve quality");
      const payoutAfterQuality = await prisma.orderArtisanPayout.findUniqueOrThrow({ where: { orderId } });
      expect(payoutAfterQuality.status).toBe(payoutBeforeQuality.status);
      dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(dbOrder.status).toBe("ready");
      expect(dbOrder.fulfillmentStatus).toBe("ready_for_delivery");
      expect(dbOrder.finalPayoutReviewEligible).toBe(false);
      await artisan.page.goto(`${WEB}/artisan/dashboard?tab=orders&orderView=completed`, { waitUntil: "domcontentloaded" });
      await shot(artisan.page, "08-completed-orders.png");

      // Dispatch/delivery. Final milestone stays blocked until eligibility.
      await ok(await artisan.api.post(`/orders/${orderId}/fulfillment`, { data: { status: "dispatched", note: "TEST ORDER dispatch" } }), "dispatch");
      await ok(await artisan.api.post(`/orders/${orderId}/fulfillment`, { data: { status: "delivered", note: "TEST ORDER delivered" } }), "deliver");
      await ok(await admin.api.post(`/admin/orders/${orderId}/artisan-payout/total-payable`, {
        data: { totalPayableAmount: 40000, reason: "Simulated lifecycle total" },
      }), "set total payable");
      const finalMilestone = await ok(await admin.api.post(`/admin/orders/${orderId}/artisan-payout/milestones`, {
        data: { kind: "final", name: "Simulated final balance", approvedAmount: 25000, currency: "NGN" },
      }), "create final milestone");
      const blockedFinal = await admin.api.post(`/admin/orders/${orderId}/artisan-payout/milestones/${finalMilestone.id}/eligible`);
      expect(blockedFinal.ok()).toBeFalsy();

      // Controlled 72-hour window may escalate eligibility, but must never transfer money.
      const transfersBeforeWindow = await prisma.orderArtisanPayoutTransfer.count({ where: { payout: { orderId } } });
      await ok(await admin.api.post(`/admin/test-orders/${orderId}/time-scenario`, { data: { scenario: "delivery_review_72h_due" } }), "apply 72-hour scenario");
      await ok(await admin.api.post("/admin/orders/delivery/process-review-windows", { data: {} }), "process 72-hour windows");
      expect(await prisma.orderArtisanPayoutTransfer.count({ where: { payout: { orderId } } })).toBe(transfersBeforeWindow);

      // Customer accepts and reviews using the real customer API and UI.
      await ok(await customer.api.post(`/orders/${orderId}/delivery/accept`, { data: {} }), "accept delivery");
      await ok(await customer.api.post(`/orders/${orderId}/review`, { data: { rating: 5, review: "Excellent simulated lifecycle test" } }), "submit review");
      await customer.page.goto(`${WEB}/marketplace/orders/${orderId}`, { waitUntil: "domcontentloaded" });
      await shot(customer.page, "09-customer-acceptance-rating.png");
      dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(dbOrder.fulfillmentStatus).toBe("customer_accepted");
      expect(dbOrder.finalPayoutReviewEligible).toBe(true);
      expect(dbOrder.customerRating).toBe(5);

      // Finance records the final simulated milestone; verifier independently confirms it.
      await ok(await admin.api.post(`/admin/orders/${orderId}/artisan-payout/milestones/${finalMilestone.id}/eligible`), "mark final milestone eligible");
      const finalTransfer = await ok(await recorder.api.post(`/admin/orders/${orderId}/artisan-payout/milestones/${finalMilestone.id}/transfers`, {
        data: {
          amount: 25000,
          currency: "NGN",
          transferDate: new Date().toISOString(),
          payeeName: "TEST ARTISAN — NO REAL PAYEE",
          payeeDetails: "SIMULATED PAYMENT — NO BANK ACCOUNT",
          externalReference: `SIM-FINAL-${orderId}-${Date.now()}`,
        },
      }), "record simulated final payout");
      await prisma.orderArtisanPayoutEvidence.create({ data: {
        transferId: Number(finalTransfer.id),
        attachmentPublicId: `test-simulation/${finalTransfer.id}`,
        attachmentResourceType: "raw",
        attachmentName: "SIMULATED-FINAL-PAYOUT.txt",
        attachmentMimeType: "text/plain",
        attachmentBytes: 0,
        attachmentKind: "document",
      } });
      const recorderFinalVerify = await recorder.api.post(`/admin/orders/${orderId}/artisan-payout/transfers/${finalTransfer.id}/verify-milestone`, { data: { notes: "self verification must fail" } });
      expect(recorderFinalVerify.ok()).toBeFalsy();
      await ok(await verifier.api.post(`/admin/orders/${orderId}/artisan-payout/transfers/${finalTransfer.id}/verify-milestone`, { data: { notes: "Independent simulated final payout verification" } }), "verify simulated final payout");
      const finalRow = await prisma.orderArtisanPayoutMilestone.findUniqueOrThrow({ where: { id: Number(finalMilestone.id) }, include: { transfers: true } });
      expect(finalRow.status).toBe("verified");
      expect(finalRow.transfers).toHaveLength(1);
      expect(finalRow.transfers[0].status).toBe("verified");
      expect(finalRow.transfers[0].isSimulated).toBe(true);
      expect(finalRow.transfers[0].recordedById).not.toBe(finalRow.transfers[0].verifiedById);
      await verifier.page.goto(`${WEB}/admin/test-orders`, { waitUntil: "domcontentloaded" });
      await shot(verifier.page, "10-final-payout-confirmation.png");

      console.log(`SIMULATOR_RESULT orderId=${orderId} testReference=${testReference}`);
    } finally {
      await prisma.$disconnect();
      for (const value of sessions) {
        await value.api.dispose();
        await value.browser.close();
      }
    }
  });
});
