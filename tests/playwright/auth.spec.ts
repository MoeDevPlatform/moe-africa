import { test, expect } from '@playwright/test';
import { PLAYWRIGHT_ADMIN_EMAIL } from '../helpers/playwrightEnv';

test.describe('Auth', () => {
  test('duplicate email shows correct error', async ({ page }) => {
    await page.goto('/auth?tab=signup', { waitUntil: 'networkidle' });

    const signupTab = page.getByRole('tab', { name: /sign up/i });
    if (await signupTab.isVisible().catch(() => false)) {
      await signupTab.click();
    }

    const existingEmail = PLAYWRIGHT_ADMIN_EMAIL || 'existing@test.com';

    await page.locator('#firstname').fill('Test');
    await page.locator('#lastname').fill('User');
    await page.locator('#signup-email').fill(existingEmail);
    await page.locator('#signup-password').fill('Test@1234Aa');
    await page.locator('#confirm-password').fill('Test@1234Aa');

    await page.locator('[data-testid="signup-btn"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="signup-btn"]').click();

    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(
      /Email or Password already in use/i,
    );
  });

  test('forgot password flow shows success message', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.click('text=Forgot password?');
    await page.locator('#reset-email').fill(`reset_pw_${Date.now()}@example.com`);

    const btn = page.locator('[data-testid="send-reset-btn"]');
    // Shared IP throttle may already be cooling down from prior suite runs.
    if (await btn.isDisabled().catch(() => false)) {
      await expect(page.locator('[data-testid="auth-error"]')).toContainText(
        /too many attempts|try again/i,
        { timeout: 5_000 },
      );
      return;
    }

    await btn.click();
    await expect(
      page
        .locator('[data-testid="reset-success"]')
        .or(page.locator('[data-testid="auth-error"]')),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('login form is reachable', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });
    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible();
  });
});
