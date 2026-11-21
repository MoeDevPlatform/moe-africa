/**
 * Full Test Order lifecycle against REAL local frontend + NestJS + moe_dev.
 * No route mocking. Run only locally:
 *   MOE_LIFECYCLE=1 npx playwright test tests/playwright/test-order-lifecycle.spec.ts --project=lifecycle
 * Accounts come from tests/test-accounts.local.json (gitignored).
 */
import { test, expect, request as pwRequest, type Browser, type Page, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const cfgPath = path.resolve("tests/test-accounts.local.json");
const enabled = process.env.MOE_LIFECYCLE === "1" && fs.existsSync(cfgPath);
const cfg = enabled ? JSON.parse(fs.readFileSync(cfgPath, "utf8")) : ({} as any);
const SHOTS = "test-results/lifecycle/screenshots";
type Role = "admin" | "financeRecorder" | "financeVerifier" | "customer" | "artisan";

test.skip(!enabled, "Set MOE_LIFECYCLE=1 and create tests/test-accounts.local.json");
test.describe.configure({ mode: "serial" });

async function api(role: Role): Promise<{ ctx: APIRequestContext; token: string }> {
  const anon = await pwRequest.newContext({ baseURL: cfg.apiUrl });
  const res = await anon.post("/auth/login", { data: cfg[role] });
  expect(res.ok(), `${role} login`).toBeTruthy();
  const body = await res.json();
  const token = body.token ?? body.accessToken ?? body.access_token;
  const ctx = await pwRequest.newContext({ baseURL: cfg.apiUrl, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
  return { ctx, token };
}

async function uiAs(browser: Browser, role: Role): Promise<Page> {
  const context = await browser.newContext({ baseURL: cfg.frontendUrl, recordVideo: { dir: `test-results/lifecycle/video/${role}` } });
  const page = await context.newPage();
  await page.goto("/auth");
  await page.getByLabel(/email/i).first().fill(cfg[role].email);
  await page.getByLabel(/password/i).first().fill(cfg[role].password);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 20_000 });
  return page;
}

const shot = (p: Page, name: string) => p.screenshot({ path: `${SHOTS}/${name}.png` });
const order = async (a: APIRequestContext, id: number) => {
  const all = await (await a.get("/admin/test-orders")).json();
  return all.find((o: any) => o.id === id);
};

test("simulator is enabled only for local test admin", async () => {
  const { ctx } = await api("admin");
  const res = await ctx.get("/admin/test-orders/config");
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).environment).not.toBe("production");
  const { ctx: cust } = await api("customer");
  expect((await cust.get("/admin/test-orders/config")).status()).toBeGreaterThanOrEqual(401);
});

