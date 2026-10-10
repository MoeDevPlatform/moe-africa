import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const a11yRoutes = ['/marketplace', '/auth', '/marketplace/cart', '/help/getting-started'];

test.describe('Accessibility', () => {
  for (const route of a11yRoutes) {
    test(`${route} has no critical axe violations`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );
      expect(
        critical,
        critical.map((v) => `${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    });
  }

  test('images on marketplace expose alt text', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    const missing = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter((img) => img.getAttribute('alt') === null)
        .map((img) => img.getAttribute('src') || '')
        .slice(0, 10);
    });
    // Allow empty alt for decorative images (alt=""); flag only missing attribute.
    expect(missing).toEqual([]);
  });
});
