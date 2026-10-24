# Phase 8 Report — Full-system regression

Phase 8 re-checked the current local `moe-africa` and `moe-backend` code against the Phase 1 audit and the Phase 2–7 reports. Mutating checks used `http://localhost:8080`, `http://localhost:3000`, and `moe_dev`. Production was not written, the database was not reset, and no migration was added.

Requirement 20 and Requirement 33 were not implemented.

The marketplace is not fully complete. Two requirements are still awaiting approval, and several older specs do not match the local catalogue or fixture ids.

## What changed in this phase

### Signup consent for Google and Clerk (Requirement 22)

Email registration already rejected a body without `acceptedTerms: true`. Two other creation paths did not.

- `GET /auth/google` with no consent proof can still start Google sign-in, so an existing account can sign in. If Google returns a person who has no MOE user, the callback does not create one. It redirects to `/auth?tab=signup&error=consent`.
- A new Google signup first calls `POST /auth/oauth-consent` with `acceptedTerms: true`. That returns a one-time state token, kept in memory for 10 minutes. The signup redirect is `/auth/google?state=…`. The token is consumed only when a new user is created. Sign-in does not request one.
- A new Clerk account is created in MOE only when Clerk `unsafeMetadata.acceptedTerms` is `true`. The signup Google button sends that flag, and it does not start the redirect while the checkbox is unchecked. An existing MOE user matched by Clerk id or email is linked and signed in without the flag.
- The value is still not stored. No schema change.

This is the same affirmation the email form already sends. It does not prove a human read the policy if a client forges the flag. Completing Google’s or Clerk’s hosted screens was not done, because that would create an external account.

### Test fixes after the regression run

- Admin order filters no longer expect a frozen total of 4. `moe_dev` now has 8 orders (the original four plus later local orders, including confirmed orders from Phase 5). Clear restores the same total the page loaded. Pending is still exactly 3, and the cancelled/refunded and search checks are unchanged.
- Featured Picks admin waits until the system-selected rows render. They were arriving after the assertion. The page does show them: Phase2 Admin Create ids 80, 76, 75, and 74, matching `GET /sections/featured_picks` (`80:algorithm`, `76:algorithm`, `75:algorithm`, `74:algorithm`).
- Message Us waits until the wishlist control has hydrated. Product 1 was already saved, so the button read “In Wishlist” / “Remove from wishlist”. The test removes it, adds it again, then sends the message.
- The older duplicate-email spec now checks the consent box before submit. Without that, the form correctly stops on the consent error and never reaches the duplicate-email error.

## Playwright

Local environment for every command:

`PLAYWRIGHT_BASE_URL=http://localhost:8080`
`MOE_API_BASE_URL=http://localhost:3000`
`PLAYWRIGHT_API_BASE_URL=http://localhost:3000`
`PLAYWRIGHT_ADMIN_EMAIL=phase2.admin@local.test`
`PLAYWRIGHT_ADMIN_PASSWORD=password123`

Customer and artisan overrides, where a spec reads them from the environment:

`PLAYWRIGHT_CUSTOMER_EMAIL=phase3.customer@local.test`
`PLAYWRIGHT_CUSTOMER_PASSWORD=password123`
`PLAYWRIGHT_ARTISAN_EMAIL=phase2.artisan@local.test`
`PLAYWRIGHT_ARTISAN_PASSWORD=password123`

The shell `.env` customer and artisan addresses are not the local accounts. The first Phase 3 login returned 401 until those overrides were set.

| Command | Result |
| --- | --- |
| `tests/playwright/phase8-oauth-consent.spec.ts` | **1 passed** (8.9s) |
| Phase 2–7 files listed below, first pass | **15 passed, 6 failed** (9.0m) |
| Rerun of the Phase 3, Phase 4 order, Phase 6, and Message Us failures with local customer credentials | Phase 3 **3 passed**. Admin orders **passed**. Phase 6 and Message Us failed on timing, then **both passed** on the follow-up (2 passed, 2.2m) |
| `auth.spec.ts`, `search.spec.ts`, `custom-orders.spec.ts`, `admin.spec.ts`, `artisan.spec.ts`, `security.spec.ts`, `checkout.spec.ts`, `commerce-ui-sprint.spec.ts`, `mobile.spec.ts` | **20 passed, 6 failed, 2 skipped** (5.8m) |
| `auth.spec.ts` after the consent checkbox | **3 passed** (21.9s) |

