import fs from 'fs';
import path from 'path';

/**
 * Load KEY=VALUE pairs from a local .env into process.env without overriding
 * variables already set in the shell. Never logs values.
 */
export function loadEnvFile(filePath = path.join(process.cwd(), '.env')): void {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  // Accept either ADMIN_* (local .env) or MOE_ADMIN_* (CI / shell overrides)
  if (!process.env.MOE_ADMIN_EMAIL && process.env.ADMIN_EMAIL) {
    process.env.MOE_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  }
  if (!process.env.MOE_ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
    process.env.MOE_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  }
}
