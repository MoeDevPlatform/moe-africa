# Requirement 20 — Cleanup Proposal (NOT EXECUTED)

**Status:** Proposal only. No mock files deleted, no fallbacks disabled, no seed/DB records migrated under Phase 2 approval.

Phase 2 *did* stop using `fallbackProducts` inside `productsService.list` so public All Products no longer silently substitutes mocks when the API fails. The mock modules and other catch-paths remain until you approve specific rows below.

---

## Proposed actions (awaiting your pick)

| # | Source | Location | Dependencies | Proposed change | Risk | Rollback |
|---|--------|----------|--------------|-----------------|------|----------|
| A | Mock catalogue | `src/data/mockData.ts` | Cards, helpers, other page catch blocks | Gate behind `import.meta.env.DEV` or `VITE_ENABLE_MOCKS`; remove from production error paths | Medium — offline/demo UX | Restore imports |
| B | `fallbackProducts` | `src/lib/apiServices.ts` (exported, unused by `list`) | None for list; other callers may still import | Delete or DEV-only after confirming no callers | Low | Reintroduce function |
| C | `productsService.getById` mock fallback | `apiServices.ts` | Product detail offline | Stop returning `mockGetProductById` on error; show error UI | Medium | Restore catch |
| D | Page-level mock catches | e.g. `AllArtisans.tsx`, `CategoryProducts.tsx` | Those pages | Same error/retry pattern as All Products | Medium | Restore catch |
| E | `ProviderCard` mock product counts | `ProviderCard.tsx` | Cards missing `productCount` | Require API `productCount` only | Low | Restore helper |
| F | Prisma seed | `moe-backend/prisma/seed.ts` | Local/staging | Document “never run in prod”; optional CI flag | Low | N/A |
| G | `ensure-admins.ts` | `prisma/ensure-admins.ts` | Bootstrap | Rotate prod passwords; keep script for local | High if misused on VPS | Re-hash known admins |
| H | Playwright/load fixtures | `tests/fixtures/seedArtisans.ts`, seed specs | E2E load tests that inflate VPS counts | Keep test-only; never run seed suite against VPS without approval | High on VPS | N/A |
| I | Legacy `POST /orders/custom-requests` stub | BE customization-orders | Legacy modal | Deprecate after Phase 3 custom-order work | Medium | Restore route |
| J | Dual Recently Viewed keys | `moe_recently_viewed` vs `recentlyViewed` | Home | Unify in Phase 6 (Req 26); not catalogue truth | Low | Revert |

---

## Recommended first approval batch

If you approve a minimal cleanup next: **A + B + C + D** (stop mock substitution on failure across listing/detail surfaces) without deleting `mockData.ts` file contents until a second approval.

**Do not approve** H against the VPS catalogue without an explicit “seed VPS” instruction.

---

## Explicit non-actions under this proposal

- No truncation of VPS/`moe_dev` catalogue rows  
- No disabling of section algorithmic fill  
- No Cloudinary bulk deletes  
