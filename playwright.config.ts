import { defineConfig, devices } from '@playwright/test';
import { loadEnvFile } from './tests/helpers/loadEnv';

// Requires @playwright/test@1.57.x (test-server for the IDE; Chromium still supports macOS 12).
// Load local .env (ADMIN_EMAIL / ADMIN_PASSWORD / PLAYWRIGHT_*) — never commit that file.
loadEnvFile();

/**
 * MOE Playwright — targets the live Vercel deployment by default.
 *
 *   Frontend: https://moe-africa-mvp.vercel.app
 *   Backend:  https://moe-backend.duckdns.org
 *
 * Feature suite:
 *   npx playwright test tests/playwright --reporter=html
 *
 * Seed 20 artisans × 5 products:
 *   npm run test:seed
 *
 * Do not run the feature suite until deployment is confirmed.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/playwright/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      process.env.MOE_FRONTEND_URL ||
      'https://moe-africa-mvp.vercel.app',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: process.env.PW_TRACE === '1' ? 'retain-on-failure' : 'off',
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/seed-artisans-products\.spec\.ts/, /humanize-marketplace\.spec\.ts/],
    },
    {
      name: 'seed',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /seed-artisans-products\.spec\.ts/,
      timeout: 120_000,
      retries: 0,
    },
  ],
});
