# Count reconciliation

The Admin Dashboard and the public catalogue are counting different sets of records. Both totals match the live API. The public pages are not dropping a page of results, and the admin totals are not inflated by a bad query.

Production was only read. No product or artisan was created, edited, approved, or deleted. Nothing was deployed.

## What the screenshots showed

| Surface | Products | Artisans |
| --- | --- | --- |
| Admin Dashboard | 304 | 73 |
| Public All Products / All Artisans | 204 | 52 |
| Difference | 100 | 21 |

## What the live API returns

The deployed frontend at `https://moe-africa-mvp.vercel.app` calls `https://moe-backend.duckdns.org`. These are the same backend and database the admin dashboard uses. The responses are not a cached older catalogue.

Public products, `GET /products?page=1&pageSize=20`:

- `totalItems`: 204
- `pageSize`: 20
- `totalPages`: 11
- Every returned row has `status: approved`
- Walking all 11 pages returns 204 rows and 204 distinct ids

Public artisans, `GET /service-providers/public-info?page=1&pageSize=100`:

- `totalItems`: 52
- `pageSize`: 100
- `totalPages`: 1
- 52 rows, 52 distinct ids

The same numbers are on the pages. Playwright recorded “204 products found” and “52 artisans found” from those responses.

## Why the admin numbers are larger

**Total Products** is every product that has not been soft-deleted (`deletedAt` is null), of any status. It does not apply the public storefront filter.

**Publicly available products** are products with `status = approved`, `deletedAt` null, whose artisan is the storefront the catalogue keeps.

**Total Artisans** is every artisan profile whose status is not `deleted`. The admin directory lists each account.

**Publicly discoverable artisans** are approved profiles after duplicate storefronts are collapsed. The listing keeps the lowest user id when brand, description, city, state, category, first name, last name, and country all match. A profile missing any of those fields is not collapsed.

Those definitions are already what the code does:

- Admin totals: `moe-backend/src/admin/admin.service.ts` `dashboard()`
- Public product filter: `moe-backend/src/products/products.service.ts` with `publicProductWhere` and `catalogueProviderFilter`
- Public artisan filter: `moe-backend/src/service-providers/service-providers.service.ts` `excludedStorefrontIds`
- The storefront key: `moe-backend/src/common/canonical-storefronts.ts`

## The 21 artisans

`GET /service-providers/:id/public-info` still returns an approved profile even when the public list hides it. Checking ids 1–159 found 73 approved profiles. 52 of them are in the public list. The other 21 are later copies of a storefront that is already listed under a lower id.

| Hidden id | Products | Brand | Kept profile |
| --- | ---: | --- | ---: |
| 26, 64 | 5 each | Adaobi Atelier Lagos | 23 |
| 27, 65 | 5 each | Okeke Menswear Studio | 24 |
| 28, 66 | 5 each | Ngozi Threadworks | 25 |
| 67 | 5 | Bello Craft Collective | 29 |
| 68 | 5 | Okafor Studio Crafts | 30 |
| 69 | 5 | Amina Paper & Print | 31 |
| 70 | 5 | SoleCraft Aba | 32 |
| 71 | 5 | Chioma Heel House | 33 |
| 72 | 5 | Bakare Boots Co. | 34 |
| 73 | 5 | Beauty by Bisi | 35 |
| 74 | 5 | Zainab Naturals | 36 |
| 75 | 5 | Adeyemi Leather Lab | 37 |
| 76 | 5 | Sade Leather Atelier | 38 |
| 77 | 5 | Uche Strapworks | 39 |
| 78 | 5 | Okoro Beads & Gold | 40 |
| 79 | 5 | Yetunde Fine Jewels | 41 |
| 80 | 5 | Afolabi Home Studio | 42 |
| 81 | 0 | Sule Living | 43 |

Each kept profile is in the public list. Incomplete profiles, including several “My business” rows, stay in the list because they do not have a full storefront fingerprint. They are not part of the 21.

73 approved accounts − 21 duplicate copies = 52 public artisans. Pending and rejected profiles are not the gap: the 73 profiles the admin total describes are the 73 approved profiles this scan reached.

## The 100 products

`productCount` on each public profile uses the same rule as the public product list: approved and not deleted.

- Products on the 52 listed artisans: 204
- Products on the 21 hidden copies: 100 (20 copies × 5, plus Sule Living’s copy with 0)
- 204 + 100 = 304

That is the whole admin total. The 100 missing products are approved products that belong to the duplicate accounts. They are not drafts, rejected products, or soft-deleted rows. Publishing them would show the same goods again under the copied storefront. The canonical storefront for each brand remains in the catalogue with its own products.

A direct category check agrees with the full list: leatherwork is 30 products both in the paged catalogue and in `GET /products?category=leatherwork`.

Production database credentials are not on this machine, so these figures are the live API’s own counts of that database, not a local `moe_dev` query. Local `moe_dev` is a smaller dataset and was not used as the source of 304 or 73.

## Playwright on the live site

`tests/playwright/count-reconciliation.spec.ts`, desktop, against `https://moe-africa-mvp.vercel.app`. Read-only. No sign-in.

All Products:

- Displayed count 204, first response `totalItems` 204, `pageSize` 20
- Scroll loaded pages 1–11 (20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 4)
- 204 cards rendered, 204 distinct `data-product-id` values
- Category `leatherwork`: displayed 30, API `totalItems` 30
- Search `q=leather`: displayed 53, API `totalItems` 53
- First result opened `/marketplace/product/215`
- No console errors and no failed `/products` responses

All Artisans:

- Displayed count 52, API `totalItems` 52, `pageSize` 100, 52 rows in that one response
- First paint showed 20 cards, then scroll revealed 52 names
- Category `tailoring`: 9, which is below 52
- Search `q=Adaobi`: 1
- View Profile opened `/marketplace/provider/23`

The admin dashboard was not opened on production. This session does not have a production admin password, and none was guessed. The dashboard cards read `totalProducts` and `totalArtisans` from `GET /admin/dashboard`, which is the aggregation above. The public `productCount` sums already account for 304 and 73.

## What was not changed

No count query, filter, or label was changed. The public totals already describe the records a customer can reach, and the admin totals already describe every non-deleted record. Changing either number to match the other would be wrong.

Duplicate storefront accounts and their 100 products were left in place. Removing them is the separate mock-data cleanup and still needs its own approval.

A dashboard subtitle could say that Total Products includes catalogue copies and Total Artisans includes duplicate accounts. That label was not added. The existing cards are accurate for the definitions above.

## Files

- `moe-africa/tests/playwright/count-reconciliation.spec.ts` — the read-only browser check
- `moe-africa/COUNT_RECONCILIATION_REPORT.md` — this report

No frontend or backend counting code was edited.
