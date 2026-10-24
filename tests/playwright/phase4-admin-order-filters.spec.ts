import { test, expect, type Page, type Response } from "@playwright/test";
import { adminLogin } from "../helpers/authFlows";

function isLocalBase(): boolean {
  const base = process.env.PLAYWRIGHT_BASE_URL || "";
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
}

function isLocalApi(url: string, pathname: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.port === "3000" && parsed.pathname === pathname;
  } catch {
    return false;
  }
}

async function orderList(
  page: Page,
  predicate: (url: URL) => boolean,
): Promise<Response> {
  return page.waitForResponse((response) => {
    if (response.request().method() !== "GET" || !isLocalApi(response.url(), "/admin/orders")) return false;
    return predicate(new URL(response.url()));
  });
}

test.describe("Phase 4 admin order filters (local)", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    test.skip(
      !isLocalBase(),
      "Refusing admin order filter suite unless PLAYWRIGHT_BASE_URL is localhost.",
    );
  });

  test("admin orders combine status, payment, and search, then clear", async ({ page }) => {
    await adminLogin(page);

    const initial = orderList(page, (url) => !url.searchParams.get("status") && !url.searchParams.get("paymentStatus"));
    await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    const initialRes = await initial;
    expect(initialRes.ok()).toBeTruthy();
    const initialBody = await initialRes.json();
    expect(initialBody.pagination.totalItems).toBe(4);
    await expect(page.getByRole("heading", { name: "ORD-002" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ORD-001" })).toBeVisible();

    const pending = orderList(page, (url) => url.searchParams.get("status") === "pending" && !url.searchParams.get("paymentStatus"));
    await page.getByTestId("admin-order-status").click();
    await page.getByRole("option", { name: "pending", exact: true }).click();
    const pendingRes = await pending;
    expect(pendingRes.ok()).toBeTruthy();
    const pendingBody = await pendingRes.json();
    expect(pendingBody.pagination.totalItems).toBe(3);
    for (const row of pendingBody.data ?? []) expect(row.status).toBe("pending");
    await expect(page.getByRole("heading", { name: "ORD-002" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "ORD-004" })).toBeVisible();

    const cancelledUnpaid = orderList(
      page,
      (url) => url.searchParams.get("status") === "cancelled" && url.searchParams.get("paymentStatus") === "unpaid",
    );
    await page.getByTestId("admin-order-status").click();
    await page.getByRole("option", { name: "cancelled", exact: true }).click();
    await page.getByTestId("admin-order-payment").click();
    await page.getByRole("option", { name: "unpaid", exact: true }).click();
    const emptyRes = await cancelledUnpaid;
    const emptyBody = await emptyRes.json();
    expect(emptyBody.pagination.totalItems).toBe(0);
    await expect(page.getByText("No orders found.")).toBeVisible();

    const refunded = orderList(
      page,
      (url) => url.searchParams.get("status") === "cancelled" && url.searchParams.get("paymentStatus") === "refunded",
    );
    await page.getByTestId("admin-order-payment").click();
    await page.getByRole("option", { name: "refunded", exact: true }).click();
    const refundedRes = await refunded;
    const refundedBody = await refundedRes.json();
    expect(refundedBody.pagination.totalItems).toBe(1);
    expect(refundedBody.data[0].status).toBe("cancelled");
    expect(refundedBody.data[0].paymentStatus).toBe("refunded");
    await expect(page.getByRole("heading", { name: "ORD-002" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ORD-001" })).toHaveCount(0);

    const searched = orderList(
      page,
      (url) =>
        url.searchParams.get("q") === "Ankara" &&
        url.searchParams.get("status") === "cancelled" &&
        url.searchParams.get("paymentStatus") === "refunded",
    );
    await page.getByTestId("admin-order-search").fill("Ankara");
    const searchedRes = await searched;
    const searchedBody = await searchedRes.json();
    expect(searchedBody.pagination.totalItems).toBe(1);
    expect(searchedBody.data[0].productName).toContain("Ankara");

    const missing = orderList(page, (url) => url.searchParams.get("q") === "no-such-order-xyz");
    await page.getByTestId("admin-order-search").fill("no-such-order-xyz");
    const missingRes = await missing;
    const missingBody = await missingRes.json();
    expect(missingBody.pagination.totalItems).toBe(0);
    await expect(page.getByText("No orders found.")).toBeVisible();

    const restored = orderList(page, (url) => !url.searchParams.get("status") && !url.searchParams.get("paymentStatus") && !url.searchParams.get("q"));
    await page.getByTestId("admin-order-clear").click();
    const restoredRes = await restored;
    const restoredBody = await restoredRes.json();
    expect(restoredBody.pagination.totalItems).toBe(4);
    await expect(page.getByTestId("admin-order-search")).toHaveValue("");
    await expect(page.getByRole("heading", { name: "ORD-002" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ORD-001" })).toBeVisible();
  });

  test("admin custom orders filter the loaded list by status and search", async ({ page }) => {
    await adminLogin(page);
    const loaded = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" && isLocalApi(response.url(), "/admin/custom-orders"),
    );
    await page.goto("/admin/custom-orders", { waitUntil: "domcontentloaded" });
    const loadedRes = await loaded;
    expect(loadedRes.ok()).toBeTruthy();
    const loadedBody = await loadedRes.json();
    expect(loadedBody.total).toBe(3);
    await expect(page.getByText("Phase3 CO")).toBeVisible();
    await expect(page.getByText("Short custom order", { exact: true })).toBeVisible();
    await expect(page.getByText("Short ok desc", { exact: true })).toBeVisible();

    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "pending", exact: true }).click();
    await expect(page.getByText("Phase3 CO")).toBeVisible();
    await expect(page.getByText("Short ok desc", { exact: true })).toBeVisible();

    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "accepted", exact: true }).click();
    await expect(page.getByText("No custom orders match these filters.")).toBeVisible();
    await expect(page.getByText("Phase3 CO")).toHaveCount(0);

    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "All statuses" }).click();
    await page.getByTestId("admin-custom-order-search").fill("Phase3");
    await expect(page.getByText("Phase3 CO")).toBeVisible();
    await expect(page.getByText("Short custom order", { exact: true })).toBeVisible();
    await expect(page.getByText("Short ok desc", { exact: true })).toBeVisible();

    await page.getByTestId("admin-custom-order-search").fill("silk wrap");
    await expect(page.getByText("Phase3 CO")).toBeVisible();
    await expect(page.getByText("Short custom order", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Short ok desc", { exact: true })).toHaveCount(0);

    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "pending", exact: true }).click();
    await expect(page.getByText("Phase3 CO")).toBeVisible();
    await expect(page.getByText("Short ok desc", { exact: true })).toHaveCount(0);

    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "accepted", exact: true }).click();
    await expect(page.getByText("No custom orders match these filters.")).toBeVisible();
    await expect(page.getByText("Phase3 CO")).toHaveCount(0);
    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "pending", exact: true }).click();

    await page.getByTestId("admin-custom-order-search").fill("no-such-custom-order");
    await expect(page.getByText("No custom orders match these filters.")).toBeVisible();

    await page.getByTestId("admin-custom-order-search").fill("");
    await page.getByTestId("admin-custom-order-status").click();
    await page.getByRole("option", { name: "All statuses" }).click();
    await expect(page.getByText("Phase3 CO")).toBeVisible();
    await expect(page.getByText("Short custom order", { exact: true })).toBeVisible();
    await expect(page.getByText("Short ok desc", { exact: true })).toBeVisible();
  });
});
