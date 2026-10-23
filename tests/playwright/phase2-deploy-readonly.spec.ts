import { test, expect } from '@playwright/test';

/**
 * Read-only deploy verification for Phase 2 against production FE/API.
 * Does NOT login as admin, create products, upload, or mutate data.
 */
test.describe('Phase 2 deploy (read-only)', () => {
  test.describe.configure({ timeout: 120_000 });

  test('live All Products shows API totalItems and loads page 2 on scroll', async ({
    page,
  }) => {
    const listResponses: Array<{ page: number; ids: number[]; totalItems: number }> = [];

    page.on('response', async (res) => {
      if (res.request().method() !== 'GET') return;
      let u: URL;
      try {
        u = new URL(res.url());
      } catch {
        return;
      }
      if (u.pathname !== '/products' && !u.pathname.endsWith('/products')) return;
      if (u.pathname.includes('/marketplace')) return;
      try {
        const json = await res.json();
        const pageNum = Number(json?.pagination?.page ?? 0);
        if (!pageNum) return;
        listResponses.push({
          page: pageNum,
          ids: (json.data ?? []).map((p: { id: number }) => p.id),
          totalItems: Number(json.pagination?.totalItems ?? 0),
        });
      } catch {
        /* ignore */
      }
    });

    await page.goto('/marketplace/products', { waitUntil: 'networkidle' });

    const count = page.getByTestId('products-total-count');
    await expect(count).toContainText(/\d+ products found/, { timeout: 45_000 });
    const label = await count.innerText();
    const uiTotal = Number(label.match(/(\d+)\s+products found/)?.[1] ?? 0);
    expect(uiTotal).toBeGreaterThan(20);

    const cards = page.locator('[data-testid="products-grid"] > *');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const initial = await cards.count();
    expect(initial).toBe(20);

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      if (listResponses.some((r) => r.page === 2)) break;
    }

    const page1 = listResponses.find((r) => r.page === 1);
    const page2 = listResponses.find((r) => r.page === 2);
    expect(page1, 'page 1 API list').toBeTruthy();
    expect(page1!.totalItems).toBe(uiTotal);
    expect(page1!.ids.length).toBe(20);
    expect(page2, 'page 2 after scroll').toBeTruthy();
    expect(page1!.ids.filter((id) => page2!.ids.includes(id))).toEqual([]);
    expect(await cards.count()).toBeGreaterThan(20);
  });
});
