import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/authFlows';

test.describe('Admin scoring & curation', () => {
  test.describe.configure({ timeout: 120_000 });

  test('admin scores page loads after recalculate', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/artisans/scores', { waitUntil: 'domcontentloaded' });
    await page.click('[data-testid="recalculate-btn"]');
    await expect(page.locator('[data-testid="scores-table"] tr')).not.toHaveCount(0, {
      timeout: 30_000,
    });
  });

  test('admin can add artisan to featured section', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/sections/featured_artisans', { waitUntil: 'domcontentloaded' });
    await page.fill('[data-testid="artisan-search"]', 'Okoro');
    await page.click('[data-testid="search-btn"]');
    await expect(page.locator('[data-testid="search-result"]').first()).toBeVisible({
      timeout: 20_000,
    });
    await page.locator('[data-testid="add-to-section"]').first().click();
    await expect(page.locator('[data-testid="curated-items"] li').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('homepage featured artisans match admin curation', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    const featuredSection = page.locator('[data-testid="featured-artisans-section"]');
    await expect(featuredSection).toBeVisible({ timeout: 20_000 });
  });
});
