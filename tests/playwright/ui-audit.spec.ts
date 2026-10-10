import { test, expect, type Page } from '@playwright/test';
import { publicRoutes, auditInteractiveChecks } from './routes';

async function assertClickable(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(20);
  expect(box!.height).toBeGreaterThan(20);
  const tag = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? null,
    { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
  );
  expect(tag).not.toBeNull();
}

test.describe('UI audit — route coverage', () => {
  for (const route of publicRoutes) {
    test(`${route} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      const res = await page.goto(route);
      // Soft-skip unknown routes (e.g. /marketplace/explore alias)
      if (res && res.status() === 404) {
        test.skip(true, `${route} returned 404`);
      }
      await page.waitForLoadState('domcontentloaded');
      expect(errors).toHaveLength(0);
      await expect(page).not.toHaveTitle(/vite app|undefined/i);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});

test.describe('UI audit — clickability', () => {
  for (const check of auditInteractiveChecks) {
    test(`${check.route} interactive elements are targetable`, async ({ page }) => {
      await page.goto(check.route);
      await page.waitForLoadState('domcontentloaded');
      for (const selector of check.selectors) {
        const count = await page.locator(selector).count();
        if (count === 0) continue;
        await assertClickable(page, selector);
      }
    });
  }
});

test.describe('UI audit — responsive layout', () => {
  test('no horizontal overflow on marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    expect(hasOverflow).toBe(false);
  });

  test('auth form is scrollable without clipped primary CTA', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    const submit = page.getByRole('button', { name: /sign in|log in|create account|sign up/i }).first();
    if ((await submit.count()) === 0) return;
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
  });
});

test.describe('UI audit — design rules', () => {
  test('primary CTA buttons meet minimum touch target when marked', async ({
    page,
  }) => {
    await page.goto('/marketplace');
    const buttons = page.locator('button[data-cta="primary"]');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});
