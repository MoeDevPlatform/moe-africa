import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import {
  SEED_ARTISANS,
  MOE_IMAGES_DIR,
  allReferencedImageFiles,
  seedArtisanEmail,
  taggedName,
} from './fixtures/seedArtisans';
import {
  API_BASE,
  updateArtisanProfile,
  uploadImage,
  createProduct,
  getMyProfile,
  listMyProducts,
  loginAdmin,
  approveArtisan,
  approveProduct,
  listPublicProviders,
  listPublicProducts,
  deleteMyProduct,
  loginSeedArtisan,
  type SeedResult,
} from './helpers/moeApi';
import { FRONTEND_BASE, SEED_RUN_ID, SEED_TAG } from './helpers/env';
import {
  signUpArtisanViaUi,
  signInArtisanViaUi,
  signOutViaUi,
  readAccessTokenFromUi,
  completeBusinessProfileViaUi,
  addProductViaUi,
} from './helpers/uiFlows';

/**
 * Live Vercel seed / discovery load test
 * --------------------------------------
 * Target: https://moe-africa-mvp.vercel.app (production-connected)
 * Backend: https://moe-backend.duckdns.org (same API the Vercel bundle uses)
 *
 * Auth: email/password artisan sign-up through the live /auth UI
 *       (artisans cannot use Google/Clerk — email form is required).
 * Data: after UI auth, profile/products are created via the same authenticated
 *       REST endpoints the dashboard uses (register already issued tokens).
 *       Set MOE_SEED_FULL_UI=1 to also exercise Add Product / profile modals
 *       for artisan #1 as an interface smoke check.
 *
 * Safety:
 *  - Unique emails per run (SEED_RUN_ID) — never signs into / overwrites existing users
 *  - All business/product names prefixed with [PW-SEED <runId>]
 *  - No mocks; no localhost; no DB bypass
 *
 * Run:
 *   npx playwright test tests/seed-artisans-products.spec.ts --project=chromium
 */
test.describe.configure({ mode: 'serial' });

