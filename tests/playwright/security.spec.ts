import { test, expect } from '@playwright/test';

test.describe('Security', () => {
  test('protected admin routes redirect when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin\/login|\/auth/, { timeout: 15_000 });
  });

  test('protected artisan dashboard redirects when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/artisan/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });

  test('rate limiting returns friendly message after repeated failed logins', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    // Same identity so the backend throttle bucket is shared (≈3 attempts → 429).
    const email = `ratelimit_pw_${Date.now()}@example.com`;
    const authError = page.locator('[data-testid="auth-error"]');
    const submit = page.getByRole('button', { name: /sign in|try again/i });

    for (let i = 0; i < 6; i++) {
      if (await authError.isVisible().catch(() => false)) {
        const t = (await authError.textContent()) || '';
        if (/too many attempts|try again/i.test(t)) break;
      }

      await page.locator('#signin-email').fill(email);
      await page.locator('#signin-password').fill('WrongPass1!');

      // If cooldown already active, the message should be visible.
      if (await submit.isDisabled().catch(() => false)) break;

      const respPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/auth/login') && res.request().method() === 'POST',
        { timeout: 20_000 },
      );
      await submit.click();
      const res = await respPromise.catch(() => null);
      if (res?.status() === 429) break;
    }

    await expect(authError).toContainText(/too many attempts|try again/i, {
      timeout: 15_000,
    });
  });
});
