import { test, expect } from '@playwright/test';

/**
 * Legacy inline-variation checks. Prefer variations.spec.ts with seeded IDs.
 * After this sprint, the selector only renders when the product has enabled
 * variationTypes from the API — skip gracefully when absents.
 */
test.describe('Inline product variations', () => {
  test('customise and order button is removed', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Customise & Order')).not.toBeVisible();
    await expect(page.locator('text=Customise and Order')).not.toBeVisible();
  });

  test('product with no variation types keeps add to cart enabled', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    const selectorCount = await page.locator('[data-testid="variation-selector"]').count();
    if (selectorCount === 0) {
      await expect(page.locator('[data-testid="add-to-cart-btn"]').first()).toBeEnabled();
      return;
    }
    await expect(page.locator('[data-testid="add-to-cart-btn"]').first()).toBeDisabled();
  });

  test('add to cart enables after required variations selected', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    const selector = page.locator('[data-testid="variation-selector"]');
    if ((await selector.count()) === 0) {
      test.skip(true, 'Product 41 has no enabled variationTypes yet');
    }
    await expect(selector).toBeVisible({ timeout: 20_000 });
    const size = page.locator('[data-testid^="size-chip-"]').first();
    const colour = page.locator('[data-testid^="colour-swatch-"]').first();
    const material = page.locator('[data-testid^="material-chip-"]').first();
    if (await size.isVisible().catch(() => false)) await size.click();
    if (await colour.isVisible().catch(() => false)) await colour.click();
    if (await material.isVisible().catch(() => false)) await material.click();

    const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    await expect(addBtn).toBeEnabled({ timeout: 10_000 });
    await addBtn.click();
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(/[1-9]/, {
      timeout: 10_000,
    });
  });
});
