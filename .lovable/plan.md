
# FRONTEND_HANDOFF Implementation Plan

Big sprint — 11 backend changes, each with required frontend work. I'll group them into 4 phases so we can review/ship incrementally. Each item maps 1:1 to a section of `FRONTEND_HANDOFF.md`.

## Phase 1 — API service layer (foundation)

Update `src/lib/apiServices.ts` + `src/lib/moeApi.ts` first; everything else depends on this.

- **authService**: add `verifyEmail({email, otp})`, `resendOtp({email})`, `adminVerifyOtp({email, otp})`, `googleOAuthUrl()`. Change `register` to no longer assume tokens come back; return `{ requiresVerification, email }` when absent. Login now also handles `requiresOtp` (admin) and `403 EMAIL_NOT_VERIFIED`.
- **artisanService**: add `getRushConfig(id)`, accept `serviceCategories` on register, accept `rushOrderEnabled`/`rushOrderSurchargePercent` on `updateProfile`. Status field on profile/products.
- **productsService**: add `getFilterMeta()`, `getCustomisationTemplate(category)`. Send `priceMin`/`priceMax` on create/update. Pass `styleTags` as comma string. Reflect `status` in returned product type.
- **providersService**: add `getFilterMeta()`, accept `category`/`location`/`serviceCategories` filters.
- **wishlistService**: switch to `/wishlist` JWT routes (`GET`, `POST /:id`, `DELETE /:id`); legacy fallback kept.
- **cartService**: send customisation payload only when product requires; surface `CUSTOMISATION_REQUIRED` error.
- **paymentMethodsService**: handle `CARD_EXPIRED`. Send `processorToken` field (placeholder for now if no Paystack/Stripe SDK yet — see open question).
- **adminService** (new): `getDashboard`, `listArtisans`, `getArtisan`, `setArtisanStatus`, `listProducts`, `getProduct`, `setProductStatus`, `listUsers`, `getUser`.
- **Image uploads**: already read `body.url` first — verify all 4 endpoints align.

## Phase 2 — Auth & onboarding UI (items 9, 11)

- `src/pages/Auth.tsx`: 
  - Artisan signup adds `serviceCategories` multi-select (use options from `/artisans/filter-meta.serviceCategories`).
  - Register no-token path → route to new OTP screen.
  - "Continue with Google" button → full-page redirect to `${API_BASE}/auth/google`.
  - Login 403 `EMAIL_NOT_VERIFIED` → OTP screen; login `requiresOtp` (admin) → admin OTP screen.
- New `src/pages/VerifyEmail.tsx`: 6-digit OTP input + "Resend code".
- New `src/pages/AuthCallback.tsx`: reads `token`/`refreshToken` from URL query, stores via AuthContext, redirects.
- `AuthContext`: add `loginWithTokens(token, refreshToken)` helper to support OTP + OAuth flows.
- Admin OTP screen: same component, calls `adminVerifyOtp`.
- `App.tsx`: add `/verify-email`, `/auth/callback`, `/admin/login` (already exists), `/admin/verify-otp` routes.

## Phase 3 — Marketplace UX (items 1, 2, 3, 5, 6, 7, 8)

- **Item 1 — Price range**: `AddProductModal` & `admin/ProductForm` send `priceMin`/`priceMax`; product cards already read `priceRange.min/max` — audit and stop forcing equality.
- **Item 2 — Customisation templates**: replace hardcoded forms in `CustomizationFormModal` (and category-specific steps) with dynamic renderer driven by `/products/customisation-template?category=`. Cart/order payloads send the keyed object. Display `400 INVALID_CUSTOMISATION` errors.
- **Item 3 — Live filters**: `FilterDrawer` (products) and any provider filter UI fetch `/products/filter-meta` and `/artisans/filter-meta` on mount; render chips from response. Pass `styleTags` comma-separated.
- **Item 5 — Wishlist sync**: `WishlistContext` hydrates from `GET /wishlist` on login; add/remove call backend; localStorage remains for guests only.
- **Item 6 — Rush order pricing**: `Checkout.tsx` fetches `/artisans/{id}/rush-order-config`, shows toggle only if enabled, computes `final = base * (1 + pct/100)` preview, sends `rushOrder: true` + `basePrice`, renders returned `rushSurcharge` in summary.
- **Item 7 — Wishlist → Cart**: `Wishlist.tsx` "Add to Cart" omits customisation unless `product.customisationRequired`; on `CUSTOMISATION_REQUIRED` open customisation modal.
- **Item 8 — Save Card**: `Settings.tsx` card form — store raw digits in state, mask in render, validate MM/YY not past, show `CARD_EXPIRED` error inline. (Aligns with existing Bug 8 in plan.md.)

## Phase 4 — Status badges & Admin portal (items 4, 10, 11)

- **Item 4**: confirm all image upload responses use `.url` (already done; spot-check `auth.uploadAvatar` to read `url` first, falling back to `avatarUrl`).
- **Item 10**: artisan `Dashboard.tsx` shows `status` badge on profile header and each product row. Banner: "New listings require admin approval."
- **Item 11 — Admin portal**: rebuild/extend `src/pages/admin/*`:
  - `Login.tsx`: integrate password + OTP flow via `requiresOtp` response.
  - `Dashboard.tsx`: stats from `/admin/dashboard`.
  - `Providers.tsx`: paginated artisans table + status PATCH with optional reason textarea (Approve/Reject buttons + dialog).
  - `Products.tsx`: same pattern for products.
  - New `Users.tsx`: paginated users table.
  - `AdminLayout.tsx`: guard by `user.role === "admin"`; redirect otherwise.

