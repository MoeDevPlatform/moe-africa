import { expect, test, type Page } from "@playwright/test";
import { authenticateOrderUi, skipUnlessLocalOrCiApp } from "../helpers/orderUiAuth";

const now = new Date().toISOString();
const conversations = [
  {
    id: 41,
    customerId: 2,
    providerId: 9,
    providerName: "Ayo Studio",
    customerName: "Ada Customer",
    customerEmail: "ada@example.test",
    artisanId: 9,
    artisanName: "Ayo Studio",
    lastMessage: "Can you confirm the fitting date?",
    lastMessageTime: now,
    lastMessageAt: now,
    status: "unread",
    unreadCount: 1,
    source: "conversation",
  },
  {
    id: 42,
    customerId: 3,
    providerId: 10,
    providerName: "Kemi Craft",
    customerName: "Bola Customer",
    customerEmail: "bola@example.test",
    artisanId: 10,
    artisanName: "Kemi Craft",
    lastMessage: "Thank you",
    lastMessageTime: now,
    lastMessageAt: now,
    status: "resolved",
    unreadCount: 0,
    source: "conversation",
  },
];

async function mockAdminMessaging(page: Page) {
  let active = [...conversations];
  let attachmentSent = false;

  await page.route(/\/admin\/messages(\?.*)?$/, (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.route(/\/admin\/support\/tickets(\?.*)?$/, (route) => {
    if (route.request().resourceType() === "document") return route.continue();
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.route(/\/admin\/conversations(\/.*)?(\?.*)?$/, async (route) => {
    const request = route.request();
    if (request.resourceType() === "document") {
      await route.continue();
      return;
    }
    const url = new URL(request.url());
    if (request.method() === "GET" && url.pathname === "/admin/conversations") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: active, pagination: { totalItems: active.length } }),
      });
      return;
    }
    if (request.method() === "POST" && url.pathname === "/admin/conversations/bulk-delete") {
      const body = request.postDataJSON() as { ids: number[] };
      active = active.filter((item) => !body.ids.includes(item.id));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, deleted: body.ids.length }),
      });
      return;
    }
    if (request.method() === "POST" && url.pathname === "/admin/conversations/41/reply") {
      attachmentSent = true;
      expect(request.headers()["content-type"]).toContain("multipart/form-data");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 502, content: "Attached", sentAt: now }),
      });
      return;
    }
    if (request.method() === "GET" && url.pathname === "/admin/conversations/41") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          conversation: conversations[0],
          messages: attachmentSent
            ? [{ id: 502, conversationId: 41, senderId: 1, senderType: "provider", senderRole: "admin", content: "Attached", sentAt: now }]
            : [],
        }),
      });
      return;
    }
    await route.continue();
  });
}

test.describe("Admin messaging regression", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    test.skip(skipUnlessLocalOrCiApp(), "Local/CI app only");
  });

  test("search selection and bulk archive remain scoped", async ({ page }) => {
    await authenticateOrderUi(page, {
      role: "admin",
      email: "phase4.admin@local.test",
      password: "password123",
    });
    await mockAdminMessaging(page);
    await page.goto("/admin/messages", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-message-row")).toHaveCount(2);
    await page.getByTestId("admin-messages-select-all").click();
    await expect(page.getByTestId("admin-messages-selected-count")).toHaveText("2 selected");

    await page.getByLabel("Search conversations").fill("Ada");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByTestId("admin-messages-selection-bar")).toHaveCount(0);

    await page.getByTestId("admin-message-select").first().click();
    await page.getByTestId("admin-messages-bulk-delete").click();
    await page.getByTestId("admin-messages-bulk-delete-confirm").click();
    await expect(page.getByText("Archived 1 conversation")).toBeVisible();
  });

  test("thread stages and sends an attachment while voice controls remain available", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await authenticateOrderUi(page, {
      role: "admin",
      email: "phase4.admin@local.test",
      password: "password123",
    });
    await mockAdminMessaging(page);
    await page.goto("/admin/messages/41", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: "Record voice message" })).toBeVisible();
    await page.getByTestId("admin-message-file-input").setInputFiles({
      name: "measurement-note.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("shoulder 40cm"),
    });
    await expect(page.getByText("measurement-note.txt")).toBeVisible();
    await page.getByRole("button", { name: "Send Reply" }).click();
    await expect(page.getByText("Reply sent")).toBeVisible();
    await expect(page.getByText("measurement-note.txt")).toHaveCount(0);
  });
});
