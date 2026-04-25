# Bug Fix Sprint v7 — Artisan & Marketplace Modules

Final revision incorporating v6 feedback. Changes from v6:
- **Bug 7 step 5 REMOVED** — do not filter server response. Restore the v5 inline-comment approach instead.
- **Bug 7 developer note** — actionable inline code comment, not a PR description.
- **Bug 6 `businessAddress`** — drop from top-level alias list (would falsely map an object to a string field). Use explicit nested access `raw.businessAddress?.city` / `raw.businessAddress?.state` only.

---

## Bug 1 — Profile Name Not Syncing

**Files:** `src/pages/marketplace/Settings.tsx`, `src/pages/artisan/Dashboard.tsx`

- In `Settings.tsx` (personal info form): after a successful PATCH for `firstName`/`lastName`, `await refreshProfile()` from `useAuth()`.
- In `Dashboard.tsx` (business profile form): after a successful PATCH for `businessName`, add `await refreshProfile()` **if not already present — verify before assuming**.
- Log backend gap **#10** in `backend_MoeV1.md`: PATCH responses must return the updated profile so the marketplace listing reflects new names without a hard refresh.

## Bug 2 — About Section Incomplete

**File:** `src/pages/marketplace/ProviderDetail.tsx`

Render in the About tab, in this order, using existing provider data only:
1. Business Name (`brandName`)
2. Business Description (`about`)
3. Business Category (`category`)

No new fetches. Other sections untouched.

## Bug 3 — "View Details" → Homepage

**Files:** `src/components/marketplace/ProductCard.tsx`, `src/App.tsx` (read-only verify)

1. Verify exact product detail route in `App.tsx` (e.g. `/marketplace/product/:id`).
2. In `ProductCard.tsx`: before navigating, check `product.id` exists. If missing, abort navigation and emit a dev-only warn:
   ```ts
   if (import.meta.env.DEV) console.warn("[ProductCard] Missing product.id, skipping navigation", product);
   ```
3. Use the verified route path with the actual id.

## Bug 4 — Product Image Not Saving

No frontend fix. Log backend gap **#12** in `backend_MoeV1.md`: `POST/PATCH /artisans/me/products` must persist and return the `images[]` field; current responses strip it.

## Bug 5 — "View Profile" Not Navigating

**Files:** `src/components/marketplace/ProviderCard.tsx` (and any other "View Profile" trigger), `src/App.tsx` (read-only verify)

1. Verify exact provider detail route in `App.tsx` (same as Bug 3 — both routes verified).
2. Wire the button's `onClick` to navigate to the verified route with `provider.id`.
3. Guard against missing id with the same dev-only warn pattern as Bug 3.

## Bug 6 — Incorrect Location on Provider Page

**File:** `src/lib/apiServices.ts` → `normalizeProvider`

Expand alias resolution for `city` / `state`:
```ts
city:  raw.city  ?? raw.businessCity  ?? raw.businessAddress?.city  ?? "",
state: raw.state ?? raw.businessState ?? raw.businessAddress?.state ?? "",
```

`businessAddress` is **only** accessed as a nested object (`?.city` / `?.state`) — never mapped wholesale to a string field.

After implementing, test once. **If location still does not display correctly**, log gap **#14** in `backend_MoeV1.md` describing the actual key name returned by the API.

## Bug 7 — Cannot Delete Business Profile Image

**File:** `src/pages/artisan/Dashboard.tsx`

1. Add an X (remove) control overlaid on the uploaded business profile image (and cover image if applicable).
2. On click: clear the local image state (`storeImageUrl = ""`) and set an internal `removeStoreImage = true` flag.
3. Render: when local `storeImageUrl` is empty/null, render `FALLBACK_IMAGE` from `src/lib/imageFallback.ts` (verified to exist).
4. **Delta builder fix:** the existing builder skips empty strings. When `removeStoreImage === true`, **explicitly inject** `delta.storeImageUrl = null` after the delta is computed, bypassing the truthy filter. Same for cover image if applicable.
5. ~~Post-save merge filter~~ — **REMOVED.** Do NOT filter or ignore `storeImageUrl` from the server response. The merge stays as-is so future legitimate updates (including `null` once #13 ships) propagate correctly.
6. **Inline code comment** at the post-save merge site in `Dashboard.tsx`:
   ```ts
   // NOTE: Until backend gap #13 (backend_MoeV1.md) is resolved, the API may
   // echo back the previous storeImageUrl after a clear request. The X button
   // will appear to work, save fires, then the old image reappears on the
   // next refresh. This is expected and resolves automatically once #13 ships.
   // Do NOT add response filtering here — it would mask legitimate null updates.
   ```
7. Log gap **#13** in `backend_MoeV1.md`: PATCH `/artisans/me` must accept `storeImageUrl: null` (and/or `""`) as an explicit clear signal and persist + echo back the cleared state.

## Bug 8 — "Save Card" Button Stays Disabled

**File:** `src/pages/marketplace/Settings.tsx`

1. **First, read the exact disabled condition** on the Save Card button — do not assume.
2. Root cause to fix: the masked display value (containing `•` / spaces) is being written back into `cardNumber` state, so length/regex validation against digits fails.
3. Fix: store **only raw digits** in `cardNumber` state (strip non-digits in `onChange`). Move bullet/space masking to the render layer (`value={formatCard(cardNumber)}`) so state stays clean.
4. Fix only the gating condition / state shape. Do not change fields, layout, or submit behavior.

---

## Backend Gaps to Append (`backend_MoeV1.md`)

Append entries **#10, #12, #13, #14** following the existing numbered format and 🔴/⚠️ badge style. Do not modify entries #1–#9.

- **#10** — PATCH profile responses must return updated user/profile object.
- **#12** — Product create/update must persist & return `images[]`.
- **#13** — PATCH `/artisans/me` must accept and persist explicit image-clear signal (`null` or `""`).
- **#14** — *(conditional, only if Bug 6 fix doesn't fully resolve display)* Document actual location field name returned.

## Files Touched

| File | Change |
|------|--------|
| `src/pages/marketplace/Settings.tsx` | refreshProfile() after personal info save; cardNumber raw-digit state |
| `src/pages/artisan/Dashboard.tsx` | refreshProfile() after business save (verify); X delete control; delta null-injection; inline race-condition comment |
| `src/pages/marketplace/ProviderDetail.tsx` | About tab: name → description → category |
| `src/components/marketplace/ProductCard.tsx` | Verified route + id guard with dev-only warn |
| `src/components/marketplace/ProviderCard.tsx` | Verified route + id guard with dev-only warn |
| `src/lib/apiServices.ts` | normalizeProvider city/state aliases (nested businessAddress access only) |
| `backend_MoeV1.md` | Append #10, #12, #13, conditionally #14 |

No new dependencies. No UI redesigns. No unrelated refactors.