## Files touched (estimate)

| Area | Files |
|------|-------|
| API layer | `src/lib/apiServices.ts`, `src/lib/moeApi.ts` |
| Auth | `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`, new `src/pages/VerifyEmail.tsx`, new `src/pages/AuthCallback.tsx`, `src/App.tsx` |
| Marketplace | `FilterDrawer.tsx`, `CustomizationFormModal.tsx`, `Wishlist.tsx`, `WishlistContext.tsx`, `Checkout.tsx`, `Settings.tsx`, `AddProductModal.tsx`, `admin/ProductForm.tsx`, `ProductCard.tsx` audit |
| Status/Admin | `artisan/Dashboard.tsx`, `admin/Login.tsx`, `admin/Dashboard.tsx`, `admin/Providers.tsx`, `admin/Products.tsx`, new `admin/Users.tsx`, `admin/AdminLayout.tsx` |

## Open questions before I start

1. **Payment tokenization (item 8)** — The handoff says "send `processorToken` from Paystack/Stripe tokenization — never send full card number." Do you have a Paystack/Stripe public key + SDK choice yet, or should I stub `processorToken` (e.g. send `"manual_unverified"` placeholder) until you wire in real tokenization?
2. **Google OAuth redirect URL** — backend uses `GOOGLE_SUCCESS_REDIRECT`. I'll assume it points to `${FRONTEND_URL}/auth/callback`. Is that correct?
3. **Admin route** — keep existing `/admin/login` URL, or move to `/admin` with nested routes? I'll keep `/admin/login` and add `/admin/verify-otp`, `/admin/dashboard`, etc.
4. **Scope confirmation** — should I ship all 4 phases in this single pass, or stop after Phase 1+2 (API + auth) for review before touching marketplace + admin?

---

# FRONTEND_HANDOFF — Shipped vs Deferred (this pass)

## Shipped (wired end-to-end)
- **Item 1** Price range — `priceMin/priceMax` already sent by `AddProductModal`; `normalizeProduct` reads `priceRange.{min,max}` first; stops assuming equality.
- **Item 3** Live filters — `FilterDrawer` now hydrates style tags + price max from `GET /products/filter-meta` (with fallback constants).
- **Item 4** Cloud uploads — `authService.uploadAvatar` now reads `url` first, falling back to legacy `avatarUrl`. Other upload services already read `.url`.
- **Item 5** Wishlist — `wishlistService` switched to JWT `/wishlist`, `/wishlist/:id` (POST + DELETE). `WishlistContext` already hydrates on login.
- **Item 8** Save Card — already stores raw digits in state and validates MM/YY not past; `CARD_EXPIRED` propagates via `MoeApiError.code` to the existing error banner.
- **Item 9** OTP + Google — Register returns `{ requiresEmailVerification, email }` path → new `/auth/verify` screen with resend + 30s cooldown. Login 403 `EMAIL_NOT_VERIFIED` redirects to same screen. "Continue with Google" button on both Sign In + Sign Up tabs → `GET ${API}/auth/google`. New `/auth/callback` page reads `token`/`refreshToken` from URL. Artisan signup gets a `serviceCategories` multi-select sourced from `/artisans/filter-meta`.
- **Item 10** Approval status — Artisan dashboard shows `status` badge on profile header and on each product row; non-approved artisans see an info banner.
- **Item 11** Admin OTP — Admin Login handles `requiresOtp` and redirects to `/auth/verify?mode=admin`. `adminService` (dashboard, list/get/setStatus for artisans/products, users) added in `apiServices.ts`.

## Deferred (API ready, UI work pending — too large to safely one-shot)
- **Item 2** Dynamic customisation renderer — `customisationTemplateService.get(category)` is in `apiServices.ts`, but `CustomizationFormModal` and the category-specific step components still use hardcoded fields. Needs a rewrite to render `fields[]` and submit a keyed object on `POST /customers/me/cart` + `POST /orders`. Handle `400 INVALID_CUSTOMISATION`.
- **Item 6** Rush order pricing — `rushOrderService.getConfig(artisanId)` is in `apiServices.ts`. Checkout still needs a fetch-on-mount, a gated toggle, the `basePrice * (1 + pct/100)` preview, and rendering `basePrice` / `rushSurcharge` from the order response.
- **Item 7** Wishlist → Cart customisation gating — `Wishlist.tsx` add-to-cart still needs to: omit customisation unless `product.customisationRequired`, and on `CUSTOMISATION_REQUIRED` open the customisation modal. `Product.customisationRequired` is now passed through by `normalizeProduct`.
- **Item 11** Admin portal UI — Approval tables (Approve/Reject + reason dialog) for `/admin/providers` and `/admin/products`, a new `/admin/users` page, a dashboard fed by `GET /admin/dashboard`, and a `role === "admin"` route guard in `AdminLayout`. API client done.

Open question carried forward: real payment tokenisation (Paystack/Stripe SDK) — currently sending safe metadata only (`brand`, `last4`, `expiry`, `cardholderName`), no `processorToken`. Backend will validate expiry and return `CARD_EXPIRED` cleanly.
