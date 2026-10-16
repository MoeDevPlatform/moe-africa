# MOE Africa — Comprehensive Application Audit Report

**Date:** 2026-10-10  
**Scope:** Frontend (`moe-africa`) + Backend (`moe-backend`)  
**Method:** Code inspection of routes, APIs, models, and UI; targeted fixes; Playwright E2E from prior sprint where noted. Full multi-viewport admin screenshot sweep and Google OAuth E2E were **not** fully re-run in this pass (see Outstanding).

Status key: **Implemented** · **Partial** · **Inaccessible/unclear** · **Bug** · **Missing** · **Needs verification**

---

## A. Requirement status matrix

### 2. Authentication & security

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 2.1 | Google authentication | Partial | Partial | BE: `GET /auth/google` + callback; FE: `ClerkGoogleButton`. Needs `GOOGLE_*` / Clerk env. **Needs verification** end-to-end without live provider secrets in this session. |
| 2.2 | Failed-login: 5 attempts then 5-min lockout | **Bug** (IP throttle 5/60s felt like lockout after 1 under shared IP) | **Implemented** (code) | BE: failure counter + 5-min lockout in `auth.service.ts`; login IP flood ceiling raised to 30/min. FE cooldown parses minutes from 429. **Requires BE redeploy** to take effect in prod. |
| 2.3 | 2FA | Missing (decorative Switch) | Missing (honest UI) | Customer Settings Switch disabled + labeled unavailable; Admin Settings documents Unavailable. Do not invent TOTP without product scope. |
| 2.4 | Logout / session / RBAC | Implemented | Implemented | JWT access+refresh; `logout()` clears client session; admin/artisan/customer guards present. Server-side refresh invalidation exists via refresh tokens. |

### 3. Admin portal

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 3.1 | Artisan ranking + Homepage Sections clarity | Inaccessible/unclear | Improved | Sections page explains purpose/manages/shows-on; scores at `/admin/artisans/scores`. Section detail already saves items/keywords. |
| 3.2 | Dashboard recent activity (messages / Contact Us / reviews) | Partial | Improved | Dashboard “Recent activity” from `/admin/messages` (+ optional `/admin/reviews`). Distinguishes Contact Us vs conversations. |
| 3.3 | Admin settings quality | Partial | Improved | Security status (honest), password change, logout — no fake toggles. |

### 4. Admin responsive UI

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 4.x | Logout hidden on small screens | **Bug** | **Fixed** | Mobile header logout button in `AdminLayout.tsx`. Full Playwright viewport sweep still recommended. |

### 5. Admin forms

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 5.1 | Add Artisan form parity | Partial | Partial | Works; still less rich than artisan self-registration. Password min length enforced. Further visual parity deferred. |
| 5.2 | Add Product + `providerId` error + variations | **Bug** / Partial | **Fixed** providerId; variations Partial | Removed forbidden `providerId` from admin create payload. Variations remain stronger on artisan product UI than admin add form. |

### 6. Account verification documents

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 6.x | PDF + image upload; admin preview | Partial | Improved | BE multer already allows PDF for `verification`; FE `VerificationSection` accepts PDF; admin Artisan Detail now previews images/PDFs + open/download. |

### 7. Search & discovery

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 7.1 | Keyword search | Implemented | Improved | Products `q` insensitive; providers public-info now filters `q`/`search`. |
| 7.2 | “View all N products” navigation | **Bug** | **Fixed** | Navigates to `/marketplace/products?q=` and `/marketplace/artisans?q=` with listing pages consuming `q`. |
| 7.3 | Admin search case-sensitivity | Partial | Implemented (client) | Admin Artisans filter already lowercases; section search lowercases. Server admin list still page-scoped — not a full-text index. |

