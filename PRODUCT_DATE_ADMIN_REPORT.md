# Product creation timestamps

Products already had `createdAt` and `updatedAt` in the database. New products were getting those values from the database clock. The admin product list received `createdAt` and then ignored it, and there was no date filter on the product query.

## What changed

- Admin Products shows a Date created column, formatted in the browser’s local time, for example `31 Oct 2026, 2:51 AM`.
- The product detail page shows Created and Updated.
- Admins can filter by today, the last 7 or 30 days, this month, one date, or a from/to range. Those bounds are applied in `GET /admin/products` across the whole catalogue, together with search, status, and category.
- Sort is Newest first, Oldest first, or Name A–Z. Ties break on product id.
- Clear filters restores the full list.
- Existing bulk select, approve, reject, draft, and delete still work on the rows of the current filtered page. Nothing is deleted because it is old, and no new bulk-delete behavior was added.
- `createdAt` is still set only when the row is inserted. Admin and artisan edits do not send a new creation time. `updatedAt` moves on edit.
- Product API responses that use the shared product mapper now include both timestamps.
- A `createdAt` index was added for large catalogues. It was applied only to local `moe_dev`.

## Verification

Local Playwright on `http://localhost:8080` created product 82, including an image upload.

- Stored `createdAt`: `2026-10-31T01:51:54.203Z`
- After moving it to draft, `createdAt` was unchanged and `updatedAt` became `2026-10-31T01:51:57.811Z`
- Filtering to today, draft, and the product name returned 1 product
- Filtering to 1–2 Jan 2020 returned 0
- Newest and oldest sorts each reported 58 products, page size 20, in timestamp order with id as the tie-break
- The date column and date filter were still present at a 390px width
- The test product was then removed through the existing delete confirmation. Its `createdAt` stayed `2026-10-31 01:51:54.203`. Active local products: 57, all with a creation time, oldest `2026-04-18 13:55:20.166`

Production was not modified.

## Files

- `moe-backend/src/admin/admin.service.ts`
- `moe-backend/src/admin/admin.controller.ts`
- `moe-backend/src/common/product-mapper.ts`
- `moe-backend/prisma/schema.prisma`
- `moe-backend/prisma/migrations/20261031120000_product_created_at_index/migration.sql`
- `moe-africa/src/pages/admin/Products.tsx`
- `moe-africa/src/pages/admin/ProductDetail.tsx`
- `moe-africa/src/lib/apiServices.ts`
- `moe-africa/src/lib/adminTimestamps.ts`
- `moe-africa/tests/playwright/admin-product-dates.spec.ts`

## Limits

Bulk actions still apply to the checked rows on the current page, not every product in a date range across all pages. Selecting a whole range and deleting it would need its own confirmation design and was not added.

The live admin site will not show the column or the filters until the frontend and backend are deployed. The new index should be applied on that database as part of that deploy. Existing production timestamps do not need to be rewritten.
