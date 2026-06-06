
# 8-Issue Bug Fix Plan (revised)

Scope: this repo is the **React frontend** + `backend-spec/` docs. Real NestJS lives elsewhere. For each issue I'll ship the React fix and append the exact NestJS contract to `backendRequirements.md`.

---

## Issue 1 — Sender can't see their own conversation [HIGHEST]

**Frontend:**
- `MessagingModal.tsx`: after `startConversation`/`sendMessage` resolves, write to the `conversations_<userId>` cache with a new shape: `{ providerId, providerName, lastMessage, lastMessageTime, createdBy: currentUserId, createdAt: nowIso, unread }`.
- `Messages.tsx` merge rule (made explicit, no over-aggression):
  - Take server list as source of truth.
  - Only re-add a local row if **all** of: `createdBy === currentUser.id` AND `Date.now() - createdAt < 30 min` AND `providerId` not in server list.
  - Drop local rows older than 30 min that the server still doesn't return — they're stale.
- Optimistic refetch: after send, call `listConversations()` once with a 1s delay to pick up the server row, then prune the matching local stub.

**Backend (`backendRequirements.md`):**
- `GET /conversations` returns rows where `customerId = currentUser.id OR artisanUserId = currentUser.id`.
- `POST /conversations` populates both participant FKs.

---

## Issue 2 — Single tick only; no delivered/read

**Frontend (`MessagingModal.tsx` / new `ChatThread.tsx`):**
- Extend `Message` with `deliveredAt`. Render: Clock (sending) → Check (sent) → CheckCheck muted (delivered) → CheckCheck primary (read).
- On open: call `messagingService.markConversationRead(conversationId)`. Existing 5s poll already refreshes `readAt` for the sender side.

**Backend (documented):**
- Migration: add `deliveredAt DateTime?`, `readAt DateTime?` to Message.
- `PATCH /conversations/:id/read` → marks all unread-for-current-user as read.
- Set `deliveredAt` server-side when recipient first fetches the message.

---

## Issue 3 — Notification links 404

**Frontend:**
- `NotificationContext.tsx`: when mapping API rows, if `link` matches `^/messages/(\d+)` rewrite to `/marketplace/messages/$1`.
- `NotificationCenter.tsx` click uses `useNavigate(link)`.
- **Mark as tech debt** with a `// TODO(backend): remove rewrite once notification links use /marketplace/messages/:id` comment, and add a "Tech debt" subsection in `backendRequirements.md` tracking removal.

**Backend (documented):**
- Notification rows of type `message` must include `conversationId` and emit `link = /marketplace/messages/:conversationId` directly.

---

## Issue 4 — Dedicated chat routes

**Frontend:**
- Add routes in `App.tsx`:
  - `/marketplace/messages/:conversationId` → new `MessageThread.tsx` page.
- **Conservative extraction**: create `ChatThread.tsx` by **copying** the body of `MessagingModal` (messages list + composer + send/upload handlers). Keep `MessagingModal` intact and unchanged for now (used by product-page CTAs). Do NOT refactor `MessagingModal` to consume `ChatThread` in the same pass — verify the new page works first; modal consolidation is a follow-up.
- Props for `ChatThread`: `{ providerId, providerName, conversationId? }` — same as modal, no behavior changes.
- `Messages.tsx` cards navigate to `/marketplace/messages/:conversationId` (fallback to `?providerId=` if conversationId unknown locally).

---

## Issue 5 — Artisan rating inconsistency

**Frontend:**
- Extend `normalizeProvider` in `apiServices.ts` to read `averageRating ?? rating` and `reviewCount ?? reviewsCount ?? numReviews ?? 0`.
- `ProviderCard.tsx`, `FeaturedArtisans.tsx`, `SearchResults.tsx`, `AllArtisans.tsx`: when `reviewCount === 0` render "No Reviews Yet" (no stars). When `>0` render filled stars + count. Remove the "New" label.

**Backend (documented — flagged as standardization request):**
- Standardize on `averageRating: number` and `reviewCount: number` in BOTH `GET /artisans` and `GET /artisans/:id`. Add a "Field naming — please standardize" note so the alias list in `normalizeProvider` can shrink later.

---

## Issue 6 — "undefined is added to cart"

**Frontend:**
- `DynamicCustomizationModal.tsx:106` — verify the toast template literal interpolates a defined variable; fallback to `productName ?? "Item"`. Audit the two sibling modals (`CustomizationFormModal`, `CanvasCustomizationModal`) — they already use `productName` correctly but apply the same `?? "Item"` guard.

---

## Issue 7 — Cart product images missing

**Frontend:**
- `CartContext.tsx`: add `imageUrl?: string` to `CartItem`.
- Populate `imageUrl` at add-time from product detail / customization modals (pass first image).
- `Cart.tsx`: `<img src={item.imageUrl || product?.images[0] || '/placeholder.svg'} onError={e => (e.currentTarget.src = '/placeholder.svg')} />` (matches project memory rule).

**Backend (documented):**
- Cart item API echoes `imageUrl`.

---

## Issue 8 — Checkout

**Part A — Validation (`Checkout.tsx`):**
- Convert to `react-hook-form` + `zod`: firstName, lastName, phone, address, country, state, city — all required, trimmed, max-length per security guideline.
- Inline `<FormMessage />` per field; "Place Order" disabled until `formState.isValid`.

**Part B — Saved cards:**
- **Pre-flight check**: `paymentMethodsService.list()` is confirmed exported in `src/lib/apiServices.ts` (line ~1416, `paymentMethodsService.list`) — wired against `GET /customers/me/payment-methods`. No stubbing needed.
- When `paymentMethod === 'card'`, fetch saved cards on mount, render as RadioGroup (brand + last4 + default badge). "Add New Card" option always visible below the list. Empty list → only "Add New Card".

**Backend (documented):** confirm `GET /customers/me/payment-methods` filters by `auth.user.id`.

---

## Files touched (frontend)
- `src/App.tsx`
- `src/components/marketplace/ChatThread.tsx` (new — copy of modal body)
- `src/pages/marketplace/MessageThread.tsx` (new)
- `src/components/marketplace/MessagingModal.tsx` — delivered/read ticks, mark-read on open (no extraction this pass)
- `src/pages/marketplace/Messages.tsx` — strict merge rule + navigate to thread route
- `src/contexts/NotificationContext.tsx` — link rewrite shim with TODO
- `src/components/marketplace/NotificationCenter.tsx` — router navigate
- `src/components/marketplace/ProviderCard.tsx`, `FeaturedArtisans.tsx`, `SearchResults.tsx`, `AllArtisans.tsx`
- `src/lib/apiServices.ts` — normalizeProvider rating aliases + `markConversationRead`
- `src/components/marketplace/DynamicCustomizationModal.tsx`
- `src/contexts/CartContext.tsx` — `imageUrl` field
- `src/pages/marketplace/ProductDetail.tsx` + customization modals — pass `imageUrl` on add
- `src/pages/marketplace/Cart.tsx`
- `src/pages/marketplace/Checkout.tsx`
- `backendRequirements.md` — contracts for Issues 1, 2, 3 (+ tech-debt note), 5 (+ field standardization), 7

## Out of scope
- WebSockets (poll-based for now).
- `MessagingModal` → `ChatThread` consolidation (follow-up).
- Removing the `/messages/:id` link-rewrite shim (follow-up after backend ships correct format).
