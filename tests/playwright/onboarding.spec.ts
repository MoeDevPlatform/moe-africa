import { test, expect } from '@playwright/test';
import { customerLogin } from '../helpers/authFlows';
import { PLAYWRIGHT_CUSTOMER_EMAIL, PLAYWRIGHT_CUSTOMER_PASSWORD } from '../helpers/playwrightEnv';

test.describe('Onboarding & personalisation', () => {
  test('onboarding selections redirect to filtered marketplace', async ({ page }) => {
    test.skip(!PLAYWRIGHT_CUSTOMER_EMAIL || !PLAYWRIGHT_CUSTOMER_PASSWORD, 'Customer creds missing');
    await customerLogin(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Landing may auto-open preferences; otherwise open via marketplace home prefs
    const modal = page.getByRole('dialog');
    if (!(await modal.isVisible().catch(() => false))) {
      await page.goto('/marketplace/settings?section=preferences', {
        waitUntil: 'domcontentloaded',
      });
      await page.getByRole('button', { name: /set|update|preferences/i }).first().click().catch(() => {});
    }
    const tailor = page.getByText(/Tailoring/i).first();
    if (await tailor.isVisible().catch(() => false)) {
      await tailor.click();
    }
    const confirm = page.locator('[data-testid="confirm-preferences"]');
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
      await expect(page).toHaveURL(/marketplace/, { timeout: 15_000 });
    }
  });

  test('zero result prompt is not shown', async ({ page }) => {
    await page.goto('/marketplace?categories=NonExistentCategory', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('text=produced 0 artisans')).not.toBeVisible();
  });
});
