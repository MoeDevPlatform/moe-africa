import { Page, expect } from '@playwright/test';
import {
  PLAYWRIGHT_ADMIN_EMAIL,
  PLAYWRIGHT_ADMIN_PASSWORD,
  PLAYWRIGHT_CUSTOMER_EMAIL,
  PLAYWRIGHT_CUSTOMER_PASSWORD,
  PLAYWRIGHT_ARTISAN_EMAIL,
  PLAYWRIGHT_ARTISAN_PASSWORD,
  requireAdminCreds,
} from './playwrightEnv';

/** Sign in via the public /auth page. */
export async function customerLogin(page: Page): Promise<void> {
  const email = PLAYWRIGHT_CUSTOMER_EMAIL;
  const password = PLAYWRIGHT_CUSTOMER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set PLAYWRIGHT_CUSTOMER_EMAIL and PLAYWRIGHT_CUSTOMER_PASSWORD in .env',
    );
  }
  await page.goto('/auth', { waitUntil: 'networkidle' });
  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/marketplace|artisan/, { timeout: 30_000 });
}

export async function artisanLogin(page: Page): Promise<void> {
  const email = PLAYWRIGHT_ARTISAN_EMAIL;
  const password = PLAYWRIGHT_ARTISAN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set PLAYWRIGHT_ARTISAN_EMAIL and PLAYWRIGHT_ARTISAN_PASSWORD in .env',
    );
  }
  await page.goto('/auth', { waitUntil: 'networkidle' });
  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/marketplace|artisan/, { timeout: 30_000 });
}

export async function adminLogin(page: Page): Promise<void> {
  requireAdminCreds();

  // Shared IP throttle with the rate-limit spec — retry after cooldown.
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill(PLAYWRIGHT_ADMIN_EMAIL);
    await page.locator('#password').fill(PLAYWRIGHT_ADMIN_PASSWORD);

    const loginResponse = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: /^sign in$/i }).click();
    const res = await loginResponse;

    if (res.status() === 429) {
      // Backend message: "try again in 1 minutes"
      await page.waitForTimeout(65_000);
      continue;
    }

    if (!res.ok()) {
      const body = await res.text().catch(() => '');
      throw new Error(`Admin login failed (${res.status()}): ${body.slice(0, 200)}`);
    }

    // Must NOT treat /admin/login as success (/admin alone is too loose).
    await expect(page).toHaveURL(/\/admin\/(dashboard|artisans|products|messages)/, {
      timeout: 30_000,
    });
    await expect(page).not.toHaveURL(/\/admin\/login/);
    return;
  }

  throw new Error('Admin login failed: still rate-limited after retries');
}
