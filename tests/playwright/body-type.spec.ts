import { test, expect } from '@playwright/test';
import { IDS } from './helpers/testIds';

test.describe('Body type selector', () => {
  test('body type selector shows for product with body_type variation enabled', async ({
    page,
  }) => {
    test.skip(
      !IDS.tailoringBodyTypeProduct,
      'Set PLAYWRIGHT_TAILORING_BODY_TYPE_PRODUCT_ID',
    );
    await page.goto(`/marketplace/product/${IDS.tailoringBodyTypeProduct}`);
    await expect(page.locator('[data-testid="body-type-selector"]')).toBeVisible();
    await page.click('[data-testid="body-type-athletic"]');
    await expect(page.locator('[data-testid="body-type-athletic"]')).toHaveClass(
      /selected/,
    );
  });
});
