import { loadEnvFile } from './loadEnv';

loadEnvFile();

export const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ||
  process.env.MOE_FRONTEND_URL?.replace(/\/$/, '') ||
  'https://moe-africa-mvp.vercel.app';

export const PLAYWRIGHT_API_URL =
  process.env.MOE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://moe-backend.duckdns.org';

export const PLAYWRIGHT_ADMIN_EMAIL = (
  process.env.PLAYWRIGHT_ADMIN_EMAIL ||
  process.env.MOE_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  ''
).trim();

export const PLAYWRIGHT_ADMIN_PASSWORD = (
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ||
  process.env.MOE_ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD ||
  ''
).trim();

export const PLAYWRIGHT_ARTISAN_EMAIL = (
  process.env.PLAYWRIGHT_ARTISAN_EMAIL ||
  ''
).trim();

export const PLAYWRIGHT_ARTISAN_PASSWORD = (
  process.env.PLAYWRIGHT_ARTISAN_PASSWORD ||
  ''
).trim();

export const PLAYWRIGHT_CUSTOMER_EMAIL = (
  process.env.PLAYWRIGHT_CUSTOMER_EMAIL ||
  ''
).trim();

export const PLAYWRIGHT_CUSTOMER_PASSWORD = (
  process.env.PLAYWRIGHT_CUSTOMER_PASSWORD ||
  ''
).trim();

export function requireAdminCreds(): void {
  if (!PLAYWRIGHT_ADMIN_EMAIL || !PLAYWRIGHT_ADMIN_PASSWORD) {
    throw new Error(
      'Admin credentials missing. Set PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD ' +
        '(or ADMIN_EMAIL / ADMIN_PASSWORD) in local .env.',
    );
  }
}
