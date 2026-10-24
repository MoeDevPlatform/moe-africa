# Phase 7 Report — Customer-Facing UI and Signup Consent

Phase 7 covers Requirements 7, 8, and 22. Work stayed in the local `moe-africa` and `moe-backend` repositories. No production accounts were created, and no schema migration was added.

Requirement 33 and Requirement 20 were not changed.

## Phase 6 checks completed first

`tests/playwright/phase6-gaps.spec.ts` passed (12.6s) before the Phase 7 browser run.

- Best Sellers **Name Z–A** kept the same two products (Ankara Midi Dress, order count 3; Phase2 API Variation Probe, order count 2) and reversed them by name. The request was `collection=best-sellers` and `sort=name_desc`.
- The desktop category **Best Sellers** shortcut opened `/marketplace/products?collection=best-sellers&category=…`. Returned rows stayed in that category and still matched the best-seller rule: `isBestSeller` or at least one order that is not cancelled or rejected.

That definition was not changed in Phase 7.

## Requirement 7 — Message Us

### Audit

`ProductDetail.tsx` rendered **Message Artisan** with `variant="ghost"`, so the control had no visible border. It already opened `MessagingModal` with `provider.id` and `provider.brandName` for the product on the page. The backend `POST /conversations` finds the existing customer/artisan thread by `customerId_providerId` and creates one only when none exists. Unauthenticated visitors can open the modal; sending a message requires the existing JWT guard. Wishlist adds are rejected with “Please sign in to save items to your wishlist” until the visitor is signed in.

### Change

The label is **Message Us**. The button uses the same outline style as Add to Wishlist (`variant="outline"`, full width, large). The click handler is unchanged.

### Playwright

On `/marketplace/product/1` at 1280px, while signed out:

- The visible button read **Message Us**.
- Its computed top border width was greater than 0 (`border-input` from the outline style).
- **Add to Cart** was visible.
- **Add to Wishlist** stayed on the page and showed the existing sign-in toast.
- The button opened a dialog titled `Re: My business`, the artisan named on that product.

After signing in as `phase3.customer@local.test`, Add to Wishlist changed to the remove-wishlist control. Sending “Phase 7 message check” reached `POST /conversations` on port 3000. The body `providerId` was the product’s `providerId` (1). A later send on the same thread uses the existing conversation id instead of creating another one; that lookup was already in the modal and was not rewritten.

## Requirement 8 — Make an Enquiry

### Audit

`ProviderDetail.tsx` used **Contact Us About This Artisan** in the hero and in the sidebar. Both called `setShowMessaging(true)` for `MessagingModal` with that profile’s id and brand name.

### Change

Both labels are **Make an Enquiry**. The hero button can wrap (`h-auto whitespace-normal`) so the shorter label still fits on a narrow screen. The modal and the artisan id passed into it are unchanged.

### Playwright

On `/marketplace/artisan/1` (the artisan for product 1):

- Neither the hero nor the sidebar still said “Contact Us About This Artisan”.
- Both buttons read **Make an Enquiry**.
- The hero button opened `Re: My business`.
- At 390px the hero button was visible and its width was within the viewport. It opened the same dialog.

## Requirement 22 — Signup consent

### Audit

Email signup in `Auth.tsx` had no checkbox. A line under the card said “By continuing, you agree…” and linked to the existing `/terms` and `/privacy` pages. `POST /auth/register` accepted a valid body with no consent field. There is no consent column on `User`. Google and Clerk signup do not post the register body.

### Change, without a new stored field

Consent is an affirmation on the registration request, not a new personal-data column.

- The checkbox is unchecked by default. Its label links to the existing Terms of Service and Privacy Policy pages. No new policy text was written.
- The passive “By continuing, you agree” line was removed so the page does not claim agreement without the checkbox.
- Submit and the signup Google buttons check the box in the submit path. An unchecked box shows “Agree to the Terms of Service and Privacy Policy to create an account.” and does not call the API.
- `AuthRegisterDto.acceptedTerms` must be boolean `true`. `AuthService.register` rejects anything else with the same message before it creates a user. The value is not written to the database.
- Sign-in, including sign-in with Google, does not ask for this checkbox.
- Google and Clerk account creation still do not receive `acceptedTerms`. Those buttons are blocked in the signup handler until the box is checked. A direct visit to `/auth/google` can still create an account without the field, because that redirect has no register body. Storing a consent timestamp for OAuth would be a schema change and was not added.

The register route’s throttler is still 3 attempts per hour. It had been applied twice (app-wide guard plus a second guard on the method), so the second attempt was already rate-limited. The extra guard on `POST /auth/register` was removed. The app-wide guard and the 3-per-hour limit remain.

### Playwright

`phase7-ui-consent.spec.ts` signup test passed (16.9s):

- The checkbox was unchecked on `/auth?tab=signup`.
- **Terms of Service** opened the page headed “Terms of Service”. **Privacy Policy** opened the page headed “Privacy Policy”.
- A short password, with the box checked, showed the existing password validation and did not create an account.
- Unchecking the box and submitting showed the consent error. No `POST /auth/register` was sent.
- `POST /auth/register` without `acceptedTerms` returned **400** and “You must agree to the Terms of Service and Privacy Policy”.
- A valid signup with the box checked posted `acceptedTerms: true` and returned **201**. The browser landed on `/marketplace`.
- Signing out and submitting the same email returned **409**, and the existing auth error was shown.

The local account created for that check is `phase7.consent.<timestamp>@local.test` in `moe_dev`.

## Files

- `moe-africa/src/pages/marketplace/ProductDetail.tsx`
- `moe-africa/src/pages/marketplace/ProviderDetail.tsx`
- `moe-africa/src/pages/Auth.tsx`
- `moe-africa/src/components/auth/ClerkGoogleButton.tsx`
- `moe-africa/src/contexts/AuthContext.tsx`
- `moe-africa/src/lib/apiServices.ts`
- `moe-africa/tests/helpers/moeApi.ts` — seed registration sends `acceptedTerms: true`
- `moe-africa/tests/playwright/phase6-gaps.spec.ts`
- `moe-africa/tests/playwright/phase7-ui-consent.spec.ts`
- `moe-backend/src/auth/dto/auth-register.dto.ts`
- `moe-backend/src/auth/auth.service.ts`
- `moe-backend/src/auth/auth.controller.ts`

## Verification

- `npx tsc --noEmit` in `moe-africa`: exit 0.
- `npx tsc --noEmit` in `moe-backend`: exit 0.
- Playwright `phase6-gaps.spec.ts`: 1 passed.
- Playwright `phase7-ui-consent.spec.ts`: the signup test passed, then the Message Us / Make an Enquiry test passed on the rerun after the wishlist assertion was moved to the signed-in path. They were not failed together in the final runs.

## Not verified

- Clerk’s hosted Google redirect was not clicked. Local signup uses the email form. The Clerk button now refuses to start while the checkbox is unchecked, and that refusal was not exercised in the browser because Clerk is not the local email path.
- A direct `/auth/google` visit was not tested and is not covered by the register DTO.
- Sign-in with an existing account was used inside the Message Us test (`phase3.customer@local.test`). A separate sign-in regression file was not rerun.

Phase 8 was not started.
