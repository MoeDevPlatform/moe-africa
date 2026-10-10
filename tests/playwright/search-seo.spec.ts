import { test, expect } from '@playwright/test';

test.describe('Search & SEO', () => {
  test('search returns keyword-matched results', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="search-input"]').first().click();
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await page.locator('input[aria-label="Search input"]').fill('leather');
    await page
      .waitForResponse(
        (res) => res.url().includes('/search') && res.ok(),
        { timeout: 30_000 },
      )
      .catch(() => {});
    await expect(page.locator('[data-testid="search-results"]')).toContainText(/leather/i, {
      timeout: 20_000,
    });
  });

  test('product detail page has correct meta title', async ({ page }) => {
    // Product id 1 is not seeded; use a known live product.
    await page.goto('/marketplace/product/41', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(async () => page.title(), { timeout: 15_000 })
      .toMatch(/MOE Africa|leather shoes/i);
  });
});
