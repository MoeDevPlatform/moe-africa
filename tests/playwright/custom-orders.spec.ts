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
    test.setTimeout(120_000);
    await adminLogin(page);
    await page.goto(`/admin/artisans/${IDS.adminToggleArtisan}`);
    const status = page.locator('[data-testid="custom-order-status"]');
    await expect(status).toBeVisible();
    const before = (await status.textContent()) || '';
    await page.click('[data-testid="custom-order-toggle"]');
    await page.click('[data-testid="confirm-toggle-btn"]');
    await expect(status).toContainText(/Eligible|Not Eligible/);
    await expect(status).not.toHaveText(before.trim());

    // Restore prior eligibility so fixture artisans stay usable for other specs.
    await page.click('[data-testid="custom-order-toggle"]');
    await page.click('[data-testid="confirm-toggle-btn"]');
    await expect(status).toContainText(before.trim().includes('Not') ? /Not Eligible/ : /Eligible/);
  });
});
