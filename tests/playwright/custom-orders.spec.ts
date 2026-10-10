import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/authFlows';
import { IDS } from './helpers/testIds';

test.describe('Custom orders', () => {
  test('request custom order button only shows for eligible artisan', async ({
    page,
  }) => {
    test.skip(
      !IDS.eligibleArtisan || !IDS.ineligibleArtisan,
      'Set PLAYWRIGHT_ELIGIBLE_ARTISAN_ID and PLAYWRIGHT_INELIGIBLE_ARTISAN_ID',
    );
    await page.goto(`/marketplace/provider/${IDS.eligibleArtisan}`);
    await expect(
      page.locator('[data-testid="request-custom-order-btn"]'),
    ).toBeVisible();

    await page.goto(`/marketplace/provider/${IDS.ineligibleArtisan}`);
    await expect(
      page.locator('[data-testid="request-custom-order-btn"]'),
    ).toHaveCount(0);
  });

  test('admin can toggle custom order eligibility', async ({ page }) => {
    test.skip(
      !IDS.adminToggleArtisan,
      'Set PLAYWRIGHT_ADMIN_TOGGLE_ARTISAN_ID',
    );
    await adminLogin(page);
    await page.goto(`/admin/artisans/${IDS.adminToggleArtisan}`);
    await page.click('[data-testid="custom-order-toggle"]');
    await page.click('[data-testid="confirm-toggle-btn"]');
    await expect(page.locator('[data-testid="custom-order-status"]')).toContainText(
      /Eligible|Not Eligible/,
    );
  });
});
