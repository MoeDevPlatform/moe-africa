/**
 * Confirms the deployed frontend (and optionally API) are reachable
 * before any Playwright tests run.
 */
import { FullConfig } from '@playwright/test';
import { loadEnvFile } from '../helpers/loadEnv';

loadEnvFile();

const FRONTEND =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ||
  process.env.MOE_FRONTEND_URL?.replace(/\/$/, '') ||
  'https://moe-africa-mvp.vercel.app';

const API =
  process.env.MOE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://moe-backend.duckdns.org';

async function waitForUrl(url: string, label: string, attempts = 12): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        console.log(`[global-setup] ${label} reachable: ${url} (${res.status})`);
        return;
      }
      lastError = new Error(`${label} returned ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(
    `[global-setup] ${label} not reachable at ${url} after ${attempts} attempts. ` +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('[global-setup] Waiting for deployment…');
  await waitForUrl(FRONTEND, 'Frontend');
  await waitForUrl(`${API}/health`, 'API').catch(async () => {
    // Some deployments expose /health under a different path — try root.
    await waitForUrl(API, 'API root');
  });
  console.log('[global-setup] Deployment confirmed. Starting tests.');
}

export default globalSetup;
