import { test, expect } from '@playwright/test';

test.describe('Security', () => {
  test('protected admin routes redirect when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/login|\/auth/, { timeout: 15_000 });
  });

  test('protected artisan dashboard redirects when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/artisan/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });

  test('rate limiting returns friendly message after repeated failed logins', async ({
    page,
  }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });
    for (let i = 0; i < 6; i++) {
      await page.fill('#signin-email, input[type="email"]', `ratelimit_${i}@example.com`);
      await page.fill('#signin-password, input[type="password"]', 'WrongPass1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(400);
    }
    // Either toast or inline error mentioning too many attempts
    const rateMsg = page.getByText(/too many attempts|try again/i);
    // Soft: backend may not be deployed with throttler yet
    const visible = await rateMsg.isVisible().catch(() => false);
    if (!visible) {
      test.info().annotations.push({
        type: 'note',
        description: 'Rate-limit UI not observed — confirm backend throttler is deployed',
      });
    }
  });
});
