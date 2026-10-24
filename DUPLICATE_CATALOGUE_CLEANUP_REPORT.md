# Duplicate catalogue cleanup

The 21 duplicate storefronts were deleted on the live admin portal with Playwright. Each delete returned 204 from `DELETE /admin/artisans/:id`. The Admin Dashboard now reports 52 artisans and 204 products, matching the public catalogue.

## Dry run

Public ids are user ids. `ArtisanProfile.userId` is that same id. Product rows use `Product.id` and `Product.providerId`.

Each duplicate profile still has the same brand, description, city, state, category, first name, last name, and country as its canonical profile. Each of the 100 products matches a canonical product on name, description, category, price, materials, and tags. None of those products is unique. Sule Living’s copy, user 81, still has no products. No record was held back.

| Duplicate user | Canonical user | Storefront | Products | Product ids |
| ---: | ---: | --- | ---: | --- |
| 26 | 23 | Adaobi Atelier Lagos | 5 | 63, 64, 65, 66, 67 |
| 64 | 23 | Adaobi Atelier Lagos | 5 | 253, 254, 255, 256, 257 |
| 27 | 24 | Okeke Menswear Studio | 5 | 68, 69, 70, 71, 72 |
| 65 | 24 | Okeke Menswear Studio | 5 | 258, 259, 260, 261, 262 |
| 28 | 25 | Ngozi Threadworks | 5 | 73, 74, 75, 76, 77 |
| 66 | 25 | Ngozi Threadworks | 5 | 263, 264, 265, 266, 267 |
| 67 | 29 | Bello Craft Collective | 5 | 268, 269, 270, 271, 272 |
| 68 | 30 | Okafor Studio Crafts | 5 | 273, 274, 275, 276, 277 |
| 69 | 31 | Amina Paper & Print | 5 | 278, 279, 280, 281, 282 |
| 70 | 32 | SoleCraft Aba | 5 | 283, 284, 285, 286, 287 |
| 71 | 33 | Chioma Heel House | 5 | 288, 289, 290, 291, 292 |
| 72 | 34 | Bakare Boots Co. | 5 | 293, 294, 295, 296, 297 |
| 73 | 35 | Beauty by Bisi | 5 | 298, 299, 300, 301, 302 |
| 74 | 36 | Zainab Naturals | 5 | 303, 304, 305, 306, 307 |
| 75 | 37 | Adeyemi Leather Lab | 5 | 308, 309, 310, 311, 312 |
| 76 | 38 | Sade Leather Atelier | 5 | 313, 314, 315, 316, 317 |
| 77 | 39 | Uche Strapworks | 5 | 318, 319, 320, 321, 322 |
| 78 | 40 | Okoro Beads & Gold | 5 | 323, 324, 325, 326, 327 |
| 79 | 41 | Yetunde Fine Jewels | 5 | 328, 329, 330, 331, 332 |
| 80 | 42 | Afolabi Home Studio | 5 | 333, 334, 335, 336, 337 |
| 81 | 43 | Sule Living | 0 | — |

The full attribute comparison is in `moe-backend/scripts/duplicate-storefront-cleanup-inventory.json`.

Canonical profiles 23–25, 29–43 and their products are not in the update list. Image URLs can differ between a copy and its keeper; the names, descriptions, prices, and categories do not. That is the same seed-copy pattern already approved.

## How they were removed

The live admin Delete button calls `DELETE /admin/artisans/:id`. That marks the profile deleted, sets `deletedAt` on its products, suspends that user, and deletes wishlist rows and product reviews attached to those products. Orders are not rewritten. Canonical profiles were not opened.

A SQL soft-delete script is still in `moe-backend/scripts/duplicate-storefront-cleanup.sql`. It was not run, and it did not create backup tables.

## What Playwright did

`tests/playwright/delete-duplicate-storefronts.spec.ts` signed into `https://moe-africa-mvp.vercel.app/admin`, opened each duplicate at `/admin/artisans/:id`, checked the brand heading, and clicked Delete. The request was `DELETE /admin/artisans/:id`, which returned 204 for all 21 profiles. It did not call `DELETE /admin/users/:id`.

That admin action marks the profile deleted, sets `deletedAt` on its products, suspends the user, and removes wishlist rows and product reviews for those products. It does not change canonical storefronts or rewrite orders. No separate SQL backup was taken, because the database was not opened directly. The SQL script in `moe-backend/scripts/` was not run.

## Counts after deletion

| Metric | Before | After |
| --- | ---: | ---: |
| Admin total products | 304 | 204 |
| Public All Products | 204 | 204 |
| Admin total artisans | 73 | 52 |
| Public All Artisans | 52 | 52 |

`GET /admin/dashboard` returned `totalArtisans: 52`, `totalProducts: 204`, `artisansByStatus.approved: 52`, and `productsByStatus.approved: 204`. Pending and rejected are 0. The dashboard cards showed 52 and 204. `totalOrders` is 0.

`GET /products` still has `totalItems` 204, and product ids 66, 63, and 256 are absent from that list. Their detail calls return `RESOURCE_NOT_FOUND`. Canonical product 51, Agbada Ceremonial Set, is still approved on provider 23. `GET /service-providers/26/public-info` is not found. `GET /service-providers/23/public-info` still returns Adaobi Atelier Lagos with 5 products. Public product 215 still loads.

## Records left untouched

Canonical storefronts and their products, incomplete profiles such as the “My business” accounts, and every product outside the table above. The 21 duplicate users were suspended by the admin delete, and wishlist rows and product reviews on their products were removed with them. Orders were not edited; the dashboard order total is 0. Mock data, seed scripts, and recommendation ranking were not changed.
