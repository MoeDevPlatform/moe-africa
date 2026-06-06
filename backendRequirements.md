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
- `estimatedDelivery: string` (free-text, max 50 chars — see Product & Category Fix Sprint section below). The legacy `estimatedDeliveryDays: number` is no longer sent by the form but the backend should keep accepting it for older clients.
- `tags: string` (comma-separated)

Category enum (superseded — see "Category Value Alignment" below).
Canonical values are now:
`tailoring | arts_and_crafts | shoemaking | beauty | leatherwork | jewellery | home_and_decor`.
Any legacy values (`accessories`, `furniture`, `art`, `canvas`, `crafts`) must
be migrated to the closest canonical value (see migration notes below) and
rejected on new writes.

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

## Product & Category Fix Sprint — Backend Requirements

### estimatedDelivery — String Field (BREAKING CHANGE)
**Status:** 🔴 BACKEND CHANGE REQUIRED
**What frontend now does:** Sends `estimatedDelivery` as a free-text string (e.g. "5-7 days") instead of `estimatedDeliveryDays` as a number.
**Backend must:**
1. Add `estimatedDelivery?: string` (max length 50) to `CreateArtisanProductDto` and `UpdateArtisanProductDto` with `@IsOptional() @IsString() @MaxLength(50)`
2. Add `estimatedDelivery String?` to the `Product` model in `prisma/schema.prisma`
3. Run migration: `npx prisma migrate dev --name add_estimated_delivery_string`
4. In `createProduct` and `patchProduct` service methods, persist `dto.estimatedDelivery` to the new field
5. In `toProductDto` and all other product mapper functions (productToDto in products.service.ts, search.service.ts, listProductsByProvider in service-providers.service.ts), include `estimatedDelivery: p.estimatedDelivery ?? null` in the response
6. Keep the existing `estimatedDeliveryDays` number field — do not remove it. Legacy products still have it.
**User-facing consequence if not built:** Delivery text entered by artisans does not save or display. All products show "Contact artisan for delivery time."

### Category Value Alignment
**Status:** 🔴 ACTION REQUIRED
**Problem:** Products saved with `category: "accessories"` exist in the database from when the Add Product form incorrectly included "Accessories" as an option.
**Backend must:**
1. Run a one-time data migration to update all products where `category = 'accessories'` to `category = 'jewellery'`
2. Confirm the backend category enum/validation accepts all 7 canonical values: `tailoring`, `arts_and_crafts`, `shoemaking`, `beauty`, `leatherwork`, `jewellery`, `home_and_decor`
3. Reject any value not in this list with `400 Bad Request`
**User-facing consequence if not built:** Products added under old "Accessories" category are invisible on the marketplace and not counted in Browse by Category.

### Product Reviews
**Status:** 🔴 NOT YET BUILT
**Endpoints required:**

**GET /products/:id/reviews**
Auth: None (public)
Query params: page (default 1), pageSize (default 5)
Response:
```
{
  "data": [
    {
      "id": 0,
      "rating": 5,
      "review": "string or null",
      "reviewerName": "Frank A.",
      "createdAt": "ISO string",
      "updatedAt": "ISO string"
    }
  ],
  "averageRating": 4.5,
  "totalReviews": 12,
  "pagination": { "page": 1, "pageSize": 5, "totalPages": 3, "totalItems": 12 }
}
```
Note: `reviewerName` must be first name + last initial only — never full name for privacy.

**GET /products/:id/reviews/mine**
Auth: JWT required
Response: `{ "id": 0, "rating": 5, "review": "string or null" }` or 404 if not yet reviewed

**POST /products/:id/reviews**
Auth: JWT required — customer role only. Artisan who owns the product must be rejected with 403.
Body: `{ "rating": number (1-5 required), "review": string (optional, max 500 chars) }`
Behaviour: upsert by userId — if review already exists, update it
Response: `{ "id": 0, "rating": 5, "review": "string or null", "createdAt": "ISO string" }`
Error: 403 if the authenticated user is the artisan who owns this product
Error: 400 if rating is outside 1-5

**PATCH /products/:id/reviews/mine**
Auth: JWT required
Body: `{ "rating": number (1-5), "review": string (optional, max 500 chars) }`
Response: updated review object
Error: 404 if no existing review to update

**After a review is submitted, the backend must recalculate and update `ArtisanProfile.rating` and `ArtisanProfile.reviewCount` as the average of all approved product reviews for that artisan.**
**User-facing consequence if not built:** Reviews tab shows no data. Users cannot rate products. Product page shows "No reviews yet" permanently.

### Service Providers Category Filter
**Status:** ⚠️ NEEDS VERIFICATION
**Endpoint:** `GET /service-providers/public-info?category={value}`
**Required:** The category query param must filter artisans by their profile category. The response `pagination.totalItems` must reflect the filtered count.
**Canonical values to support:** `tailoring`, `arts_and_crafts`, `shoemaking`, `beauty`, `leatherwork`, `jewellery`, `home_and_decor`
**User-facing consequence if not built:** Browse by Category shows no artisan counts for any category.

