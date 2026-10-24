# Phase 6 Report — Homepage Collections, Navigation, and Curation

Phase 6 covers Requirements 23, 24, 25, 26, 27, and 28. Changes are in the local `moe-africa` and `moe-backend` repositories. Mutating checks used `http://localhost:8080` and `http://localhost:3000` against `moe_dev`. No production writes, no database reset, and no schema migration.

Requirement 33 (quotation and payment) and Requirement 20 (mock-data cleanup) were not implemented.

## Requirement 23 — All Products, New Arrivals, and Best Sellers

### Audit

Three different behaviours were using overlapping names:

- **All Products** (`/marketplace/products`) lists approved products, default A–Z. This was already correct.
- **New Arrivals** sent `sort=newest`, and the API ordered by `updatedAt`, not creation time. There is no `publishedAt` column.
- **Best Sellers** was two different queries. The homepage shelf titled “Best Sellers” loaded the `featured_picks` section, then padded it with the newest products until four items. The catalogue URL `?sort=bestSeller` forced `isBestSeller=true`. Local data has 0 products with that flag and 0 trending flags, so the catalogue page was empty. Real orders exist: Ankara Midi Dress (product 1) and Phase2 API Variation Probe (product 72).

There is no separate sales-ranking service. The authoritative signal already in the database is the `Order` table, plus the existing `isBestSeller` flag.

### Definition now used everywhere

| Collection | Source | Order |
| --- | --- | --- |
| All Products | Approved, non-deleted catalogue | Name A–Z unless the visitor changes sort |
| New Arrivals | Same catalogue | `createdAt` descending |
| Best Sellers | `isBestSeller` is true, or the product has at least one order whose status is not `cancelled` or `rejected` | Order count descending, then name. An empty result stays empty |

Cancelled and rejected orders are not counted. Product 1 has four order rows and one cancelled row, so its best-seller count is 3. Product 72 has two confirmed orders. No sales figures, flags, or products were invented.

### API evidence (local, before the browser run)

- `GET /products?pageSize=5`: `totalItems` 56. First names: Ankara Midi Dress, Corporate Kaftan, Custom Agbada Set, Emeka Dress, Emeka Kaftan.
- `GET /products?sort=newest&pageSize=5`: `totalItems` 56. First row `2026-10-23T13:17:47.002Z` Phase2 Admin Create 1792761462245, then three older Phase2 Admin Create rows, then Phase2 API Variation Probe.
- `GET /products?collection=best-sellers`: `totalItems` 2. Ankara Midi Dress `orderCount` 3, then Phase2 API Variation Probe `orderCount` 2.

Playwright confirmed the same totals on the pages, with headings **All Products**, **New Arrivals**, and **Best Sellers**.

## Requirement 24 — Best Sellers navigation

### Audit

Desktop Categories used `/marketplace/products?sort=bestSeller` (flag filter). Mobile Categories used `/marketplace?featured=best-sellers`, which the homepage ignored. Category shortcuts on both menus used a third pattern.

### Change

Desktop quick link, mobile quick link, and category shortcuts now open `/marketplace/products?collection=best-sellers` (category shortcuts also keep `category`). `?sort=bestSeller` still opens Best Sellers, but the page now requests `collection=best-sellers` instead of `isBestSeller=true`.

### Playwright

- Desktop 1280px: hover **Categories**, click the Best Sellers link inside the mega menu. URL `/marketplace/products?collection=best-sellers`. Heading **Best Sellers**.
- Mobile 390px: **Open mobile menu**, click the Best Sellers link inside the dialog. Same URL and heading.
- Clicking the first best-seller card (Ankara Midi Dress, id 1) opened `/marketplace/product/1` and the product heading.

## Requirement 25 — Separate homepage sections

### Audit

`featured_picks`, `featured_styles`, `seasonal_picks`, and `featured_artisans` are separate `CuratedSection` rows. Admin add/remove/reorder already scoped to one section key. The public `getPublicSection` then padded every product section with the same newest products when fewer than four items were curated, so empty Featured Picks, Editor’s Recommendations, and Seasonal Picks rendered the same four products and duplicated New Arrivals. The homepage title for `featured_picks` was “Best Sellers”, while the Featured Picks nav item filtered `featured=true`.

