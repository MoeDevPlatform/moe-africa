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
**Status:** ⚠️ FRONTEND MAPPING GAP — verify before escalating
The typed DTO (`ArtisanReviewApi` in `src/lib/apiServices.ts`) only exposes `customerId`; the frontend currently reads `customer?.name` via a loose cast and falls back to "Anonymous". Before asking backend to add `customer: { name }`, capture a live `GET /artisans/:id/reviews` response and confirm no name field is present (it may already ship as `customerName`, `customer.name`, or `author.name` and just be missing from our type). If the field truly isn't there, request `customer: { name }` (first name + last initial for privacy) and re-escalate to 🔴 REQUIRED.
**User-facing consequence if not built:** Every review on the artisan profile renders the author as "Anonymous", which hurts review credibility and trust.

### Product / provider filter params for preferences
**Status:** ⚠️ NEEDS VERIFICATION
Frontend now applies a client-side filter on the marketplace home so saved preferences visibly shape the listing. To remove that client-side fallback the following query params must be honoured server-side:
- `GET /products?category=…&styleTags=a,b&priceMax=…&budget=…`
- `GET /service-providers/public-info?category=…&styleTags=a,b`

`pagination.totalItems` on both endpoints must reflect the filtered total so the "Picked for you" sections render accurate counts.

### Review "helpful" votes — no endpoint yet
**Status:** 🔴 NOT YET BUILT
The "Helpful" thumbs-up button on each review currently persists votes in `localStorage` only (per-browser, not shared). Required endpoints:
- `POST /reviews/:id/helpful` → increments the count, idempotent per user
- `DELETE /reviews/:id/helpful` → removes the current user's vote
- `GET /artisans/:id/reviews` should include `helpfulCount: number` and `viewerMarkedHelpful: boolean` on each review

### Artisan aggregate rating must come from real reviews
**Status:** 🔴 REQUIRED
`GET /service-providers/public-info` and `GET /artisans/:id` return `rating` and `reviewCount` that don't match the reviews actually stored — e.g. an artisan with one 4-star review surfaces as "4.3 (0 reviews)". The aggregate fields must be computed from `Review` rows:
- `rating` = `AVG(review.rating)` (0 when no reviews, not a seeded value)
- `reviewCount` = `COUNT(review)`

Until this is fixed the provider profile hero falls back to deriving both values from the loaded reviews list (showing "—" when none), which avoids the dummy-number bug but means listing/search results still display the stale aggregate.

---

## In-App Notifications — Verified + Outstanding Work (June 2026)

### Read path — VERIFIED working
- `GET /notifications` → `200` with `{ data: Notification[], pagination }`. Frontend `NotificationContext` now reads `response.data` (and tolerates a bare-array shape as a fallback).
- `PATCH /notifications/:id/read` → `200`. Wired on per-item click.
- `PATCH /notifications/read-all` → `200`. Wired on "Mark all as read".
- Frontend polls `/notifications` every 30s while authenticated and caches per-user at `moe_notifications:<userId>` so the bell paints instantly on reload and survives transient API errors. The legacy global `moe_notifications` key is wiped on mount to prevent cross-account leakage.

### Write path — 🔴 NOT YET BUILT (this is why the bell stays empty)
No backend code creates `Notification` rows from domain events. Until this lands, customers will never see anything in the bell even after real activity. Required emitters:

| Event | Recipient | `type` | `title` | `body` | `link` |
|---|---|---|---|---|---|
| Order created | customer | `order_update` | "Order placed" | "Your order #<id> has been received." | `/orders/<id>` |
| Order status change (paid, in_production, shipped, delivered, cancelled) | customer | `order_update` | "Order <status>" | "Order #<id> is now <status>." | `/orders/<id>` |
| New message in a conversation | recipient (customer or artisan) | `message` | "New message from <senderName>" | first 80 chars of body | `/messages?c=<conversationId>` |
| Quote request submitted | artisan | `order_update` | "New custom-order request" | "<customerName> requested a quote for <product>." | `/artisan/quotes/<id>` |
| Quote responded | customer | `order_update` | "Quote ready" | "<artisanName> responded to your request." | `/orders/<id>` |
| Wishlist item back in stock / price drop | customer | `promotion` | dynamic | dynamic | `/products/<id>` |
| Admin promotion / campaign | broadcast | `promotion` | dynamic | dynamic | optional |

Implementation notes:
- Create rows inside the same service that emits the event (e.g. `orders.service.create` → also `notifications.service.create`). Idempotency key = (`userId`, `type`, dedupe field like `orderId`/`messageId`) to avoid duplicates on retries.
- Set `link` to a frontend-relative path (not absolute URL).
- `body` should be plain text (no markdown) and ≤140 chars.
- DO NOT send email/SMS/push in the same path — those channels are still disabled on the frontend ("Coming soon"). When they're ready, gate them on the user's `NotificationSettings`.

