import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/authFlows';

test.describe('Admin portal', () => {
  // Allow headroom when adminLogin waits out a shared IP rate-limit cooldown.
  test.describe.configure({ timeout: 120_000 });

  test('admin can create a new artisan', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/artisans', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-testid="add-artisan-btn"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.click('[data-testid="add-artisan-btn"]');

    const email = `artisan_${Date.now()}@test.com`;
    await page.locator('[name="firstName"]').fill('Test');
    await page.locator('[name="lastName"]').fill('Artisan');
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill('Test@1234Aa');
    await page.locator('[name="businessName"]').fill(`PW Biz ${Date.now()}`);

    await page.click('[data-testid="create-artisan-submit"]');
    await expect(
      page.locator('[data-testid="success-toast"]').or(page.getByText(/created|success/i).first()),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('contact us message appears in admin dashboard', async ({ page }) => {
    const uniqueMsg = `Playwright test message ${Date.now()}`;
    await page.goto('/marketplace/support/contact', { waitUntil: 'networkidle' });
    await page.locator('#contact-name, [name="contactName"]').fill('Test User');
    await page.locator('#contact-email, [name="contactEmail"]').fill('test@test.com');
    await page
      .locator('#contact-message, [name="contactMessage"], textarea')
      .first()
      .fill(uniqueMsg);

    const submitRes = page.waitForResponse(
      (res) =>
        (res.url().includes('/support/contact') || res.url().includes('/support/tickets')) &&
        res.request().method() === 'POST',
      { timeout: 20_000 },
    );
    await page.locator('[data-testid="contact-submit"]').click();
    const posted = await submitRes.catch(() => null);
    if (posted && !posted.ok()) {
      throw new Error(`Contact submit failed: ${posted.status()}`);
    }

    await adminLogin(page);
    await page.goto('/admin/messages', { waitUntil: 'networkidle' });
    await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 20_000 });
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await expect(page.getByText(/admin portal/i)).toBeVisible();
  });
});
