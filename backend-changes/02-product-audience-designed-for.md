## Product audience ("Designed For") — non-destructive migration

```prisma
enum ProductAudience { men women children unisex }
model Product {
  // ...existing fields untouched
  designedFor                   ProductAudience[] @default([])
  audienceClassificationStatus  String?   // classified | suggested | uncertain | not_applicable
  audienceSuggestion            ProductAudience[] @default([])
}
```
SQL equivalent: `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "designedFor" "ProductAudience"[] NOT NULL DEFAULT '{}'` (+ the two other columns). Additive only — no rows deleted or rewritten.

- `POST/PATCH /artisans/me/products` and `POST /admin/products` accept `designedFor: string[]`; reject empty for tailoring/shoemaking.
- `GET /products?audience=men|women` returns that audience **plus unisex**; `audience=children` returns only children. Unclassified products stay in unfiltered listings.
- `GET /admin/products?audienceStatus=needs_review` lists products with empty `designedFor` in applicable categories, with `audienceSuggestion` filled only on clear text evidence, else status `uncertain`.
- `PATCH /admin/products/:id/audience { designedFor }` and `POST /admin/products/classification/bulk-approve { items }` make a classification definitive.

