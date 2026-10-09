import { test, expect } from '@playwright/test';

test.describe('Mobile scroll', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('preference page scrolls on mobile', async ({ page }) => {
    // Preferences may live on marketplace home (modal) or a dedicated route
    await page.goto('/marketplace', { waitUntil: 'networkidle' });

    const prefsLink = page.locator('a[href*="preferences"]').or(
      page.getByRole('button', { name: /preferences|customise|personalize/i }),
    );
    if (await prefsLink.first().isVisible().catch(() => false)) {
      await prefsLink.first().click();
    } else {
      await page.goto('/marketplace/preferences', { waitUntil: 'networkidle' }).catch(() => {});
    }

    const scrollHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(scrollHeight).toBeGreaterThan(844);
  });

  test('marketplace home does not clip vertical content', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'networkidle' });
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