---

## Sprint Findings — Observed Backend Behaviour

Logged during the Issues & Enhancements sprint to capture what the live backend currently does versus what the frontend assumes.

### GET /conversations (corrected path)
The live backend mounts the controller at `/conversations`, not `/messages/conversations`. The frontend `messagingService.listConversations()` calls `/conversations` and normalises the response, because the backend returns a **raw array** of conversation rows rather than the `{ data, pagination }` wrapper used elsewhere:

```json
[
  { "id": 1, "customerId": 42, "providerId": 7, "providerName": "Brand Name",
    "lastMessage": "Hello", "lastMessageTime": "2026-06-06T12:00:00.000Z",
    "unreadCount": 2 }
]
```

Frontend treats any error as "no conversations" instead of falling back to localStorage (which previously leaked another user's threads). `GET /conversations/:id/messages` is also expected to return a raw array; the service layer normalises both.

**Backend follow-ups (non-blocking):**
- Add `providerAvatarUrl` (or `providerImage`) to the conversation DTO so the inbox can show an avatar instead of the initial-letter fallback.
- Provide an artisan-side conversation list (`/conversations` is currently customer-scoped only) so artisans can read inbound messages from their dashboard.
- When a thread has no messages, return `lastMessageTime: null` instead of `now()` so empty threads don't sort to the top of the inbox.

### Admin product count (GET /products?category=…&pageSize=1)
Used by `/admin/categories` to render per-category counts. The `pagination.totalItems` field must reflect the filtered total (not just the page). Verified shape matches `ProductsResponse`. Failures fall back to `0` with a skeleton until resolved.

**Caveat — approved-only:** The public `/products` endpoint scopes results to `status = APPROVED`, so admin counts currently exclude `pending`, `rejected`, and `draft` products. This is acceptable for an "approved per category" view but undercounts true admin totals.

**Backend follow-up (non-blocking):** either add a `category` filter to `GET /admin/products` (which already accepts `status` and includes all statuses when omitted), or expose a dedicated `GET /admin/categories/counts` aggregate endpoint. Until then the admin page will display approved-only counts.

### GET /service-providers/{id}/public-info
Returns 404 when the artisan does not exist or is unapproved. Frontend now renders an in-page "Profile not found" card with Back / Browse links instead of redirecting to `/marketplace`, so the URL stays stable for retry/sharing.

### GET /service-providers/public-info?category=…
Required to filter by canonical category value. Where the artisan count is zero, the marketplace home now falls back to a product count for the same category via `GET /products?category=…&pageSize=1` so the category card isn't blank.

### GET /products/customisation-template?category=…
Returns `{ fields: CustomisationField[] }` keyed by `category`. The customisation modal posts the keyed `customisation` object on the cart payload via `addItem` / `updateItem` — no separate API call for confirm.

---

## Messaging, Reviews & Personalization — Backend Gaps (June 2026)

Captured while wiring real send/receipt behaviour in `MessagingModal`, persistent review display in `ProviderDetail`, and visible preference filtering on `Home`.

### Messaging — three-state read receipts
**Status:** 🔴 NOT YET BUILT
The frontend currently renders two tick states derived from `readAt`:
- single grey tick → message sent, not yet read
- double blue tick → recipient has read it (`readAt != null`)

To support WhatsApp-style "delivered vs read", the `Message` DTO should include a `deliveredAt` timestamp set when the recipient's client first pulls the message. Frontend will then render double-grey for delivered + double-blue for read.

### Messaging — presence / online indicator
**Status:** 🔴 NOT YET BUILT
No endpoint exposes whether a user is currently connected. To show an online dot in the chat header, expose either:
- `GET /users/:id/presence` → `{ online: boolean, lastSeen: ISO }`, or
- a WebSocket presence channel.

Until then the modal omits the online indicator (no faked state).

### Artisan reviews — include reviewer name
**Status:** ⚠️ NEEDS VERIFICATION
`GET /artisans/:id/reviews` should return each review with an embedded `customer: { name }` (first name + last initial is sufficient for privacy). Without it the frontend renders "Customer" as the author, which is misleading.

### Product / provider filter params for preferences
**Status:** ⚠️ NEEDS VERIFICATION
Frontend now applies a client-side filter on the marketplace home so saved preferences visibly shape the listing. To remove that client-side fallback the following query params must be honoured server-side:
- `GET /products?category=…&styleTags=a,b&priceMax=…&budget=…`
- `GET /service-providers/public-info?category=…&styleTags=a,b`

`pagination.totalItems` on both endpoints must reflect the filtered total so the "Picked for you" sections render accurate counts.
