import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { adminLogin } from "../helpers/authFlows";

const API = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:3000";
const CUSTOMER = { email: "phase3.customer@local.test", password: "password123" };
const OWNER = { email: "phase2.artisan@local.test", password: "password123" };
const OTHER = { email: "phase3.artisan@local.test", password: "password123" };
const PRODUCT_ID = 72;

function isLocalBase(): boolean {
  const base = process.env.PLAYWRIGHT_BASE_URL || "";
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
}

async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `${email} login ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(typeof body.token).toBe("string");
  return body.token as string;
}

async function uiLogin(page: Page, email: string, password: string) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  const login = page.waitForResponse(
    (res) => res.url().includes("/auth/login") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const res = await login;
  expect(res.ok(), `login ${res.status()}`).toBeTruthy();
  await page.waitForURL(/marketplace|artisan/, { timeout: 30_000 });
}

test.describe("Phase 5 curation and artisan orders (local)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    test.skip(!isLocalBase(), "Refusing Phase 5 suite unless PLAYWRIGHT_BASE_URL is localhost.");
  });

  test("curation pickers show the product artisan and add that product", async ({ page }) => {
    await adminLogin(page);
    const sections = ["featured_picks", "featured_styles", "seasonal_picks"];

    for (const section of sections) {
      await page.goto(`/admin/sections/${section}`, { waitUntil: "domcontentloaded" });
      const ankara = page.locator('[data-testid="search-result"][data-product-id="1"]');
      const emeka = page.locator('[data-testid="search-result"][data-product-id="25"]');
      await ankara.scrollIntoViewIfNeeded();
      await expect(ankara.getByTestId("curation-product-name")).toHaveText("Ankara Midi Dress");
      await expect(ankara.getByTestId("curation-artisan-name")).toHaveText("My Business");
      await emeka.scrollIntoViewIfNeeded();
      await expect(emeka.getByTestId("curation-product-name")).toHaveText("Emeka Dress");
      await expect(emeka.getByTestId("curation-artisan-name")).toHaveText("Emeka Artisan");
    }

    await page.goto("/admin/sections/featured_picks", { waitUntil: "domcontentloaded" });
    const searched = page.waitForResponse(
      (res) => res.request().method() === "GET" && new URL(res.url()).port === "3000" && new URL(res.url()).pathname === "/search",
    );
    await page.getByTestId("product-search").fill("Emeka Dress");
    await page.getByTestId("search-btn").click();
    const searchRes = await searched;
    expect(searchRes.ok()).toBeTruthy();
    const searchBody = await searchRes.json();
    const match = (searchBody.products ?? []).find((row: { id: number }) => row.id === 25);
    expect(match?.artisanName).toBe("Emeka Artisan");
    const result = page.locator('[data-testid="search-result"][data-product-id="25"]');
    await expect(result.getByTestId("curation-artisan-name")).toHaveText("Emeka Artisan");

    const added = page.waitForResponse(
      (res) => res.request().method() === "POST" && new URL(res.url()).pathname === "/admin/sections/featured_picks/items",
    );
    await result.getByTestId("add-to-section").click();
    const addedRes = await added;
    expect(addedRes.ok()).toBeTruthy();
    const payload = addedRes.request().postDataJSON() as { itemType?: string; itemId?: string };
    expect(payload.itemType).toBe("product");
    expect(String(payload.itemId)).toBe("25");
    await expect(page.getByTestId("curated-items").getByTestId("curation-product-name")).toHaveCount(0);
    await expect(page.getByTestId("curated-items")).toContainText("Emeka Dress");
    await expect(page.getByTestId("curated-artisan-name")).toHaveText("Emeka Artisan");

    const removed = page.waitForResponse(
      (res) => res.request().method() === "DELETE" && res.url().includes("/admin/sections/featured_picks/items/"),
    );
    await page.getByTestId("remove-section-item-25").click();
    const removedRes = await removed;
    expect(removedRes.ok()).toBeTruthy();
    await expect(page.getByText("No curated items yet")).toBeVisible();
  });

  test("pending card, order filters, status persistence, and ownership", async ({ page, request }) => {
    const customerToken = await apiLogin(request, CUSTOMER.email, CUSTOMER.password);
    const created = await request.post(`${API}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [{ productId: String(PRODUCT_ID), quantity: 1 }],
        shippingAddress: {
          firstName: "Phase",
          lastName: "Customer",
          phone: "08012345678",
          address: "1 Local Street",
          country: "Nigeria",
          state: "Lagos",
          city: "Lagos",
        },
        paymentMethod: "bank_transfer",
      },
    });
    expect(created.ok(), `create order ${created.status()} ${await created.text()}`).toBeTruthy();
    const order = await created.json();
    const orderId = String(order.id);
    expect(order.status).toBe("pending");
    expect(order.providerId).toBe(14);

    const ownerToken = await apiLogin(request, OWNER.email, OWNER.password);
    const before = await request.get(`${API}/orders?pageSize=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(before.ok()).toBeTruthy();
    const beforeSummary = (await before.json()).summary as { new: number; pending: number };
    const expectedPending = beforeSummary.pending;
    const expectedNew = beforeSummary.new;

    await uiLogin(page, OWNER.email, OWNER.password);
    await page.goto("/artisan/dashboard", { waitUntil: "domcontentloaded" });
    const pendingCard = page.getByTestId("artisan-pending-orders");
    await expect(pendingCard).toContainText("Pending Orders");
    await expect(pendingCard).toContainText(String(expectedPending));

    await pendingCard.click();
    await expect(page).toHaveURL(/tab=orders/);
    await expect(page).toHaveURL(/orderView=pending/);
    await expect(page.getByTestId("artisan-order-filter-pending")).toHaveAttribute("aria-pressed", "true");
    const pendingRow = page.getByTestId(`artisan-order-${orderId}`);
    await expect(pendingRow).toContainText("Phase2 API Variation Probe");
    await expect(pendingRow.getByTestId("artisan-order-status")).toHaveText(/pending/i);
    await expect(page.getByTestId("artisan-order-filter-pending")).toContainText(`(${expectedPending})`);

    await page.getByTestId("artisan-order-filter-new").click();
    await expect(page).toHaveURL(/orderView=new/);
    const row = page.getByTestId(`artisan-order-${orderId}`);
    await expect(row).toContainText("Phase2 API Variation Probe");
    await expect(row.getByTestId("artisan-order-status")).toHaveText(/pending/i);
    await expect(page.getByTestId("artisan-order-filter-new")).toContainText(`(${expectedNew})`);

    const patched = page.waitForResponse(
      (res) => res.request().method() === "PATCH" && new URL(res.url()).pathname === `/orders/${orderId}/status`,
    );
    await page.getByTestId(`artisan-order-next-${orderId}`).click();
    await page.getByRole("option", { name: "confirmed", exact: true }).click();
    const patchedRes = await patched;
    expect(patchedRes.ok()).toBeTruthy();
    expect(patchedRes.request().postDataJSON()).toEqual({ status: "confirmed" });
    expect((await patchedRes.json()).status).toBe("confirmed");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/orderView=new/);
    await expect(page.getByTestId(`artisan-order-${orderId}`)).toHaveCount(0);
    await expect(page.getByTestId("artisan-order-filter-new")).toContainText(`(${expectedNew - 1})`);
    await expect(pendingCard).toContainText(String(expectedPending));
    await page.getByTestId("artisan-order-filter-pending").click();
    await expect(page).toHaveURL(/orderView=pending/);
    await expect(page.getByTestId("artisan-order-filter-pending")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId(`artisan-order-${orderId}`).getByTestId("artisan-order-status")).toHaveText(/confirmed/i);
    await expect(page.getByTestId("artisan-order-filter-pending")).toContainText(`(${expectedPending})`);

    const otherToken = await apiLogin(request, OTHER.email, OTHER.password);
    const foreignList = await request.get(`${API}/orders?pageSize=100`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(foreignList.ok()).toBeTruthy();
    const foreignBody = await foreignList.json();
    expect((foreignBody.data ?? []).map((row: { id: number }) => String(row.id))).not.toContain(orderId);
    expect(foreignBody.summary.all).toBe(0);
    const foreignPatch = await request.patch(`${API}/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${otherToken}` },
      data: { status: "in_progress" },
    });
    expect(foreignPatch.status()).toBe(403);
    const still = await request.get(`${API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${await apiLogin(request, OWNER.email, OWNER.password)}` },
    });
    expect(still.ok()).toBeTruthy();
    expect((await still.json()).status).toBe("confirmed");
  });
});