Phase files in the first pass: `phase2-catalogue`, `phase2-deploy-readonly` (against localhost, not the VPS), `phase3-custom-messaging`, `phase4-discovery`, `phase4-admin-order-filters`, `phase5-curation-orders`, `phase6-gaps`, `phase6-collections`, `homepage-view-all`, `duplicate-products`, `phase7-ui-consent`.

`phase7` signup consent passed on the first pass (14.7s): unchecked box blocks submit, policies open, register without `acceptedTerms` is 400, a checked signup returns 201 and lands on `/marketplace`.

Not run: `seed-artisans-products.spec.ts`, visual screenshot baselines, and the remaining older specs (`variations`, `accessibility`, `dispute`, `onboarding`, `trust`, `admin-scoring`, `body-type`, `behaviour`, `search-seo`, `ui-audit`, `product-variations`, `artisan-products`). Those were left so this pass could finish the phase suites and a functional sample without another rate-limit restart.

### OAuth result

- `POST /auth/oauth-consent` without `acceptedTerms: true` returned 400.
- With `acceptedTerms: true` it returned 200 and a state string.
- `GET /auth/google` with no state responded 3xx to `accounts.google.com` and the location had no `state`.
- On `/auth?tab=signup`, Continue with Google did not leave the page while the box was unchecked, and the consent error was shown.
- After the box was checked, Clerk started its redirect (local Clerk is enabled). The test aborted Google and `accounts.dev` so no external account was created.
- Sign-in Continue with Google started without `POST /auth/oauth-consent`.

Jest `src/auth/oauth-consent.spec.ts`: **5 passed**. A new Google profile without a ticket does not call `user.create`. The same profile with a ticket does, and the ticket cannot be reused. An existing user signs in with no ticket. Clerk metadata without `acceptedTerms: true` is rejected by the helper the create path calls.

### Failures that remain

| Spec | What happened |
| --- | --- |
| `search.spec.ts` View all for “leather” | `GET /search?q=leather` returns **0 products** on `moe_dev`. The overlay never offers View all. The test was written for the live catalogue. Keyword search for a query that does match, and the location filter, passed. |
| `custom-orders.spec.ts` and two commerce-ui custom-order button tests | They look for `request-custom-order-btn` using `PLAYWRIGHT_ELIGIBLE_ARTISAN_ID` from `.env`. That control exists on `ProviderDetail` only when `isCustomOrderEligible` is true. The configured id did not show it. Phase 3’s own local customer flow, which uses the eligible local artisan, passed. |
| `checkout.spec.ts` | Skipped. It looks for an anchor to `/marketplace/product/`, and the catalogue card opens the product with a button. |

## Typecheck and API

- `npx tsc --noEmit` in `moe-backend`: exit 0.
- `npx nest build` in `moe-backend`: exit 0.
- `npx tsc -p tsconfig.app.json --noEmit` in `moe-africa`: exit 0.
- Jest oauth consent: 5 passed.

Local API after the catalogue work, still true in this phase:

- `GET /products?pageSize=1`: **56** products. First row Ankara Midi Dress, id 1.
- `GET /service-providers/public-info?pageSize=100`: **6** artisans.
- `GET /products?collection=deals&pageSize=1`: **52**.
- `GET /products?collection=styles&pageSize=1`: **5**.
- `GET /products?collection=best-sellers&pageSize=1`: **2**.
- `GET /sections/featured_picks`: four algorithm items, ids 80, 76, 75, 74.
- Admin orders: **8** rows. 4 confirmed/unpaid, 3 pending/unpaid, 1 cancelled/refunded.

