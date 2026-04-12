

# Revised Plan — Fix Broken UI Behaviours

Scoped per user feedback: addresses are frontend-only against `/customers/me/addresses`. No backend spec files.

---

## Changes

### 1. `src/pages/marketplace/Home.tsx` — Null safety (crash prevention)

Six locations where `priceRange` or `materials` are accessed without guards:

- **Filter logic**: `product.priceRange.min` / `.max` → `(product.priceRange?.min ?? 0)` / `(product.priceRange?.max ?? Infinity)`
- **Materials filter**: `product.materials.toLowerCase()` → `(product.materials ?? "").toLowerCase()`
- **Tags filter**: `product.tags.map(...)` → `(product.tags ?? []).map(...)`
- **dealProducts**: Guard all `p.priceRange.min` / `.max` with `?? 0` in filter, map, and discount calculation
- **styleProducts**: Guard `p.priceRange.min` with `?? 0`
- **Deal price display**: Guard `product.price.toLocaleString()` and `product.originalPrice.toLocaleString()` with null checks

### 2. `src/pages/artisan/Dashboard.tsx` — Null safety (1 crash point)

Replace `₦{product.priceRange.min.toLocaleString()} – ₦{product.priceRange.max.toLocaleString()}` with conditional: show "Price on request" when either value is null.

### 3. `src/lib/apiServices.ts` — Add `addressesService`

New service object:
- `list()` → `GET /customers/me/addresses` — returns `Address[]`, fallback `[]`
- `create(data)` → `POST /customers/me/addresses` — returns created `Address`
- `update(id, data)` → `PATCH /customers/me/addresses/:id`
- `remove(id)` → `DELETE /customers/me/addresses/:id`
- `setDefault(id)` → `PATCH /customers/me/addresses/:id/default`

The `Address` interface uses `string` IDs (UUIDs from backend) instead of `number`.

### 4. `src/pages/marketplace/Settings.tsx` — Wire addresses to API

- Change `Address.id` type from `number` to `string`
- Remove `initialAddresses` hardcoded array
- Add `useEffect` to fetch addresses on mount via `addressesService.list()`
- Add `addressesLoading` state for loading indicator
- **handleSaveAddress**: Call API first (`create` or `update`), update state only on success, show error toast on failure
- **handleDeleteAddress**: Call API first, remove from state only on success, show error toast on failure and keep address in list
- **handleSetDefaultAddress**: Call API first, update state only on success

### 5. `src/pages/marketplace/Settings.tsx` — Add Payment Terms section

- Add "Payment Terms & Policies" card in the payment tab, visible only for artisan users
- Fields: payment schedule (select), deposit % (input), refund policy (textarea), accepted methods (checkboxes), installment toggle
- Submit via `PATCH /artisans/me` using existing artisan profile update service

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/marketplace/Home.tsx` | Add null safety to 6 locations |
| `src/pages/artisan/Dashboard.tsx` | Add null safety to price display |
| `src/lib/apiServices.ts` | Add `addressesService` |
| `src/pages/marketplace/Settings.tsx` | API-backed addresses + payment terms UI |

No backend spec files created — frontend codes against the agreed endpoints.

