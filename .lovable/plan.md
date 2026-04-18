

# Final Plan v3 — Marketplace Bug Fixes & Feature Completion

All prior feedback incorporated. Two final clarifications added (Orders mapper containment, payment method delete signature).

---

## 1. Artisan Business Profile (`src/pages/artisan/Dashboard.tsx`)
- **Category** → `Select` dropdown (shared CATEGORIES list).
- **Location** → 4 separate fields: Country (Select), State (Select, filtered), City (text), Address/Street (text). Sent as **distinct fields** in PATCH (`country`, `state`, `city`, `address`) — never concatenated.
- **Store Image upload**: native picker, `accept="image/jpeg,image/png,image/webp"`, **client-side max 5MB + MIME check** before upload, preview before save, `artisanService.uploadStoreImage`.

## 2. Add Product Form (`src/components/artisan/AddProductModal.tsx`)
- Single `price` numeric (drop `priceRange`/`priceMin`/`priceMax`).
- **Strip `images` from payload entirely** until backend accepts.
- **Image control disabled with visible "Image upload coming soon" badge/tooltip** — not silently dropping files.
- `tags` → CSV string.
- Client-side validation before any API call.

## 3. Wishlist (`src/pages/marketplace/Wishlist.tsx` + `WishlistContext.tsx`)
- Component uses `price` only — no `priceRange` access.
- **WishlistContext mapper compat shim**: `price: apiItem.price ?? apiItem.priceRange?.min ?? null`. Logged in `backend_MoeV1.md`.
- **Full file null-safety audit** of every property access on `item`/`selectedItem`.
- Authenticated init from API; localStorage for guests only.

## 4. Data Persistence
- Wishlist: await API before state mutation.
- **Inspect `Orders.tsx` BEFORE coding**. If mocked/missing → wire to `ordersService.list()` + log gaps.
- **If endpoint exists but response shape mismatches: document shape in `backend_MoeV1.md` and add a data mapper in the service layer (`apiServices.ts`). Do NOT patch the component directly** — keep backend inconsistencies contained to service layer.

## 5. Password Visibility (`src/pages/Auth.tsx`)
- Eye/EyeOff toggle on Sign In, Sign Up, Confirm password. `aria-label`, `type="button"`.

## 6. Address Form (`src/pages/marketplace/Settings.tsx` AddressModal)
- Order: Country → State → City → Street.
- Verify `src/data/countryStateData.ts` exposes `countries` + `getStatesByCountry()`; if missing, install `country-state-city`.
- City: free-text (documented).

## 7. Payment Methods (`src/pages/marketplace/Settings.tsx` + new service)
- Fields: Cardholder Name, Card Number, Expiry MM/YY, CVV, Billing Address.
- **Card Number behaviour**: while focused show all digits + space every 4; on blur mask to `•••• •••• •••• 1234` (last 4 only); on refocus show full digits for editing.
- CVV: masked input, 3-4 digits.
- Validation: 16 digits, future expiry, 3-4 CVV.
- **Persistence**: `POST /customers/me/payment-methods` with **only safe fields** (`last4`, `brand`, `expiry`, `cardholderName`). Never send raw PAN. Tokenise via Paystack/Stripe in production.
- New `paymentMethodsService` with `list()`, `create(data)`, **`remove(id)` → `DELETE /customers/me/payment-methods/:id` (single resource by ID — NEVER a blanket delete of the collection)**. Fetch on mount; await before state update.
- **Billing Address dropdown**: addresses fetched before PaymentModal opens; fallback fetch inside modal on mount.

## 8. Cross-Cutting Rules (ALL forms)
- Cascading dropdowns reset child fields on parent change.
- Submit buttons disabled while request in flight; re-enable on success/failure.
- All new API service methods use existing auth interceptor/header pattern in `apiServices.ts`/`moeApi.ts`.
- On API failure: **inline error message on the form (under affected field or at form top) in addition to toast**.
- All file uploads: client-side max 5MB + MIME check before upload.

## 9. `backend_MoeV1.md` (new file, project root)
Every backend gap logged with section/endpoint/what/why. **Explicit note: all listed endpoints require `Authorization: Bearer <token>`**. Sections:
- Artisan profile DTO (`businessName`, `description`, `country`, `state`, `city`, `address`)
- `POST /artisans/me/upload-image`
- Product DTO (`price` number, `images` array, `tags` CSV)
- Wishlist endpoints + note: API should return `price` (not `priceRange`); frontend has temporary compat shim
- `GET/POST/PATCH/DELETE /customers/me/addresses`
- `GET /customers/me/payment-methods`, `POST /customers/me/payment-methods`, **`DELETE /customers/me/payment-methods/:id`** + tokenisation note
- Orders endpoints (pending inspection; shape mismatches handled in service layer)

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/artisan/Dashboard.tsx` | Category dropdown, structured location, store image upload |
| `src/components/artisan/AddProductModal.tsx` | Single price, disabled image control, CSV tags, validation |
| `src/pages/marketplace/Wishlist.tsx` | Remove priceRange usage; full null-safety audit |
| `src/contexts/WishlistContext.tsx` | API-first init; mapper compat shim |
| `src/pages/marketplace/Orders.tsx` | Inspect; wire to real API; service-layer mapper if shape mismatch |
| `src/pages/Auth.tsx` | Password visibility toggles |
| `src/pages/marketplace/Settings.tsx` | Address modal cascading reset; payment modal w/ card masking + persistence + inline errors |
| `src/lib/apiServices.ts` | `paymentMethodsService` (list/create/remove-by-id), `artisanService.uploadStoreImage`, optional Orders mapper |
| `src/data/countryStateData.ts` | Verify or replace with `country-state-city` package |
| `backend_MoeV1.md` | New — backend gaps, auth header note, wishlist compat note, payment delete-by-id |

