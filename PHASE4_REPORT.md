# Phase 4 Report — Search, filtering, sorting, and artisan discovery

**Date:** 2026-10-24  
**Requirements:** 1, 2, 3, 4, 5, 9, 10, 17  
**Not in scope:** Requirement 33 payment/quotation workflow. Existing payment and order behaviour was left as-is. Phase 5 was not part of this phase.

---

## 1. Requirements

| Req | Audit finding | What changed | Evidence |
|-----|----------------|--------------|----------|
| **1** Admin artisan filters | Status and client search worked. Category, date, and location were absent. | Directory still loads every admin page, then filters by category/service, country (name or stored code), state, city, and created-date range. Status filter and search stay. Clear resets status and the extra filters. | Playwright on `/admin/artisans`: Rejected shows the empty state; Approved shows Emeka; search hides Micheal; tailoring + Nigeria + Lagos + Lagos + 1–30 Apr 2026 leaves one Emeka row; Clear restores the original row count. |
| **2** Naming / internal SEO | `metaTitle` / `metaDescription` exist. Create forms had no convention guidance. | Helper text on admin Add Product and Add Artisan. No existing product or artisan names were rewritten. | Placeholders and help copy in the create dialogs. Empty fields still fail the existing required-field check; placeholders are not written into state. |
| **3** Searchable artisan selector | Add Product used a plain select capped at 100 approved artisans. | Combobox searches the full approved directory (name, email, brand, business) and stores that row’s user id as `artisanId`. Options are A–Z. | Playwright typed “Emek”, selected Emeka (user id 7), and the create POST sent `artisanId: 7`. The verification product was then soft-deleted. |
| **4** Alphabetical ordering | Lists used `createdAt desc` or an unsorted public slice. Database `name` order is byte order, so “Phase2 API” sorted before “Phase2 Admin”. | Public product name sorts now use case-insensitive `localeCompare` before paging. Public artisans stay A–Z by brand. Newest, price, top rated, and flagged rankings keep their own order. | Playwright: first product page names matched case-insensitive A–Z, with “Phase2 Admin…” before “Phase2 API…”. `?sort=newest` still requested `sort=newest`. Artisan cards were A–Z. |
| **5** Admin list filters | Products/artisans: status + search. Orders: search only. Categories and users already had search. | Products: server search, category, status, name sort. Orders: existing search plus status and payment filters the API already accepted. Custom orders: client search and status on the loaded page. Artisans: Req 1 filters. | Controls on `/admin/products`, `/admin/orders`, `/admin/custom-orders`, `/admin/artisans`. |
| **9** Naming placeholders | Artisan add-product modal already had examples. Admin add product/artisan did not. | Example placeholders and “placeholders are examples only” help. Values are submitted only from the controlled fields. | Playwright saw the Handwoven name placeholder, the materials description placeholder, and the helper sentence. The POST name and description were the typed values, not the placeholders. |
| **10** Public filters and sorting | All Products read URL filters but had little on-page UI. `bestSeller` and `trending` were ignored. | On-page sort, category, min/max price, and max delivery. Those map to real query params. `bestSeller` / `trending` now require the stored product flags and do not invent a ranking. Clear removes the controls. | Playwright: Beauty reduced 56 approved products and every row was `beauty`; min price 300000 reduced that set and every price was at least 300000; within 3 days kept only `estimatedDeliveryDays <= 3`; price low-to-high was sorted; Best Sellers and Trending each returned `totalItems: 0` and “No products found”. |
| **17** Explore all artisans | Drawer filters existed. No Top Rated / Featured / Best Seller chips, delivery was hidden, default order was not A–Z. | Chips: All, Featured, Top Rated, Custom Orders, Best Sellers. Drawer adds custom-order availability and average delivery period. Default is A–Z. Top Rated uses real review averages and hides artisans with no reviews. Best Sellers keeps only artisans who have a product with `isBestSeller=true`. | Playwright: Featured returned 0; Top Rated and Custom Orders each showed only Phase3 Eligible Studio; Best Sellers returned 0; fastest delivery returned 0 because every local profile stores 7 days; Clear restored the original count. |

---

## 2. Actual control behaviour

- **Admin artisans.** Status still reloads `GET /admin/artisans?status=`. Search, category, country, state, city, and dates filter that loaded directory together. Clear resets status and those fields. Empty copy: “No artisans match these filters.”
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
| Playwright `tests/playwright/phase4-discovery.spec.ts` | **3 passed** in 1.2m against `http://localhost:8080` and `http://localhost:3000`. No production requests. |
| Search relevance Jest `src/search/search.relevance.spec.ts` | 1 passed |

