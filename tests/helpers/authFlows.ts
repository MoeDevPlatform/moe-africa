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
  await page.fill('#signin-email, [name="email"], input[type="email"]', email);
  await page.fill('#signin-password, [name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
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
  await page.fill('#signin-email, [name="email"], input[type="email"]', email);
  await page.fill('#signin-password, [name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/marketplace|artisan/, { timeout: 30_000 });
}

export async function adminLogin(page: Page): Promise<void> {
  requireAdminCreds();
  await page.goto('/admin/login', { waitUntil: 'networkidle' });
  await page.fill('#email, input[type="email"]', PLAYWRIGHT_ADMIN_EMAIL);
  await page.fill('#password, input[type="password"]', PLAYWRIGHT_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin(\/dashboard)?/, { timeout: 30_000 });
}