### 8. Trends, SEO, purchase signals

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 8.1 | Trending keywords | Partial / unclear | Partial | Keywords module + section keywords exist; seasonal examples not hardcoded as special cases. Admin discoverability via Sections. |
| 8.2 | SEO meta | Implemented | Implemented | `SEOMeta` + product/artisan `metaTitle`/`metaDescription`. SPA meta is client-side (crawler caveat). |
| 8.3 | Low-stock / high-demand | Implemented | Implemented | Product detail: stock ≤5; `isHighDemand` from events service. |
| 8.4 | Abandoned-cart re-engagement | Missing | Missing | No cart-abandonment notifier found. Needs product decision on email/consent. |

### 9. Refunds & social proof

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 9.1 | Refunds / disputes | Partial | Partial | `disputes` module + `/admin/disputes` exist. Full payment-provider refund confirmation path needs verification. |
| 9.2 | Verified badges / social proof | Implemented but no live data / unclear admin control | Improved | Badges on cards/profiles; admin **Verified artisan** toggle on Artisan Detail (`PATCH /admin/artisans/:id/verified`). |

### 10. Product variations

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 10.1 | Swatches / thumbnails | Partial | Partial | Variation APIs + product detail selection exist from prior sprint. |
| 10.2 | Real-time price updates | Implemented (prior sprint) | Needs verification | Price override wiring landed earlier; re-verify after deploy. |

### 11. Custom orders

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 11.1 | Eligibility programme | Implemented | Implemented | Admin Artisan Detail toggle; public `isCustomOrderEligible`. |
| 11.2 | Ranking eligible artisans | Implemented | Implemented | Custom order rank + admin Custom Orders. |
| 11.3 | Structured request form | Implemented | Implemented | `CustomOrderRequestModal` + marketplace Custom Orders. |
| 11.4 | Forbidden on submit | **Bug** | **Fixed** (prior) | Payload mapped to `categoryFields`; eligibility on public artisan DTO. Playwright form submit passed after redeploy. |
| 11.5 | Acceptance → checkout | Partial | Partial | Quote/accept flows exist; checkout transition coverage needs more E2E. |

### 12. Artisan dashboard redesign

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 12 | Full dashboard redesign | Partial | Partial | Prior commerce UI sprint visual refresh; not a full Temu/Jumia-parity redesign. |

### 13. Homepage & cards

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 13.1 | Artisan product thumbnails on cards | Implemented | Implemented | `ArtisanProductPreviews` / `productPreviews`. |
| 13.2 | Recommended carousel nav + card size | **Bug** | **Fixed** | Dot-per-snap replaced with progress bar + prev/next; min card height wrapper. |
| 13.3 | Homepage dynamism | Partial | Partial | AnimatedSection, carousels, hover states present; further motion polish optional. |

### 14. Preference messaging

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 14 | Hide internal preference prompt | **Bug** / UX | **Fixed** | Removed “Showing picks matched to your preferences (…slugs…)” banner; preference filtering retained. |

### 15. Recommendation analytics visibility

| ID | Requirement | Initial | Resulting | Evidence / action |
|----|-------------|---------|-----------|-------------------|
| 15 | Behaviour capture + admin visibility | Partial | Improved | Capture via `trackBehaviour` → `/events`. Admin **Behaviour** nav + `/admin/behaviour` page + dashboard teaser; BE summary adds totals / byEventType. |

---

## B. Implementation summary (this pass)

**Fixed**
- Login failure lockout policy (5 failures → 5 minutes), separate from aggressive IP throttle
- Search “View all” → filtered products/artisans routes with `q`
- Admin product create `providerId` whitelist error
- Preference slug banner removed
- Admin mobile logout visibility
- Recommended Artisans carousel progress (no per-item dots)
- Verification PDF messaging + admin preview
- Homepage Sections explanations
- Admin Settings honesty (2FA unavailable)
- Dashboard recent activity strip

