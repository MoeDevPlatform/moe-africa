# MOE visual fidelity specification

## Brand and foundation
- Reuse the existing logo and actual HSL tokens: primary `150 100% 13%`, secondary `21 63% 52%`, accent `45 87% 63%`, background `45 60% 93%`. Dark-mode overrides remain intact.
- Surface token `45 60% 98%` provides a quieter ivory canvas; card stays white. No replacement brand palette.
- Inter for UI, product names and metadata; Playfair Display for page and editorial headings.
- Desktop page headings 40px; mobile 32px. Section headings retain 24–30px. Product titles 16px, body 16px, supporting metadata 12–14px.
- Marketplace containers max 1320px, 16px phone gutters and 32px tablet/desktop gutters. Customer accounts max 1120px.
- Standard corners 8px; dashboard-specific storefront preview retains its established cap/overlap. Shadows are restrained and token-based.

## Shared patterns
- Product cards: square, stable image frame; `object-contain` preserves the uploaded product; title, artisan attribution, optional description, genuine price and existing detail action. No invented ratings.
- Artisan cards: work image, business name, category, supplied previews, genuine rating/no-review state, location/delivery, quiet tags, profile and eligibility-controlled custom action.
- Desktop navigation: logo/search/utilities on the first row, existing discovery links and category control on the second. Tablet/phone use the existing menu and a visible search row.
- Underline tabs: horizontally scrollable, left-aligned, active primary underline, visible text labels on phones.
- Forms: readable labels, 44px shared inputs, existing validation unchanged; product form groups and sticky Save/Cancel footer. Dialogs retain viewport edge gaps.
- Buttons: forest primary; card/bordered secondary; quiet ghost. Existing focus rings, disabled states and control handlers preserved.
- Empty states are unframed, with genuine existing wording. Loading skeletons and retry states remain in place.

## Responsive behavior
- Product catalogue: two columns on phones, three on tablets, four on desktop; artisan directory retains one/two/three columns.
- Product detail: meaningful gallery beside purchasing information on desktop; stacked content and existing sticky actions on phones. Gallery tools wrap and fullscreen thumbnails scroll.
- Storefront: shorter cover followed by identity on an opaque surface, avoiding text over photography; existing Products/Reviews/About and contact actions preserved.
- Small product shelves remain content-sized rather than duplicating items; no blank filler cards. Carousels retain manual controls and their existing sources.
- Dashboard preserves responsive product table/cards and scrollable tabs; no order or verification state changes.

## Review evidence
Live preview inspected at 360×800, 390×844, 822×634 and 1440×1000, plus 1280×1800 captures. Representative catalogue, artisan directory, product detail, storefront, settings, orders and wishlist had no document-level horizontal overflow. Gallery fullscreen, product navigation, account payment tab and mobile menu were exercised. No frontend Playwright test files were created; temporary browser inspection scripts are outside the repository.

Signed-in account persistence, populated orders/messages, artisan dashboard and submission workflows remain unverified: the external authentication service has no preview session. No supplied screen recording was available. Reference research used accessible first-party Etsy search guidance, Jumia listings and Fiverr results; exact reference mobile layouts and Afrikrea's current site could not be inspected.