import { test, expect } from '@playwright/test';

/**
 * Visual regression baselines live under tests/playwright/snapshots/
 * (Playwright default: adjacent to the spec via snapshotPathTemplate).
 *
 * Update intentionally:
 *   npx playwright test tests/playwright/visual-regression.spec.ts --update-snapshots
 *
 * Do not auto-update in CI.
 */
test.describe('Visual regression', () => {
  test.use({
    // Stable screenshots — avoid motion / dynamic badges where possible
  });

  test('marketplace homepage matches baseline', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('marketplace-homepage.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('auth sign-in matches baseline', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('auth-signin.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('cart page matches baseline', async ({ page }) => {
    await page.goto('/marketplace/cart');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('marketplace-cart.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });
});
