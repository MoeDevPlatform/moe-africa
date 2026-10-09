import { defineConfig, devices } from '@playwright/test';
import { loadEnvFile } from './tests/helpers/loadEnv';

// Load local .env (ADMIN_EMAIL / ADMIN_PASSWORD) — never commit that file.
loadEnvFile();

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
 *   ADMIN_EMAIL / ADMIN_PASSWORD (or MOE_ADMIN_*) from local .env — never hardcode
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
    // Off by default — full seed runs are long; enable locally with PWDEBUG / override if needed
    trace: process.env.PW_TRACE === '1' ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    video: process.env.PW_VIDEO === '1' ? 'retain-on-failure' : 'off',
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
