# Phase 4 Report — Search, filtering, sorting, and artisan discovery

**Date:** 2026-10-24  
**Requirements:** 1, 2, 3, 4, 5, 9, 10, 17  
**Not in scope:** Requirement 33 payment/quotation workflow. Existing payment and order behaviour was left as-is. Phase 5 was not started.

---

## 1. Requirements

| Req | Audit finding | What changed | Evidence |
|-----|----------------|--------------|----------|
| **1** Admin artisan filters | Status and client search worked. Category, date, and location were absent. | Directory still loads every admin page, then filters by category/service, country (name or stored code), state, city, and created-date range. Status filter and search stay. Clear resets the extra filters. | `filterArtisanDirectory` checks: combined Beauty + Nigeria + Abia + Aba + March 2026 returns only the matching row; Nigeria + Lagos matches a profile stored as `NG`. UI: `/admin/artisans` filter bar. Playwright not run — local Postgres was down. |
| **2** Naming / internal SEO | `metaTitle` / `metaDescription` exist. Create forms had no convention guidance. | Helper text on admin Add Product and Add Artisan. No existing product or artisan names were rewritten. | Placeholders and help copy in the create dialogs. Empty fields still fail the existing required-field check; placeholders are not written into state. |
| **3** Searchable artisan selector | Add Product used a plain select capped at 100 approved artisans. | Combobox searches the full approved directory (name, email, brand, business) and stores that row’s user id as `artisanId`. Options are A–Z. | `ArtisanCombobox` + `loadArtisanDirectory`. Playwright spec asserts the POST body `artisanId` equals the selected public artisan id. Spec not executed. |
| **4** Alphabetical ordering | Lists used `createdAt desc` or an unsorted public slice. | Public products default to `sort=name_asc`. Public artisans default to brand name A–Z. Admin products default to name A–Z. Newest, price, featured, top rated, and best-seller views keep their own order. | `ProductsService.getSort` default is `{ name: 'asc' }`. `listPublicInfo` sorts with `localeCompare` unless `sort=rating`. |
| **5** Admin list filters | Products/artisans: status + search. Orders: search only. Categories and users already had search. | Products: server search, category, status, name sort. Orders: existing search plus status and payment filters the API already accepted. Custom orders: client search and status on the loaded page. Artisans: Req 1 filters. | Controls on `/admin/products`, `/admin/orders`, `/admin/custom-orders`, `/admin/artisans`. |
| **9** Naming placeholders | Artisan add-product modal already had examples. Admin add product/artisan did not. | Example placeholders and “placeholders are examples only” help. Values are submitted only from the controlled fields. | `namingConventions.ts`. Playwright spec checks the product name placeholder and that the submitted name is the typed value. Spec not executed. |
| **10** Public filters and sorting | All Products read URL filters but had little on-page UI. `bestSeller` and `trending` were ignored. | On-page sort, category, min/max price, and max delivery. Those map to real query params. `bestSeller` / `trending` now require the stored product flags and do not invent a ranking. Clear removes the controls. | `AllProducts` controls call `GET /products` with `sort`, `category`, `minPrice`, `maxPrice`, `maxDeliveryDays`, `isBestSeller`, `isTrending`. |
| **17** Explore all artisans | Drawer filters existed. No Top Rated / Featured / Best Seller chips, delivery was hidden, default order was not A–Z. | Chips: All, Featured, Top Rated, Custom Orders, Best Sellers. Drawer adds custom-order availability and average delivery period. Default is A–Z. Top Rated uses real review averages and hides artisans with no reviews. Best Sellers keeps only artisans who have a product with `isBestSeller=true`. | `AllArtisans` + `useArtisanSearch` + `GET /service-providers/public-info`. Cards show the stored `estimatedDeliveryDays`. |

---

## 2. Actual control behaviour

