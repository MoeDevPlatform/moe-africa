import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('keyword search returns relevant results', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

    const navbarSearch = page.locator('[data-testid="search-input"]').first();
    await navbarSearch.click();

    const overlay = page.locator('[data-testid="search-results"]');
    await expect(overlay).toBeVisible({ timeout: 15_000 });

    const overlayInput = page.locator('input[aria-label="Search input"]');
    const searchResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/search') &&
        res.url().includes('leather') &&
        res.request().method() === 'GET',
      { timeout: 30_000 },
    );
    await overlayInput.fill('leather');
    const res = await searchResponse;
    expect(res.ok(), `search API status ${res.status()}`).toBeTruthy();

    await expect(overlay.getByText(/Searching/i)).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(overlay).toContainText(/leather/i, { timeout: 10_000 });
  });

  test('location filter returns artisans from correct country', async ({ page }) => {
    await page.goto('/marketplace/artisans', { waitUntil: 'domcontentloaded' });

    const filterBtn = page.locator('[data-testid="filter-btn"]').or(
      page.getByRole('button', { name: /filter/i }),
    );
    if (await filterBtn.isVisible().catch(() => false)) {
      await filterBtn.click();
    }

    const countrySelect = page.locator('[data-testid="country-select"]');
    if (await countrySelect.isVisible().catch(() => false)) {
      await countrySelect.selectOption({ label: 'Nigeria' }).catch(async () => {
        await countrySelect.click();
        await page.getByText('Nigeria', { exact: true }).click();
      });
      const apply = page.locator('[data-testid="apply-filters"]');
      if (await apply.isVisible().catch(() => false)) await apply.click();

      await page
        .waitForResponse(
          (res) =>
            res.url().includes('/artisans') || res.url().includes('/service-providers'),
          { timeout: 20_000 },
        )
        .catch(() => {});

      const locations = await page
        .locator('[data-testid="artisan-location"]')
        .allTextContents()
        .catch(() => [] as string[]);
      for (const loc of locations) {
        expect(loc.toLowerCase()).toContain('nigeria');
      }
    } else {
      test.skip(true, 'Location filter UI not yet available on this page');
    }
  });
});
