# Phase 1 — Marketplace Requirements Audit & Test Baseline

**Date:** 2026-10-23  
**Repos:** `moe-africa` (Vite/React, port 8080) · `moe-backend` (NestJS/Prisma, port 3000)  
**Mode:** Audit and planning only. No feature implementation. No destructive data changes.  
**Live API spot-check:** `GET https://moe-backend.duckdns.org/products?page=1&pageSize=20` → `pagination.totalItems=303`, `pageSize=20`, `totalPages=16`, 20 rows returned. Public artisans `public-info` → `totalItems=73`. Frontend `https://moe-africa-mvp.vercel.app` HTTP 200.

Status key: **working** · **missing** · **partial** · **broken** · **duplicated/inconsistent** · **blocked** · **approval required**

---

## 1. Executive summary

Postgres via the Nest API is the intended catalogue source of truth, but the public UI often shows only the first page of results, falls back to `mockData.ts` on any API error, and disagrees with admin on counts and filters. Highest-impact Phase 2 defects: All Products load-more missing (303 → shows ~20), Admin Add Product sending non-whitelisted `variationTypes`, and no admin product image upload path.

| Phase | Reqs | Dominant statuses |
|-------|------|-------------------|
| 2 Catalogue | 11, 12, 16, 20, 21, 31 | broken / duplicated / missing (+ 20 approval required for cleanup) |
| 3 Custom orders / messaging | 13–15, 29, 30, 32, 33 | partial / missing / broken |
| 4 Search / filters | 1–5, 9, 10, 17 | partial / missing |
| 5 Dashboards | 6, 18, 19 | partial / missing / broken |
| 6 Homepage / curation | 23–28 | partial / broken / duplicated |
| 7 Customer UI / signup | 7, 8, 22 | missing |

---

## 2. Requirements matrix (all 33)

### Req 1 — Admin Artisan filters
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Status + client search work on `/admin/artisans` (`Artisans.tsx`, `adminArtisanDirectory.ts`, `GET /admin/artisans?status=`). Category, date, location filters absent. |
| **Proposed fix** | Add category/service, date-range, location filters against real profile fields; keep status; combine with search. Prefer BE query params if adding server filter support. |
| **Risk** | Low–medium (client directory already loads all pages). |
| **Playwright** | Admin artisans: combine status + search + category; empty state; URL sync. |

### Req 2 — Naming conventions for internal SEO
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | `metaTitle` / `metaDescription` on models + `SEOMeta`; no in-form naming convention guidance. |
| **Proposed fix** | Document conventions; add concise form helper text. Do not auto-rewrite existing content (approval required). |
| **Risk** | Low. |
| **Playwright** | Create forms show guidance; placeholders not submitted as values. |

### Req 3 — Searchable Artisan selector (Admin Add Product)
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | Plain `Select` capped at `pageSize=100` approved artisans (`Products.tsx`). Combobox pattern exists in Settings. |
| **Proposed fix** | Searchable combobox over full directory (reuse `adminArtisanDirectory`); persist `artisanId`. |
| **Risk** | Low. |
| **Playwright** | Partial name match; select persists correct id on create. |

### Req 4 — Alphabetical ordering
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | Admin/public lists use `createdAt desc` or unsorted `public-info` slice; no `localeCompare` list defaults. |
| **Proposed fix** | Case-insensitive name sort where no intentional ranking; preserve newest/best-seller/relevance/manual collections. |
| **Risk** | Low–medium (ordering changes visible). |
| **Playwright** | All Artisans default A→Z; product lists without sort param alphabetical. |

### Req 5 — Useful Admin list filters
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Products/artisans: status + search. Orders: search only. Categories: search. Reviews list page missing. |
| **Proposed fix** | Add meaningful status/date/category filters per list; admin reviews index if required by Req 15. |
| **Risk** | Low. |
| **Playwright** | Each list: filter combine, clear, empty. |

