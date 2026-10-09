import { test, expect } from '@playwright/test';
import { FRONTEND_BASE, API_BASE } from './helpers/env';
import { listPublicProducts, listPublicProviders } from './helpers/moeApi';

/**
 * Visitor-facing validation after in-place humanize of seed records.
 * Confirms no visible PW-SEED prefixes and that marketplace discovery still works.
 */
test.describe('Humanized marketplace validation (live Vercel)', () => {
  test.setTimeout(5 * 60 * 1000);

  test('public API: no PW-SEED prefixes; images load; approvals intact', async ({
    request,
  }) => {
    expect(FRONTEND_BASE).toContain('moe-africa-mvp.vercel.app');

    const providers = await listPublicProviders(request);
    const products = await listPublicProducts(request);

    const taggedProviders = providers.filter((p) =>
      /\[?\s*PW-SEED/i.test(
        `${p.brandName || ''} ${p.businessName || ''} ${p.name || ''}`,
      ),
    );
    const taggedProducts = products.filter((p) =>
      /\[?\s*PW-SEED/i.test(String(p.name || '')),
    );

    expect(
      taggedProviders,
      `Artisans still showing test prefixes: ${taggedProviders
        .slice(0, 5)
        .map((p) => p.brandName || p.businessName)
        .join(', ')}`,
    ).toEqual([]);
    expect(
      taggedProducts,
      `Products still showing test prefixes: ${taggedProducts
        .slice(0, 5)
        .map((p) => p.name)
        .join(', ')}`,
    ).toEqual([]);

    // Spot-check humanized names exist
    const brandBlob = providers
      .map((p) => p.brandName || p.businessName || '')
      .join(' | ');
    expect(brandBlob).toMatch(/Lekki Thread Atelier|Allen Avenue Menswear|Mushin Leather Lab/);

    const productBlob = products.map((p) => p.name || '').join(' | ');
    expect(productBlob).toMatch(/Indigo Ankara Wrap Dress|Padded Leather Laptop Messenger/);

    // Images present + under 2MB (Content-Length when available)
    let checked = 0;
    for (const p of products.slice(0, 40)) {
      const imgs: string[] = Array.isArray(p.images)
        ? p.images
        : p.imageUrl
          ? [p.imageUrl]
          : [];
      if (!imgs.length) continue;
      const url = imgs[0];
      expect(url, `product ${p.name} missing image url`).toBeTruthy();
      const head = await request.head(url);
      expect(head.ok() || head.status() === 200, `image failed: ${url}`).toBeTruthy();
      const len = Number(head.headers()['content-length'] || 0);
      if (len > 0) {
        expect(len, `image >= 2MB: ${url}`).toBeLessThan(2 * 1024 * 1024);
      }
      checked += 1;
    }
    expect(checked).toBeGreaterThan(10);

    // Approved visibility — public list should only include approved/visible items
    for (const p of products.filter((x) => /Lekki|Mushin|Ikoyi Canvas/i.test(String(x.name)))) {
      if (p.status) expect(String(p.status).toLowerCase()).not.toBe('pending');
    }
  });

  test('Vercel UI: marketplace looks natural; discovery/sort work', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/marketplace`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.getByText(/PW-SEED/i)).toHaveCount(0);

    await expect(
      page.getByRole('heading', { name: /Recommended Artisans/i }).first(),
    ).toBeVisible({ timeout: 45_000 });

    const sort = page.getByLabel(/Sort artisans/i);
    if (await sort.isVisible().catch(() => false)) {
      await sort.click();
      await page.getByRole('option', { name: /Recently Added/i }).click();
      await page.waitForTimeout(800);
      await expect(page.getByText(/PW-SEED/i)).toHaveCount(0);
      await sort.click();
      await page.getByRole('option', { name: /Highest Rated/i }).click();
      await page.waitForTimeout(800);
    }

    await page.goto(`${FRONTEND_BASE}/marketplace/artisans`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.getByText(/PW-SEED/i)).toHaveCount(0);

    // Search for a known humanized artisan (may not be on the first page)
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('Lekki Thread');
      await page.waitForTimeout(1200);
    }
    await expect(
      page.getByText(/Lekki Thread Atelier|Allen Avenue Menswear|Adaobi Atelier/i).first(),
    ).toBeVisible({ timeout: 45_000 });

    await page.goto(`${FRONTEND_BASE}/marketplace/products?sort=newest`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.getByText(/PW-SEED/i)).toHaveCount(0);

    // Product cards should render images (not broken placeholders only)
    const imgs = page.locator('img').filter({ hasNot: page.locator('[alt=""]') });
    await expect(imgs.first()).toBeVisible({ timeout: 30_000 });
    const src = await imgs.first().getAttribute('src');
    expect(src).toBeTruthy();
  });
});
