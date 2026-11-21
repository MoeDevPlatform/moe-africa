# Page content matrix

| Area | Content source retained | Static wording / unresolved content |
| --- | --- | --- |
| Navigation | CategoriesContext, existing routes, Auth/Cart/Wishlist/Notification contexts | Existing labels and support destinations retained; compact discovery row repeats valid destinations. |
| Homepage banner | Existing local images and banner array | Existing Kente collection / Summer Deals / Leather Shoes text retained, not newly invented. Collection relevance and “up to 40%” claim require content-owner review. |
| Browse by Category | Existing categories and distinct-artisan counts | Existing category labels retained. |
| Featured Artisans | `sectionsService.get("featured_artisans")` | Real supplied name/location/about/review counts and previews; no fabricated reviews. |
| Best Sellers / Featured Picks / Editor's Recommendations | Existing section keys `best_sellers`, `featured_picks`, `featured_styles` | Existing collection titles retained. |
| Seasonal Picks | Existing matched-keyword source with curated fallback | Existing keywords and section content retained. |
| Recommended / Filtered Artisans | Existing filters, real review hydration and ranking | No ranking or deduplication changes. |
| Picked / Services / Deals / Styles | Existing preference and filter-driven sources | Existing prices, discounts and tags retained; no replacement inventory. |
| Recently Viewed | Existing browser ID history and product/artisan loaders | Existing recent-history behavior retained. |
| Products / collections | Existing product and section loaders, query controls, server pagination | Existing title/description/count/empty/error copy retained. |
| Artisan directory | Existing discovery loader and filters | Existing collection explanation copy retained; some descriptions explain ordering mechanics and merit separate content review. |
| Storefront | Existing provider/product/review loaders | Business/category/location/about retained. Missing delivery uses “Delivery: contact artisan” instead of a zero/undefined-day claim. |
| Product detail | Existing product/provider/reviews/variants/delivery sources | Prices, material and optional demand/stock values retained. Existing buyer-protection promise needs policy-owner confirmation; not expanded. |
| Wishlist / cart | Existing per-user contexts and product hydration | Existing saved/move/delete/customization behavior retained. Delivery fees unchanged. |
| Orders | Existing order and custom-request services | Existing status labels, summaries and details actions retained. Populated signed-in state not verified. |
| Settings / addresses / payment | Existing auth/preferences/notification and persistence-first CRUD | Existing payment-encryption claim needs service-owner confirmation; no fictitious new capabilities. |
| Messages | Existing conversations and dock | Existing identity, delete confirmations and rich-message behavior retained. Signed-in conversations not verified. |
| Artisan dashboard | Existing profile/products/optional aggregates and workflow panels | All tabs, finance/production/quality/verification actions and eligibility rules unchanged. Signed-in presentation not verified. |

No new product imagery, testimonials, discounts, policies or backend content was introduced. The requested page-by-page recording was not attached. Afrikrea-specific visual references remain missing.