### Req 6 — Artisan name in product-selection UIs
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Admin products table + public cards show artisan; `SectionDetail` product picker shows name/price only. |
| **Proposed fix** | Show artisan brand/name beside product in all curation pickers. |
| **Risk** | Low. |
| **Playwright** | Section item search results include artisan label. |

### Req 7 — Product detail “Message Us”
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | `ProductDetail.tsx`: label “Message Artisan”, `variant="ghost"`. |
| **Proposed fix** | Rename to “Message Us”; border/outline styling parity with cart/wishlist; keep messaging to product’s artisan. |
| **Risk** | Low. |
| **Playwright** | Label + click opens messaging for that artisan. |

### Req 8 — Artisan enquiry CTA
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | `ProviderDetail.tsx`: “Contact Us About This Artisan” (hero + sidebar). |
| **Proposed fix** | Rename to “Make an Enquiry”; preserve enquiry/messaging target. |
| **Risk** | Low. |
| **Playwright** | Label + flow targets displayed artisan. |

### Req 9 — Naming placeholders
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Artisan `AddProductModal` has good placeholders; admin Add Product name field lacks them; admin Add Artisan weak. |
| **Proposed fix** | Add helpful placeholders/guidance; ensure not submitted as data. |
| **Risk** | Low. |
| **Playwright** | Placeholders visible; empty submit still validates. |

### Req 10 — Public filters and sorting
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | All Products reads URL filters but little on-page UI; BE `getSort` supports newest/price only — `bestSeller`/`trending` ignored. Artisans have FilterDrawer; incomplete vs Home. |
| **Proposed fix** | Page-appropriate controls wired to real queries; implement or drop unsupported sort keys. |
| **Risk** | Medium. |
| **Playwright** | Each control changes result set; combine + reset. |

### Req 11 — One source of truth (products/artisans)
| Field | Value |
|-------|--------|
| **Status** | **duplicated/inconsistent** |
| **Evidence** | Live DB via `/products` & admin APIs; parallel `mockData.ts` + `apiServices` catch-all fallbacks; public approved-only vs admin all statuses; dual `providerId`/`artisanId`. |
| **Proposed fix** | Restrict mocks to DEV/offline; unify relationships; document approved vs all count semantics. |
| **Risk** | Medium (fallback behaviour change). |
| **Approval** | Mock removal/disable in prod paths needs explicit cleanup approval (ties to Req 20). |
| **Playwright** | Same product id on public + admin; card fields match API. |

### Req 12 — Admin Add Product fails
| Field | Value |
|-------|--------|
| **Status** | **broken** |
| **Root cause** | `handleAddProduct` always POSTs `variationTypes`; `CreateAdminProductDto` has no such field; global `forbidNonWhitelisted: true` → 400. Secondary: `replaceProductVariations` uses artisan route with admin JWT. |
| **Files** | `Products.tsx`, `create-admin-product.dto.ts`, `admin.service.ts`, artisan variations routes. |
| **Proposed fix** | Align DTO/service with payload or strip variations from admin create and add admin-safe variation API; stop artisan-route calls from admin. |
| **Risk** | Medium. |
| **Playwright** | Admin creates product with artisan; persists after refresh; appears in admin + public when approved. |

### Req 13 — Custom Order Budget + Reference Image UX
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Min/Max ₦ fields only (no useless Budget button found). Reference upload = plain file input; legacy dashed zone unused. |
| **Proposed fix** | Confirm Budget control absence OK; upgrade reference upload affordance + feedback. |
| **Risk** | Low. |
| **Playwright** | File picker opens; preview shown; submit includes images when authorized. |

### Req 14 — Custom-order Forbidden
| Field | Value |
|-------|--------|
| **Status** | **partial** (gates working; UX/report ambiguous) |
| **Evidence** | 403 if role ≠ customer or artisan ineligible (`custom-orders.service.ts`). FE often shows generic “Forbidden”. |
| **Proposed fix** | Surface distinct messages; ensure CTA only when eligible; do not weaken auth. |
| **Risk** | Medium (auth). |
| **Playwright** | Customer eligible: 201; non-customer / ineligible: 403 with clear copy. |

