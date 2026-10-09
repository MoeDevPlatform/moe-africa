import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import {
  SEED_PASSWORD,
  imagePath,
  seedArtisanEmail,
  taggedName,
  type SeedArtisan,
  type SeedProduct,
} from '../fixtures/seedArtisans';
import { FRONTEND_BASE } from './env';

/**
 * Live Vercel email/password artisan sign-up (Clerk Google is not used for artisans).
 * Creates a brand-new account only — does not sign into existing users.
 */
export async function signUpArtisanViaUi(
  page: Page,
  artisan: SeedArtisan,
): Promise<void> {
  const email = seedArtisanEmail(artisan.index);

  await page.goto(`${FRONTEND_BASE}/auth?tab=signup`, {
    waitUntil: 'domcontentloaded',
  });

  // Select Artisan role card
  await page.locator('label[for="role-artisan"]').click();
  await expect(page.locator('#role-artisan')).toBeChecked();

  // Wait for service category chips from live /meta/service-categories.
  // Production currently omits some product categories (e.g. Paintings and Canvas),
  // so fall back to the first visible chip if the preferred label is missing.
  const preferred = [...artisan.serviceCategories, 'Arts & Crafts', 'Tailoring'];
  await expect(
    page.getByText(/Tailoring|Arts & Crafts|Shoemaking/i).first(),
  ).toBeVisible({ timeout: 30_000 });
  let picked = false;
  for (const label of preferred) {
    const chip = page.getByText(label, { exact: true }).first();
    if (await chip.isVisible().catch(() => false)) {
      await chip.click();
      picked = true;
      break;
    }
  }
  if (!picked) {
    throw new Error(
      `No service category chip found for ${artisan.businessName} (tried: ${preferred.join(', ')})`,
    );
  }

  await page.locator('#firstname').fill(artisan.firstName);
  await page.locator('#lastname').fill(artisan.lastName);
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(SEED_PASSWORD);
  await page.locator('#confirm-password').fill(SEED_PASSWORD);

  await page.getByRole('button', { name: /Create Artisan Account|Create Account|Sign Up/i }).click();

  // App navigates artisans to dashboard after successful register
  await page.waitForURL(/\/artisan\/dashboard/, { timeout: 60_000 });
  await expect(page.getByText(/Business Profile|My Products|Dashboard/i).first()).toBeVisible({
    timeout: 30_000,
  });

  // Register path does not set remember-me / session-alive flags; without these,
  // AuthContext clears tokens on the next full navigation/reload when REMEMBER_KEY
  // was previously "0". Pin the session for the remainder of this artisan's steps.
  await page.evaluate(() => {
    localStorage.setItem('moe_remember_me', '1');
    sessionStorage.setItem('moe_session_alive', '1');
  });
}