**Material files**
- FE: `SearchResults.tsx`, `AllProducts.tsx`, `AllArtisans.tsx`, `useArtisanSearch.ts`, `Home.tsx`, `AdminLayout.tsx`, `RecommendedArtisanCarousel.tsx`, `Products.tsx` (admin), `Sections.tsx`, `Settings.tsx` (admin + marketplace), `Dashboard.tsx`, `ArtisanDetail.tsx`, `CustomOrders.tsx` (admin), `Artisans.tsx`, `ProviderCard.tsx`, `VerificationSection.tsx`, `authErrors.ts`, `useAuthRateLimitCooldown.ts`, `apiServices.ts`
- BE: `auth.service.ts`, `auth.controller.ts`, `service-providers.service.ts`, `multer.config.ts`, `custom-orders.service.ts`, `create-admin-artisan.dto.ts`

**Follow-up from parallel audits** ([Audit auth security flows](ffd7f22e-f051-41e4-a62b-580c5a47c228), [Audit admin portal features](0d75f5db-c302-410d-87b0-d0dbc3b7fb5a), [Audit marketplace and custom orders](d63ad64c-b15b-45d5-8356-e8f1576b4a3f)):
- Admin Custom Orders list parses `{ items }` + ranks table/recalculate
- Verification PDF client validator + Cloudinary `resource_type: auto`
- Sections guide keys aligned to `featured_picks` / `featured_artisans` / `featured_styles` / `seasonal_picks`
- ProviderCard no longer N+1 fetches product lists
- Admin sidebar scroll + close on navigate; Google redirect default `/auth/callback`
- Admin create-artisan password complexity matches register

---

## C. Test results

| Test | Result |
|------|--------|
| Prior commerce UI Playwright suite (custom order form, variations, CTAs) | Passed after last BE/FE redeploy (prior session) |
| Login lockout 5-attempt policy against production | **Not run** — requires BE redeploy + isolated test account |
| Google OAuth E2E | **Not run** — provider credentials / env blocker |
| Admin multi-viewport screenshot regression | **Not run** this session (logout fix code-reviewed) |
| Search View-all navigation | Code-path fixed; automated re-run pending deploy |

---

## D. Outstanding / product decisions

1. Redeploy **moe-backend** for login lockout + provider `q` search.
2. Redeploy **moe-africa** for FE fixes above.
3. Abandoned-cart email/push: product + consent decision before building.
4. Whether to implement real 2FA (TOTP) — currently correctly marked unavailable.
5. Admin Add Product: full variation editor parity with artisan modal.
6. Admin recommendation analytics dashboard beyond raw events.
7. Persist login failure counters in DB/Redis if multi-instance BE (current: in-memory Map).

---

## E. Security findings

| Control | Status |
|---------|--------|
| Email/password auth | Implemented |
| Google / Clerk optional paths | Implemented; env-dependent |
| Failed-login lockout (5 / 5 min) | Implemented in code (redeploy needed) |
| IP flood throttle on login | 30 req / 60s (ceiling) |
| 2FA | **Missing** (UI honest) |
| Logout | Client session clear + navigate; refresh tokens server-side |
| Session expiry | Access JWT 24h default / 30d rememberMe |
| Protected routes + role guards | Implemented FE + BE |
| Verification uploads | Auth-gated; PDF+images for verification folder |

---

## F. Admin navigation guide (hard-to-find features)

| Goal | Path |
|------|------|
| Homepage shelves (Featured / Best Sellers / Trending / etc.) | **Sections** → click a card → add/reorder items & keywords |
| Artisan composite ranking | **Artisan Scores** (`/admin/artisans/scores`) |
| Custom Order eligibility | **Artisans** → open artisan → Custom Order eligibility switch |
| Custom Order admin queue / rank | **Custom Orders** (`/admin/custom-orders`) |
| Customer inbox + Contact Us | **Customer Messages** (`/admin/messages`); also summarized on **Dashboard → Recent activity** |
| Disputes | **Disputes** (`/admin/disputes`) |
| Verification docs review | **Artisans** → artisan detail → Verification documents |
| Account security | **Settings** |

---

*End of report.*