### Req 15 — Reviews in Admin Dashboard
| Field | Value |
|-------|--------|
| **Status** | **missing** on dashboard (**working** on Artisan Detail) |
| **Evidence** | Dashboard activity = messages only; copy mentions reviews. |
| **Proposed fix** | Include reviews feed per moderation rules without bypass. |
| **Risk** | Low. |
| **Playwright** | Submit review → appears in admin with correct artisan/status. |

### Req 16 — All Products catalogue / batches of 20
| Field | Value |
|-------|--------|
| **Status** | **broken** |
| **Root cause** | BE paginates (live: 303/20/16 pages). FE `AllProducts.tsx` single `list()` with no page/load-more; count = `displayProducts.length`. |
| **Proposed fix** | Backend-driven append of 20; loading/retry/end; preserve filters; use `totalItems` for count. |
| **Risk** | Medium. |
| **Playwright** | First 20 → scroll → next 20 unique; stop at end; filter reset. |

### Req 17 — Explore All Artisans controls
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Some filters via drawer; Featured URL; no Top Rated/Featured/Best-Selling tabs; delivery period hidden in `artisansOnly`; no alphabetical default; custom-order is separate page. |
| **Proposed fix** | Meaningful chips backed by real metrics; alphabetical default. |
| **Risk** | Medium. |
| **Playwright** | Each chip changes set; default A→Z. |

### Req 18 — Pending Orders card (Artisan Dashboard)
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | Total Orders only; `GET /artisans/me` lacks pending aggregate. |
| **Proposed fix** | Pending count for signed-in artisan; click → orders with pending filter. |
| **Risk** | Low. |
| **Playwright** | Count matches artisan’s pending orders; navigates correctly. |

### Req 19 — Artisan Orders status controls
| Field | Value |
|-------|--------|
| **Status** | **broken** |
| **Root cause** | UI uses `PATCH /orders/:id` (customer-owned). Artisans need `PATCH /orders/:id/status`. Status enums diverge (FE vs BE vs “New/Pending/Completed” labels). |
| **Proposed fix** | Map labels to real statuses; fix endpoint; filter list by selection. |
| **Risk** | High (order integrity). |
| **Playwright** | Filters + status transitions for artisan-owned orders only. |

### Req 20 — Static/mock/generated data inventory
| Field | Value |
|-------|--------|
| **Status** | **approval required** (inventory complete; no cleanup performed) |
| **Inventory (summary)** | See §4. |
| **Proposed fix** | Feature-flag mocks; remove prod catch→mock; keep seeds/tests isolated. |
| **Risk** | High if deleted without plan. |
| **Playwright** | After approved cleanup: public lists never show mock IDs when API healthy. |

### Req 21 — Admin 303 vs frontend 20
| Field | Value |
|-------|--------|
| **Status** | **duplicated/inconsistent** (confirmed live) |
| **Root cause** | Live public API also reports **303** total; UI shows first page length (~20) and never paginates. Admin dashboard counts non-deleted products (same order of magnitude). Not primarily “two catalogues” when API is healthy. |
| **Proposed fix** | Same as Req 16 + display `totalItems`; document approved vs all-status if they diverge. |
| **Risk** | Low once pagination fixed. |
| **Playwright** | UI total matches API `totalItems` for same filter scope. |

### Req 22 — Signup Terms/Privacy consent
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | `Auth.tsx` signup has no required checkbox; passive links only. `/terms`, `/privacy` exist. |
| **Proposed fix** | Required unchecked checkbox; block signup without consent; enforce in signup path; links correct. |
| **Risk** | Low–medium (auth). |
| **Playwright** | Unchecked blocked; checked succeeds; links open policies. |

### Req 23 — All Products / New Arrivals / Best Sellers differ
| Field | Value |
|-------|--------|
| **Status** | **broken** / **duplicated/inconsistent** |
| **Evidence** | FE maps `sort=newest` / `sort=bestSeller` / `featured=true`. BE ignores `bestSeller` sort and flag filters. Homepage “Best Sellers” shelf = `featured_picks` section, not product flags. |
| **Proposed fix** | Distinct authoritative queries (date / sales or flags / all eligible); align homepage labels. |
| **Risk** | Medium. |
| **Playwright** | Three URLs return meaningfully different ordered sets on known fixtures. |