No production deploy. The live catalogue still returns the repeated storefront products until the backend from the duplicate-card fix is deployed. Those rows were not deleted.

## Requirement matrix

| Req | Behavior | Status | What Phase 8 saw |
| --- | --- | --- | --- |
| 1 | Admin artisan filters combine and clear | **Passed** | `phase4-discovery` admin section passed. Rejected, approved, search, tailoring, location, date, and Clear were already covered by that spec and it passed again. |
| 2 | Naming guidance, no content rewrite | **Passed** | Same Phase 4 spec. Helper text is on the create forms. Existing names were not rewritten. |
| 3 | Searchable artisan selector saves the user id | **Passed** | Phase 4 spec selects the real artisan id on create. |
| 4 | Alphabetical default where no other ranking applies | **Passed** | Phase 4 and Phase 6. All Products names were case-insensitive A–Z. `sort=newest` stayed newest. |
| 5 | Admin list filters | **Passed** | Products, artisans, and custom orders passed. Admin orders: status, payment, and search combined, the empty search showed “No orders found.”, and Clear restored the loaded total (8, not the old snapshot of 4). |
| 6 | Artisan name beside products in curation pickers | **Passed** | `phase5-curation-orders` passed. The picker shows the artisan from the product relationship. |
| 7 | Message Us on the product, outlined, to that artisan | **Passed** | On `/marketplace/product/1`, Message Us opened `Re:` plus that artisan’s name. Signed-in send hit `POST /conversations` on port 3000. Wishlist toggled Add → In Wishlist. |
| 8 | Make an Enquiry on the artisan page | **Passed** | Same test. Hero and sidebar read Make an Enquiry. The old “Contact Us About This Artisan” label was absent. The hero button opened the dialog. Mobile 390px was included. |
| 9 | Placeholders are examples, not saved values | **Passed** | Phase 4 create-form checks passed inside `phase4-discovery`. |
| 10 | Public product filters and sorts | **Passed** | Phase 4 discovery passed: category, price, delivery, price sort, and empty best-seller/trending flag filters. Phase 6 best-seller category shortcut passed. |
| 11 | One source of truth | **Partial** | Healthy product lists use the API and show an error instead of mock cards (`phase2` and `duplicate-products` passed). Other screens still have mock catch paths. Removing them is Requirement 20 and was not done. |
| 12 | Admin can create a product | **Passed** | Phase 2 admin create with artisan and image passed (20.0s). |
| 13 | Custom-order reference upload | **Passed** | Phase 3 eligible customer submitted a custom order with a reference image (14.4s on the rerun). |
| 14 | Custom-order permission errors stay explicit | **Passed** | Phase 3 description and submit tests passed for the local eligible customer. The older custom-order specs failed on the `.env` artisan id, not on this flow. |
| 15 | Reviews on the admin dashboard | **Passed** | Phase 3 admin dashboard activity test passed (14.7s). |
| 16 | All Products loads in batches of 20 without duplicate ids | **Passed** | Phase 2 scroll test passed. `duplicate-products` passed: page 1 and page 2 of 20 did not share ids, and the grid grew past 20. |
| 17 | Explore artisans controls | **Passed** | Phase 4 artisan chips, delivery, and A–Z default passed. |
| 18 | Pending Orders count and link | **Passed** | Phase 5 pending card, filters, and ownership passed. |
| 19 | Artisan status changes on their own orders | **Passed** | Same Phase 5 test. New is the narrower pending subset. Transitions persisted. Another artisan’s orders are not updated. |
| 20 | Remove mock and generated data | **Awaiting approval** | Inspected only. Fallbacks and the production seed spec are still present. Nothing was deleted. |
| 21 | UI total matches the API total | **Passed** | Phase 2 and the localhost “deploy” scroll test. The on-page count matched `pagination.totalItems`, including page 2 with no shared ids. Local total 56. |
| 22 | Signup requires Terms and Privacy consent | **Passed** | Email: checkbox unchecked by default, policies open, missing `acceptedTerms` is 400, checked signup is 201. Google: direct `/auth/google` does not carry consent state and cannot create a user (Jest). Signup starts only after the checkbox and a one-time ticket. Clerk: the button is blocked until the checkbox, and a new MOE user requires `unsafeMetadata.acceptedTerms`. Existing sign-in does not ask. The hosted Google/Clerk finish was not completed. |
| 23 | All Products, New Arrivals, and Best Sellers differ | **Passed** | Phase 6 passed on the rerun. Totals differ, newest is `createdAt` desc, best sellers are order-count desc. Phase 6 gaps: name Z–A stays inside that set, and a category shortcut keeps the collection. |
| 24 | Best Sellers navigation | **Passed** | Phase 6 desktop mega menu and mobile menu both landed on `/marketplace/products?collection=best-sellers`. |
| 25 | Separate sections and Featured Picks listing | **Passed** | Phase 6 opened Featured Picks, Seasonal Picks, and Editor’s Recommendations. Admin algorithm rows for Featured Picks rendered after load. |
| 26 | View All and Recently Viewed | **Passed** | `homepage-view-all` passed (17.8s). Phase 6 View All and recent views passed on the rerun. The older “leather” View all spec failed because local search has no leather products. |
| 27 | Ethical discovery, no invented rankings | **Partial** | Best sellers still come from real orders or `isBestSeller`. Empty sections were not padded. No new recommendation surface was added in this phase, and a separate preference-editing journey was not re-run. |
| 28 | Algorithm items visible; add does not wipe other sections | **Passed** | Admin Featured Picks showed the four system rows and “No curated items yet.” Phase 6 curation steps completed on the passing rerun. |
| 29 | Custom-order form guidance | **Passed** | Phase 3 submit test reached the guided form and completed a local request. |
| 30 | Conversation open, send, and floating messages | **Passed** | Phase 3 inbox, existing conversation, send, and FAB passed (10.0s on the rerun). |
| 31 | Admin product image upload | **Passed** | Phase 2 create-with-image passed. |
| 32 | Description length, max 200 | **Passed** | Phase 3: short description accepted, over 200 blocked (14.3s on the rerun). |
| 33 | Quote and payment | **Awaiting approval** | Not implemented. Existing custom-order status and messaging were re-tested. No payment link or quotation flow was added. |

