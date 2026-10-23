import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adminLogin } from '../helpers/authFlows';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isProductsListApi(url: string): boolean {
  // Match Nest list endpoint, not the SPA route /marketplace/products
  try {
    const u = new URL(url);
    return (
      (u.pathname === '/products' || u.pathname.endsWith('/products')) &&
      !u.pathname.includes('/marketplace')
    );
  } catch {
    return false;
  }
}

/**
 * Phase 2 — local isolated verification only.
 * Requires:
 *   PLAYWRIGHT_BASE_URL=http://localhost:8080
 *   VITE_API_BASE_URL=http://localhost:3000 (FE .env)
 *   PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD for local moe_dev admin
 *
 * Must NOT target production VPS for mutating tests.
 */
test.describe('Phase 2 catalogue (local)', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    const base = process.env.PLAYWRIGHT_BASE_URL || '';
    test.skip(
      /vercel\.app|moe-africa\.com|duckdns/i.test(base),
      `Refusing mutating/local Phase 2 suite against non-local baseURL (${base || 'unset'}). Set PLAYWRIGHT_BASE_URL=http://localhost:8080`,
    );
  });

  test('All Products: totalItems, first page of 20, scroll loads next unique batch', async ({
    page,
  }) => {
    const listResponses: Array<{ page: number; ids: number[]; totalItems: number }> = [];

    page.on('response', async (res) => {
      if (res.request().method() !== 'GET' || !isProductsListApi(res.url())) return;
      try {
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        const pageNum = Number(json?.pagination?.page ?? 0);
        if (!pageNum) return;
        listResponses.push({
          page: pageNum,
          ids: data.map((p: { id: number }) => p.id),
          totalItems: Number(json?.pagination?.totalItems ?? 0),
        });
      } catch {
        /* ignore non-json */
      }
    });

    await page.goto('/marketplace/products', { waitUntil: 'networkidle' });

    const countText = page.getByTestId('products-total-count');
    await expect(countText).toContainText(/\d+ products found/, { timeout: 30_000 });

    const totalLabel = await countText.innerText();
    const totalMatch = totalLabel.match(/(\d+)\s+products found/);
    expect(totalMatch).toBeTruthy();
    const uiTotal = Number(totalMatch![1]);
    expect(uiTotal).toBeGreaterThan(20);

    await expect(page.getByTestId('products-grid')).toBeVisible();
    const firstBatch = page.locator('[data-testid="products-grid"] a, [data-testid="products-grid"] [href*="/marketplace/product/"]');
    // ProductCard may wrap differently — count cards by product links or article/root
    const cards = page.locator('[data-testid="products-grid"] > *');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThanOrEqual(20);
    expect(initialCount).toBeLessThanOrEqual(20);

    // Scroll until page 2 loads or end marker
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      if (listResponses.some((r) => r.page === 2)) break;
      const after = await cards.count();
      if (after > initialCount) break;
    }

    const page1 = listResponses.find((r) => r.page === 1);
    const page2 = listResponses.find((r) => r.page === 2);
    expect(page1, 'expected GET /products page=1').toBeTruthy();
    expect(page1!.ids.length).toBe(20);
    expect(page1!.totalItems).toBe(uiTotal);
    expect(page2, 'expected GET /products page=2 after scroll').toBeTruthy();
    expect(page2!.ids.length).toBeGreaterThan(0);

    const overlap = page1!.ids.filter((id) => page2!.ids.includes(id));
    expect(overlap, 'no duplicate product ids across pages').toEqual([]);

    const afterCount = await cards.count();
    expect(afterCount).toBeGreaterThan(initialCount);
    expect(afterCount).toBeLessThanOrEqual(uiTotal);

    // Console error check (ignore benign known noise)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.waitForTimeout(500);
    const blocking = consoleErrors.filter(
      (t) => !/Download the React DevTools|favicon|net::ERR_ABORTED/i.test(t),
    );
    expect(blocking, `console errors: ${blocking.join(' | ')}`).toEqual([]);
  });

  test('All Products: filter/search resets pagination and updates total', async ({ page }) => {
    await page.goto('/marketplace/products', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('products-total-count')).toContainText(/\d+ products found/, {
      timeout: 30_000,
    });

    const resPromise = page.waitForResponse(
      (res) =>
        isProductsListApi(res.url()) &&
        res.url().includes('q=') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 30_000 },
    );
    await page.goto('/marketplace/products?q=Phase2%20Seed', { waitUntil: 'domcontentloaded' });
    const res = await resPromise;
    const body = await res.json();
    const apiTotal = Number(body?.pagination?.totalItems ?? 0);
    expect(apiTotal).toBeGreaterThan(0);

    await expect(page.getByTestId('products-total-count')).toHaveText(
      `${apiTotal} products found`,
      { timeout: 15_000 },
    );
    await expect(page.getByRole('heading', { name: /Results for/i })).toBeVisible();
  });

  test('Admin Add Product: create with artisan + image persists', async ({ page }) => {
    const fixture = path.join(__dirname, 'fixtures', 'phase2-upload.png');
    test.skip(!fs.existsSync(fixture), `Missing fixture ${fixture}`);

    await adminLogin(page);
    await page.goto('/admin/products', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('add-product-btn')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('add-product-btn').click();

    const productName = `Phase2 Admin Create ${Date.now()}`;

    await page.getByTestId('admin-product-artisan').click();
    await page.getByRole('option').first().click();

    await page.getByTestId('admin-product-name').fill(productName);
    await page.getByTestId('admin-product-description').fill('Created by Phase 2 Playwright on local moe_dev');
    await page.getByTestId('admin-product-category').click();
    await page.getByRole('option', { name: /tailor/i }).first().click();
    await page.getByTestId('admin-product-price-min').fill('12000');
    await page.getByTestId('admin-product-price-max').fill('15000');
    await page.getByTestId('admin-product-eta').fill('7 days');

    const uploadPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/admin/products/upload-image') &&
        res.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await page.getByTestId('admin-product-images').setInputFiles(fixture);
    const uploadRes = await uploadPromise;
    expect(uploadRes.ok(), `upload status ${uploadRes.status()}`).toBeTruthy();
    const uploadBody = await uploadRes.json();
    expect(uploadBody.url || uploadBody.imageUrl).toBeTruthy();
    await expect(page.getByTestId('admin-product-image-previews')).toBeVisible({
      timeout: 15_000,
    });

    const createPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/admin/products') &&
        !res.url().includes('upload-image') &&
        res.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await page.getByTestId('admin-product-create-submit').click();
    const createRes = await createPromise;
    const createText = await createRes.text();
    expect(createRes.ok(), `create failed ${createRes.status()}: ${createText.slice(0, 300)}`).toBeTruthy();
    await expect(page.getByTestId('success-toast')).toBeVisible({ timeout: 15_000 });

    // Persist after refresh
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByPlaceholder(/search/i).fill(productName);
    await expect(page.getByRole('cell', { name: productName }).or(page.getByText(productName, { exact: true })).first()).toBeVisible({
      timeout: 20_000,
    });

    // Public catalogue can see approved admin-created product
    await page.goto(`/marketplace/products?q=${encodeURIComponent(productName)}`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.getByTestId('products-grid').getByRole('heading', { name: productName }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
