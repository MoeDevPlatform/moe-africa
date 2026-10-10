import { test, expect } from '@playwright/test';
import { artisanLogin } from '../helpers/authFlows';
import { IDS } from './helpers/testIds';
import {
  PLAYWRIGHT_ARTISAN_EMAIL,
  PLAYWRIGHT_ARTISAN_PASSWORD,
  PLAYWRIGHT_API_URL,
} from '../helpers/playwrightEnv';

test.describe('Artisan product variations', () => {
  test.beforeEach(() => {
    test.skip(
      !PLAYWRIGHT_ARTISAN_EMAIL || !PLAYWRIGHT_ARTISAN_PASSWORD,
      'Set PLAYWRIGHT_ARTISAN_EMAIL / PLAYWRIGHT_ARTISAN_PASSWORD',
    );
  });

  test('artisan can enable and configure size variation', async ({ page }) => {
    test.setTimeout(120_000);
    await artisanLogin(page);
    await page.goto('/artisan/dashboard');
    await page.click('[data-testid="add-product-btn"]');
    // Radix Select — open and choose Tailoring
    await page.getByText('Select a category', { exact: false }).first().click();
    await page.getByRole('option', { name: /Tailoring/i }).click();
    await page.click('[data-testid="variation-toggle-size"]');
    await expect(page.locator('[data-testid="variation-options-size"]')).toBeVisible();
    await page.fill('[data-testid="variation-option-input-size"]', 'Small');
    await page.click('[data-testid="add-variation-option-size"]');
    await expect(page.getByText('Small', { exact: true }).first()).toBeVisible();
  });

  test('artisan can disable a variation type on existing product', async ({
    page,
    request,
  }) => {
    test.skip(
      !IDS.productWithVariations,
      'Set PLAYWRIGHT_PRODUCT_WITH_VARIATIONS_ID',
    );
    test.setTimeout(180_000);
    await artisanLogin(page);
    await page.goto('/artisan/dashboard');

    // Open the seeded disable-fixture by navigating via products list text if present.
    const row = page.getByText('PW Disable Variation Product').first();
    if (await row.isVisible().catch(() => false)) {
      await page.locator('[data-testid="edit-product-btn"]').first().click();
    } else {
      await page.locator('[data-testid="edit-product-btn"]').first().click();
    }

    const sizeToggle = page.locator('[data-testid="variation-toggle-size"]');
    await expect(sizeToggle).toBeVisible({ timeout: 15_000 });
    await sizeToggle.click();
    await page.click('[data-testid="save-variations-btn"]');
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.goto(`/marketplace/product/${IDS.productWithVariations}`);
    await expect(
      page.locator('[data-testid="variation-selector-size"]'),
    ).toHaveCount(0);
  });
});
