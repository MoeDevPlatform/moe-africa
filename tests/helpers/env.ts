import { loadEnvFile } from './loadEnv';

loadEnvFile();

/** Live deployment under test — never point seed at localhost by default. */
export const FRONTEND_BASE =
  process.env.MOE_FRONTEND_URL?.replace(/\/$/, '') ||
  'https://moe-africa-mvp.vercel.app';

/** Production backend used by the Vercel app (from deployed bundle). */
export const API_BASE =
  process.env.MOE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://moe-backend.duckdns.org';

/**
 * Admin portal credentials — required from the environment / local .env.
 * Never hardcode; never log the password.
 */
export const ADMIN_EMAIL = (
  process.env.MOE_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  ''
).trim();

export const ADMIN_PASSWORD = (
  process.env.MOE_ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD ||
  ''
).trim();

export function requireAdminCredentials(): void {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'Admin credentials missing. Set ADMIN_EMAIL and ADMIN_PASSWORD in your local .env ' +
        '(or MOE_ADMIN_EMAIL / MOE_ADMIN_PASSWORD). Do not commit these values.',
    );
  }
}

/** Unique per run so we never collide with / overwrite existing accounts. */
export const SEED_RUN_ID =
  process.env.MOE_SEED_RUN_ID ||
  `r${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;

export const SEED_TAG = `[PW-SEED ${SEED_RUN_ID}]`;
