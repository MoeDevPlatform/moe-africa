# Product Detail, Category, Rating & Delivery Fix Sprint (v3)

Four sequential fixes per the spec. Backend dependencies appended to `backendRequirements.md`.

## Fix 1 — Category cleanup (canonical 7)

**`src/components/artisan/AddProductModal.tsx`**
- Category options come exclusively from `CATEGORIES` in `src/lib/categories.ts` (no `accessories`, `canvas`, `crafts`, `furniture`, `art`). Label = `c.label`, submitted value = `c.value`.

**Browse by Category (`src/pages/marketplace/Home.tsx`)**
- Iterate `CATEGORIES`, `Promise.all` 7 calls to `GET /service-providers/public-info?category={value}`.
- `count > 0` → render "{n} artisan(s)"; 0 or failure → render nothing. Card layout untouched.

## Fix 2 — Estimated delivery as free-text string

**`src/components/artisan/AddProductModal.tsx`**
- Replace numeric input with text input: optional, `maxLength={50}`, placeholder `e.g. 5-7 days`. Submit as `estimatedDelivery` (string). Block submit if length > 50.

**`src/lib/apiServices.ts`**
- In `normalizeProduct`: `estimatedDelivery: raw.estimatedDelivery ?? (raw.estimatedDeliveryDays ? \`${raw.estimatedDeliveryDays} days\` : null)`. Keep `estimatedDeliveryDays` in output.

**Product type — update EVERY definition**
- Grep `interface Product` / `type Product` / `estimatedDeliveryDays` across `src/` (`mockData.ts`, `apiServices.ts`, any `src/types/*`). Add `estimatedDelivery?: string | null` to every match so all consumers typecheck.

**All display sites** (grep `estimatedDeliveryDays`)
- `deliveryDisplay = product.estimatedDelivery ?? (product.estimatedDeliveryDays ? \`${product.estimatedDeliveryDays} days\` : null)`.
- null → "Contact artisan for delivery time". Else render the string as-is. Remove any hardcoded `21` fallback.

## Fix 3 — Product detail redesign (`src/pages/marketplace/ProductDetail.tsx`)

Data unchanged; only layout/spacing.

Desktop two-column (`grid lg:grid-cols-5 gap-8`):
- Left col-span-3: existing `ProductImageGallery`.
- Right col-span-2, `p-6 flex flex-col gap-6`:
  1. Category badge (`bg-primary/10 text-primary` pill)
  2. Product name (`text-2xl font-bold`)
  3. Artisan avatar + "by {brandName}" → provider page
  4. Star rating + review count (from Fix 4; "No reviews yet" when empty)
  5. Price — `text-2xl font-bold text-primary`, range or single
  6. Delivery — clock icon + "Est. delivery: {deliveryDisplay}"
  7. Description — `text-sm text-muted-foreground leading-relaxed`
  8. Tags — wrapping pill badges
  9. Materials (if present) — small muted
  10. Action buttons stacked full-width: Customise & Order (primary), Add to Wishlist (outline), Message Artisan (ghost)

Below: full-width Tabs — Reviews / About the Artisan / More from this Artisan.

Mobile: single column. Action bar:
`sticky bottom-0 bg-background border-t p-4 flex flex-col gap-2 lg:static lg:border-0 lg:p-0`.

## Fix 4 — Product reviews (Reviews tab)

**`src/lib/apiServices.ts` — new `productReviewsService`:**
- `list(productId, page=1, pageSize=5)` → `GET /products/:id/reviews`
- `mine(productId)` → `GET /products/:id/reviews/mine` (404 → null)
- `submit(productId, { rating, review })` → `POST /products/:id/reviews`
- `update(productId, { rating, review })` → `PATCH /products/:id/reviews/mine`

**New `src/components/marketplace/ProductReviews.tsx`:**
- Header: big average + stars + "Based on {n} reviews"; empty-state copy otherwise.
- List: reviewer name (already first + last initial from API), star row, text, relative date via `date-fns` `formatDistanceToNow` — confirmed installed as `^3.6.0`, import: `import { formatDistanceToNow } from "date-fns"`. 5/page; "Show more" paginates.
- Write-a-review card shown only when: user authenticated AND role is customer AND not the product owner.
  - **Ownership check:** `product.providerId` is the artisan profile id, not user id. Read `AuthContext` to find the user→artisan-profile id mapping (e.g. `user.artisanProfile?.id` or `user.providerId`), compare to `product.providerId`. If the mapping is ambiguous, hide the form (safer than letting an artisan review their own product).
- Required star selector; textarea ≤500 chars optional. Submit disabled until rating set.
- If `mine()` returns existing review → prefill, button "Update Review", `PATCH`. Else `POST`.
- Success → toast + refetch list + refetch mine. Network errors render empty state (no crash).

## Fix 5 — `backendRequirements.md`

Append the full spec block verbatim: `estimatedDelivery` string field, category alignment + `accessories → jewellery` migration, product reviews endpoints, service-providers category filter verification.

## Technical notes

- `src/lib/categories.ts` is the single source of truth — no inline category arrays.
- `estimatedDeliveryDays` stays in types and `normalizeProduct` output for legacy products; display logic uses `deliveryDisplay`.
- `estimatedDelivery` added to every Product/ProductDto type found.
- Reviews ownership uses the user's artisan-profile id, not `user.id`.
- Mobile sticky action bar needs `bg-background border-t` to avoid floating over content.
- `date-fns` v3.6.0 is in `package.json` — no new dependency required.
- Semantic tokens only (`bg-primary/10`, `text-primary`, `text-muted-foreground`, `bg-background`, `border-t`).
