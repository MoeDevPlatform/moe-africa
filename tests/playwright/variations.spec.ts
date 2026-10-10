import { test, expect } from '@playwright/test';
import { IDS } from './helpers/testIds';

test.describe('Product variations', () => {
  test('price updates when variation with price override selected', async ({ page }) => {
    test.skip(!IDS.variationPriceProduct, 'Set PLAYWRIGHT_VARIATION_PRICE_PRODUCT_ID');
    await page.goto(`/marketplace/product/${IDS.variationPriceProduct}`);
    const price = page.locator('[data-testid="product-price"]');
    await expect(price).toBeVisible();
    const basePriceText = await price.textContent();
    await page.click('[data-testid="variation-option-large"]');
    const updatedPriceText = await price.textContent();
    expect(updatedPriceText).not.toEqual(basePriceText);
  });

  test('product without variations has enabled add to cart', async ({ page }) => {
    test.skip(!IDS.noVariationProduct, 'Set PLAYWRIGHT_NO_VARIATION_PRODUCT_ID');
    await page.goto(`/marketplace/product/${IDS.noVariationProduct}`);
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeEnabled();
    await expect(page.locator('[data-testid="variation-selector"]')).toHaveCount(0);
  });

  test('sold out variation option is visible but not selectable', async ({ page }) => {
    test.skip(!IDS.soldOutOptionProduct, 'Set PLAYWRIGHT_SOLD_OUT_OPTION_PRODUCT_ID');
    await page.goto(`/marketplace/product/${IDS.soldOutOptionProduct}`);
    const soldOutOption = page.locator('[data-testid="variation-option-sold-out"]').first();
    await expect(soldOutOption).toBeVisible();
    await soldOutOption.click({ force: false }).catch(() => undefined);
    await expect(soldOutOption).not.toHaveClass(/selected/);
  });
});
