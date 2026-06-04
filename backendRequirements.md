# MoE Frontend Sprint v2 — Backend Requirements

This document lists every endpoint, contract, and migration the frontend
now depends on after the v2 sprint. Items marked **REQUIRED** are called
today; items marked **OPTIONAL** are best-effort with graceful fallbacks.

## 1. Customization templates (Task 1) — REQUIRED

`GET /products/customisation-template?category=<keyword>`

Returns the schema used by `CustomizationFormModal` to render dynamic
inputs. Keyword is resolved on the client (product name first, then
category). Response shape (example):

```json
{
  "category": "tailoring",
  "fields": [
    { "key": "fabric", "label": "Fabric", "type": "select",
      "options": ["Ankara", "Adire", "Linen"], "required": true },
    { "key": "lining", "label": "Lining", "type": "multiselect",
      "options": ["Cotton", "Silk"] },
    { "key": "notes", "label": "Notes", "type": "text" }
  ]
}
```

## 2. Wishlist sync (Task 3) — REQUIRED for logged-in users

- `GET /wishlist` — probe on login. 200 means server is source of truth.
  Any other status (401/404/5xx) → frontend falls back to user-scoped
  `localStorage` key `moe_wishlist_user_<id>`.
- `POST /wishlist/items` `{ productId }` — add.
- `DELETE /wishlist/items/:wishlistItemId` — remove. Frontend uses the
  `wishlistItemId` or `productId` returned in the list payload.
- On login the client merges any guest wishlist items into the server
  list and clears the guest key.

## 3. Customer preferences (Task 4A) — OPTIONAL

- `GET /customers/me/preferences` → `{ categories, styleTags, budget, updatedAt }`
- `PATCH /customers/me/preferences` → same shape (partial updates allowed).
- `DELETE /customers/me/preferences` → clear.
- All three calls **fail silently** on the client; local storage keeps
  the UI functional if the backend is not yet built.

## 4. Product form extras (Task 4B) — REQUIRED for new fields

`AddProductModal` now sends these optional fields when present:

- `materials: string`
- `estimatedDeliveryDays: number`
- `tags: string` (comma-separated)

Category enum migration (Task 8): canonical values are
`tailoring | shoemaking | leatherwork | beauty | accessories | furniture | art`.
The DTO must still accept the legacy values `canvas` and `crafts` until the
backend confirms migration of existing rows.

## 5. Delivery + rush-order (Task 5) — REQUIRED

`GET /artisans/:id/rush-order-config` → `{ rushOrderEnabled, surchargePercent }`.
On 404 the client treats it as disabled.

## 6. Messaging polling (Task 6) — REQUIRED for real-time feel

- `GET /conversations` → list (used to resolve a server `conversationId`
  for a given `providerId`).
- `GET /conversations/:id/messages` → polled every 5s while the modal is
  open. Cleanup runs on close/unmount/conversation change.
- `POST /conversations/:id/messages` `{ content }`.
- `POST /conversations` `{ providerId, initialMessage }`.
- `PATCH /conversations/:id/read`.

## 7. Artisan reviews (Task 7) — REQUIRED

- `GET /artisans/:id/reviews` → list of reviews.
- `POST /artisans/:id/reviews` `{ rating, comment? }` — **upsert** by
  `(userId, artisanId)`. The same customer posting again must update
  the existing row, not create a duplicate. There is intentionally no
  PATCH path.

## 8. Seasonal picks (Task 9) — OPTIONAL

Currently filtered on the client by tags determined from the user's
timezone (with West African calendar fallback when `Intl` returns
`UTC` or no zone). If the backend later supports
`GET /products?featured=true&season=<harmattan|rainy|...>`, the client
can swap to it without UI changes.
