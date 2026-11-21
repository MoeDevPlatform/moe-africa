import { expect, test } from "@playwright/test";
import { authenticateOrderUi, skipUnlessLocalOrCiApp } from "../helpers/orderUiAuth";

test.describe("safe test order simulator UI", () => {
  test.beforeEach(() => test.skip(skipUnlessLocalOrCiApp(), "Local/CI app only"));

  test("shows persistent simulation labels and existing-dashboard actions at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await authenticateOrderUi(page, { role: "admin", email: "sim.admin@local.test", password: "password123" });
    await page.route(/\/admin\/test-orders(\/.*)?(\?.*)?$/, async (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/config")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enabled: true, environment: "test", database: "moe_dev" }) });
      if (path.endsWith("/options")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ customers: [{ id: 20, name: "TEST Customer", email: "customer@test.local" }], artisans: [{ id: 30, name: "TEST Artisan", email: "artisan@test.local", artisanProfile: { businessName: "TEST Studio" } }], products: [{ id: 40, name: "TEST Product", price: 45000, currency: "NGN", providerId: 30, images: [] }] }) });
      if (route.request().method() === "GET" && path === "/admin/test-orders") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: 50, testReference: "TEST-50-DEMO", label: "TEST ORDER", customerId: 20, artisanId: 30, productId: 40, productName: "TEST Product", price: 45000, currency: "NGN", simulatedPaymentStatus: "succeeded", readinessStatus: "awaiting_response", initialPayoutStatus: null, productionStatus: null, qualityStatus: null, deliveryStatus: null, finalPayoutStatus: "not_eligible", simulationTimeScenario: null, transfers: [], createdAt: new Date().toISOString() }]) });
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/admin/test-orders", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("test-orders-panel")).toBeVisible();
    await expect(page.getByText("TEST-50-DEMO")).toBeVisible();
    await expect(page.getByText("TEST ORDER", { exact: true })).toBeVisible();
    await expect(page.getByText("SIMULATED PAYMENT", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Customer order/ })).toHaveAttribute("href", "/marketplace/orders/50");
    await expect(page.getByRole("link", { name: /Artisan orders/ })).toHaveAttribute("href", "/artisan/dashboard?tab=orders&orderView=all");
    await expect(page.getByRole("button", { name: "Record simulated payout" })).toBeDisabled();
  });
});