### Req 24 — Best Sellers expanded page
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | MegaMenu → `/marketplace/products?sort=bestSeller`. MobileMenu → `/marketplace?featured=best-sellers` ignored by Home. |
| **Proposed fix** | Unify nav to dedicated listing with same logic as homepage Best Sellers. |
| **Risk** | Low. |
| **Playwright** | Desktop + mobile nav land on correct listing. |

### Req 25 — Separate sections + Featured Picks listing
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Admin sections keys OK (`featured_picks`, `seasonal_picks`, …). Homepage titles “Best Sellers” for `featured_picks`; Featured Picks nav uses product `featured=true`, not section. |
| **Proposed fix** | Independent management + matching expanded listings per section. |
| **Risk** | Medium. |
| **Playwright** | Edit one section; others unchanged; Featured Picks View All correct. |

### Req 26 — View All + reusable listings + Recently Viewed
| Field | Value |
|-------|--------|
| **Status** | **partial** / **duplicated/inconsistent** |
| **Evidence** | Search View All works. Homepage shelves lack View All. Two Recently Viewed systems: `moe_recently_viewed` (products) vs `recentlyViewed` (artisans) on Home. |
| **Proposed fix** | View All → collection-param listings; unify recently viewed semantics. |
| **Risk** | Medium. |
| **Playwright** | Each View All destination + recently viewed fidelity. |

### Req 27 — Ethical discovery
| Field | Value |
|-------|--------|
| **Status** | **partial** + **approval required** for new rec surfaces |
| **Evidence** | Events, preferences, recommendations endpoint, behaviour admin exist. |
| **Proposed fix** | Propose transparent, data-backed improvements only; no dark patterns. |
| **Risk** | Product decision. |
| **Playwright** | If approved, assert labels and real-data sourcing. |

### Req 28 — Algorithm items visible; append not overwrite
| Field | Value |
|-------|--------|
| **Status** | **partial** |
| **Evidence** | Public `getPublicSection` appends algorithmic fill to curated. Admin add appends; PUT replace wipes. Admin cannot see algorithm fills; no curated vs algorithm flag in API. |
| **Proposed fix** | Surface algorithm items in admin; keep append semantics; avoid accidental replace. |
| **Risk** | Medium. |
| **Playwright** | View/add/remove/reorder/persist without wiping other sections. |

### Req 29 — Custom-order form guidance
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | Active `CustomOrderRequestModal` has title only; guidance lives in unused legacy modal. |
| **Proposed fix** | Top-of-form friendly guidance + description help text. |
| **Risk** | Low. |
| **Playwright** | Guidance visible before submit. |

### Req 30 — Conversation not found / messaging FAB
| Field | Value |
|-------|--------|
| **Status** | **partial** / **broken** |
| **Evidence** | Thread resolves only via list membership → “Conversation not found.” No floating message button (only refresh FAB). Admin dashboard `?conversation=` vs `/admin/messages/:id` mismatch. |
| **Proposed fix** | Proper empty state / fetch by id; floating messaging control; fix admin deep links. |
| **Risk** | Medium. |
| **Playwright** | No-conversation empty; open existing; send; unread; FAB. |

### Req 31 — Admin product image upload
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | Admin Add Product has no image UI/API. Artisan-only `POST /artisans/me/products/upload-image` (Cloudinary). “Variable error” likely overlaps Req 12 whitelist errors and/or missing upload state. |
| **Proposed fix** | Admin upload (or URL) → Cloudinary → `images[]` on product; display on cards/detail. |
| **Risk** | Medium (storage policies). |
| **Playwright** | Select file → upload → associate → visible admin + public. |

