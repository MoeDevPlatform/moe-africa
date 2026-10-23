# Phase 2 Report — Catalogue integrity, pagination, admin create & image upload

**Date:** 2026-10-23  
**Scope:** Reqs **11, 12, 16, 21, 31** implemented & verified. Req **20** proposal only.  
**Environment:** Code in local repos. Mutating verification against **local** Nest (`localhost:3000`) + **`moe_dev`** Postgres + Vite (`localhost:8080`). VPS/production DB was **not** written by Playwright.  
**Note:** Real catalogue (~303) lives on the VPS; local DB was seeded with Phase2-only rows solely for pagination/mutation tests.

---

## 1. Requirements

| Req | Status | Root cause / outcome |
|-----|--------|----------------------|
| **11** | **Verified (partial completeness)** | Public product **list** no longer silently substitutes mocks on API failure (`productsService.list` throws; All Products shows error + Retry). Mock modules retained pending Req 20. Product ids/details from API used when healthy; admin-created local products visible on public list with correct artisan (`providerId`). Other pages may still have mock catch paths (listed in Req 20 proposal). |
| **12** | **Verified** | Admin POST sent `variationTypes` not on DTO → `forbidNonWhitelisted` 400; FE also called artisan variation route. **Fix:** DTO + `AdminService.createProduct` persists variations via `ProductVariationsService`; FE sends variations only in admin create body. |
| **16** | **Verified (local)** | All Products single-page fetch. **Fix:** backend-driven append, `pageSize=20`, IntersectionObserver, dedupe by id, loading/end/error/retry, filters preserved via URL. |
| **20** | **Proposal only** | See `PHASE2_REQ20_CLEANUP_PROPOSAL.md`. No cleanup executed. |
| **21** | **Verified (local)** | UI showed loaded length (~20). **Fix:** display `pagination.totalItems`. Local: UI total matched API (51+). VPS API previously confirmed `totalItems=303` (read-only in Phase 1); FE against VPS not re-tested in browser this phase (mutating suite locked to localhost). |
| **31** | **Verified** | No admin upload UI/API. **Fix:** `POST /admin/products/upload-image` (Cloudinary `moe/products`, admin JWT) + Admin Add Product file UI; images saved on create. |

---

## 2. Files changed

### Backend (`moe-backend`)
- `src/admin/dto/create-admin-product.dto.ts` — allow `variationTypes`
- `src/admin/admin.service.ts` — inject variations service; persist on create
- `src/admin/admin.controller.ts` — `POST admin/products/upload-image`

### Frontend (`moe-africa`)
- `src/pages/marketplace/AllProducts.tsx` — infinite scroll + `totalItems` + error/retry
- `src/pages/admin/Products.tsx` — image upload UI; valid create payload (no artisan variation call)
- `src/lib/apiServices.ts` — `adminService.uploadProductImage`; `list` without silent mock fallback
- `tests/playwright/phase2-catalogue.spec.ts` — Phase 2 suite (local-only guard)
- `tests/playwright/fixtures/phase2-upload.png` — tiny upload fixture

### Docs
- `PHASE2_REQ20_CLEANUP_PROPOSAL.md`
- `PHASE2_REPORT.md` (this file)

---

## 3. Playwright evidence (local)

**Command:**
```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
PLAYWRIGHT_ADMIN_EMAIL=phase2.admin@local.test \
PLAYWRIGHT_ADMIN_PASSWORD=password123 \
npx playwright test tests/playwright/phase2-catalogue.spec.ts --project=chromium --reporter=list
```

**Result: 3 passed (51.7s)**

| Test | Observations |
|------|----------------|
| Infinite scroll | Opened `/marketplace/products`. Count showed API `totalItems` (>20). Grid initially 20 cards. Scroll triggered `GET /products?page=2`. Page-1 and page-2 ids disjoint. Loaded count increased. |
| Search/filter | `/marketplace/products?q=Phase2%20Seed` → list API with `q=`; UI total matched `pagination.totalItems`; heading “Results for…”. |
| Admin create + image | Login → Add Product → select artisan → fill fields → file input → `POST /admin/products/upload-image` 200 (Cloudinary URL) → `POST /admin/products` 201 → success toast → refresh + search → name present → public search shows product heading in grid. |

**API persistence check (local):** product ids 74–76 have Cloudinary `images[]` and `providerId=14` (Phase2 Local Studio).

**API smoke (local):** create with `variationTypes` returned product id 72 with 1 variation type (pre-Playwright).

---

## 4. Limitations / not claimed

| Item | Limitation |
|------|------------|
| VPS 303 catalogue in browser | Mutating Playwright locked to localhost per your rules. Phase 1 read-only API confirmed VPS `totalItems=303`. Deploy FE/BE to VPS to verify production UI totals. |
| Local seed data | `Phase2 Seed Product *` and `phase2.*@local.test` exist only in **`moe_dev`**, not VPS. |
| Cloudinary | Upload uses the configured Cloudinary account (same as BE env). DB rows are local-only. |
| Req 11 elsewhere | Artisan listings / `getById` may still mock-fallback until Req 20 cleanup approved. |
| Req 20 | No removals. |
| Retry / failure UI | Error+Retry implemented; full offline failure not force-injected in Playwright (would need proxy abort). |
| Console errors | First scroll test did not assert console after listener attach order; no blocking failures observed in successful runs. |

---

## 5. Risks & rollback

- Revert the listed BE/FE files to undo Phase 2 behaviour.  
- No destructive migrations.  
- Local seed products can be deleted with `DELETE FROM "Product" WHERE name LIKE 'Phase2%'` on **moe_dev only** if desired.  
- Cloudinary assets from tests remain until manually cleaned in Cloudinary console.

---

## 6. Stop — Phase 3 gate

Phase 2 complete. **Do not start Phase 3** until you explicitly approve it.

Optional follow-ups before Phase 3:
1. Approve specific Req 20 cleanup rows (A–D recommended first).  
2. Deploy Phase 2 BE/FE to VPS and run a **read-only** Playwright pass against production totals (no creates).  
