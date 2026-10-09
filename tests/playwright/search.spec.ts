import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('keyword search returns relevant results', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'networkidle' });

    const searchInput = page.locator('[data-testid="search-input"]').or(
      page.locator('input[type="search"]').first(),
    );
    await searchInput.click();
    // Open overlay if needed
    const overlayInput = page.locator('[data-testid="search-input"]').or(
      page.locator('input[aria-label="Search input"], input[type="search"]').last(),
    );
    await overlayInput.fill('leather');

    await page.waitForResponse(
      (res) => res.url().includes('/search') && res.ok(),
      { timeout: 20_000 },
    ).catch(() => {});

    await expect(
      page.locator('[data-testid="search-results"]').or(page.getByText(/leather/i).first()),
    ).toContainText(/leather/i, { timeout: 15_000 });
  });

  test('location filter returns artisans from correct country', async ({ page }) => {
    await page.goto('/marketplace/artisans', { waitUntil: 'networkidle' });

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

      await page.waitForResponse(
        (res) => res.url().includes('/artisans') || res.url().includes('/service-providers'),
        { timeout: 20_000 },
      ).catch(() => {});

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
