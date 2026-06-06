# Investigation Summary

I traced all four issues to specific gaps. They're real bugs, not perception issues.

## 1. The "Thank you for your message…" auto‑reply

**Root cause:** `MessagingModal.tsx` (lines 180–201) is still running a leftover demo simulation:
- `setIsTyping(true)` then a `setTimeout` that pushes a fake provider message into local state.
- A second `setTimeout` flips the customer's message to `read: true` after 1 s, regardless of whether the artisan saw it.
- Messages are written to `localStorage` only — `sendMessage()` is never called against the backend.

That's why every customer sees the same canned reply 2.5 s after sending, and why ticks always go blue.

## 2. Sent messages don't appear on `/marketplace/messages`

Two compounding causes:
- Because we never POST to the backend, `/conversations` returns `[]` for this customer.
- `Messages.tsx` removed the localStorage fallback in the previous sprint, so an empty backend list now renders "No messages yet" even though the modal saved the thread locally.
- The reload effect only re-fires when `selectedProvider` changes (modal closes), which is fine — the real problem is that nothing was ever persisted server-side.

## 3. Artisan reviews don't show after submission

`ProviderDetail.tsx` has `const providerReviews: Review[] = []` hardcoded at module scope (line 25). The Reviews tab always renders that empty array. `artisanReviewsService.list()` exists but is never called, and the submit handler doesn't refresh anything.

## 4. Preferences don't visibly affect the marketplace

`Home.tsx` passes `category`, `styleTags`, `priceMax` to `productsService.list()` and sorts providers by preferred category. But:
- The backend `/products` endpoint currently ignores `styleTags` and `priceMax` query params, so the response is unchanged.
- There is no client-side filter applied as a fallback after the server response.
- There is no dedicated "Based on your preferences" section — the only signal is a small banner at the top, easy to miss.

---

# Plan

## Task 1 — Real messaging with proper read‑receipt ticks

In `src/components/marketplace/MessagingModal.tsx`:

1. Delete the simulated typing indicator timeout and the `autoReply` block (lines 180–201). No fake provider message, no fake read flip.
2. Rewrite `handleSendMessage` to:
   - Optimistically append the local message with `status: "sending"`.
   - If `conversationId` is null, call `messagingService.startConversation(providerId, content)` and store the returned `id`.
   - Otherwise call `messagingService.sendMessage(conversationId, content)`.
   - On success, replace the optimistic row with the server message (real `id`, `sentAt`, `readAt`). On failure, mark it `status: "failed"` and show a retry affordance.
3. Read‑receipt ticks (derived from server data only):
   - `status === "sending"` → clock icon.
   - Server message with `readAt == null` → single grey `Check`.
   - Server message with `readAt != null` → double blue `CheckCheck`.
   - The "double grey tick = delivered, blue = read" distinction requires a `deliveredAt` field that the backend does not currently expose. We will document this in `backendRequirements.md` and ship single‑grey/double‑blue for now (a true 3‑state tick is a backend follow‑up).
4. Keep the 5 s poll, which already imports `readAt` from the server, so ticks turn blue automatically once the artisan opens the thread.
5. Keep the localStorage cache as a draft/optimistic mirror only — server messages always win on merge.

**Online/offline dot:** The backend has no presence endpoint. I'll add a backend gap note rather than fake it; the modal will simply not render a presence dot until the API exists.

## Task 2 — Conversations list reflects sent messages

In `src/pages/marketplace/Messages.tsx`:

1. After fetching `/conversations`, merge in any locally cached conversation summaries (from the user-scoped `conversations_<userId>` key) that the backend hasn't returned yet, so a freshly sent message shows up immediately even if the backend write is still propagating.
2. Re-fetch when the page regains focus (`visibilitychange` listener) so closing the modal and returning shows the new thread.
3. Drop entries from the local cache once the backend returns the same `providerId`, so we don't double-render.

No backend change required — once Task 1 actually POSTs, `/conversations` will start returning real data and this merge becomes a thin fallback.

## Task 3 — Artisan reviews load + persist visibly

In `src/pages/marketplace/ProviderDetail.tsx`:

1. Remove the module-level `providerReviews` constant. Add `const [reviews, setReviews] = useState<Review[]>([])` plus `averageRating` / `totalReviews` derived from that array.
2. Add a `loadReviews(providerId)` helper that calls `artisanReviewsService.list(providerId)`, normalizes both `ArtisanReviewApi[]` and `PaginatedResponse<ArtisanReviewApi>` shapes, and maps each row to the `Review` shape `CustomerReviews` expects (id, authorName from `customer.name` if backend includes it — otherwise "Customer", rating, date, comment, verifiedPurchase from `orderId` presence, helpful=0).
3. Call `loadReviews` in the existing data‑load `useEffect`.
4. In the submit handler, after a successful `artisanReviewsService.submit(...)`:
   - Optimistically prepend the new review using the current user's name.
   - Then call `loadReviews` again to reconcile with the server's canonical row.
5. Pass the live `reviews`, `averageRating`, `totalReviews` into `<CustomerReviews />`.

## Task 4 — Preferences visibly shape the marketplace

In `src/pages/marketplace/Home.tsx`:

1. Apply preferences as a **client-side filter** on top of the API response, so behaviour is correct even when the backend ignores the query params:
   - Filter `allProducts` by `preferences.categories` (match against product.category) and `preferences.budget` (product min price ≤ budget) and `preferences.styles` (intersection with product.tags).
   - Filter/sort `allProviders` by `preferences.categories` first, then by rating.
2. Add a dedicated "Picked for you" section above "Recommended Artisans" that only renders when `hasPreferences` is true — shows the top 6 providers and top 8 products after the preference filter. This is the visible proof that preferences are being honored.
3. Make the existing preference banner more prominent (icon + "Showing X results matching your preferences" with the active chips).

In `backendRequirements.md`, document that `/products` and `/service-providers/public-info` should accept `category`, `styleTags`, `priceMax`, and `budget` query params so the client-side filter can eventually be removed.

---

# Technical notes

- All four tasks are frontend-only. No DB or migration work.
- The only new dependency on backend behaviour is what already exists: `POST /conversations`, `POST /conversations/:id/messages`, `GET /artisans/:id/reviews`, `POST /artisans/:id/reviews`. If any of these 500, the UI falls back to the optimistic local state and shows a toast.
- Backend gaps captured in `backendRequirements.md`:
  - Three-state read receipts need a `deliveredAt` field on messages.
  - Online/offline presence endpoint (`GET /users/:id/presence` or a WebSocket).
  - `/products` filter params: `styleTags`, `priceMax`, `budget`.
  - Artisan review response should include `customer.name` so we don't render "Customer" as the author.

# Files touched

- `src/components/marketplace/MessagingModal.tsx` — remove auto-reply, wire real send, derive ticks from server.
- `src/pages/marketplace/Messages.tsx` — merge local + server conversations, refresh on focus.
- `src/pages/marketplace/ProviderDetail.tsx` — load and refresh real reviews; optimistic insert.
- `src/pages/marketplace/Home.tsx` — client-side preference filter + "Picked for you" section + stronger banner.
- `backendRequirements.md` — document the four gaps above.
