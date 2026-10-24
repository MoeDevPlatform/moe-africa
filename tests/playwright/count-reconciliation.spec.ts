import { expect, test } from '@playwright/test';

/**
 * Read-only check that public catalogue totals match the live API.
 * Does not sign in, and does not create or change records.
 */
test.describe('public catalogue counts', () => {
  test.setTimeout(180_000);

  test('All Products total, pages, filters, and a detail link', async ({ page }) => {
    const productResponses: { url: string; totalItems?: number; page?: number; pageSize?: number; ids: number[] }[] = [];
    const failed: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('response', async (res) => {
      const url = res.url();
      if (res.status() >= 400 && url.includes('/products')) failed.push(`${res.status()} ${url}`);
      if (!url.includes('/products?') && !url.includes('/products&')) return;
      if (res.request().method() !== 'GET' || res.status() !== 200) return;
      try {
        const body = await res.json();
        const rows = Array.isArray(body?.data) ? body.data : [];
        productResponses.push({
          url,
          totalItems: body?.pagination?.totalItems,
          page: body?.pagination?.page,
          pageSize: body?.pagination?.pageSize,
          ids: rows.map((row: { id?: number }) => Number(row.id)),
        });
      } catch {
        /* non-json */
      }
    });

    await page.goto('/marketplace/products');
    const total = page.getByTestId('products-total-count');
    await expect(total).toContainText('products found');
    const shown = Number((await total.innerText()).match(/(\d+)/)?.[1]);
    const first = productResponses.at(-1);
    console.log('PRODUCTS displayed', shown, 'api', first);

    const ids = new Set<string>();
    let stalled = 0;
    for (let i = 0; i < 15; i++) {
      const cards = page.locator('[data-product-id]');
      const count = await cards.count();
      for (let n = 0; n < count; n++) {
        ids.add((await cards.nth(n).getAttribute('data-product-id')) || '');
      }
      console.log('PRODUCTS batch', i, 'cards', count, 'unique', ids.size);
      if (ids.size >= shown) break;
      const before = count;
      await cards.last().scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      const after = await page.locator('[data-product-id]').count();
      stalled = after === before ? stalled + 1 : 0;
      if (stalled >= 3) break;
    }
    const endCount = await page.locator('[data-product-id]').count();
    console.log('PRODUCTS scrolled cards', endCount, 'unique', ids.size, 'responses', productResponses.map((row) => [row.page, row.ids.length, row.totalItems]));
    expect(shown).toBe(first?.totalItems);
    expect(ids.size).toBe(shown);
    expect(endCount).toBe(shown);
    expect(failed).toEqual([]);

    await page.goto('/marketplace/products?category=leatherwork');
    await expect(total).toContainText('products found');
    const categoryShown = Number((await total.innerText()).match(/(\d+)/)?.[1]);
    const categoryApi = productResponses.filter((row) => row.url.includes('category=leatherwork')).at(-1);
    console.log('CATEGORY displayed', categoryShown, 'api', categoryApi?.totalItems, categoryApi?.pageSize);
    expect(categoryShown).toBe(categoryApi?.totalItems);

    await page.goto('/marketplace/products?q=leather');
    await expect(total).toContainText('products found');
    const searchShown = Number((await total.innerText()).match(/(\d+)/)?.[1]);
    const searchApi = productResponses.filter((row) => row.url.includes('q=leather')).at(-1);
    console.log('SEARCH displayed', searchShown, 'api', searchApi?.totalItems);
    expect(searchShown).toBe(searchApi?.totalItems);
    expect(searchShown).toBeLessThan(shown);

    const card = page.locator('[data-product-id]').first();
    const productId = await card.getAttribute('data-product-id');
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/marketplace/product/${productId}`));
    console.log('PRODUCT detail', page.url(), 'consoleErrors', consoleErrors.length);
  });

  test('All Artisans total, scroll, filters, and a detail link', async ({ page }) => {
    const artisanResponses: { url: string; totalItems?: number; pageSize?: number; rows: number }[] = [];
    const failed: string[] = [];
    page.on('response', async (res) => {
      const url = res.url();
      if (res.status() >= 400 && url.includes('service-providers')) failed.push(`${res.status()} ${url}`);
      if (!url.includes('/service-providers/public-info') || res.status() !== 200) return;
      try {
        const body = await res.json();
        artisanResponses.push({
          url,
          totalItems: body?.pagination?.totalItems,
          pageSize: body?.pagination?.pageSize,
          rows: Array.isArray(body?.data) ? body.data.length : 0,
        });
      } catch {
        /* non-json */
      }
    });

    await page.goto('/marketplace/artisans');
    const total = page.getByTestId('artisans-total-count');
    await expect(total).toContainText('artisans found', { timeout: 30_000 });
    const shown = Number((await total.innerText()).match(/(\d+)/)?.[1]);
    const names = page.getByTestId('artisan-name');
    const initial = await names.count();
    console.log('ARTISANS displayed', shown, 'initial cards', initial, 'api', artisanResponses.at(-1));

    for (let i = 0; i < 8; i++) {
      if (await page.getByTestId('artisans-end').isVisible().catch(() => false)) break;
      await page.getByTestId('artisans-load-more').scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(400);
    }
    await expect(page.getByTestId('artisans-end')).toBeVisible();
    const endCount = await names.count();
    const seen = new Set<string>();
    for (let n = 0; n < endCount; n++) seen.add((await names.nth(n).innerText()).trim());
    console.log('ARTISANS scrolled', endCount, 'unique names', seen.size);
    expect(shown).toBe(artisanResponses[0]?.totalItems);
    expect(endCount).toBe(shown);
    expect(initial).toBeLessThanOrEqual(20);
    expect(failed).toEqual([]);

    await page.goto('/marketplace/artisans?category=tailoring');
    await expect(total).toContainText('artisans found');
    const categoryShown = Number((await total.innerText()).match(/(\d+)/)?.[1]);
    console.log('ARTISAN CATEGORY displayed', categoryShown);
    expect(categoryShown).toBeGreaterThan(0);
    expect(categoryShown).toBeLessThan(shown);

    await page.goto('/marketplace/artisans?q=Adaobi');
    await expect(total).toContainText('artisans found');
    const searchShown = Number((await total.innerText()).match(/(\d+)/)?.[1]);
    console.log('ARTISAN SEARCH displayed', searchShown);
    expect(searchShown).toBeGreaterThan(0);
    expect(searchShown).toBeLessThan(shown);

    const profile = page.getByRole('button', { name: 'View Profile' }).first();
    await profile.click();
    await expect(page).toHaveURL(/\/marketplace\/provider\/\d+/);
    console.log('ARTISAN detail', page.url());
  });
});