test.describe('Live Vercel seed — 20 artisans × 5 products', () => {
  test.setTimeout(45 * 60 * 1000);

  const results: SeedResult[] = [];
  const reportPath = path.join(process.cwd(), 'test-results', 'seed-report.json');
  const fullUi = process.env.MOE_SEED_FULL_UI === '1';

  test.beforeAll(() => {
    console.log(`Seed run id: ${SEED_RUN_ID}  tag: ${SEED_TAG}`);
    console.log(`Frontend: ${FRONTEND_BASE}`);
    console.log(`API: ${API_BASE}`);
  });

  test('preflight: Vercel + production API + images', async ({ request, page }) => {
    expect(FRONTEND_BASE).toContain('moe-africa-mvp.vercel.app');
    expect(API_BASE).toContain('moe-backend.duckdns.org');

    expect(fs.existsSync(MOE_IMAGES_DIR), `Missing ${MOE_IMAGES_DIR}`).toBeTruthy();
    const missing = allReferencedImageFiles().filter(
      (f) => !fs.existsSync(path.join(MOE_IMAGES_DIR, f)),
    );
    expect(missing, `Missing images: ${missing.join(', ')}`).toEqual([]);

    const health = await request.get(`${API_BASE}/health`);
    expect(health.ok(), `Production API down: ${API_BASE}`).toBeTruthy();

    const front = await page.goto(FRONTEND_BASE, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    expect(front?.ok() || front?.status() === 304).toBeTruthy();
    await expect(page).toHaveURL(/moe-africa-mvp\.vercel\.app/);

    expect(SEED_ARTISANS).toHaveLength(20);
    expect(SEED_ARTISANS.reduce((n, a) => n + a.products.length, 0)).toBe(100);
    expect(new Set(SEED_ARTISANS.map((a) => seedArtisanEmail(a.index))).size).toBe(20);
  });

  test('UI sign-up on Vercel + create 20 artisans × 5 products via live APIs', async ({
    page,
    request,
  }) => {
    for (const artisan of SEED_ARTISANS) {
      await test.step(`Artisan ${artisan.index}: ${artisan.businessName}`, async () => {
        // 1) Real sign-up through the deployed Auth UI (no auth bypass)
        await signUpArtisanViaUi(page, artisan);
        const uiToken = await readAccessTokenFromUi(page);

        // 2) Same backend endpoints the dashboard uses after login
        const result: SeedResult = {
          artisanIndex: artisan.index,
          email: seedArtisanEmail(artisan.index),
          businessName: taggedName(artisan.businessName),
          productIds: [],
          productNames: [],
          errors: [],
        };

        // Prefer the UI-issued token so we stay within the authenticated session
        const token = uiToken;

        let storeImageUrl: string | undefined;
        let coverImageUrl: string | undefined;
        try {
          storeImageUrl = await uploadImage(
            request,
            token,
            '/artisans/me/upload-image',
            artisan.profileImageFile,
          );
          result.storeImageUrl = storeImageUrl;
        } catch (e) {
          result.errors.push(`store image: ${(e as Error).message}`);
        }
        try {
          coverImageUrl = await uploadImage(
            request,
            token,
            '/artisans/me/upload-cover',
            artisan.coverImageFile,
          );
          result.coverImageUrl = coverImageUrl;
        } catch {
          try {
            coverImageUrl = await uploadImage(
              request,
              token,
              '/artisans/me/upload-image',
              artisan.coverImageFile,
            );
            result.coverImageUrl = coverImageUrl;
          } catch (e2) {
            result.errors.push(`cover image: ${(e2 as Error).message}`);
          }
        }

        const profile = await updateArtisanProfile(request, token, artisan, {
          storeImageUrl,
          coverImageUrl,
        });
        result.artisanProfileId = profile?.id;
        if (!result.artisanProfileId) {
          const me = await getMyProfile(request, token);
          result.artisanProfileId = me?.id;
          result.userId = me?.userId;
        }

        for (const product of artisan.products) {
          try {
            const imageUrl = await uploadImage(
              request,
              token,
              '/artisans/me/products/upload-image',
              product.imageFile,
            );
            const created = await createProduct(request, token, product, imageUrl);
            result.productIds.push(created.id);
            result.productNames.push(created.name);
          } catch (e) {
            result.errors.push(`product "${product.name}": ${(e as Error).message}`);
          }
        }

        // Optional full-UI path for artisan #1 (profile modal + one Add Product)
        if (fullUi && artisan.index === 1) {
          await completeBusinessProfileViaUi(page, artisan);
          await addProductViaUi(page, {
            ...artisan.products[0],
            name: `${artisan.products[0].name} UI`,
          });
        }

        // Confirm persistence via the same authenticated API the dashboard uses
        // (avoids flaky tab selection mid-seed; full UI check is in the verify step).
        const mine = await listMyProducts(request, token);
        const mineNames = new Set(mine.map((p) => p.name as string));
        for (const pname of result.productNames) {
          expect(mineNames.has(pname), `Missing product in API list: ${pname}`).toBeTruthy();
        }

        // Spot-check dashboard still authenticated after soft navigation
        await page.goto(`${FRONTEND_BASE}/artisan/dashboard`, {
          waitUntil: 'domcontentloaded',
        });
        await expect(page).toHaveURL(/\/artisan\/dashboard/);
        await expect(
          page.getByText(/My Products|Business Profile/i).first(),
        ).toBeVisible({ timeout: 30_000 });

        results.push(result);
        expect(result.errors, result.errors.join('\n')).toEqual([]);
        expect(result.productIds.length).toBe(5);
        expect(result.artisanProfileId).toBeTruthy();

        await signOutViaUi(page);
      });
    }

    expect(results).toHaveLength(20);
    expect(results.reduce((n, r) => n + r.productIds.length, 0)).toBe(100);
  });

  test('admin-approve seeded artisans/products (supported admin API)', async ({
    request,
  }) => {
    test.skip(results.length === 0, 'No seed results');
    const adminToken = await loginAdmin(request);
    const errors: string[] = [];

    for (const r of results) {
      if (r.artisanProfileId) {
        try {
          await approveArtisan(request, adminToken, r.artisanProfileId);
        } catch (e) {
          errors.push(`artisan ${r.businessName}: ${(e as Error).message}`);
        }
      }
      for (const id of r.productIds) {
        try {
          await approveProduct(request, adminToken, id);
        } catch (e) {
          errors.push(`product #${id}: ${(e as Error).message}`);
        }
      }
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('verify persistence on Vercel UI + public API (no duplicates / broken images)', async ({
    page,
    request,
  }) => {
    test.skip(results.length === 0, 'No seed results');

    const providers = await listPublicProviders(request, 300);
    const products = await listPublicProducts(request, 400);

    const seededBusinesses = new Set(results.map((r) => r.businessName));
    const publicBrands = providers.map(
      (p) => p.brandName || p.businessName || p.name || '',
    );
    const matchedProviders = publicBrands.filter((n) => seededBusinesses.has(n));
    expect(
      matchedProviders.length,
      `Expected 20 tagged artisans publicly; got ${matchedProviders.length}`,
    ).toBeGreaterThanOrEqual(20);
    expect(new Set(matchedProviders).size).toBe(matchedProviders.length);

    const seededProductNames = new Set(results.flatMap((r) => r.productNames));
    const matchedProducts = products
      .map((p) => p.name as string)
      .filter((n) => seededProductNames.has(n));
    expect(
      matchedProducts.length,
      `Expected 100 tagged products publicly; got ${matchedProducts.length}`,
    ).toBeGreaterThanOrEqual(100);
    expect(new Set(matchedProducts).size).toBe(matchedProducts.length);

    // All seeded names carry the run tag
    for (const n of [...matchedProviders, ...matchedProducts]) {
      expect(n).toContain(SEED_TAG);
    }

    const broken: string[] = [];
    for (const r of results) {
      for (const url of [r.storeImageUrl, r.coverImageUrl]) {
        if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/')) {
          broken.push(`${r.businessName}: ${url}`);
        }
      }
    }
    for (const p of products) {
      if (!seededProductNames.has(p.name)) continue;
      const imgs: string[] = Array.isArray(p.images)
        ? p.images
        : p.imageUrl
          ? [p.imageUrl]
          : [];
      if (!imgs.length) broken.push(`product "${p.name}" missing images`);
      for (const url of imgs) {
        if (url && !/^https?:\/\//i.test(url) && !String(url).startsWith('/')) {
          broken.push(`product "${p.name}": ${url}`);
        }
      }
    }
    expect(broken, broken.join('\n')).toEqual([]);

    // Vercel UI smoke after reload
    await page.goto(`${FRONTEND_BASE}/marketplace/artisans`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });
    for (const name of results.slice(0, 3).map((r) => r.businessName)) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
        timeout: 45_000,
      });
    }

    await page.goto(`${FRONTEND_BASE}/marketplace/products`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });
    for (const name of results[0].productNames.slice(0, 2)) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
        timeout: 45_000,
      });
    }

    // Sign-in again and confirm products still listed (persistence)
    await signInArtisanViaUi(page, results[0].artisanIndex);
    await page.goto(`${FRONTEND_BASE}/artisan/dashboard`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.getByText(results[0].productNames[0], { exact: false }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await signOutViaUi(page);

    const report = {
      frontend: FRONTEND_BASE,
      apiBase: API_BASE,
      seedTag: SEED_TAG,
      runId: SEED_RUN_ID,
      generatedAt: new Date().toISOString(),
      artisansCreated: results.length,
      productsCreated: results.reduce((n, r) => n + r.productIds.length, 0),
      publicProvidersMatched: matchedProviders.length,
      publicProductsMatched: matchedProducts.length,
      artisans: results,
      cleanupNote:
        'Seeded products can be removed via DELETE /artisans/me/products/:id while signed in as each seed artisan. User accounts remain unless an admin deletes them. All records are tagged with SEED_TAG.',
    };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Seed report → ${reportPath}`);
  });

  test('optional cleanup: delete seeded products via supported artisan API', async ({
    request,
  }) => {
    test.skip(process.env.MOE_SEED_CLEANUP !== '1', 'Set MOE_SEED_CLEANUP=1 to delete seeded products');
    test.skip(results.length === 0, 'No seed results');

    for (const r of results) {
      const token = await loginSeedArtisan(request, r.artisanIndex);
      for (const id of r.productIds) {
        await deleteMyProduct(request, token, id);
      }
    }
  });
});
