import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

/**
 * Focused messaging checks: private support notes + attachment UX.
 * Local app only — does not touch production conversations.
 */

const ARTISAN_EMAIL = "phase3.artisan@local.test";
const ARTISAN_PASSWORD = "password123";
const CUSTOMER_EMAIL = "phase3.customer@local.test";
const CUSTOMER_PASSWORD = "password123";

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
  await page.waitForURL(/\/(marketplace|artisan)/, { timeout: 30_000 });
}

function writeTempFile(name: string, contents: string | Buffer) {
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, contents);
  return filePath;
}

const localInquiry = {
  id: 9001,
  customerId: 1,
  providerId: 2,
  customerName: "Local Customer",
  providerName: "Local Artisan",
  lastMessage: "Need a quote",
  lastMessageTime: new Date().toISOString(),
  unreadCount: 0,
  artisanNote: null,
  status: "unread",
};

test.describe("Messaging notes and attachments", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "";
    test.skip(!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base), "Local app only");
  });

  test("private support note confirms success and shows Private note history", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);

    let noteSaved = false;
    await page.route(/\/conversations(\/\d+(\/messages|\/artisan-note)?)?(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === "GET" && /\/conversations\/?$/.test(url.pathname)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              ...localInquiry,
              artisanNote: noteSaved ? `saved-${noteSaved}` : null,
            },
          ]),
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
              conversationId: localInquiry.id,
              senderId: 1,
              senderType: "customer",
              senderRole: "customer",
              content: "Need a quote",
              sentAt: new Date().toISOString(),
            },
          ]),
        });
        return;
      }
      if (method === "PATCH" && /\/artisan-note$/.test(url.pathname)) {
        const body = route.request().postDataJSON() as { note?: string };
        noteSaved = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, artisanNote: body?.note ?? "" }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/artisan/dashboard?tab=inquiries", { waitUntil: "domcontentloaded" });
    const noteInput = page.getByTestId("private-note-input").first();
    await expect(noteInput).toBeVisible({ timeout: 20_000 });
    const note = `Private support note ${Date.now()}`;
    await noteInput.fill(note);

    await page.getByTestId("private-note-send").first().click();
    await expect(page.getByText("Your private note has been sent to the MOE Support Team.")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("private-note-history").first()).toContainText("Private note");
    await expect(page.getByTestId("private-note-history").first()).toContainText(note);
    await expect(noteInput).toHaveValue("");
  });

  test("failed private note keeps draft and shows error", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, ARTISAN_EMAIL, ARTISAN_PASSWORD);

    await page.route(/\/conversations(\/\d+(\/messages|\/artisan-note)?)?(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === "GET" && /\/conversations\/?$/.test(url.pathname)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([localInquiry]),
        });
        return;
      }
      if (method === "GET" && /\/conversations\/\d+\/messages$/.test(url.pathname)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
        return;
      }
      if (method === "PATCH" && /\/artisan-note$/.test(url.pathname)) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "boom" }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/artisan/dashboard?tab=inquiries", { waitUntil: "domcontentloaded" });
    const noteInput = page.getByTestId("private-note-input").first();
    await expect(noteInput).toBeVisible({ timeout: 20_000 });
    const note = `Keep this note ${Date.now()}`;
    await noteInput.fill(note);

    await page.getByTestId("private-note-send").first().click();
    await expect(page.getByText(/Failed to send private note/i)).toBeVisible({ timeout: 10_000 });
    await expect(noteInput).toHaveValue(note);
  });

  test("attachment picker validates unsupported files and can stage a document", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/marketplace/product/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Message Us" }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Message Us" }).first().click();
    await expect(page.getByTestId("messages-thread")).toBeVisible();

    const badFile = writeTempFile(`bad-${Date.now()}.exe`, Buffer.from("MZ-not-allowed"));
    await page.getByTestId("messages-panel-file-input").setInputFiles(badFile);
    await expect(page.getByText(/Unsupported file format/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("messages-panel-pending-attachment")).toHaveCount(0);

    const docFile = writeTempFile(`note-${Date.now()}.txt`, "hello from local messaging test");
    await page.getByTestId("messages-panel-file-input").setInputFiles(docFile);
    const pending = page.getByTestId("messages-panel-pending-attachment");
    await expect(pending).toBeVisible();
    await expect(pending).toContainText(/note-.*\.txt/);
    await page.getByTestId("messages-panel-remove-attachment").click();
    await expect(pending).toHaveCount(0);

    await page.getByTestId("messages-panel-file-input").setInputFiles(docFile);
    await expect(pending).toBeVisible();
    const sent = page.waitForResponse((response) => {
      if (response.request().method() !== "POST") return false;
      return /\/conversations\/\d+\/messages$/.test(new URL(response.url()).pathname);
    });
    await page.getByTestId("messages-panel-send").click();
    const sentRes = await sent;
    if (sentRes.ok()) {
      await expect(
        page.getByText(/Attachment uploaded successfully|hello from local messaging test|note-/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    } else {
      const body = await sentRes.text();
      expect(sentRes.status()).toBeGreaterThanOrEqual(400);
      expect(body.length).toBeGreaterThan(0);
      await expect(page.getByText(/upload failed|Cloudinary|Unsupported|required/i).first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(pending).toBeVisible();
    }
  });
});