## Files

- `moe-backend/src/auth/oauth-consent.ts`
- `moe-backend/src/auth/oauth-consent.spec.ts`
- `moe-backend/src/auth/dto/oauth-consent.dto.ts`
- `moe-backend/src/auth/guards/google-oauth.guard.ts`
- `moe-backend/src/auth/auth.service.ts`
- `moe-backend/src/auth/auth.controller.ts`
- `moe-africa/src/pages/Auth.tsx`
- `moe-africa/src/components/auth/ClerkGoogleButton.tsx`
- `moe-africa/src/lib/apiServices.ts`
- `moe-africa/tests/playwright/phase8-oauth-consent.spec.ts`
- `moe-africa/tests/playwright/auth.spec.ts`
- `moe-africa/tests/playwright/phase4-admin-order-filters.spec.ts`
- `moe-africa/tests/playwright/phase6-collections.spec.ts`
- `moe-africa/tests/playwright/phase7-ui-consent.spec.ts`

The duplicate-storefront catalogue filter from the earlier urgent fix was already in the tree. `duplicate-products.spec.ts` passed again in this phase. It is not a new Phase 8 feature.

## Still open

- **Requirement 20** and **Requirement 33** need a separate approval before any cleanup or payment work.
- Deploying the API is required before the live site stops listing the extra seeded storefronts. Deleting those rows also needs approval.
- Finishing a brand-new Google or Clerk account inside the provider’s screen was not executed.
- Local search has no “leather” products, so that older View all spec cannot pass here.
- Custom-order button specs that use the `.env` artisan id did not see `request-custom-order-btn`. The Phase 3 local eligible-artisan flow did pass.
- Checkout smoke did not run, because it looks for a product anchor the card does not render.
- Older specs listed above were not executed in this pass.
