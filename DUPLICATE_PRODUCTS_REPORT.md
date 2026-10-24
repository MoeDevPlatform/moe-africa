# Duplicate product cards

## Root cause

The three Agbada cards in the screenshot are three different product records, not one record drawn three times.

A read-only pass of the live catalogue (`https://moe-backend.duckdns.org`) returned **303 products and 303 distinct product ids**. There were **0 repeated ids** in the API response. **85 product names** appear more than once because the seed script `moe-africa/tests/seed-artisans-products.spec.ts` was run more than once. Each run creates new accounts instead of updating existing ones, so the same storefront and its five products were inserted again.

Agbada Ceremonial Set is three rows:

| Product id | Provider id | Storefront | Price | Public listing |
| --- | --- | --- | --- | --- |
| 51 | 23 | Adaobi Atelier Lagos | ₦95,000 | Kept (lowest id) |
| 66 | 26 | Adaobi Atelier Lagos | ₦95,000 | Omitted after this fix |
| 256 | 64 | Adaobi Atelier Lagos | ₦95,000 | Omitted after this fix |

Those three accounts share brand, about, city (Lekki), state (Lagos), and category (tailoring). Their image URLs differ. Artisan grids already collapse that fingerprint in `uniqueArtisanListings`. Product queries did not, so All Products and category grids rendered every copy.

Local `moe_dev` does not contain these rows. After the fix it still has **56 products, 0 repeated ids, 6 artisans, 52 deals, 5 styles, and 2 best sellers**.

No database rows were deleted or edited.

## What was not the cause

- Prisma `include` joins were not multiplying parent rows.
- Homepage sections were not appending the same id from curated and algorithmic fills on the local data.
- Infinite scroll already dropped an id it had already rendered. A same-tick double request could still ask for the same page twice; that is now guarded, but it was not the Agbada case.
- Mock fallback data is still used only when a category or provider request fails. It was not merged into a successful API response.

Products that only share a name, price, or image stay separate. The greeting-card neighbour in the screenshot is a different product from the Agbada rows.

## Fix

Public catalogues now keep one storefront per complete fingerprint and drop the later copies. The keeper is the **lowest user id**. Incomplete profiles are never collapsed. A different city, about, or category stays as its own storefront.

The filter is applied before pagination, so totals and page boundaries count the catalogue that is actually shown.

| Surface | Behaviour |
| --- | --- |
| `GET /products`, including deals, styles, best sellers, name sort, and recommendations | `providerId` not in the extra storefront ids |
| `GET /service-providers/public-info` | Extra profiles removed before sort and page slice |
| `GET /search` | Same exclusion for products and artisans |
| Homepage sections | Algorithmic fill and resolved curated items skip extra storefronts; a repeated id inside one section is dropped |
| Direct product page, `GET /products/by-ids`, and a provider’s own product list | Unchanged, so a known id and an artisan’s own shop still open |

Empty exclusion lists are not sent as `notIn: []`.

Frontend guards, in addition to the API:

- `productsService.list`, `getByIds`, and `getByProvider` keep the first copy of each product id.
- `uniqueArtisanListings` now keeps the lowest matching id, including when the later copy appears first.
- All Products ignores a second request for a page that is already in flight, and still ignores an id already on screen.

## Files

- `moe-backend/src/common/canonical-storefronts.ts`
- `moe-backend/src/common/canonical-storefronts.spec.ts`
- `moe-backend/src/products/products.service.ts`
- `moe-backend/src/service-providers/service-providers.service.ts`
- `moe-backend/src/search/search.service.ts`
- `moe-backend/src/sections/sections.service.ts`
- `moe-africa/src/lib/artisanListings.ts`
- `moe-africa/src/lib/apiServices.ts`
- `moe-africa/src/pages/marketplace/AllProducts.tsx`
- `moe-africa/tests/artisan-listings.test.ts`
- `moe-africa/tests/playwright/duplicate-products.spec.ts`

## Production before and after

Measured against the live API, read only. This backend has not been deployed, so the live site still returns all 303 rows.

- 73 public artisans, **18 duplicate storefront groups**, **21 extra profiles**.
- Groups (lowest id is kept): 23/26/64, 37/75, 42/80, 31/69, 34/72, 35/73, 29/67, 33/71, 25/28/66, 30/68, 24/27/65, 40/78, 38/76, 32/70, 43/81, 39/77, 41/79, 36/74.
- 303 unique product ids before the rule.
- **100** of those products belong to the 21 extra storefronts and leave the public catalogue.
- **203** products remain.
- Agbada ids after the rule: **51 kept**, 66 and 256 omitted.

## Verification

Backend `tsc --noEmit` passed. Jest: `canonical-storefronts.spec.ts` and `search.relevance.spec.ts`, **5 passed**. The storefront spec uses the Adaobi fingerprint and asserts that ids 26 and 64 are the ones excluded. Frontend `tsc -p tsconfig.app.json --noEmit` passed.

Playwright against `http://localhost:8080` and `http://localhost:3000`:

`tests/playwright/duplicate-products.spec.ts` — **1 passed (46.5s)**.

It checked:

- Section payloads for Featured Picks, Editor’s Recommendations, and Seasonal Picks have unique item ids.
- Best Sellers, All Products, New Arrivals (`sort=newest`), Deals, Styles, search `q=dress`, and `/marketplace/category/fashion/products` render unique `data-product-id` values.
- Page 1 and page 2 of `pageSize=20` are 20 ids and a non-empty second page, with no shared id. After scrolling, the grid grew past 20 and the first 20 ids still matched page 1.
- `pageSize=1` and `pageSize=100` report the same `totalItems`, and the full page length equals that total.
- View Details on the first card opened `/marketplace/product/{that id}`.

Local totals after the API restart were unchanged: 56 products, 6 artisans, 52 deals, 5 styles, 2 best sellers. Homepage View All code was not changed. Those collection totals are the same inputs that control whether View All is shown.

The local run cannot show the three Agbada cards disappearing, because those rows are not in `moe_dev`.

## Still needs approval

- Deploying this backend before the live catalogue changes.
- Deleting the 21 extra storefronts and their 100 public products. They remain in the database and still appear on that artisan’s own shop and on a direct product URL.
- Requirement 20 (removing the seed script or mock fallback) was not done.