### Correction

- Homepage **Best Sellers** uses the order-count query above.
- Homepage **Featured Picks** is `featured_picks`. The newest-product fill (up to four) is kept only on this shelf, which is the shelf that previously used it.
- **Editor’s Recommendations** is `featured_styles`, curated items only.
- **Seasonal Picks** is curated items plus keyword matches from the existing matched endpoint. It no longer receives the newest-product pad.
- **Featured Artisans** still uses the existing score, then featured/rating, fill.
- `featured=true` on the catalogue remains the product flag filter. Its heading is now **Featured products**, so it is not labelled Featured Picks.

Local public payloads after the change, with no curated rows: Featured Picks 4 algorithm items (the four newest Phase2 Admin Create products), Seasonal Picks 0, Editor’s Recommendations 0, Featured Artisans 4 algorithm items.

Adding products 25 and 23 to `featured_styles` left the `featured_picks` curated id list unchanged. Playwright compared the admin `featured_picks` item ids before and after the add.

## Requirement 26 — View All and Recently Viewed

View All was added on the homepage shelves and opens the existing listing pages:

| Shelf | Destination | Playwright |
| --- | --- | --- |
| Best Sellers | `/marketplace/products?collection=best-sellers` | Heading Best Sellers, 2 products |
| Featured Picks | `/marketplace/products?collection=featured_picks` | Heading Featured Picks, count matched the section payload (4) |
| Seasonal Picks | `/marketplace/products?collection=seasonal_picks` | Heading Seasonal Picks. **No products found** because the section has no curated items and no keywords |
| Editor’s Recommendations | `/marketplace/products?collection=featured_styles` | Heading Editor’s Recommendations. Empty before the admin test; two curated products during it; empty again after removal |
| Featured Artisans | `/marketplace/artisans?collection=featured_artisans` | Heading Featured Artisans |
| Trending | `/marketplace/products?sort=trending` | Heading Trending Now. **No products found** (0 `isTrending` flags) |
| Recently viewed products | `/marketplace/products?collection=recently-viewed` | Only stored product ids |
| Recently viewed artisans | `/marketplace/artisans?collection=recent` | Only stored artisan ids |

Product history stays in `moe_recently_viewed`. Artisan history stays in `recentlyViewed`. They are not merged. An empty product history shows **No products found** and does not fill in other products. The homepage product shelf now appears after one real visit; it previously waited for two ids.

Playwright cleared both keys, confirmed the empty product listing, opened product 1 (Ankara Midi Dress) and product 72 (Phase2 API Variation Probe), then saw both names under **You recently viewed**. View All showed **2 products found** and those two ids. Opening artisan 14 (Phase2 Local Studio) showed **Recently Viewed Artisans**, and View All showed **1 artisans found**.

Filters and loading on the shared product page:

- Best Sellers min price `99999999` called `GET /products?collection=best-sellers&minPrice=99999999` and returned `totalItems` 0, with **No products found**. Clear restored **2 products found**.
- All Products showed 20 headings, then more than 20 after scrolling to the sentinel.

## Requirement 27 — Discovery without a new targeting system

### Audit

`Complete Your Look` started from the mock catalogue and could show mock products before the API returned. The homepage “Trending Right Now” shelf was not the `isTrending` flag. It kept products whose style tags included Modern, Afrocentric, or Custom, and labelled that subset as trending. Recommendation endpoints (`/products/recommendations`, `/service-providers/recommendations`) and behaviour events already exist and were left in place.

### Low-risk changes made

- Trending now requests `isTrending=true`. With no flagged products the shelf is omitted and the listing shows an empty state.
- Complete Your Look waits for the live catalogue (first 40 products) and does not seed suggestions from mock products. The artisan line uses `artisanName` from the API when present.

### Not implemented — needs separate approval

A new ranker that mixes behaviour events, preferences, and cross-category targeting would be a new merchandising system. Expected benefit would be more relevant complementary products than tag overlap on one catalogue page. Success would need a defined event (for example product-detail click-through on the suggestion) compared with the current tag shelf, on real traffic, without invented popularity or stock. That was not built.

## Requirement 28 — Algorithmic selections visible in admin

