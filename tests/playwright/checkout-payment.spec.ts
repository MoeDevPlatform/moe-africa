import { expect, test, type Page } from '@playwright/test';

const profile = {
  id: 7,
  username: 'ada',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'customer',
  createdAt: '2026-01-01T00:00:00.000Z',
  emailVerified: true,
};

const cartItem = {
  id: 'c1',
  productId: 11,
  productName: 'Ankara Set',
  providerId: 3,
  providerName: 'Atelier',
  basePrice: 20000,
  finalPrice: 20000,
  category: 'tailoring',
  selectedVariants: {},
  measurements: {},
  notes: '',
  quantity: 1,
};

async function installCheckout(page: Page, gateways = { paystack: true, flutterwave: true, mode: 'test' }) {
  const orders: unknown[] = [];
  const initializations: unknown[] = [];
  await page.addInitScript((item) => {
    localStorage.setItem('moe_access_token', 'test-access');
    localStorage.setItem('moe_refresh_token', 'test-refresh');
    localStorage.setItem('moe_remember_me', '1');
    localStorage.setItem('moe_cart_user_7', JSON.stringify([item]));
  }, cartItem);

  await page.route(/moe-backend\.duckdns\.org|localhost:3000/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.endsWith('/auth/profile')) {
      return route.fulfill({ json: profile });
    }
    if (path.endsWith('/payments/gateways')) {
      return route.fulfill({ json: gateways });
    }
    if (path.includes('payment-methods')) {
      return route.fulfill({
        json: {
          data: [{ id: 'pm_1', brand: 'visa', last4: '4081', expiry: '12/30', isDefault: true, cardholderName: 'Ada' }],
        },
      });
    }
    if (request.method() === 'GET' && path.includes('/cart')) {
      return route.fulfill({
        json: {
          data: [
            {
              id: 'c1',
              productId: 11,
              productName: 'Ankara Set',
              providerId: 3,
              providerName: 'Atelier',
              basePrice: 20000,
              finalPrice: 20000,
              category: 'tailoring',
              selectedVariants: {},
              measurements: {},
              notes: '',
              quantity: 1,
            },
          ],
        },
      });
    }
    if (request.method() === 'POST' && path.endsWith('/orders')) {
      const body = request.postDataJSON() ?? {};
      orders.push(body);
      return route.fulfill({
        json: {
          id: 42,
          paymentMethod: body.paymentMethod,
          paymentStatus: 'unpaid',
          price: 20000,
          currency: 'NGN',
          productName: 'Ankara Set',
          providerName: 'Atelier',
        },
      });
    }
    if (request.method() === 'POST' && path.endsWith('/payments/initialize')) {
      const body = request.postDataJSON() ?? {};
      initializations.push(body);
      const host = body.gateway === 'flutterwave' ? 'checkout.flutterwave.com' : 'checkout.paystack.com';
      return route.fulfill({
        json: {
          paymentUrl: `https://${host}/${body.cardOnly ? 'card' : 'checkout'}-session`,
          reference: body.gateway === 'flutterwave' ? 'moe-fw-42-abc' : 'moe-ps-42-abc',
          amount: 22500,
          currency: 'NGN',
          orderId: '42',
          accessCode: 'AC_test',
        },
      });
    }
    if (request.method() === 'POST' && path.endsWith('/payments/verify')) {
      return route.fulfill({
        json: {
          reference: 'forged',
          status: 'failed',
          amount: 0,
          currency: 'NGN',
          paidAt: null,
          orderId: '42',
          alreadyPaid: false,
        },
      });
    }
    return route.fulfill({ json: { data: [] } });
  });

  await page.route(/checkout\.paystack\.com|checkout\.flutterwave\.com/, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Hosted checkout</body></html>' }),
  );

  return { orders, initializations };
}

async function fillShipping(page: Page) {
  await page.locator('#firstname').fill('Ada');
  await page.locator('#lastname').fill('Lovelace');
  await page.locator('#phone').fill('+2348012345678');
  await page.locator('#address').fill('12 Broad Street');
  await page.locator('#city').fill('Lagos');
  await page.locator('#country').click();
  await page.getByRole('option', { name: 'Nigeria' }).click();
  await page.locator('#state').click();
  await page.getByRole('option', { name: 'Lagos', exact: true }).click();
  await page.keyboard.press('Escape');
}

test.describe('checkout payments', () => {
  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('switches methods, keeps raw card fields off the page, and opens hosted checkout', async ({ page }) => {
      const { orders, initializations } = await installCheckout(page);
      await page.goto('/marketplace/checkout');
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
      await expect(page.getByText('Ankara Set')).toBeVisible();
      await expect(page.getByTestId('payment-method-paystack')).not.toContainText('Unavailable');
      await expect(page.locator('input[autocomplete="cc-number"]')).toHaveCount(0);
      await expect(page.getByLabel(/^cvv/i)).toHaveCount(0);

      await page.locator('#flutterwave').click();
      await expect(page.getByTestId('checkout-submit')).toHaveText('Continue to Flutterwave');
      await page.locator('#transfer').click();
      await expect(page.getByTestId('checkout-submit')).toHaveText('Place Order');
      await page.locator('#delivery').click();
      await expect(page.getByTestId('checkout-submit')).toHaveText('Place Order');
      await page.locator('#card').click();
      await expect(page.getByText('visa •••• 4081')).toBeVisible();
      await expect(page.getByText('Not available for this checkout')).toBeVisible();
      await expect(page.getByTestId('pay-with-new-card')).toBeVisible();

      await fillShipping(page);
      const pay = page.getByTestId('pay-with-new-card');
      await pay.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForURL(/checkout\.paystack\.com\/card-session/),
        pay.click(),
      ]);
      expect(orders[0]).toMatchObject({ paymentMethod: 'paystack' });
      expect(initializations[0]).toMatchObject({ gateway: 'paystack', cardOnly: true, orderId: '42' });
      expect(JSON.stringify(initializations[0])).not.toMatch(/amount|cvv|cardNumber/i);
    });
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('opens Flutterwave from the checkout summary without a card form', async ({ page }) => {
      const { initializations } = await installCheckout(page);
      await page.goto('/marketplace/checkout');
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
      await expect(page.getByText('Ankara Set')).toBeVisible();
      await page.locator('#flutterwave').click();
      await expect(page.locator('input[autocomplete="cc-number"]')).toHaveCount(0);
      await expect(page.getByLabel(/^cvv/i)).toHaveCount(0);
      await fillShipping(page);
      await page.getByTestId('checkout-submit').click();
      await page.waitForURL(/checkout\.flutterwave\.com\/checkout-session/);
      expect(initializations[0]).toMatchObject({ gateway: 'flutterwave', cardOnly: false, orderId: '42' });
      await expect(page.locator('input[autocomplete="cc-number"]')).toHaveCount(0);
    });
  });

  test('marks an unconfigured gateway unavailable and ignores a forged callback', async ({ page }) => {
    await installCheckout(page, { paystack: false, flutterwave: true, mode: 'test' });
    await page.goto('/marketplace/checkout');
    await expect(page.getByTestId('payment-method-paystack')).toContainText('Unavailable');
    await expect(page.locator('#paystack')).toBeDisabled();
    await expect(page.locator('#flutterwave')).toBeEnabled();
    await expect(page.locator('#transfer')).toBeEnabled();

    await page.goto('/marketplace/payment/callback?status=successful&reference=forged&gateway=paystack');
    await expect(page.getByText('Payment failed')).toBeVisible();
    await expect(page.getByText('Order Placed Successfully')).toHaveCount(0);
  });
});