### Auth token field name — frontend alignment note
Login response returns `token` (not `accessToken`). Frontend already stores it under `moe_access_token`, so this is purely informational — keep the response field name `token` to avoid breaking the current client.

---

## 9. Checkout — Saved Cards & Order Payload (Issue 8) — REQUIRED

### Saved Cards endpoint

`GET /payment-methods`

Auth: JWT required. Returns the current customer's saved payment instruments.

Response shape:

```json
{
  "data": [
    {
      "id": "pm_abc123",
      "brand": "visa",
      "last4": "4242",
      "expiry": "12/28",
      "isDefault": true
    }
  ]
}
```

Field requirements:
- `id` — opaque token, passed back in `paymentMethodId` on order create
- `brand` — lowercase network name (`visa`, `mastercard`, `verve`, etc.). Frontend maps to human-readable label and icon.
- `last4` — last four digits only
- `expiry` — string in `MM/YY` or `MM/YYYY` format; frontend renders as-is
- `isDefault` — boolean; the frontend pre-selects the default card when present

If the customer has no saved cards, return `{ "data": [] }` (200, not 404).

### Checkout order creation payload

`POST /orders` (or existing checkout endpoint) must accept the following fields. The frontend now sends them via `react-hook-form` + `zod` validation:

Body:

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "customisation": { "fabric": "Ankara" }
    }
  ],
  "shippingAddress": {
    "firstName": "Ada",
    "lastName": "Obi",
    "phone": "+2348012345678",
    "address": "12 Lagos Street",
    "country": "Nigeria",
    "state": "Lagos",
    "city": "Ikeja"
  },
  "paymentMethod": "card",
  "paymentMethodId": "pm_abc123",
  "saveCard": false
}
```

Validation rules enforced on the frontend (backend should mirror for defence-in-depth):
- `firstName` / `lastName` — required, min 1 char, max 50
- `phone` — required, must match `^\+?[0-9\s\-\(\)]{7,20}$`
- `address` — required, max 200 chars
- `country` / `state` / `city` — required strings
- `paymentMethod` — enum: `card` | `wallet` | `bank_transfer` | `cod`
- `paymentMethodId` — required when `paymentMethod === "card"` and a saved card is selected; omit when `"Add New Card"` is chosen (the gateway token will be created client-side and passed as `gatewayToken` instead)
- `saveCard` — optional boolean; instructs the backend/payment processor to tokenise the card for future reuse

**Backend must:**
1. Persist `shippingAddress` as a structured JSON/object (not a flat string) so it can be reused for order tracking and invoice generation.
2. Accept both `paymentMethodId` (saved card) and `gatewayToken` (one-time client-side token) for card payments. Return `400` if neither is provided when `paymentMethod === "card"`.
3. When `saveCard === true`, store the newly tokenised instrument and surface it on subsequent `GET /payment-methods` calls.
4. Include the saved card list in the checkout success/failure webhook or response so the UI can refresh without an extra round-trip.

**User-facing consequence if not built:**
- No saved cards list → customer must re-enter card details on every order.
- Missing validation on backend → invalid phone/address values slip through and break downstream delivery/invoice generation.
- `paymentMethodId` rejected → checkout fails for returning customers who select a saved card.

---

## 10. Conversation Reset — Bulk Delete (Testing Support) — REQUIRED

Frontend needs a way to fully wipe a user's messaging history during QA so
stale threads don't pollute the inbox after backend/seed changes. Today the
client can only clear its `localStorage` cache; threads returned by
`GET /conversations` reappear on refresh.

### Endpoints

`DELETE /conversations/:id`

- Auth: JWT required. Caller must be a participant (customer or provider) on
  the conversation, otherwise return `403`.
- Behaviour: hard-delete the conversation and all of its messages (cascade),
  plus any per-user read receipts. Return `204 No Content` on success, `404`
  if the conversation does not exist for this user.
- Idempotent: a second `DELETE` on the same id returns `404` (not `500`).

`DELETE /conversations`

- Auth: JWT required.
- Behaviour: delete every conversation (and its messages) where the
  authenticated user is a participant. Other participants lose access to the
  thread as well — this is intentional for test environments. In production
  this endpoint should be gated behind an environment flag
  (`ALLOW_CONVERSATION_BULK_DELETE=true`) or restricted to non-prod tiers so
  customers cannot accidentally wipe artisans' inboxes.
- Response: `200` with `{ "deleted": <number> }` indicating how many
  conversations were removed. Return `{ "deleted": 0 }` (not `404`) when the
  user had no conversations.

### Notifications side-effect

When a conversation is deleted, also delete any `Notification` rows whose
`type = "message"` and `link` references the deleted conversation id, so the
bell doesn't surface dead links.

### Frontend usage

- A "Clear all conversations" action on the Messages page calls
  `DELETE /conversations`, then clears the local `conversations_<userId>` and
  `conversation_<userId>_*` cache keys and refetches.
- Per-thread delete (swipe / overflow menu) calls `DELETE /conversations/:id`
  and removes the matching local cache entry.

**User-facing consequence if not built:** Testers cannot reset the inbox
between runs; cleared local caches repopulate from the server on next load,
making it impossible to verify "no messages yet" empty states or fresh
thread-creation flows.

## 11. Categories CRUD (Admin) — REQUIRED

The admin "Categories" screen must let staff add, rename, and remove
marketplace categories. Today the list is hardcoded on the client
(`src/lib/categories.ts`), which means non-engineers can't evolve the
taxonomy. The frontend now expects a backend-managed list it can merge with
the seven canonical seeds.

### Data model (Prisma sketch)

```prisma
model Category {
  id           String   @id @default(cuid())
  slug         String   @unique           // e.g. "tailoring", "custom_apparel"
  label        String                       // display name
  icon         String?                      // lucide icon name, optional
  isSeed       Boolean  @default(false)     // true for the 7 canonical entries
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Seed the seven canonical categories on first migration with `isSeed=true`
(`tailoring`, `arts_and_crafts`, `shoemaking`, `beauty`, `leatherwork`,
`jewellery`, `home_and_decor`). Seeds may be renamed/re-iconed but must not
be deletable.

### Endpoints

`GET /categories`

- Auth: public.
- Returns `Category[]` ordered by `sortOrder, label`. Each entry carries
  `productCount` so the admin grid can render counts without a per-row
  request:
  ```json
  [
    { "id": "...", "slug": "tailoring", "label": "Tailoring",
      "icon": "Scissors", "isSeed": true, "productCount": 4 }
  ]
  ```

`POST /categories`

- Auth: admin only (JWT + role check).
- Body: `{ "label": string, "slug"?: string, "icon"?: string }`.
  Slug is auto-derived from label (`lowercase`, spaces→`_`,
  strip non-alphanumerics) when omitted. Reject duplicates with `409`.
- Response: `201` with the created `Category`.

`PATCH /categories/:id`

- Auth: admin only.
- Body: partial `{ label?, icon?, sortOrder? }`. Slug is immutable once a
  category has products; the backend should return `409` if a slug change is
  attempted on a non-empty category.
- Response: `200` with the updated `Category`.

`DELETE /categories/:id`

- Auth: admin only.
- Reject seeds (`isSeed=true`) with `409 { "error": "Seed categories cannot
  be deleted" }`.
- Reject categories with `productCount > 0` with `409 { "error": "Move or
  delete products in this category first" }`.
- Response: `204 No Content` on success.

### Frontend behaviour

- `categoriesService.list()` is called on admin Categories mount and its
  result is merged with the canonical client-side `CATEGORIES` list (server
  wins on slug collisions).
- When `GET /categories` is unreachable the admin UI falls back to
  `localStorage` key `moe_admin_categories` so QA can still demo add/edit.
  Mutations queue locally and reconcile on next successful list call.
- Other consumers (signup, mega menu, filters, customization) still read
  from the canonical seed list. Once the backend ships, those consumers
  should switch to `categoriesService.list()` in a follow-up so newly added
  categories appear everywhere — not in this sprint.

**User-facing consequence if not built:** Admins cannot grow the taxonomy
without a code change, and the "Add Category" button on
`/admin/categories` either no-ops or only persists changes in the current
browser via `localStorage`.

## 12. Admin product hard-delete (DELETE /admin/products/:id)

Admins need to permanently remove a product from the system — not just
reject it. A removed product must disappear everywhere: the public
marketplace catalog (`GET /products`), category and search results, the
artisan's own storefront and dashboard listing, wishlists, "complete your
look" suggestions, recommendations, and any cached aggregates.

`DELETE /admin/products/:id`

- Auth: admin only (same guard as the other `/admin/products` routes).
- Optional query: `?reason=<string>` — stored in an audit log entry for
  the action; not returned to the artisan.
- Behaviour:
  1. Soft-delete is acceptable internally (set `deletedAt` and exclude from
     every product query), but the row must be invisible to all non-admin
     reads. If you implement hard-delete, cascade to dependent rows
     (reviews, wishlist items, cart items, customization templates,
     bundled-suggestions links). Existing orders must keep their snapshot
     of the product (denormalised name/price/image on the order line) so
     order history is not broken.
  2. Notify the owning artisan (`product_removed_by_admin` notification)
     with the product name and optional reason.
  3. Invalidate any per-artisan product count caches.
- Response: `204 No Content` on success. `404` if the product does not
  exist. `403` for non-admin callers.

### Frontend behaviour

- New "Remove" action on `/admin/products` (table row) and
  `/admin/products/:id` (header). Opens an `AlertDialog` warning that the
  deletion is permanent and cross-surface before calling
  `adminService.removeProduct(id)`.
- On success the table reloads and the detail page navigates back to
  `/admin/products`. Toast confirms removal.

**User-facing consequence if not built:** Admin clicks Remove, sees a
success toast, but the product reappears on next page load because the
`DELETE` call 404s and the row was never deleted server-side.
