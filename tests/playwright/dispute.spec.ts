import { test, expect } from '@playwright/test';
import { adminLogin, customerLogin } from '../helpers/authFlows';
import {
  PLAYWRIGHT_CUSTOMER_EMAIL,
  PLAYWRIGHT_CUSTOMER_PASSWORD,
} from '../helpers/playwrightEnv';

test.describe('Disputes', () => {
  test('admin disputes page loads', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/disputes', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /disputes/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('customer can open report a problem on order detail', async ({ page }) => {
    test.skip(!PLAYWRIGHT_CUSTOMER_EMAIL || !PLAYWRIGHT_CUSTOMER_PASSWORD, 'Customer creds missing');
    await customerLogin(page);
    await page.goto('/marketplace/orders', { waitUntil: 'domcontentloaded' });
    const firstOrder = page.locator('a[href*="/marketplace/orders/"]').first();
    if (!(await firstOrder.isVisible().catch(() => false))) {
      test.skip(true, 'No customer orders available');
      return;
    }
    await firstOrder.click();
    await expect(page.getByRole('button', { name: /report a problem/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
