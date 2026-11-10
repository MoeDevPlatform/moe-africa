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

  test("admin messages search, select all, and bulk archive confirmation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    const email = page.locator("#signin-email, input[type='email']").first();
    if (await email.isVisible().catch(() => false)) {
      await email.fill(ADMIN_EMAIL);
      await page.locator("#signin-password, input[type='password']").first().fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    } else {
      await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    let listed: typeof inboundInquiry[] = [
      {
        ...inboundInquiry,
        id: 701,
        customerName: "Searchable Customer",
        customerEmail: "searchable@example.com",
        artisanName: "Searchable Artisan",
        providerName: "Searchable Artisan",
      },
      {
        ...inboundInquiry,
        id: 702,
        customerName: "Other Customer",
        artisanName: "Other Artisan",
        providerName: "Other Artisan",
        lastMessage: "Unrelated",
      },
    ];

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
      if (route.request().url().includes("/admin/conversations")) {
        await route.continue();
        return;
      }
      if (route.request().method() === "GET" && /contact|tickets/i.test(route.request().url())) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/admin/messages", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-messages-search")).toBeVisible({ timeout: 20_000 });

    await page.getByLabel("Search conversations").fill("Searchable");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page.getByTestId("admin-message-row")).toHaveCount(1, { timeout: 10_000 });
    await expect(page.getByText("Searchable Customer")).toBeVisible();

    await page.getByTestId("admin-messages-select-all").click();
    await expect(page.getByTestId("admin-messages-selection-bar")).toContainText("1 selected");
    await page.getByRole("button", { name: /bulk delete/i }).click();
    await expect(page.getByText(/Archive 1 conversations/i)).toBeVisible();
    await page.getByRole("button", { name: /archive selected/i }).click();
    await expect(page.getByText(/Archived 1 conversation/i)).toBeVisible({ timeout: 10_000 });
  });
});
