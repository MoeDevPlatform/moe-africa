import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/authFlows';

test.describe('Admin portal', () => {
  test('admin can create a new artisan', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/artisans', { waitUntil: 'networkidle' });
    await page.click('[data-testid="add-artisan-btn"]');
    const email = `artisan_${Date.now()}@test.com`;
    await page.fill('[name="email"]', email);
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'Artisan');
    await page.fill('[name="password"]', 'Test@1234Aa').catch(() => {});
    await page.fill('[name="businessName"]', `PW Biz ${Date.now()}`).catch(() => {});
    await page.click('[data-testid="create-artisan-submit"]');
    await expect(
      page.locator('[data-testid="success-toast"]').or(page.getByText(/created|success/i).first()),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('contact us message appears in admin dashboard', async ({ page }) => {
    const uniqueMsg = `Playwright test message ${Date.now()}`;
    await page.goto('/marketplace/support/contact', { waitUntil: 'networkidle' });
    await page.fill('[name="contactName"], #contact-name, [name="name"]', 'Test User');
    await page.fill('[name="contactEmail"], #contact-email, [name="email"]', 'test@test.com');
    await page.fill(
      '[name="contactMessage"], #contact-message, [name="message"], textarea',
      uniqueMsg,
    );
    await page.click('[data-testid="contact-submit"]').catch(async () => {
      await page.getByRole('button', { name: /send|submit/i }).click();
    });

    await adminLogin(page);
    await page.goto('/admin/messages', { waitUntil: 'networkidle' });
    await expect(page.locator(`text=${uniqueMsg}`)).toBeVisible({ timeout: 20_000 });
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await expect(page.getByText(/admin portal/i)).toBeVisible();
  });
});