/** Sign in an already-seeded artisan via the live Auth form. */
export async function signInArtisanViaUi(
  page: Page,
  index: number,
): Promise<void> {
  const email = seedArtisanEmail(index);
  await page.goto(`${FRONTEND_BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: /Sign In/i }).click().catch(() => {});
  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(SEED_PASSWORD);
  // Prefer remember-me so AuthContext keeps tokens across navigations/reloads
  const remember = page.locator('#remember-me, input[name="remember"]');
  if (await remember.count()) {
    await remember.first().check().catch(() => {});
  }
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(/\/(artisan\/dashboard|marketplace)/, { timeout: 60_000 });
  await page.evaluate(() => {
    localStorage.setItem('moe_remember_me', '1');
    sessionStorage.setItem('moe_session_alive', '1');
  });
}

/** Read MOE JWT written by AuthContext after successful UI auth. */
export async function readAccessTokenFromUi(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('moe_access_token'));
  if (!token) {
    throw new Error('No moe_access_token in localStorage after UI auth');
  }
  return token;
}

export async function signOutViaUi(page: Page): Promise<void> {
  // Clear session the same way a hard logout would for isolation between artisans
  await page.evaluate(() => {
    localStorage.removeItem('moe_access_token');
    localStorage.removeItem('moe_refresh_token');
    localStorage.removeItem('moe_session_alive');
    localStorage.removeItem('moe_remember_me');
    sessionStorage.removeItem('moe_session_alive');
  });
  await page.goto(`${FRONTEND_BASE}/auth`, { waitUntil: 'domcontentloaded' });
}

/**
 * Complete Business Profile through the artisan dashboard UI on Vercel.
 */
export async function completeBusinessProfileViaUi(
  page: Page,
  artisan: SeedArtisan,
): Promise<void> {
  await page.goto(`${FRONTEND_BASE}/artisan/dashboard`, {
    waitUntil: 'domcontentloaded',
  });

  // Open Business Profile tab if present
  const profileTab = page.getByRole('tab', { name: /Business Profile/i });
  if (await profileTab.isVisible().catch(() => false)) {
    await profileTab.click();
  }

  const editBtn = page.getByRole('button', { name: /^Edit$|Edit profile/i }).first();
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
  }

  const businessName = taggedName(artisan.businessName);
  await page.getByLabel(/Business Name/i).fill(businessName);
  const desc = page.getByLabel(/Description/i);
  if (await desc.isVisible().catch(() => false)) {
    await desc.fill(artisan.description);
  }

  // Category chips (multi-select) — ensure primary is selected
  for (const cat of artisan.serviceCategories) {
    const chip = page.getByText(cat, { exact: true }).first();
    if (await chip.isVisible().catch(() => false)) {
      await chip.click();
    }
  }

  // Location fields (best-effort — labels may vary)
  const country = page.getByLabel(/^Country/i);
  if (await country.isVisible().catch(() => false)) {
    await country.click();
    await page.getByRole('option', { name: artisan.country }).click().catch(async () => {
      await page.getByText(artisan.country, { exact: true }).click();
    });
  }

  // Store / cover image uploads
  const storeInput = page.locator('input[type="file"]').first();
  if (await storeInput.count()) {
    await storeInput.setInputFiles(imagePath(artisan.profileImageFile));
  }
  const coverInput = page.locator('input[type="file"]').nth(1);
  if (await coverInput.count()) {
    await coverInput.setInputFiles(imagePath(artisan.coverImageFile));
  }

  await page.getByRole('button', { name: /Save Changes|Save/i }).click();
  await expect(
    page.getByText(/updated|saved|success/i).first(),
  ).toBeVisible({ timeout: 60_000 }).catch(() => {
    /* toast may dismiss quickly — continue */
  });
}

/**
 * Add one product via the Add Product modal on the live dashboard.
 */
export async function addProductViaUi(
  page: Page,
  product: SeedProduct,
): Promise<string> {
  const name = taggedName(product.name);

  await page.goto(`${FRONTEND_BASE}/artisan/dashboard`, {
    waitUntil: 'domcontentloaded',
  });
  const productsTab = page.getByRole('tab', { name: /My Products/i });
  if (await productsTab.isVisible().catch(() => false)) {
    await productsTab.click();
  }

  await page.getByRole('button', { name: /Add Product/i }).click();
  await expect(page.getByLabel(/Product Name/i)).toBeVisible({ timeout: 15_000 });

  await page.getByLabel(/Product Name/i).fill(name);
  await page.getByLabel(/Description/i).fill(product.description);

  // Category select — choose by visible label; value is snake_case under the hood
  await page.getByLabel(/Category/i).click().catch(async () => {
    await page.getByRole('combobox').first().click();
  });
  // Map category value → approximate label text
  const labelMap: Record<string, string> = {
    tailoring: 'Tailoring',
    arts_and_crafts: 'Arts & Crafts',
    shoemaking: 'Shoemaking',
    beauty: 'Beauty',
    leatherwork: 'Leatherwork',
    jewellery: 'Jewellery',
    home_and_decor: 'Home & Decor',
    paintings_and_canvas: 'Paintings and Canvas',
  };
  const label = labelMap[product.category] || product.category;
  await page.getByRole('option', { name: label }).click();

  await page.getByLabel(/Min Price/i).fill(String(product.priceMin));
  await page.getByLabel(/Max Price/i).fill(String(product.priceMax));

  const materials = page.getByLabel(/Materials/i);
  if (await materials.isVisible().catch(() => false)) {
    await materials.fill(product.materials);
  }
  const delivery = page.getByLabel(/Estimated Delivery/i);
  if (await delivery.isVisible().catch(() => false)) {
    await delivery.fill(product.estimatedDelivery);
  }

  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count()) {
    await fileInput.last().setInputFiles(imagePath(product.imageFile));
    // Wait briefly for upload preview / completion
    await page.waitForTimeout(1500);
  }

  await page.getByRole('button', { name: /Add Product|Save Product|Create/i }).click();
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
    timeout: 90_000,
  });

  return name;
}