- **Admin artisans.** Status still reloads `GET /admin/artisans?status=`. Search, category, country, state, city, and dates filter that loaded directory together. Clear removes those fields and shows the status result again. Empty copy: “No artisans match these filters.”
- **Admin products.** Search (debounced), category, and status are sent to `GET /admin/products`. Results are ordered by product name. The artisan field opens a search box; choosing a row sets `artisanId` to that artisan’s user id.
- **Admin orders.** Search, order status, and payment status are sent together to `GET /admin/orders`. Clear resets all three.
- **Admin custom orders.** Search and status filter the already loaded request list. Ranking stays on the server’s composite rank.
- **All Products.** Default request sort is `name_asc`. Category, price, and delivery each change the query. Clear drops those params. `?sort=bestSeller` and `?sort=trending` return only rows whose flags are true. If none are flagged, the page is empty.
- **All Artisans.** Default request sort is `name`. Featured sends `featured=true`. Custom Orders sends `customOrderEligible=true` and still drops anyone who is not `isCustomOrderEligible`. Top Rated sorts by the average of stored reviews. Best Sellers sends `hasBestSeller=true`. Delivery uses `estimatedDeliveryDays` on the profile. The schema default for that column is 7, so a “within 7 days” filter matches profiles that still have the stored default.

Homepage preview filters were not retargeted. That page uses an intentional featured/rating preview and belongs to Phase 6.

---

## 3. Files

### Backend
- `src/products/products.service.ts` — name sort default; price, newest, best-seller, trending sorts; best-seller/trending/new-arrival flags; materials; state; max delivery days
- `src/service-providers/service-providers.service.ts` — featured, custom-order, delivery, minimum rating, best-seller product ownership; A–Z or rating sort
- `src/admin/admin.service.ts` — artisan list returns category, services, and location; product list accepts search, category, and name sort
- `src/admin/admin.controller.ts` — product list query params

### Frontend
- `src/lib/adminArtisanDirectory.ts`
- `src/lib/namingConventions.ts` (new)
- `src/lib/apiServices.ts`
- `src/components/admin/ArtisanCombobox.tsx` (new)
- `src/components/marketplace/FilterDrawer.tsx`
- `src/components/marketplace/ProductCard.tsx`
- `src/components/marketplace/ProviderCard.tsx`
- `src/hooks/useArtisanSearch.ts`
- `src/pages/marketplace/AllProducts.tsx`
- `src/pages/marketplace/AllArtisans.tsx`
- `src/pages/admin/Artisans.tsx`
- `src/pages/admin/Products.tsx`
- `src/pages/admin/Orders.tsx`
- `src/pages/admin/CustomOrders.tsx`
- `tests/catalogue-filters.test.ts`
- `tests/playwright/phase4-discovery.spec.ts`

---

## 4. Tests

| Check | Result |
|-------|--------|
| Frontend `tsc --noEmit` | Pass |
| Backend `tsc --noEmit` | Pass |
| Artisan directory filter script (`npx tsx` against `filterArtisanDirectory`) | 3 checks passed: combined filters, country-code match, clear |
| `tests/catalogue-filters.test.ts` | Same three cases, written for `bun:test`. `bun` is not on this machine, so it was executed through `tsx` instead. |
| Playwright `tests/playwright/phase4-discovery.spec.ts` | **Not run.** `localhost:5432` did not respond (`pg_isready`: no response). Starting the system PostgreSQL 16 service needs a password (`sudo: a password is required`). No records were written to production or to `moe_dev`. |

The Playwright spec, once Postgres and the local API/FE are up, covers:

1. All Products first response uses `sort=name_asc`, returned names are A–Z, Tailoring changes the category query, Clear removes the category param.
2. All Artisans first response uses `sort=name`, visible names are A–Z, Featured requests `featured=true` and only featured rows.
3. Admin artisan search empty state and clear; Add Product placeholder is not submitted; selected artisan id is the POST `artisanId`.

Run it only against localhost:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
PLAYWRIGHT_API_BASE_URL=http://localhost:3000 \
PLAYWRIGHT_ADMIN_EMAIL=phase2.admin@local.test \
PLAYWRIGHT_ADMIN_PASSWORD=password123 \
npx playwright test tests/playwright/phase4-discovery.spec.ts --project=chromium
```

The third test creates one local admin product. Do not point `PLAYWRIGHT_BASE_URL` at Vercel.

---

## 5. Outstanding

- Playwright UI, navigation, and persistence checks are still outstanding until local PostgreSQL 16 is running on port 5432.
- Best Sellers and Trending stay empty when no product has `isBestSeller` or `isTrending` set. Those flags were not backfilled.
- Top Rated omits artisans with no review rows, even if `rating` is stored as 0.
- A product or artisan search is ordered A–Z, not by relevance score.
- Homepage filter drawer still filters the homepage preview set. It was not changed in this phase.
