import { expect, test } from '@playwright/test';
import { adminLogin } from '../helpers/authFlows';
import { PLAYWRIGHT_API_URL } from '../helpers/playwrightEnv';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function localDay(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

test('admin product dates filter the full catalogue', async ({ page }) => {
  test.setTimeout(180_000);
  const name = `PW date ${Date.now()}`;
  const today = localDay();

  await adminLogin(page);
  await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('columnheader', { name: 'Date created' })).toBeVisible();

  await page.getByTestId('add-product-btn').click();
  await page.getByTestId('admin-product-name').fill(name);
  await page.getByTestId('admin-product-eta').fill('5 days');
  await page.getByTestId('admin-product-artisan').click();
  await page.getByTestId('admin-product-artisan-search').fill('Phase2');
  await page.getByRole('option', { name: /Phase2/ }).first().click();
  await page.getByTestId('admin-product-images').setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  const preview = page.getByTestId('admin-product-image-previews');
  const uploadError = page.getByTestId('admin-product-image-error');
  await expect(preview.or(uploadError)).toBeVisible({ timeout: 20_000 });
  if (await uploadError.isVisible()) {
    throw new Error(`Image upload failed: ${await uploadError.innerText()}`);
  }

  const createdResponse = page.waitForResponse(
    (res) => res.url().includes('/admin/products') && res.request().method() === 'POST' && res.ok(),
  );
  await page.getByTestId('admin-product-create-submit').click();
  const createdBody = await (await createdResponse).json();
  console.log('created', {
    id: createdBody.id,
    createdAt: createdBody.createdAt,
    updatedAt: createdBody.updatedAt,
  });
  expect(createdBody.createdAt).toBeTruthy();
  expect(createdBody.updatedAt).toBeTruthy();
  const createdAt = createdBody.createdAt as string;

  await page.getByTestId('admin-product-search').fill(name);
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByTestId('product-created-at')).not.toHaveText('—');

  await row.getByRole('link').click();
  await expect(page.getByTestId('product-detail-created')).toContainText('Created');
  await page.getByRole('button', { name: 'Draft' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Product set to draft')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('product-detail-created')).toContainText(
    new Date(createdAt).getDate().toString(),
  );
  const token = await page.evaluate(() => localStorage.getItem('moe_access_token'));
  const detail = await page.request.get(`${PLAYWRIGHT_API_URL}/admin/products/${createdBody.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const after = await detail.json();
  console.log('after edit', { createdAt: after.createdAt, updatedAt: after.updatedAt, status: after.status });
  expect(after.createdAt).toBe(createdAt);
  expect(after.status).toBe('draft');
  expect(new Date(after.updatedAt).getTime()).toBeGreaterThan(new Date(createdBody.updatedAt).getTime());

  await page.goto('/admin/products');
  await page.getByTestId('admin-product-search').fill(name);
  await page.getByTestId('admin-product-status').click();
  await page.getByRole('option', { name: 'Draft' }).click();
  await page.getByTestId('admin-product-created').click();
  await page.getByRole('option', { name: 'Custom range' }).click();
  await page.getByTestId('admin-product-date-from').fill(today);
  await page.getByTestId('admin-product-date-to').fill(today);
  await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible({ timeout: 15_000 });
  const included = page.getByTestId('admin-products-total');
  await expect(included).toContainText('1 total');

  await page.getByTestId('admin-product-date-from').fill('2020-01-01');
  await page.getByTestId('admin-product-date-to').fill('2020-01-02');
  await expect(page.getByText('No products match these filters.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('admin-products-total')).toContainText('0 total');

  await page.getByTestId('admin-product-clear').click();
  await expect(page.getByTestId('admin-product-search')).toHaveValue('');

  const oldestResponse = page.waitForResponse(
    (res) => res.url().includes('/admin/products') && res.url().includes('sort=oldest') && res.ok(),
  );
  await page.getByTestId('admin-product-sort').click();
  await page.getByRole('option', { name: 'Oldest first' }).click();
  const oldest = await (await oldestResponse).json();
  const oldestTimes = (oldest.data as { createdAt: string; id: number }[]).map((row) => ({
    id: row.id,
    time: new Date(row.createdAt).getTime(),
  }));
  for (let i = 1; i < oldestTimes.length; i++) {
    const prev = oldestTimes[i - 1];
    const next = oldestTimes[i];
    expect(prev.time < next.time || (prev.time === next.time && prev.id < next.id)).toBeTruthy();
  }

  const newestResponse = page.waitForResponse(
    (res) => res.url().includes('/admin/products') && res.url().includes('sort=newest') && res.ok(),
  );
  await page.getByTestId('admin-product-sort').click();
  await page.getByRole('option', { name: 'Newest first' }).click();
  const newest = await (await newestResponse).json();
  const newestTimes = (newest.data as { createdAt: string; id: number }[]).map((row) => ({
    id: row.id,
    time: new Date(row.createdAt).getTime(),
  }));
  for (let i = 1; i < newestTimes.length; i++) {
    const prev = newestTimes[i - 1];
    const next = newestTimes[i];
    expect(prev.time > next.time || (prev.time === next.time && prev.id > next.id)).toBeTruthy();
  }
  console.log('page totals', { oldest: oldest.pagination, newest: newest.pagination });
  expect(newest.pagination.totalItems).toBe(oldest.pagination.totalItems);
  expect(newest.pagination.pageSize).toBe(20);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('columnheader', { name: 'Date created' })).toBeVisible();
  await expect(page.getByTestId('admin-product-created')).toBeVisible();

  await page.getByTestId('admin-product-search').fill(name);
  const cleanup = page.getByRole('row', { name: new RegExp(name) });
  await expect(cleanup).toBeVisible({ timeout: 15_000 });
  page.once('dialog', (dialog) => dialog.accept());
  await cleanup.getByRole('button', { name: `Delete ${name}` }).click();
  const confirm = page.getByRole('alertdialog').getByRole('button', { name: /Delete|Remove|Confirm/i });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
});
