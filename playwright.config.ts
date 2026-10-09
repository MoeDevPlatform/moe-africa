import { defineConfig, devices } from '@playwright/test';

/**
 * MOE Playwright — targets the live Vercel deployment by default.
 *
 *   Frontend: https://moe-africa-mvp.vercel.app
 *   Backend:  https://moe-backend.duckdns.org  (same as the deployed app)
 *
 * Seed 20 artisans × 5 products:
 *   npm run test:seed
 *
 * Optional:
 *   MOE_SEED_FULL_UI=1     exercise profile + Add Product modals for artisan #1
 *   MOE_SEED_CLEANUP=1     delete seeded products after the run
 *   MOE_SEED_RUN_ID=...    override the unique run id (emails / name tags)
 *   MOE_FRONTEND_URL / MOE_API_BASE_URL / MOE_ADMIN_EMAIL / MOE_ADMIN_PASSWORD
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.MOE_FRONTEND_URL || 'https://moe-africa-mvp.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
