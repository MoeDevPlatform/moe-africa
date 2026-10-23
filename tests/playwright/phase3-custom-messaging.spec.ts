import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adminLogin } from '../helpers/authFlows';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CUSTOMER_EMAIL = process.env.PLAYWRIGHT_CUSTOMER_EMAIL || 'phase3.customer@local.test';
const CUSTOMER_PASSWORD = process.env.PLAYWRIGHT_CUSTOMER_PASSWORD || 'password123';
const ARTISAN_ID = Number(process.env.PHASE3_ARTISAN_ID || '16');
const CONVERSATION_ID = Number(process.env.PHASE3_CONVERSATION_ID || '4');

async function customerLogin(page: Page) {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await page.locator('#signin-email').fill(CUSTOMER_EMAIL);
  await page.locator('#signin-password').fill(CUSTOMER_PASSWORD);
  const loginResponse = page.waitForResponse(
    (res) => res.url().includes('/auth/login') && res.request().method() === 'POST',
    { timeout: 30_000 },
  );
  await page.getByRole('button', { name: /^sign in$/i }).click();
  const res = await loginResponse;
  expect(res.ok(), `customer login ${res.status()}`).toBeTruthy();
  await page.waitForURL(/marketplace/, { timeout: 30_000 });
}

test.describe('Phase 3 custom orders & messaging (local)', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || '';
    test.skip(
      /vercel\.app|moe-africa\.com|duckdns/i.test(base),
      `Refusing Phase 3 mutating suite against non-local baseURL (${base || 'unset'})`,
    );
  });

  test('description validation: short OK, over 200 blocked', async ({ page }) => {
    await customerLogin(page);
    await page.goto(`/marketplace/artisan/${ARTISAN_ID}`, { waitUntil: 'networkidle' });
    const openBtn = page.getByTestId('request-custom-order-btn');
    await expect(openBtn).toBeVisible({ timeout: 20_000 });
    await openBtn.click();

    await expect(page.getByTestId('custom-order-guidance')).toBeVisible();
    await expect(page.getByText(/Maximum 200 characters/i)).toBeVisible();

    const desc = page.getByTestId('custom-order-description');
    await desc.fill('Short custom order');
    await page.getByTestId('submit-custom-order-btn').click();
    // Should not show 50-char minimum error
    await expect(page.getByText(/at least 50/i)).toHaveCount(0);

    await desc.fill('x'.repeat(201));
    // maxLength attribute should clip; force via evaluate if needed
    const len = await desc.evaluate((el: HTMLTextAreaElement) => el.value.length);
    expect(len).toBeLessThanOrEqual(200);
  });

  test('eligible customer can submit custom order with reference image', async ({ page }) => {
    const fixture = path.join(__dirname, 'fixtures', 'phase2-upload.png');
    test.skip(!fs.existsSync(fixture), 'missing upload fixture');

    await customerLogin(page);
    await page.goto(`/marketplace/artisan/${ARTISAN_ID}`, { waitUntil: 'networkidle' });
    await page.getByTestId('request-custom-order-btn').click();

    const unique = `Phase3 CO ${Date.now()} silk wrap dress waist 80cm`;
    await page.getByTestId('custom-order-description').fill(unique);

    await page.getByTestId('custom-order-images').setInputFiles(fixture);
    await expect(page.locator('img[alt^="Reference:"]').first()).toBeVisible({ timeout: 15_000 });

    const createPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/custom-orders') &&
        res.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await page.getByTestId('submit-custom-order-btn').click();
    const created = await createPromise;
    expect(created.ok(), await created.text()).toBeTruthy();

    await page.goto('/marketplace/orders?tab=custom', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('custom-orders-list')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(unique)).toBeVisible({ timeout: 20_000 });
  });

  test('messages: inbox, existing conversation, send message, floating FAB', async ({ page }) => {
    await customerLogin(page);

    await page.goto('/marketplace/messages', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('floating-messages-btn')).toBeVisible({ timeout: 15_000 });

    await page.goto(`/marketplace/messages/${CONVERSATION_ID}`, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('conversation-not-found')).toHaveCount(0);
    // Chat UI should load for seeded conversation
    await expect(page.getByText(/Hello from Phase3 seed|Phase3 Eligible|Artisan/i).first()).toBeVisible({
      timeout: 20_000,
    });

    const composer = page.locator('textarea, input[placeholder*="message" i]').last();
    if (await composer.count()) {
      const msg = `Phase3 ping ${Date.now()}`;
      await composer.fill(msg);
      const send = page.getByRole('button', { name: /send/i }).last();
      const sendRes = page.waitForResponse(
        (res) =>
          res.url().includes(`/conversations/${CONVERSATION_ID}/messages`) &&
          res.request().method() === 'POST',
        { timeout: 20_000 },
      ).catch(() => null);
      await send.click();
      const posted = await sendRes;
      if (posted) expect(posted.ok()).toBeTruthy();
      await expect(page.getByText(msg)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('admin dashboard shows artisan reviews in recent activity', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.getByText(/review/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Phase3 seeded review|Phase3 Eligible/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
