import { test, expect } from '@playwright/test';

test.describe('Inline product variations', () => {
  test('product variations appear inline on product detail page', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="variation-selector"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeDisabled();
  });

  test('add to cart enables after all variations selected', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="variation-selector"]')).toBeVisible({
      timeout: 20_000,
    });
    // Category-dependent chips — try common size/colour for leather/shoe products
    const size = page.locator('[data-testid^="size-chip-"]').first();
    const colour = page.locator('[data-testid^="colour-swatch-"]').first();
    const material = page.locator('[data-testid^="material-chip-"]').first();
    if (await size.isVisible().catch(() => false)) await size.click();
    if (await colour.isVisible().catch(() => false)) await colour.click();
    if (await material.isVisible().catch(() => false)) await material.click();
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeEnabled({
      timeout: 10_000,
    });
    await page.click('[data-testid="add-to-cart-btn"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(/[1-9]/, {
      timeout: 10_000,
    });
  });

  test('customise and order button is removed', async ({ page }) => {
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Customise & Order')).not.toBeVisible();
    await expect(page.locator('text=Customise and Order')).not.toBeVisible();
  });
});
