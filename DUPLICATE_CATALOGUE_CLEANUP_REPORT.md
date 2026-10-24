# Duplicate catalogue cleanup

The 21 duplicate storefronts and their 100 products were checked again against the live API on 24 October 2026. They still match the audit. The cleanup was not applied, because this machine cannot reach the production database.

Local `moe_dev` was not modified and is not a substitute for the live catalogue.

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

## Why the admin delete endpoint was not used

`AdminService.removeArtisan` marks the profile deleted and sets `deletedAt` on products, which is the right end state. It also suspends the user and permanently deletes that product’s reviews and wishlist rows. Orders store `productId` without a Prisma cascade from this update, but those review and wishlist deletes are not reversible.

The prepared script only:

- sets `ArtisanProfile.status` to `deleted` and `featured` to false
- sets `Product.deletedAt`
- records the previous profile reason in the backup, then sets `rejectionReason` to a cleanup note

It does not change users, orders, reviews, messages, wishlist rows, payments, or any canonical profile or product.

## Backup and rollback

The script has not been run, so the backup tables do not exist yet. When it runs, one transaction creates:

- `duplicate_cleanup_artisan_20261024`, a full copy of the 21 profiles
- `duplicate_cleanup_product_20261024`, a full copy of the 100 products

The transaction rolls back unless all of these are still true:

- 21 profiles are approved and their brand matches the canonical profile’s brand
- 100 products are approved, not deleted, and still have the inventoried provider, name, category, and price
- the 85 canonical products those copies match are still active on the canonical provider
- no duplicate product id is also a canonical product id

`scripts/duplicate-storefront-cleanup-rollback.sql` copies `status`, `featured`, `rejectionReason`, and `deletedAt` back from those tables.

## Current live counts

Unchanged, measured from `https://moe-backend.duckdns.org` before any write:

| Metric | Now | After the script |
| --- | ---: | ---: |
| Admin total products | 304 | 204 |
| Public All Products | 204 | 204 |
| Admin total artisans | 73 | 52 |
| Public All Artisans | 52 | 52 |

Public All Products is `totalItems` 204. Public All Artisans is `totalItems` 52. The admin figures are the earlier dashboard totals, and they still match 204 public products plus these 100, and 52 public artisans plus these 21. They were not re-read from the admin dashboard because there is no production admin session here.

## What remains

Run this on the production database, from the backend directory on the VPS:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/duplicate-storefront-cleanup.sql
```

This machine’s `DATABASE_URL` points at local Postgres. SSH to the API host `95.217.187.173` rejected the local key. No password was guessed and no port or account was changed.

After that command commits, the live checks are:

- `GET /products` `totalItems` stays 204, and the 100 product ids above are no longer returned
- `GET /service-providers/public-info` stays 52, and `GET /service-providers/{id}/public-info` for each duplicate id returns not found
- `GET /admin/dashboard` shows 204 products and 52 artisans
- canonical profile URLs such as `/marketplace/provider/23` still open
- a canonical product such as `/marketplace/product/215` still opens
- orders, reviews, and messages are still present

Playwright against the deployed site is only meaningful after the script commits. The catalogue on Vercel still includes these records in the admin totals until then.

## Records left untouched

Every canonical storefront, every product that is not in the table above, incomplete profiles such as the “My business” accounts, users, orders, reviews, conversations, and payment records. Mock data, seed scripts, and recommendation ranking were not changed.
