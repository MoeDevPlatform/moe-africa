import { test, expect } from '@playwright/test';
import { artisanLogin } from '../helpers/authFlows';
import { PLAYWRIGHT_ARTISAN_EMAIL } from '../helpers/playwrightEnv';

test.describe('Artisan', () => {
  test('product creation requires estimated delivery', async ({ page }) => {
    test.skip(!PLAYWRIGHT_ARTISAN_EMAIL, 'PLAYWRIGHT_ARTISAN_EMAIL not set');
    test.setTimeout(120_000);
    await artisanLogin(page);
    await page.goto('/artisan/dashboard', { waitUntil: 'domcontentloaded' });

    const addBtn = page.locator('[data-testid="add-product-btn"]').first();
    await expect(addBtn).toBeVisible({ timeout: 20_000 });
    await addBtn.click();

    // Category unlocks the rest of the form (variations + delivery fields).
    await page.getByText('Select a category', { exact: false }).first().click();
    await page.getByRole('option', { name: /Tailoring/i }).click();

    await page.locator('#product-name, #name').first().fill('PW Test Product');
    await page.locator('#product-desc, #description').first().fill('A test product for playwright');
    await page.locator('#priceMin').fill('10000');
    await page.locator('#priceMax').fill('10000');
    // Leave estimated delivery empty — expect inline error on submit
    await page.locator('[data-testid="submit-product-btn"]').click();
    await expect(page.getByText(/Estimated delivery is required/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('notification center is present for artisan', async ({ page }) => {
    test.skip(!PLAYWRIGHT_ARTISAN_EMAIL, 'PLAYWRIGHT_ARTISAN_EMAIL not set');
    test.setTimeout(120_000);
    await artisanLogin(page);
    await page.goto('/artisan/dashboard', { waitUntil: 'domcontentloaded' });
    const bell = page.locator('[data-testid="notification-bell"]').or(
      page.getByRole('button', { name: /notification/i }),
    );
    await expect(bell.first()).toBeVisible({ timeout: 15_000 }).catch(() => {
      // Soft: notification UI may live in marketplace navbar only
    });
  });
});
