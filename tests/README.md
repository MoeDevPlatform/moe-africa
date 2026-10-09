# MOE Playwright tests

## Live seed: 20 artisans × 5 products

Targets the **production-connected** Vercel app (not localhost):

| Layer    | URL |
|----------|-----|
| Frontend | https://moe-africa-mvp.vercel.app |
| Backend  | https://moe-backend.duckdns.org |

### What it does

1. **Preflight** — images under `src/Moe Images`, Vercel + API health.
2. **Sign-up** — for each of 20 artisans, completes the live `/auth` email sign-up form (artisan role; Google/Clerk is not used for artisans).
3. **Profile + products** — using the JWT issued by that sign-up, calls the same authenticated endpoints the dashboard uses (`PATCH /artisans/me`, image upload, `POST /artisans/me/products`) with images from `src/Moe Images`.
4. **Admin approve** — signs into https://moe-africa-mvp.vercel.app/admin via the portal UI and Approves only `[PW-SEED …]` rows (no API status shortcuts, no DB edits).
5. **Verify** — admin statuses after reload, public API/UI, Recommended Artisans sorts, and product discovery.

### Credentials (admin)

Put these in a **local** `.env` (already gitignored — do not commit):

```bash
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-password
```

Playwright loads `.env` at startup. The password is never hardcoded, logged, or written to reports. If login needs CAPTCHA/2FA, the test stops and asks you to complete verification.

### Safety

- Emails are unique per run: `artisan01.<runId>@moe-pw-seed.test`
- Names are tagged: `[PW-SEED <runId>] …` so records are identifiable
- **Never** signs into an existing account or overwrites production users
- Admin UI only approves tagged seed rows — never other artisans/products
- No mocks, no DB bypass
- Signup picks a chip from live `/meta/service-categories` (fallback if a preferred label is missing)
- Public verify paginates (API caps `pageSize` at ~100)

### Run

```bash
# Requires Playwright browsers once:
npx playwright install chromium

npm run test:seed
```

Optional flags:

```bash
MOE_SEED_FULL_UI=1 npm run test:seed      # also drive profile + Add Product UI for artisan #1
MOE_SEED_CLEANUP=1 npm run test:seed      # delete seeded products via artisan DELETE API at the end
```

Report: `test-results/seed-report.json`

### Keeping `.env` untracked

`.gitignore` already lists `.env`. If Git still shows changes, the file was committed earlier — remove it from the index once (keeps your local file):

```bash
git rm --cached .env
git commit -m "Stop tracking .env"
```

