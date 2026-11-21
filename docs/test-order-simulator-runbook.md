# Test Order Simulator — Local run & staging setup

Run on your machine (needs moe_dev Postgres + NestJS backend `c04521f`). No real money moves; all transfers `isSimulated=true`.

## 1. Local setup
```bash
# backend
npx prisma migrate status            # expect 37 applied, "Database schema is up to date"
```
Backend `.env.local` (never commit):
```
DATABASE_URL=postgresql://localhost:5432/moe_dev
NODE_ENV=development
TEST_ORDER_SIMULATOR_ENABLED=true
TEST_ORDER_ADMIN_IDS=<id from query below>
PAYMENTS_MODE=simulated
NOTIFICATIONS_TRANSPORT=log
CORS_ORIGINS=http://localhost:8080
```
Find/prepare accounts (SQL on moe_dev):
```sql
SELECT id,email,role FROM "User" WHERE email LIKE '%@moe.local';
UPDATE "User" SET "isTestUser"=true WHERE email IN ('test-customer@moe.local','test-artisan@moe.local');
-- grant finance capabilities: recorder → record_payout only, verifier → verify_payout only
-- approve storefront + one product for test-artisan (status='approved')
```
Create the accounts via the normal signup if missing, then copy
`tests/test-accounts.local.example.json` → `tests/test-accounts.local.json` (gitignored) and fill in passwords.

Frontend `.env.local`: `VITE_API_BASE_URL=http://localhost:3000`, then `npm run dev`.

## 2. Run
```bash
MOE_LIFECYCLE=1 npx playwright test tests/playwright/test-order-lifecycle.spec.ts --project=lifecycle
# macOS 12 Chromium problem? add: --browser=firefox is not valid with projects; instead set
#   use: devices['Desktop Firefox'] in the lifecycle project, or run on the Linux CI runner.
```
Outputs:
- Screenshots: `test-results/lifecycle/screenshots/01…10-*.png`
- Video (per role): `test-results/lifecycle/video/<role>/*.webm`
- Order reference: `test-results/lifecycle/order.json` (order is kept for manual inspection)
- Report: `npx playwright show-report`

Covered failure checks: readiness alone can't start work; unverified funding blocks Start Work; recorder can't self-verify; quality approval doesn't release payment; 72h window never auto-transfers; non-admin rejected from simulator. Still covered by existing specs: delivery dispute (`dispute.spec.ts`), production/disabled rejection (backend unit tests).

Manual access: sign in as test admin → `/admin/test-orders`.

## 3. Staging (do not deploy without approval)
- Vercel: branch `staging` → Preview env only. `VITE_API_BASE_URL=https://staging-api.<domain>`.
- NestJS: separate instance, `NODE_ENV=staging`, `TEST_ORDER_SIMULATOR_ENABLED=true`, `TEST_ORDER_ADMIN_IDS=<staging admin ids>`, `PAYMENTS_MODE=simulated`, no live Paystack/Flutterwave keys.
- Postgres: separate database (e.g. `moe_staging`), own `DATABASE_URL`, `prisma migrate deploy`.
- CORS: `CORS_ORIGINS=https://<project>-git-staging-<team>.vercel.app` only.
- Notifications: `NOTIFICATIONS_TRANSPORT=log` (or sandbox mail inbox). Media: separate Cloudinary folder/account `moe-staging`.
- Production keeps `TEST_ORDER_SIMULATOR_ENABLED` unset → simulator returns 403/404.
