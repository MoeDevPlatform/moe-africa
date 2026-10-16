import { test, expect } from '@playwright/test';
import { artisanLogin, customerLogin } from '../helpers/authFlows';
import { IDS } from './helpers/testIds';
import {
  PLAYWRIGHT_ARTISAN_EMAIL,
  PLAYWRIGHT_CUSTOMER_EMAIL,
} from '../helpers/playwrightEnv';

/** Matches aria-label "Request a custom order from …" and visible "Request Custom Order". */
const requestCustomOrderBtn = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /request.*custom order/i });

/**
 * Commerce UI, Motion & Dashboard sprint — E2E against live Vercel.
 */
test.describe('Commerce UI sprint', () => {
  test('custom-orders discovery page loads ranked artisan cards', async ({
    page,
  }) => {
    await page.goto('/marketplace/custom-orders', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.getByRole('heading', {
        name: /Custom Orders — Handcrafted Just for You/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(
        /Work directly with a skilled artisan to create something uniquely yours/i,
      ),
    ).toBeVisible();

    const empty = page.getByText(/No artisans are accepting custom orders yet/i);
    await expect(requestCustomOrderBtn(page).first().or(empty)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('navbar exposes Custom Orders navigation', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    const direct = page.getByRole('link', { name: /^Custom Orders$/i }).first();
    if (!(await direct.isVisible().catch(() => false))) {
      const categories = page.getByRole('button', { name: /Categories/i });
      if (await categories.isVisible().catch(() => false)) {
        await categories.click();
      }
    }
    await expect(
      page.getByRole('link', { name: /Custom Orders/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: /Custom Orders/i }).first().click();
    await expect(page).toHaveURL(/\/marketplace\/custom-orders/);
  });

  test('eligible artisan card CTA navigates to #custom-order', async ({
    page,
  }) => {
    test.skip(!IDS.eligibleArtisan, 'Set PLAYWRIGHT_ELIGIBLE_ARTISAN_ID');
    await page.goto('/marketplace/custom-orders', {
      waitUntil: 'domcontentloaded',
    });
    const cta = requestCustomOrderBtn(page).first();
    await expect(cta).toBeVisible({ timeout: 30_000 });
    await cta.click();
    await expect(page).toHaveURL(/\/marketplace\/artisan\/\d+#custom-order/);
  });

  test('product detail shows custom-order callout for eligible artisan', async ({
    page,
  }) => {
    test.skip(
      !IDS.variationPriceProduct && !IDS.noVariationProduct,
      'Set PLAYWRIGHT_*_PRODUCT_ID',
    );
    const productId =
      IDS.variationPriceProduct ||
      IDS.noVariationProduct ||
      IDS.tailoringBodyTypeProduct;
    await page.goto(`/marketplace/product/${productId}`, {
      waitUntil: 'domcontentloaded',
    });
    const callout = page.getByText(/Want something different\?/i);
    if ((await callout.count()) === 0) {
      test.skip(true, 'Product fixture artisan is not custom-order eligible');
    }
    await expect(callout).toBeVisible();
    await page
      .getByRole('button', { name: /Request a Custom Order/i })
      .click();
    await expect(page).toHaveURL(/\/marketplace\/artisan\/\d+#custom-order/);
  });

  test('structured custom order form validates and submits', async ({
    page,
  }) => {
    test.skip(
      !IDS.eligibleArtisan || !PLAYWRIGHT_CUSTOMER_EMAIL,
      'Need eligible artisan + customer creds',
    );
    test.setTimeout(180_000);
    await customerLogin(page);
    await page.goto(`/marketplace/artisan/${IDS.eligibleArtisan}`, {
      waitUntil: 'domcontentloaded',
    });

    // Dismiss any leftover dialog/sheet overlay from auth redirects.
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);

    const openBtn = page.locator('[data-testid="request-custom-order-btn"]');
    await expect(openBtn).toBeVisible({ timeout: 20_000 });
    await openBtn.scrollIntoViewIfNeeded();
    await openBtn.click({ force: true });

    const dialog = page.getByRole('dialog', {
      name: /Request a custom order/i,
    });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    const descriptionField = dialog
      .locator('[data-testid="custom-order-description"]')
      .or(dialog.locator('#co-description'));
    await descriptionField.fill('Too short');
    await dialog
      .locator('[data-testid="submit-custom-order-btn"]')
      .or(dialog.getByRole('button', { name: /Submit request/i }))
      .click();
    await expect(dialog.getByRole('alert').first()).toBeVisible({
      timeout: 10_000,
    });

    await descriptionField.fill(
      'I would like a bespoke commission with detailed finishing, custom colours, and careful sizing for a special event next month.',
    );
    const minBudget = dialog.locator('#co-budgetMin');
    if (await minBudget.isVisible().catch(() => false)) {
      await minBudget.fill('20000');
      await dialog.locator('#co-budgetMax').fill('45000');
    }

    await dialog
      .locator('[data-testid="submit-custom-order-btn"]')
      .or(dialog.getByRole('button', { name: /Submit request/i }))
      .click();

    await expect(
      page.getByText(/Your custom order request has been sent/i),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('artisan dashboard shows redesigned stats and preserved tabs', async ({
    page,
  }) => {
    test.skip(!PLAYWRIGHT_ARTISAN_EMAIL, 'Set PLAYWRIGHT_ARTISAN_EMAIL');
    test.setTimeout(180_000);
    await artisanLogin(page);
    await page.goto('/artisan/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Total Products')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Average Rating')).toBeVisible();
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByRole('tab', { name: /My Products/i })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Customer Inquiries/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Business Profile/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Add Product/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Edit Business Profile/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /View Public Profile/i }),
    ).toBeVisible();
  });

  test('homepage has animated section wrappers and featured artisans', async ({
    page,
  }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(700);
    const animated = page.locator('.section-animated, .section-hidden');
    await expect(animated.first()).toBeAttached({ timeout: 15_000 });
    await expect(
      page.locator('[data-testid="featured-artisans-section"]'),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.artisan-card').first()).toBeVisible();
  });

  test('pageFadeIn keyframes are present for route transitions', async ({
    page,
  }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    const hasKeyframes = await page.evaluate(() =>
      [...document.styleSheets].some((sheet) => {
        try {
          return [...sheet.cssRules].some(
            (rule) =>
              rule instanceof CSSKeyframesRule && rule.name === 'pageFadeIn',
          );
        } catch {
          return false;
        }
      }),
    );
    expect(hasKeyframes).toBeTruthy();
  });

  test('eligible profile still exposes Request Custom Order button', async ({
    page,
  }) => {
    test.skip(!IDS.eligibleArtisan, 'Set PLAYWRIGHT_ELIGIBLE_ARTISAN_ID');
    await page.goto(`/marketplace/provider/${IDS.eligibleArtisan}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.locator('[data-testid="request-custom-order-btn"]'),
    ).toBeVisible({ timeout: 20_000 });
  });
});