### Req 32 — Project Description length
| Field | Value |
|-------|--------|
| **Status** | **missing** |
| **Evidence** | FE `validateCustomOrder` min 50; BE `@MinLength(50)`; no max 200. |
| **Proposed fix** | Allow 0–200 (respect required rule); show “Maximum 200 characters”; align FE/BE. |
| **Risk** | Low. |
| **Playwright** | Short valid; >200 rejected; required rule preserved. |

### Req 33 — Custom-order quote / payment follow-up
| Field | Value |
|-------|--------|
| **Status** | **missing** / **partial** |
| **Evidence** | Accept/decline + status only; no quote amount/payment link. Customer `/marketplace/orders` ignores `GET /custom-orders/me`. |
| **Proposed fix** | Reuse notifications/messaging; expose customer request status; only add payment links if product-supported. |
| **Risk** | High (payments). |
| **Approval** | Payment URL behaviour needs product confirmation. |
| **Playwright** | Request → artisan response visible to customer; unauthorized access denied. |

---

## 3. Playwright & runtime baseline

### How to run

| App | Command | Notes |
|-----|---------|--------|
| FE | `cd moe-africa && npm run dev` | Vite **8080** (`vite.config.ts`); README still mentions 5173 (stale). |
| BE | `cd moe-backend && npm run start:dev` | Port **3000**; Prisma migrate/generate first (`howtorun.md`). |
| E2E | `cd moe-africa && npm run test:playwright` or `npx playwright test tests/playwright --project=chromium` | Default base URL: Vercel; API: duckdns. |

### Config & accounts

- Config: `moe-africa/playwright.config.ts` (desktop/tablet/mobile/chromium/seed).
- Env template: `.env.example` (`PLAYWRIGHT_*`, `ADMIN_*`).
- Local `.env`: Playwright admin/artisan/customer emails **SET** (values not recorded here).
- Global setup: `tests/playwright/global-setup.ts`.
- Helpers: `tests/helpers/{authFlows,adminFlows,moeApi,playwrightEnv}.ts`.

### Existing Playwright inventory (relevant)

| Spec | Covers (partially) |
|------|--------------------|
| `commerce-ui-sprint.spec.ts` | Custom order form, homepage sections |
| `custom-orders.spec.ts` | Custom orders |
| `search.spec.ts` | View all + `q` |
| `admin.spec.ts` / `admin-scoring.spec.ts` | Admin / sections |
| `auth.spec.ts` | Auth (no consent checkbox) |
| `behaviour.spec.ts` | Recently viewed products |
| `artisan*.spec.ts`, `variations.spec.ts` | Artisan products / variations |
| `ui-audit` / `visual-regression` / `accessibility` / `mobile` | UX sweeps |

**Gaps for this brief:** All Products infinite scroll, admin create+upload, Message Us / Make an Enquiry, signup consent, artisan pending orders, Best Sellers differentiation, messaging FAB, Req 32 limits.

### Baseline run status (this Phase 1 session)

| Check | Result |
|-------|--------|
| Live `GET /products` pagination | **Pass** — 303 total, 20/page, 16 pages |
| Live `GET /service-providers/public-info` | **Pass** — 73 total, 20/page |
| FE marketplace products HTTP | **Pass** — 200 |
| Full Playwright feature suite | **Not run** this session (audit-only; avoid attributing prod flakiness before Phase 2). Recommend run after Phase 2 against the same `PLAYWRIGHT_BASE_URL` with existing creds. |
| Unit-ish tests present | `tests/custom-order-rules.test.ts`, `admin-artisan-directory.test.ts`, `artisan-listings.test.ts`, `section-keywords.test.ts` |

**Record for later deltas:** Any “only 20 products” / admin create / Forbidden custom-order failures observed after Phase 2 should be compared against this matrix, not treated as new regressions from mocks alone when API returns 303.

---

## 4. Requirement 20 — Data source inventory (no cleanup)

