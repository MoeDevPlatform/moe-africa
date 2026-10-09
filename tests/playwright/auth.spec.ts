import { test, expect } from '@playwright/test';
import { PLAYWRIGHT_ADMIN_EMAIL } from '../helpers/playwrightEnv';

test.describe('Auth', () => {
  test('duplicate email shows correct error', async ({ page }) => {
    await page.goto('/auth?tab=signup', { waitUntil: 'networkidle' });
    // Prefer signup tab trigger if present
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    if (await signupTab.isVisible().catch(() => false)) {
      await signupTab.click();
    }

    const existingEmail = PLAYWRIGHT_ADMIN_EMAIL || 'existing@test.com';
    await page.locator('#signup-email, [name="email"]').last().fill(existingEmail);
    await page.locator('#signup-first-name, [name="firstName"]').fill('Test').catch(() => {});
    await page.locator('#signup-last-name, [name="lastName"]').fill('User').catch(() => {});
    // Fill first/last if labeled differently
    const first = page.getByLabel(/first name/i);
    if (await first.isVisible().catch(() => false)) await first.fill('Test');
    const last = page.getByLabel(/last name/i);
    if (await last.isVisible().catch(() => false)) await last.fill('User');

    await page.locator('#signup-password, [name="password"]').last().fill('Test@1234');
    const confirm = page.getByLabel(/confirm password/i);
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.fill('Test@1234');
    }

    await page.locator('[data-testid="signup-btn"]').or(page.getByRole('button', { name: /sign up|create account/i })).click();

    await expect(
      page.locator('[data-testid="auth-error"]').or(page.getByText('Email or Password already in use')),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('forgot password flow shows success message', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });
    await page.click('text=Forgot password?');
    await page.fill('[name="resetEmail"], #reset-email', 'any@email.com');
    await page.click('[data-testid="send-reset-btn"]');
    await expect(page.locator('[data-testid="reset-success"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('login form is reachable', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });
    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible();
  });
});
