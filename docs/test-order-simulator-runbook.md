# Test Order Simulator — local restart and fixture runbook

This workflow is for an isolated local/staging database only. It never calls a
payment gateway or bank-transfer API. Production must leave the feature flag
unset/false.

## Preserved successful run

- Reference: `TEST-6D42230A-38D3-4465-BDD5-01528CE7D13E` (`Order.id=120`)
- Local database: `moe_dev`
- Screenshots and successful role videos:
  `../test-artifacts/test-order-simulator/`

Artifacts and credentials are intentionally gitignored and must not be moved
into a repository.

## Restart after reboot

Start your installed PostgreSQL service first, verify the isolated database,
then use three terminals from `MOE-WORSPACE`:

```bash
pg_isready -d moe_dev
```

Backend:

```bash
cd moe-backend
npx prisma migrate deploy
npx prisma migrate status

# Only when the dedicated fixtures/config are missing or need rotating.
npx ts-node scripts/setup-test-order-simulator.ts

set -a
source .env.simulator.local
set +a
RESEND_API_KEY= RESEND_FROM_EMAIL= \
CLOUDINARY_CLOUD_NAME= CLOUDINARY_API_KEY= CLOUDINARY_API_SECRET= \
npm run start:dev
```

The Nest config loader reads the normal gitignored `.env` for `DATABASE_URL`
and JWT secrets. `.env.simulator.local` supplies only simulator overrides and
generated test credentials. Never copy either file to source control.

Frontend:

```bash
cd moe-africa
VITE_API_BASE_URL=http://127.0.0.1:3000 \
npm run dev -- --host 127.0.0.1 --port 8080
```

Open `http://127.0.0.1:8080/admin/test-orders`. Read the local account emails
and passwords from `../moe-backend/.env.simulator.local`.

Run the reusable lifecycle only when a new verification is actually needed:

```bash
cd moe-africa
set -a
source ../moe-backend/.env.simulator.local
set +a
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
MOE_API_BASE_URL=http://127.0.0.1:3000 \
SIM_API_BASE_URL=http://127.0.0.1:3000 \
SIM_BACKEND_PATH=../moe-backend \
npx playwright test tests/playwright/test-order-lifecycle.spec.ts \
  --project=lifecycle --reporter=list
```

The test deliberately keeps its successful order. New output goes under the
gitignored `test-results/lifecycle/` directory.

## Recreate dedicated fixtures

`scripts/setup-test-order-simulator.ts` is idempotent. It creates or refreshes:

- test admin with `payout_amount_approve`;
- separate Finance Recorder with `payout_transfer_record`;
- separate Finance Verifier with `payout_transfer_verify`;
- customer and artisan users marked `isTestUser=true`;
- an approved `MOE Simulator Studio` storefront;
- an approved `MOE Simulator Test Garment` owned by that artisan.

It generates a fresh shared local password, writes all IDs/emails/passwords to
`.env.simulator.local` with mode `0600`, and prints only non-secret IDs. Reruns
do not delete retained test orders.

## Safe simulator configuration

The authoritative safe template is the simulator block in
`moe-backend/.env.example`. Required gates are:

```dotenv
APP_ENV=test
NODE_ENV=test
TEST_ORDER_SIMULATION_ENABLED=true
TEST_ORDER_SIMULATION_DATABASE_NAMES=moe_dev
TEST_ORDER_SIMULATION_ADMIN_IDS=<admin-id>,<recorder-id>,<verifier-id>
PAYMENT_MODE=test
PAYMENT_LIVE_ENABLED=false
ORDER_SCHEDULERS_ENABLED=false
INITIAL_PAYOUT_LIMITS_JSON='{"NGN":{"maxAbsolute":50000}}'
```

The **₦50,000 value is a local test ceiling**, chosen to exercise limit checks.
It is not an approved MOE manual-funding policy. Production limits or ratios
require an explicit Finance policy decision; if no policy is configured, the
backend continues to fail closed unless an authorised exception and reason are
recorded.

## Genuine-data exclusions

- Sales-ranked Best Sellers count only `Order.isTestOrder=false`.
- Public product/artisan review aggregates exclude `isTestUser` customers and
  reviews linked to test orders.
- Admin marketplace totals and artisan order counts exclude test orders/users.
- Earnings & Payouts excludes test-order IDs before requesting payout bundles,
  so simulated transfers never enter verified earnings, pending payouts,
  outstanding balances, milestones, or payment history.
- Test orders remain visible in their dedicated customer, artisan, admin and
  simulator views for lifecycle inspection.

## Outstanding external-service verification

The successful local lifecycle intentionally ran with Cloudinary and Resend
disabled. Its quality/final-payment evidence was a clearly marked local test
fixture; API state transitions remained real.

Before staging sign-off, still verify:

1. Multipart readiness, production, quality and payout-evidence uploads using
   a separate staging Cloudinary account/folder—never production storage.
2. Signed/private evidence retrieval and deletion/replacement behaviour.
3. Email/notification delivery using a staging Resend key and sink inbox,
   confirming no genuine customer/artisan recipient is addressed.
4. Retry/idempotency behaviour for both services.

Do not relax the simulator environment/database/admin allowlists to complete
those checks.