| Source | Location | Facing | Relied on by | Proposal | Rollback |
|--------|----------|--------|--------------|----------|----------|
| Mock catalogue | `src/data/mockData.ts` | Dev/offline; **also prod catch paths** | `apiServices` fallbacks, AllProducts/AllArtisans, cards | Gate behind `DEV` / `VITE_ENABLE_MOCKS`; never replace live errors silently | Restore import + catch |
| API catch mocks | `src/lib/apiServices.ts` | Runtime | Most marketplace calls | Narrow to network failures + telemetry | Revert catch |
| Image placeholders | `src/lib/imageFallback.ts`, `assets/uploads` | UI | Broken images | Keep presentation-only | N/A |
| Static categories | FE `lib/categories.ts`, BE `product-categories.ts` / `service-categories.ts` | Runtime | Forms, menus | Prefer `GET /categories`; keep code sync | Revert |
| CategoriesContext fallback | `CategoriesContext.tsx` | Runtime | Category UI | Empty-state only | Revert |
| Recently viewed LS | `recentlyViewed.ts` + legacy key on Home | Client | Home / PDP | Keep; unify keys | N/A |
| Prisma seed | `moe-backend/prisma/seed.ts` | Dev | Local DB | Do not run in prod | Re-seed |
| Admin bootstrap | `prisma/ensure-admins.ts` | Dev/bootstrap | Admin login | Rotate secrets for prod | Recreate admins |
| Category SQL seeds | migrations `isSeed` | DB | Taxonomy | Keep | Migration down |
| Customisation templates | `product-customisation.templates.ts` | Config | Custom order fields | Keep or CMS later | Revert |
| Section constants + algorithmic fill | `sections.constants.ts`, `sections.service.ts` | Runtime DB-derived | Homepage | Keep algorithm; label sources | Revert |
| Playwright fixtures | `tests/fixtures/seedArtisans.ts`, seed specs | Test only | Load tests (~303 products likely) | Keep out of prod bundle | N/A |
| Legacy custom-order stub | `POST /orders/custom-requests` in-memory | Uncertain | Legacy modal | Deprecate after migration | Restore route |
| Dual Recently Viewed | `moe_recently_viewed` vs `recentlyViewed` | Prod UX | Home | Unify under one semantic | Revert |

**Separate approval required before:** deleting mocks, truncating seed/load-test products, disabling algorithmic fill, or migrating disputed tables.

---

## 5. Proposed sequence (unchanged brief order)

1. **Phase 2** — Reqs 11, 12, 16, 20 (proposal only), 21, 31  
2. **Phase 3** — 13, 14, 15, 29, 30, 32, 33  
3. **Phase 4** — 1, 2, 3, 4, 5, 9, 10, 17  
4. **Phase 5** — 6, 18, 19  
5. **Phase 6** — 23–28  
6. **Phase 7** — 7, 8, 22  
7. **Phase 8** — Full regression + final 33-item verification matrix  

---

## 6. Phase 2 preview (not started)

**Intended changes (after your approval):**

- Fix Admin Add Product payload/DTO/variations path (Req 12).  
- Implement All Products backend-driven infinite batches of 20 + correct totals (Req 16, 21).  
- Trace and align public vs admin catalogue sources; document count semantics (Req 11).  
- Deliver Req 20 cleanup **proposal** only unless you separately approve specific removals.  
- Add admin product image upload via existing Cloudinary stack (Req 31).  

**Likely files:** `AllProducts.tsx`, `Products.tsx` (admin), `apiServices.ts`, `create-admin-product.dto.ts`, `admin.service.ts` / controller, multer/Cloudinary upload route, Playwright specs under `tests/playwright/`.  

**Risks:** Mock fallback behaviour; storage policies; variation API auth; large catalogue scroll performance.  

**Playwright plan:** Admin create product (+ image); public All Products scroll through >20 into second batch; totals match API; no duplicate ids.

---

## 7. Stop — approval gate

Phase 1 complete. **No Phase 2 work has started.**

Please reply with explicit approval to begin **Phase 2** (e.g. “Approve Phase 2”), and separately confirm any Req 20 cleanup actions if you want them in that phase. Optional limits: local-only vs Vercel/duckdns, which Playwright project, whether admin create may write to the live API database.
