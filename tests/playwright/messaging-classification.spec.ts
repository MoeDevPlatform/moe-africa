import { test, expect, type Page } from "@playwright/test";

/**
 * Personal Floating Messages vs Customer Inquiries classification.
 * Uses mocked list payloads keyed by `as=customer|provider`.
 */

const ARTISAN_EMAIL = "phase3.artisan@local.test";
const ARTISAN_PASSWORD = "password123";
const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || "phase3.admin@local.test";
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || "password123";

const personalThread = {
  id: 501,
  customerId: 99,
  providerId: 88,
  customerName: "Dual Hat User",
  providerName: "Other Studio",
  lastMessage: "Hi other studio",
  lastMessageTime: new Date().toISOString(),
  unreadCount: 0,
  viewerContext: "as_customer",
  status: "unread",
};

const inboundInquiry = {
  id: 502,
  customerId: 77,
  providerId: 99,
  customerName: "Buyer One",
  providerName: "Dual Hat Studio",
  lastMessage: "Interested in your piece",
  lastMessageTime: new Date().toISOString(),
  unreadCount: 1,
  viewerContext: "as_provider",
  artisanNote: null,
  status: "unread",
};

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

test.describe("Messaging classification + admin management", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("floating messages requests as=customer and never shows inbound inquiries", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);

    const asParams: string[] = [];
    await page.route(/\/conversations(\?.*)?$/, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      if (!/\/conversations\/?$/.test(url.pathname)) {
        await route.continue();
        return;
      }
      const as = url.searchParams.get("as") ?? "";
      asParams.push(as);
      const body = as === "provider" ? [inboundInquiry] : [personalThread];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await page.getByTestId("floating-messages-btn").click();
    const panel = page.getByTestId("messages-panel");
    await expect(panel).toBeVisible();
    await page.getByTestId("messages-panel-expand").click();
    await expect(panel.getByText("Other Studio")).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText("Buyer One")).toHaveCount(0);
    expect(asParams.some((v) => v === "customer")).toBeTruthy();
    expect(asParams.every((v) => v !== "provider")).toBeTruthy();
  });

  test("customer inquiries uses as=provider, collapses by default, expands one card", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);

    await page.route(/\/conversations(\/\d+(\/messages|\/artisan-note)?)?(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === "GET" && /\/conversations\/?$/.test(url.pathname)) {
        expect(url.searchParams.get("as")).toBe("provider");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([inboundInquiry, { ...inboundInquiry, id: 503, customerName: "Buyer Two" }]),
        });
        return;
      }
      if (method === "GET" && /\/conversations\/\d+\/messages$/.test(url.pathname)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              conversationId: inboundInquiry.id,
              senderId: 77,
              senderType: "customer",
              senderRole: "customer",
              content: "Interested in your piece",
              sentAt: new Date().toISOString(),
            },
          ]),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/artisan/dashboard?tab=inquiries", { waitUntil: "domcontentloaded" });
    const cards = page.getByTestId("artisan-inquiry-card");
    await expect(cards).toHaveCount(2, { timeout: 20_000 });
    await expect(page.getByTestId("artisan-inquiry-body")).toHaveCount(0);

    await cards.nth(0).getByTestId("artisan-inquiry-toggle").click();
    await expect(page.getByTestId("artisan-inquiry-body")).toHaveCount(1);
    await expect(page.getByText("Interested in your piece")).toBeVisible();

    await cards.nth(1).getByTestId("artisan-inquiry-toggle").click();
    await expect(page.getByTestId("artisan-inquiry-body")).toHaveCount(1);

    await cards.nth(1).getByTestId("artisan-inquiry-toggle").click();
    await expect(page.getByTestId("artisan-inquiry-body")).toHaveCount(0);
  });

  test("admin messages selection, search, cancel, single and bulk archive", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill(ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL(/\/admin(\/dashboard)?\/?$/, { timeout: 60_000 }),
      page.getByRole("button", { name: /^Sign In$/i }).click(),
    ]);
    await expect(page.getByText(/Dashboard|Marketplace activity|Pending/i).first()).toBeVisible({
      timeout: 30_000,
    });

    type AdminRow = typeof inboundInquiry & {
      customerEmail?: string;
      artisanName?: string;
      unreadCount?: number;
      status?: string;
    };

    let listed: AdminRow[] = [
      {
        ...inboundInquiry,
        id: 701,
        customerName: "Searchable Customer",
        customerEmail: "searchable@example.com",
        artisanName: "Searchable Artisan",
        providerName: "Searchable Artisan",
        unreadCount: 1,
        status: "unread",
      },
      {
        ...inboundInquiry,
        id: 702,
        customerName: "Other Customer",
        artisanName: "Other Artisan",
        providerName: "Other Artisan",
        lastMessage: "Unrelated",
        unreadCount: 0,
        status: "resolved",
      },
      {
        ...inboundInquiry,
        id: 703,
        customerName: "Resolved Buyer",
        artisanName: "Quiet Studio",
        providerName: "Quiet Studio",
        lastMessage: "All set",
        unreadCount: 0,
        status: "resolved",
      },
    ];
    let unauthorizedDeleteStatus = 0;

    await page.route(/\/admin\/conversations.*/, async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === "GET" && /\/admin\/conversations\/?$/.test(url.pathname)) {
        const q = (url.searchParams.get("q") ?? "").toLowerCase();
        const data = q
          ? listed.filter(
              (c) =>
                c.customerName.toLowerCase().includes(q) ||
                String(c.id).includes(q) ||
                (c.lastMessage ?? "").toLowerCase().includes(q),
            )
          : listed;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data,
            pagination: { page: 1, pageSize: 100, totalPages: 1, totalItems: data.length },
          }),
        });
        return;
      }
      if (method === "POST" && /bulk-delete$/.test(url.pathname)) {
        const body = route.request().postDataJSON() as { ids?: number[] };
        listed = listed.filter((c) => !(body.ids ?? []).includes(c.id));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, deleted: body.ids?.length ?? 0 }),
        });
        return;
      }
      if (method === "DELETE" && /\/admin\/conversations\/\d+$/.test(url.pathname)) {
        const id = Number(url.pathname.split("/").pop());
        listed = listed.filter((c) => c.id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }
      await route.continue();
    });

    await page.route(/\/admin\/support\/contact|\/support\/tickets|\/admin\/messages/, async (route) => {
      const req = route.request();
      // Do not intercept the SPA document navigation to /admin/messages.
      if (req.resourceType() === "document") {
        await route.continue();
        return;
      }
      if (req.url().includes("/admin/conversations")) {
        await route.continue();
        return;
      }
      if (req.method() === "GET" && /contact|tickets|\/admin\/messages/i.test(req.url())) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
        return;
      }
      await route.continue();
    });

    // Unauthorized delete probe (no admin token) against the local API.
    const unauth = await page.request.delete("http://127.0.0.1:3000/admin/conversations/701");
    unauthorizedDeleteStatus = unauth.status();
    expect([401, 403]).toContain(unauthorizedDeleteStatus);

    await page.goto("/admin/messages", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-messages-search")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-message-row")).toHaveCount(3, { timeout: 10_000 });

    // 1. Select one conversation
    await page.getByTestId("admin-message-select").first().click();
    await expect(page.getByTestId("admin-messages-selection-bar")).toContainText("1 selected");

    // 2. Select All on current page
    await page.getByTestId("admin-messages-select-all").click();
    await expect(page.getByTestId("admin-messages-selected-count")).toHaveText("3 selected");

    // 3. Deselect one after Select All
    await page.getByTestId("admin-message-select").nth(1).click();
    await expect(page.getByTestId("admin-messages-selected-count")).toHaveText("2 selected");
    await expect(page.getByTestId("admin-messages-select-all")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );

    // 6. Change filters and confirm selection resets
    await page.getByRole("tab", { name: /Resolved/i }).click();
    await expect(page.getByTestId("admin-messages-selection-bar")).toHaveCount(0);
    await page.getByRole("tab", { name: /^All/i }).click();

    // 4–5. Search, select one, Select All within search results
    await page.getByLabel("Search conversations").fill("Searchable");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page.getByTestId("admin-message-row")).toHaveCount(1, { timeout: 10_000 });
    await expect(page.getByTestId("admin-messages-selection-bar")).toHaveCount(0);
    await page.getByTestId("admin-message-select").click();
    await expect(page.getByTestId("admin-messages-selected-count")).toHaveText("1 selected");
    await page.getByTestId("admin-messages-clear-selection").click();
    await page.getByTestId("admin-messages-select-all").click();
    await expect(page.getByTestId("admin-messages-selected-count")).toHaveText("1 selected");

    // 9. Cancel deletion — nothing changes
    const beforeCancel = listed.map((c) => c.id);
    await page.getByTestId("admin-messages-bulk-delete").click();
    await expect(page.getByTestId("admin-messages-bulk-delete-dialog")).toBeVisible();
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByTestId("admin-messages-bulk-delete-dialog")).toHaveCount(0);
    await expect(page.getByTestId("admin-messages-selected-count")).toHaveText("1 selected");
    expect(listed.map((c) => c.id)).toEqual(beforeCancel);

    // 8. Bulk-delete selected (search result)
    await page.getByTestId("admin-messages-bulk-delete").click();
    await expect(page.getByText(/Archive 1 conversation\?/i)).toBeVisible();
    await page.getByTestId("admin-messages-bulk-delete-confirm").click();
    await expect(page.getByText(/Archived 1 conversation/i)).toBeVisible({ timeout: 10_000 });

    // Clear search and confirm deleted row stays gone (10)
    await page.getByRole("button", { name: /clear search/i }).click();
    await expect(page.getByTestId("admin-message-row")).toHaveCount(2, { timeout: 10_000 });
    await expect(page.getByText("Searchable Customer")).toHaveCount(0);

    // 7. Delete one via action menu after confirmation
    const row = page.getByTestId("admin-message-row").first();
    await row.getByRole("button", { name: /conversation actions/i }).click();
    await page.getByRole("menuitem", { name: /^delete$/i }).click();
    await expect(page.getByTestId("admin-messages-delete-dialog")).toBeVisible();
    await page.getByTestId("admin-messages-delete-confirm").click();
    await expect(page.getByText(/Conversation archived/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("admin-message-row")).toHaveCount(1, { timeout: 10_000 });

    // Refresh — deleted conversations remain absent
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-message-row")).toHaveCount(1, { timeout: 10_000 });
    expect(listed.map((c) => c.id)).toEqual([703]);
  });
});
