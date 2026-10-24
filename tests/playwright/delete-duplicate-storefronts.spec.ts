import { expect, test } from '@playwright/test';
import { adminLogin } from '../helpers/authFlows';
import { PLAYWRIGHT_API_URL } from '../helpers/playwrightEnv';

/** Duplicate user ids from the count audit. Canonical profiles are not listed. */
const DUPLICATES: { id: number; brand: string }[] = [
  { id: 26, brand: 'Adaobi Atelier Lagos' },
  { id: 64, brand: 'Adaobi Atelier Lagos' },
  { id: 27, brand: 'Okeke Menswear Studio' },
  { id: 65, brand: 'Okeke Menswear Studio' },
  { id: 28, brand: 'Ngozi Threadworks' },
  { id: 66, brand: 'Ngozi Threadworks' },
  { id: 67, brand: 'Bello Craft Collective' },
  { id: 68, brand: 'Okafor Studio Crafts' },
  { id: 69, brand: 'Amina Paper & Print' },
  { id: 70, brand: 'SoleCraft Aba' },
  { id: 71, brand: 'Chioma Heel House' },
  { id: 72, brand: 'Bakare Boots Co.' },
  { id: 73, brand: 'Beauty by Bisi' },
  { id: 74, brand: 'Zainab Naturals' },
  { id: 75, brand: 'Adeyemi Leather Lab' },
  { id: 76, brand: 'Sade Leather Atelier' },
  { id: 77, brand: 'Uche Strapworks' },
  { id: 78, brand: 'Okoro Beads & Gold' },
  { id: 79, brand: 'Yetunde Fine Jewels' },
  { id: 80, brand: 'Afolabi Home Studio' },
  { id: 81, brand: 'Sule Living' },
];

test('delete the 21 duplicate storefronts from the admin portal', async ({ page }) => {
  test.setTimeout(600_000);
  const deleted: { id: number; brand: string; status: number; url: string }[] = [];

  await adminLogin(page);

  const token = await page.evaluate(() => localStorage.getItem('moe_access_token'));
  expect(token).toBeTruthy();
  const probe = await page.request.delete(`${PLAYWRIGHT_API_URL}/admin/artisans/999999`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const probeBody = await probe.text();
  console.log('DELETE route probe', probe.status(), probeBody.slice(0, 180));
  expect(probeBody).not.toMatch(/Cannot DELETE/i);
  expect(probe.status()).toBe(404);

  for (const row of DUPLICATES) {
    await page.goto(`/admin/artisans/${row.id}`, { waitUntil: 'domcontentloaded' });
    const missing = page.getByText('Artisan not found.');
    if (await missing.isVisible().catch(() => false)) {
      console.log('already gone', row.id, row.brand);
      continue;
    }
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(row.brand, { timeout: 20_000 });

    const responsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'DELETE' &&
        /\/admin\/artisans\/\d+/.test(res.url()),
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('heading', { name: `Delete "${row.brand}"?` })).toBeVisible();
    await dialog.getByPlaceholder('Optional reason (audit)').fill('Duplicate storefront copy. Canonical profile was kept.');
    await dialog.getByRole('button', { name: 'Delete permanently' }).click();
    const response = await responsePromise;
    const url = response.url();
    if (url.includes('/admin/users/')) {
      throw new Error(`Refusing user hard-delete for ${row.id}: ${url}`);
    }
    expect(response.status(), `delete ${row.id}`).toBe(204);
    deleted.push({ id: row.id, brand: row.brand, status: response.status(), url });
    await expect(page).toHaveURL(/\/admin\/artisans\/?$/, { timeout: 20_000 });
    console.log('deleted', row.id, row.brand, response.status());
  }

  console.log('deleted count', deleted.length);

  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Total Artisans')).toBeVisible({ timeout: 20_000 });
  const dashboardText = await page.locator('main').innerText();
  console.log('DASHBOARD\n', dashboardText.slice(0, 800));

  const products = await page.request.get(`${PLAYWRIGHT_API_URL}/products?page=1&pageSize=1`);
  const artisans = await page.request.get(`${PLAYWRIGHT_API_URL}/service-providers/public-info?page=1&pageSize=100`);
  const hidden = await page.request.get(`${PLAYWRIGHT_API_URL}/service-providers/26/public-info`);
  const canonical = await page.request.get(`${PLAYWRIGHT_API_URL}/service-providers/23/public-info`);
  const product = await page.request.get(`${PLAYWRIGHT_API_URL}/products/215`);
  console.log('public products', (await products.json()).pagination);
  console.log('public artisans', (await artisans.json()).pagination);
  console.log('duplicate 26', hidden.status(), 'canonical 23', canonical.status(), 'product 215', product.status());
  expect(hidden.status()).toBe(404);
  expect(canonical.status()).toBe(200);
  expect(product.status()).toBe(200);
});

test('admin totals match the catalogue after duplicate removal', async ({ page }) => {
  test.setTimeout(90_000);
  await adminLogin(page);
  const token = await page.evaluate(() => localStorage.getItem('moe_access_token'));
  expect(token).toBeTruthy();
  const dashboard = await page.request.get(`${PLAYWRIGHT_API_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(dashboard.ok()).toBeTruthy();
  const body = await dashboard.json();
  console.log('admin totals', {
    totalArtisans: body.totalArtisans,
    totalProducts: body.totalProducts,
    totalOrders: body.totalOrders,
    artisansByStatus: body.artisansByStatus,
    productsByStatus: body.productsByStatus,
  });
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  const artisansCard = page.getByRole('link', { name: /Total Artisans/ });
  await expect(artisansCard).toContainText('52', { timeout: 20_000 });
  await expect(page.getByRole('link', { name: /Total Products/ })).toContainText('204');
  expect(body.totalArtisans).toBe(52);
  expect(body.totalProducts).toBe(204);

  const duplicateProduct = await page.request.get(`${PLAYWRIGHT_API_URL}/products/66`);
  const canonicalProduct = await page.request.get(`${PLAYWRIGHT_API_URL}/products/51`);
  const duplicateBody = await duplicateProduct.json();
  const canonicalBody = await canonicalProduct.json();
  console.log('product 66', duplicateProduct.status(), duplicateBody.code || duplicateBody.id);
  console.log('product 51', canonicalProduct.status(), canonicalBody.id, canonicalBody.name);
  expect(duplicateBody.code).toBe('RESOURCE_NOT_FOUND');
  expect(canonicalBody.id).toBe(51);
});
