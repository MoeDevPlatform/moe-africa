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
    trace: 'on-first-retry',
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: [/seed-artisans-products\.spec\.ts/, /humanize-marketplace\.spec\.ts/],
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
      testMatch: [/ui-audit\.spec\.ts/, /visual-regression\.spec\.ts/, /accessibility\.spec\.ts/, /mobile\.spec\.ts/],
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
      testMatch: [/ui-audit\.spec\.ts/, /visual-regression\.spec\.ts/, /accessibility\.spec\.ts/, /mobile\.spec\.ts/],
    },
    // Alias kept for existing npm scripts (`--project=chromium`)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
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
