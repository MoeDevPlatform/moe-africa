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
4. **Admin approve** — promotes seeded artisans/products so they appear in public discovery.
5. **Verify** — public API uniqueness/images + Vercel UI after reload + re-login.

### Safety

- Emails are unique per run: `artisan01.<runId>@moe-pw-seed.test`
- Names are tagged: `[PW-SEED <runId>] …` so records are identifiable
- **Never** signs into an existing account or overwrites production users
- No mocks, no DB bypass

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
