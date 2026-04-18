

# Plan v2 — Artisan Profile Display Fixes (with observations folded in)

## A. `src/lib/apiServices.ts` — normalize `providersService.getById`
Tolerate backend field aliases:
- `heroImage` ← `heroImage` ?? `storeImageUrl` ?? `images[0]` ?? `""`
- `about` ← `about` ?? `description` ?? `bio` ?? `""`
- `brandName` ← `brandName` ?? `businessName` ?? `name` ?? `""`
- `city`, `state`, `category` passthrough with `""` fallback

## B. `src/pages/marketplace/ProviderDetail.tsx`
- Add `onError` → `/placeholder.svg` on hero `<img>`.
- When `heroImage` is empty, skip rendering the `<img>` so the gradient shows cleanly (no broken icon).
- Empty-state in About: *"This artisan hasn't added a description yet."*

## C. `src/pages/artisan/Dashboard.tsx` — DEV-gated diagnostic
Add **once**, gated behind Vite dev flag so it never ships:
```ts
if (import.meta.env.DEV) {
  console.log("[MOE][dev-only] /artisans/me response:", profile);
}
```
Inline comment: *"DEV-only diagnostic — must stay gated. Do NOT remove the `import.meta.env.DEV` guard. Logs raw profile data including personal fields."*

## D. `backend_MoeV1.md` — two additions

**New Section 8 — Public Provider Endpoint field alignment** (🔴 badge)
Document required/aliased fields on `GET /service-providers/:id/public-info`:
`brandName`/`businessName`, `about`/`description`, `heroImage`/`storeImageUrl`.

**Missing `providerId` link — framed by user impact (not as footnote):**
> 🔴 **UX BLOCKER — high priority.** The `/artisans/me` response does not include the artisan's public `providerId`. **User-facing consequence:** an artisan cannot navigate from their own dashboard to their public profile page to verify how it looks to customers. They have no way to preview their own storefront. This is a significant UX gap and should be prioritised — add `providerId: string` to the `/artisans/me` response payload.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/apiServices.ts` | Field-alias normalization in `providersService.getById` |
| `src/pages/marketplace/ProviderDetail.tsx` | Image `onError` + empty-states |
| `src/pages/artisan/Dashboard.tsx` | DEV-gated diagnostic log with retention comment |
| `backend_MoeV1.md` | Section 8 + reframed `providerId` UX-blocker note |

No new dependencies. No backend changes required for A/B/C to take effect.

