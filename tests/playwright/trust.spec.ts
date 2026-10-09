import { test, expect } from '@playwright/test';
import { customerLogin } from '../helpers/authFlows';
import { PLAYWRIGHT_CUSTOMER_EMAIL, PLAYWRIGHT_CUSTOMER_PASSWORD } from '../helpers/playwrightEnv';

test.describe('Trust & delivery', () => {
  test('product detail shows delivery timeline', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="delivery-timeline"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('checkout shows buyer protection message', async ({ page }) => {
    test.skip(!PLAYWRIGHT_CUSTOMER_EMAIL || !PLAYWRIGHT_CUSTOMER_PASSWORD, 'Customer creds missing');
    await customerLogin(page);
    await page.goto('/marketplace/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Order Protection/i)).toBeVisible({ timeout: 15_000 });
  });
});