### PostgreSQL

On recheck, launchd service `postgresql-16` was already running and `pg_isready` reported `localhost:5432` accepting connections. `moe_dev` was intact: 57 products, 6 artisan profiles, 12 users. Nothing was reset, dropped, or migrated. The earlier outage did not need a password or a service change.

### What Playwright saw

Local approved catalogue at run time: 56 public products, 6 approved artisans, 0 featured artisans, 0 best-seller products, 0 trending products, 1 custom-order-eligible artisan, 1 review.

**Public products** (`/marketplace/products`)

- The count showed “Loading…”, then “56 products found”.
- The first API response used `sort=name_asc`. Names were case-insensitive A–Z. “Phase2 Admin Create…” came before “Phase2 API Variation Probe”.
- Clicking the first product opened `/marketplace/product/{id}`. Back returned to `/marketplace/products`.
- Category Beauty returned fewer products, and every returned row had category `beauty`.
- Min price 300000 reduced that set further. Every returned price was at least 300000.
- Clear removed `category` and `minPrice` from the URL.
- Delivery “Within 3 days” sent `maxDeliveryDays=3`. Every returned row had `estimatedDeliveryDays` of 3 or less.
- Sort “Price: low to high” returned prices in ascending order.
- Opening `?sort=newest` sent `sort=newest`.
- `?sort=bestSeller` sent `isBestSeller=true`, returned `totalItems: 0`, and the page said “No products found”.
- `?sort=trending` sent `isTrending=true`, returned `totalItems: 0`, and the page said “No products found”.
- Aborting the next catalogue request showed the error state. Retry received a successful response, the error disappeared, and Clear brought the product grid back.

**All Artisans** (`/marketplace/artisans`)

- The first request used `sort=name`. Visible card names were A–Z and the count matched the API total.
- Featured sent `featured=true`, returned 0 artisans, stayed on `?view=featured`, and showed “No artisans found. Try adjusting your filters.”
- Top Rated sent `sort=rating` and showed one card: Phase3 Eligible Studio, the only artisan with a review.
- Custom Orders sent `customOrderEligible=true`. The only row was Phase3 Eligible Studio, with `isCustomOrderEligible: true`.
- Best Sellers sent `hasBestSeller=true` and returned 0 artisans.
- Drawer “Fastest delivery” sent `maxDeliveryDays=3` and returned 0 artisans. Every local profile stores 7 days.
- Clear restored the original artisan count.
- The first card opened `/marketplace/provider/{id}` and the page heading was that artisan’s brand name.

**Admin**

- `/admin/artisans` loaded more than one row.
- Status Rejected showed “No artisans match these filters.”
- Status Approved showed Emeka Artisan.
- Search “Emeka” kept that row and removed Micheal Tayo.
- Together, Approved + “Emeka” + category `tailoring` + country Nigeria + state Lagos + city Lagos + created 2026-04-01 through 2026-04-30 left exactly one table row, Emeka Artisan.
- Clear emptied the search box and restored the original row count.
- Add Product showed the Handwoven placeholder, the materials description placeholder, and the “placeholders are examples only” helper.
- Searching “Emek” showed the Emeka option. The create POST used artisan id 7, the typed name, and the typed description. The name did not contain “Handwoven”.
- That product was soft-deleted through `DELETE /admin/products/:id`. Two local verification rows remain with `deletedAt` set (ids 77 and 78, provider 7). They are not in the public catalogue. No production rows were written.

---

## 5. Outstanding

- Best Sellers, Trending, and Featured are empty in `moe_dev` because no product or artisan is flagged. The controls return that empty set. They were not given invented flags.
- Artisan “fastest delivery” is empty locally because every profile’s stored average is 7 days.
- Top Rated shows only artisans with review rows. A stored rating without reviews does not qualify.
- Search results stay alphabetical. They are not reordered by the separate relevance score.
- The homepage preview drawer was not part of this suite. It still filters the homepage preview and belongs with Phase 6.
- Admin orders and custom-order list filters were not in the original discovery file. They were checked afterwards in `tests/playwright/phase4-admin-order-filters.spec.ts` against localhost. Both tests passed. Admin orders sent status, payment status, and search together: pending returned 3, cancelled plus unpaid returned 0, cancelled plus refunded returned ORD-002, search `Ankara` kept that row, an unknown search returned none, and Clear restored all 4. Custom orders filter the loaded page: accepted returned the empty state, `silk wrap` kept only the Phase 3 description, and `Phase3` kept all 3 because that text is also the artisan name. Clearing the controls restored all 3.

Phase 4 is verified against the local catalogue above, including the admin order and custom-order filters.