### Audit

`POST /admin/sections/:key/items` already appends and returns 409 for a duplicate. `DELETE .../items/:itemId` removes one row. `PATCH .../items/reorder` updates positions. `PUT .../items` deletes every curated row in that section and recreates the submitted list. The dashboard does not call `PUT`. The public section merged curated and algorithmic items, and the admin screen only listed stored rows.

No migration was applied. The public JSON now includes `selection: "curated" | "algorithm"`. That field is computed in the response. Stored curated rows were not rewritten.

### Admin behaviour verified

On `/admin/sections/featured_picks`, **Selected by the system** listed the four newest products that the public shelf adds. They are not removable from that panel, because they are not curated rows.

On `/admin/sections/featured_styles`:

1. Search **Emeka Dress** (product 25). The result showed artisan **Emeka Artisan**. Add appended it.
2. Search **Emeka Kaftan** (product 23). Add appended it. Product 25 was still in the list.
3. `featured_picks` curated ids were unchanged.
4. Move up on product 23. After refresh the curated order was 23, then 25.
5. `GET /sections/featured_styles` returned ids `[23, 25]` in that order.
6. Remove 23, then remove 25. The screen showed **No curated items yet**. After refresh it was still empty. `GET /sections/featured_styles` returned `items: []`.

`PUT` replace was not wired to any button. It remains available for an explicit full replacement and was not used.

## Files

Backend:

- `moe-backend/src/products/products.service.ts` — New Arrivals uses `createdAt`. Best Sellers ranking and `orderCount`.
- `moe-backend/src/sections/sections.service.ts` — `selection` on public items. Newest-product fill limited to `featured_picks`. Artisan fill unchanged. Artisan name on public product items.

Frontend:

- `moe-africa/src/pages/marketplace/AllProducts.tsx` — collection listings, headings, client filters for section pages.
- `moe-africa/src/components/marketplace/FeaturedProducts.tsx` — separate shelves and View All.
- `moe-africa/src/components/marketplace/FeaturedArtisans.tsx`, `RecentlyViewed.tsx`, `MegaMenu.tsx`, `MobileMenu.tsx`, `ProductCard.tsx`, `CompleteYourLook.tsx`.
- `moe-africa/src/pages/marketplace/Home.tsx`, `AllArtisans.tsx`, `ProviderDetail.tsx`.
- `moe-africa/src/lib/recentArtisans.ts`, `apiServices.ts` (`collection` filter).
- `moe-africa/src/pages/admin/SectionDetail.tsx`, `Sections.tsx`.
- `moe-africa/tests/playwright/phase6-collections.spec.ts`
- `moe-africa/tests/playwright/phase4-discovery.spec.ts` — Best Sellers assertion now expects the order-count collection, not an empty flag filter.

## Verification

- `npx tsc --noEmit` in `moe-backend`: exit 0.
- `npx tsc --noEmit` in `moe-africa`: exit 0.
- Playwright `phase6-collections.spec.ts`: 1 passed (about 1.3 minutes). No page errors and no local API responses at status 500 or above during that run.
- Playwright `phase4-discovery.spec.ts`: 3 passed (product filters and the updated Best Sellers request, artisan chips, admin filters).
- Playwright `phase5-curation-orders.spec.ts`: 2 passed (curation artisan names, pending-order card and ownership).

The Phase 6 browser test recorded the headings, URLs, API totals, curated order before and after refresh, and the empty states above. It did not click every category shortcut in the mega menu. Those shortcuts use the same collection query as the quick links. It did not click the Best Sellers “Order count / Name A–Z” sort control; the API supports re-sorting the same best-seller set, and the default order-count order was the one displayed. Load-more was exercised on All Products (56 items, page size 20), not on Best Sellers, which has only two qualifying products.

## Left unchanged on purpose

- Requirement 33 payment and quotation workflow.
- Requirement 20 mock catalogue files. `productsService.getById` can still fall back to a mock on a failed detail request. The recently viewed listing does not add products that are absent from the stored ids.
- `PUT /admin/sections/:key/items` still replaces one section’s curated rows. Nothing in the dashboard calls it.
- Algorithmic fill for Featured Picks and Featured Artisans.
- Phase 7 was not started.