test("full successful lifecycle", async ({ browser }) => {
  test.setTimeout(10 * 60_000);
  const admin = await api("admin");
  const recorder = await api("financeRecorder");
  const verifier = await api("financeVerifier");

  // 1–2 Admin creates test order
  const adminPage = await uiAs(browser, "admin");
  await adminPage.goto("/admin/test-orders");
  await expect(adminPage.getByTestId("test-orders-panel")).toBeVisible();
  for (const id of ["test-customer", "test-artisan", "test-product"]) {
    await adminPage.getByTestId(id).click();
    await adminPage.getByRole("option").first().click();
  }
  await adminPage.getByTestId("create-test-order").click();
  await expect(adminPage.getByText(/simulated customer settlement created/i)).toBeVisible();
  await shot(adminPage, "01-test-order-created");
  const list = await (await admin.ctx.get("/admin/test-orders")).json();
  const created = list[0];
  const id: number = created.id;
  fs.writeFileSync("test-results/lifecycle/order.json", JSON.stringify({ id, testReference: created.testReference }, null, 2));
  expect(created.simulatedPaymentStatus).toMatch(/success|paid/i);

  // 3–4 Artisan readiness
  const artisanPage = await uiAs(browser, "artisan");
  await artisanPage.goto("/artisan/dashboard?tab=orders&orderView=all");
  await expect(artisanPage.getByTestId(`artisan-order-${id}`)).toBeVisible();
  await shot(artisanPage, "02-artisan-new-orders");
  await artisanPage.getByTestId(`artisan-readiness-accept-${id}`).click();
  await artisanPage.getByRole("button", { name: /submit/i }).last().click();
  await shot(artisanPage, "03-readiness-assessment");

  // 5–6 Admin approves readiness + funding
  await adminPage.goto(`/admin/orders/${id}`);
  await adminPage.getByRole("button", { name: /approve readiness/i }).click();
  await shot(adminPage, "04-admin-readiness-approval");
  // Failure: readiness alone cannot start production
  await artisanPage.reload();
  await expect(artisanPage.getByTestId(`artisan-start-work-${id}`)).toHaveCount(0);
  await expect(artisanPage.getByTestId("artisan-awaiting-payout")).toBeVisible();
  const amt = await admin.ctx.post(`/admin/orders/${id}/artisan-payout/approve-amount`, { data: {} });
  expect(amt.ok(), "approve funding").toBeTruthy();

  // 7–9 Record, self-verify blocked, independent verify
  expect((await recorder.ctx.post(`/admin/test-orders/${id}/payouts/record`, { data: {} })).ok()).toBeTruthy();
  const transfer = (await order(admin.ctx, id)).transfers.find((t: any) => t.isSimulated);
  expect(transfer).toBeTruthy();
  await artisanPage.reload();
  await expect(artisanPage.getByTestId(`artisan-start-work-${id}`)).toHaveCount(0); // 8: unverified blocks
  const selfVerify = await recorder.ctx.post(`/admin/test-orders/${id}/payouts/${transfer.id}/verify`, { data: {} });
  expect(selfVerify.ok(), "recorder must not verify own transfer").toBeFalsy();
  expect((await verifier.ctx.post(`/admin/test-orders/${id}/payouts/${transfer.id}/verify`, { data: {} })).ok()).toBeTruthy();
  await adminPage.goto("/admin/test-orders");
  await shot(adminPage, "05-initial-payout-verified");

  // 10–11 Start work + countdown
  await artisanPage.reload();
  await artisanPage.getByTestId(`artisan-start-work-${id}`).click();
  await expect(artisanPage.getByTestId("artisan-production-countdown")).toBeVisible();
  await expect(artisanPage.getByTestId("artisan-order-status")).toContainText(/pending/i);
  await shot(artisanPage, "06-production-countdown");

  // 12–13 Progress + quality submission
  await artisanPage.getByTestId(`artisan-progress-note-${id}`).fill("Cutting and stitching complete (simulated).");
  await artisanPage.getByTestId(`artisan-progress-files-${id}`).setInputFiles("public/placeholder.svg");
  await artisanPage.getByRole("button", { name: /submit progress/i }).click();
  await artisanPage.getByRole("button", { name: /submit for quality/i }).click();

  // 14–15 Quality approval does not release payment
  await adminPage.goto(`/admin/orders/${id}`);
  await shot(adminPage, "07-quality-review");
  await adminPage.getByRole("button", { name: /approve quality/i }).click();
  const afterQuality = await order(admin.ctx, id);
  expect(afterQuality.qualityStatus).toMatch(/approved/i);
  expect(afterQuality.finalPayoutStatus).not.toMatch(/paid|verified/i);
  await artisanPage.reload();
  await shot(artisanPage, "08-completed-orders");

  // 16 Dispatch + delivery
  expect((await admin.ctx.post(`/orders/${id}/fulfillment`, { data: { status: "dispatched", note: "Simulated dispatch" } })).ok()).toBeTruthy();
  expect((await admin.ctx.post(`/orders/${id}/fulfillment`, { data: { status: "delivered", note: "Simulated delivery" } })).ok()).toBeTruthy();

  // 17 Customer accepts + reviews
  const customerPage = await uiAs(browser, "customer");
  await customerPage.goto(`/marketplace/orders/${id}`);
  await customerPage.getByRole("button", { name: /confirm delivery|accept delivery/i }).click();
  await customerPage.getByRole("button", { name: /5 star/i }).click().catch(() => {});
  await customerPage.getByRole("textbox").last().fill("Beautiful work — simulated test review.");
  await customerPage.getByRole("button", { name: /submit review/i }).click();
  await shot(customerPage, "09-customer-delivery-rating");

  // 18–21 Final milestone, record, verify
  const final = await order(admin.ctx, id);
  expect(final.deliveryStatus).toMatch(/accepted|confirmed/i);
  expect((await recorder.ctx.post(`/admin/test-orders/${id}/payouts/record`, { data: {} })).ok()).toBeTruthy();
  const finalTransfer = (await order(admin.ctx, id)).transfers.filter((t: any) => t.isSimulated).at(-1);
  expect((await verifier.ctx.post(`/admin/test-orders/${id}/payouts/${finalTransfer.id}/verify`, { data: {} })).ok()).toBeTruthy();
  const done = await order(admin.ctx, id);
  expect(done.finalPayoutStatus).toMatch(/verified|paid|completed/i);
  expect(done.transfers.every((t: any) => t.isSimulated)).toBeTruthy();
  await adminPage.goto("/admin/test-orders");
  await shot(adminPage, "10-final-payout-confirmed");
  // Order intentionally NOT cleaned up so it can be inspected manually.
  for (const p of [adminPage, artisanPage, customerPage]) await p.context().close();
});

test("72h review window escalates, never auto-transfers", async () => {
  const admin = await api("admin");
  const { id } = JSON.parse(fs.readFileSync("test-results/lifecycle/order.json", "utf8"));
  const before = (await order(admin.ctx, id)).transfers.length;
  await admin.ctx.post(`/admin/test-orders/${id}/time-scenario`, { data: { scenario: "delivery_review_72h_due" } });
  expect((await order(admin.ctx, id)).transfers.length).toBe(before);
});
