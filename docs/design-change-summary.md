# Design change summary

## Implemented passes
1. **Foundation:** semantic surface/overlay/image-text roles; quieter shared shadows, 8px radius, readable inputs, outlined/ghost buttons and edge-spaced dialogs.
2. **Discovery:** search-led two-row desktop navigation; tablet/mobile menu/search; quieter category/menu treatment; image-first product cards; streamlined artisan metadata; centered Featured Artisans emphasis preserved without decorative gradient/ribbon; small shelves and manual controls retained.
3. **Shopping/account:** coordinated catalogue grids/toolbars; shorter storefront cover with business identity below; contained product gallery and fullscreen tooling; consistent detail tabs and phone purchase actions; wishlist/cart/order/settings/message presentation and visible account tab labels.
4. **Artisan:** quieter statistics/statuses and existing panels, responsive product headers, business-information grouping, product-form spacing/upload treatment and sticky Save/Cancel footer. No dashboard workflow logic changed.
5. **Review:** live public pages and available signed-out account layouts inspected at phone/tablet/desktop sizes; no horizontal document overflow on representative pages, no runtime errors during inspection. Documentation added.

## Reused / refined components
ProductCard, ProviderCard, FeaturedProducts, FeaturedArtisans, ProductImageGallery, SectionViewAll, Navbar/MegaMenu/MobileMenu, RecentlyViewed, AddProductModal and existing Button/Input/Dialog. Shared `marketplace-page`, `commerce-tabs`, `product-media`, `page-heading` and account roles keep page-level styling coordinated without moving loaders or state.

## Verified and not verified
- Verified using actual public catalogue data: product-card navigation, gallery fullscreen and detail tab switching, real artisan storefront, account Payment-tab rendering, mobile category menu.
- Checked representative public/signed-out layouts at 360, 390, 822 and 1440px widths and reviewed screenshots.
- Not verified: signed-in purchase/CRUD persistence, populated orders/messages, artisan dashboard panels/forms or uploads. External authentication supplied no preview session; protected routes were not bypassed and no fake account was created.
- No backend APIs, service calls, schemas, payment processing, routes, permission rules or order state machines changed. No new dependencies or frontend test files added.
- Existing homepage promotion wording, buyer-protection/payment-storage claims and ordering-explanation copy were preserved and flagged in the content matrix for owner review.
- Reference pages were partly inaccessible; research limitations are recorded in the visual specification. No screen recording accompanied the brief.

## Reference principles
Search-led navigation: [Etsy search guidance](https://help.etsy.com/hc/en-us/articles/115015627947-How-to-Search-for-Items-and-Shops-on-Etsy). Price/title hierarchy: [Jumia fashion catalogue](https://www.jumia.com.ng/category-fashion-by-jumia/). Artisan identity and genuine trust indicators: [Fiverr results](https://www.fiverr.com/gigs/fiverr-logo-design). These informed principles, not copied branding or layouts.