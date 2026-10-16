# Architecture rules

- Use the shared ImageThumbnail control for product gallery thumbnails; its overlay keeps selection and keyboard focus visible inside scroll-clipped bounds.
- Keep custom-order ranking in its dedicated discovery service; homepage curated sections must retain their own data sources.
- Normalize listing product previews centrally and render through ArtisanProductPreviews; previews never trigger per-card catalogue requests.
- Extend the existing custom-order modal through its compatibility export and shared form validation; structured requests must never silently fall back to a lossy legacy payload.
- Use AnimatedSection and RouteEntry for entry-only CSS motion and the common Skeleton variants for loading; respect reduced-motion preferences.
- Keep the dashboard redesign presentational: quick actions invoke existing controls, stats read optional profile aggregates, and product rows share a desktop-table/mobile-card layout.