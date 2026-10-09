import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  FRONTEND_BASE,
  requireAdminCredentials,
  SEED_TAG,
} from './env';

/** Only the current run's tagged rows — never other artisans/products or older seed runs. */
function rowLooksLikeSeed(text: string): boolean {
  return text.includes(SEED_TAG);
}

/** Sign in through the live admin portal UI (/admin/login). Never logs the password. */
export async function signInAdminViaUi(page: Page): Promise<void> {
  requireAdminCredentials();

  await page.goto(`${FRONTEND_BASE}/admin/login`, {
    waitUntil: 'domcontentloaded',
  });

  // Extra verification (CAPTCHA / 2FA / Clerk challenge) — pause for a human.
  const challenge = page.getByText(
    /captcha|verify your identity|two-factor|2fa|enter the code|authentication app/i,
  );
  if (await challenge.isVisible().catch(() => false)) {
    throw new Error(
      'Admin login requires additional verification. Please complete it in the browser, then re-run the seed.',
    );
  }

  await page.locator('#email').fill(ADMIN_EMAIL);
  await page.locator('#password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /^Sign In$/i }).click();

  const denied = page.getByText(/Access denied|Invalid credentials|admin accounts only/i);
  await Promise.race([
    page.waitForURL(/\/admin(\/dashboard)?\/?$/, { timeout: 60_000 }),
    denied.waitFor({ state: 'visible', timeout: 60_000 }).then(async () => {
      throw new Error(
        'Admin portal sign-in failed (access denied or invalid credentials). ' +
          'Check ADMIN_EMAIL / ADMIN_PASSWORD in .env — password is never logged.',
      );
    }),
  ]);

  await expect(page.getByText(/Marketplace activity|Dashboard|Pending/i).first()).toBeVisible({
    timeout: 30_000,
  });
}

async function setStatusFilter(page: Page, status: string): Promise<void> {
  const trigger = page.locator('button').filter({ hasText: /All statuses|Pending|Approved|Rejected|Draft/i }).first();
  await trigger.click();
  await page.getByRole('option', { name: new RegExp(`^${status}$`, 'i') }).click();
  await page.waitForTimeout(800);
}

async function confirmApproveDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole('button', { name: /^Confirm$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
}

/**
 * Approve every pending seed artisan visible in the admin portal.
 * Only touches rows tagged with PW-SEED / moe-pw-seed.test — never other artisans.
 */
export async function approveSeedArtisansViaAdminUi(
  page: Page,
  expectedCount: number,
): Promise<number> {
  await page.goto(`${FRONTEND_BASE}/admin/artisans?status=pending`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByRole('heading', { name: /^Artisans$/i })).toBeVisible({
    timeout: 30_000,
  });
  await setStatusFilter(page, 'Pending');

  let approved = 0;
  const maxIterations = expectedCount * 4 + 20;

  for (let i = 0; i < maxIterations && approved < expectedCount; i++) {
    const rows = page.locator('table tbody tr');
    await expect(page.locator('table')).toBeVisible({ timeout: 30_000 });

    const count = await rows.count();
    let targetIndex = -1;
    for (let r = 0; r < count; r++) {
      const text = (await rows.nth(r).innerText()).replace(/\s+/g, ' ');
      if (!rowLooksLikeSeed(text)) continue;
      if (!/pending/i.test(text)) continue;
      const approveBtn = rows.nth(r).getByRole('button', { name: /Approve/i });
      if (await approveBtn.isVisible().catch(() => false)) {
        targetIndex = r;
        break;
      }
    }

    if (targetIndex >= 0) {
      await rows.nth(targetIndex).getByRole('button', { name: /Approve/i }).click();
      await confirmApproveDialog(page);
      approved += 1;
      continue;
    }

    // No seed row on this page — try Next
    const next = page.getByRole('button', { name: /^Next$/i });
    if (await next.isEnabled().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(800);
      continue;
    }

    // Reload pending list once more in case of lag
    await page.reload({ waitUntil: 'domcontentloaded' });
    await setStatusFilter(page, 'Pending');
    const remaining = page.locator('table tbody tr').filter({ hasText: SEED_TAG });
    if ((await remaining.count()) === 0) break;
  }

  return approved;
}

/**
 * Approve every pending seed product via the admin portal Products page.
 */
export async function approveSeedProductsViaAdminUi(
  page: Page,
  expectedCount: number,
): Promise<number> {
  await page.goto(`${FRONTEND_BASE}/admin/products?status=pending`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByRole('heading', { name: /^Products$/i })).toBeVisible({
    timeout: 30_000,
  });
  await setStatusFilter(page, 'Pending');

  let approved = 0;
  const maxIterations = expectedCount * 4 + 40;

  for (let i = 0; i < maxIterations && approved < expectedCount; i++) {
    const rows = page.locator('table tbody tr');
    await expect(page.locator('table')).toBeVisible({ timeout: 30_000 });

    const count = await rows.count();
    let targetIndex = -1;
    for (let r = 0; r < count; r++) {
      const text = (await rows.nth(r).innerText()).replace(/\s+/g, ' ');
      if (!rowLooksLikeSeed(text)) continue;
      if (!/pending/i.test(text)) continue;
      const approveBtn = rows.nth(r).getByRole('button', { name: /Approve/i });
      if (await approveBtn.isVisible().catch(() => false)) {
        targetIndex = r;
        break;
      }
    }

    if (targetIndex >= 0) {
      await rows.nth(targetIndex).getByRole('button', { name: /Approve/i }).click();
      await confirmApproveDialog(page);
      approved += 1;
      continue;
    }

    const next = page.getByRole('button', { name: /^Next$/i });
    if (await next.isEnabled().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(800);
      continue;
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await setStatusFilter(page, 'Pending');
    const remaining = page.locator('table tbody tr').filter({ hasText: SEED_TAG });
    if ((await remaining.count()) === 0) break;
  }

  return approved;
}

/** Count seed rows currently shown under an admin status filter. */
export async function countSeedRowsInAdmin(
  page: Page,
  kind: 'artisans' | 'products',
  status: 'Pending' | 'Approved',
): Promise<number> {
  const path =
    kind === 'artisans'
      ? `${FRONTEND_BASE}/admin/artisans?status=${status.toLowerCase()}`
      : `${FRONTEND_BASE}/admin/products?status=${status.toLowerCase()}`;
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await setStatusFilter(page, status);

  let total = 0;
  for (let pageNum = 0; pageNum < 30; pageNum++) {
    await expect(page.locator('table')).toBeVisible({ timeout: 30_000 });
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    for (let r = 0; r < count; r++) {
      const text = await rows.nth(r).innerText();
      if (rowLooksLikeSeed(text) && text.toLowerCase().includes(status.toLowerCase())) {
        total += 1;
      }
    }
    const next = page.getByRole('button', { name: /^Next$/i });
    if (!(await next.isEnabled().catch(() => false))) break;
    await next.click();
    await page.waitForTimeout(600);
  }
  return total;
}
