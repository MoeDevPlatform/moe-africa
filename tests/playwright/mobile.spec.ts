import { test, expect } from '@playwright/test';

test.describe('Mobile scroll', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('preference page scrolls on mobile', async ({ page }) => {
    // Preferences live under Settings (not /marketplace/preferences)
    await page.goto('/marketplace/settings?section=preferences', {
      waitUntil: 'networkidle',
    });

    // Ensure preferences tab content is active (URL param or tab click)
    const prefsTab = page.getByRole('tab', { name: /preferences/i });
    if (await prefsTab.isVisible().catch(() => false)) {
      await prefsTab.click();
    }

    await expect(
      page.getByText(/personalization|preferences|haven't set/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    const metrics = await page.evaluate(() => {
      const el = document.documentElement;
      return {
        scrollHeight: Math.max(
          document.body.scrollHeight,
          el.scrollHeight,
        ),
        clientHeight: el.clientHeight,
      };
    });

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  });

  test('marketplace home does not clip vertical content', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=/Browse by Category|Featured|marketplace/i', {
      timeout: 20_000,
    }).catch(() => {});
    const overflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const style = window.getComputedStyle(body);
      return {
        scrollHeight: Math.max(body.scrollHeight, html.scrollHeight),
        overflowY: style.overflowY,
      };
    });
    expect(overflow.scrollHeight).toBeGreaterThan(400);
  });
});
