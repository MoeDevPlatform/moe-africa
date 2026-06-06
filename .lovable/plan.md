# Follow-up fixes from review

Two leftover issues from the previous sprint plan. Everything else from the review checks out in code.

## Task A — Recover from existing-conversation conflict

**File:** `src/components/marketplace/MessagingModal.tsx` (inside `handleSendMessage`)

Today, if `messagingService.startConversation(providerId, content)` throws (which the backend does when a conversation already exists — typically 409, sometimes 400), the optimistic message flips to `status: "failed"`. The user then has to retry, but every retry hits the same conflict.

Change:

1. Wrap the `startConversation` call in its own try/catch.
2. On any error, fall back to `messagingService.listConversations()`, find the row whose `providerId` matches, adopt its `id` into `conversationId`, then call `messagingService.sendMessage(adoptedId, content)`.
3. Only mark the row `"failed"` if both the start and the recovery `sendMessage` throw.
4. If recovery succeeds, treat it as a normal success path (same optimistic-row replacement logic by `localId`).

This keeps a single retry behaviour and never strands the user on a permanent "failed" tick when the conversation is just already there.

## Task B — Reviewer name fallback should be "Anonymous" + escalate gap

**File:** `src/pages/marketplace/ProviderDetail.tsx`

In `mapReview`, change the `authorName` fallback from `"Customer"` to `"Anonymous"`. The "Customer" label looks like a stub bug to real users; "Anonymous" reads as an intentional privacy choice.

**File:** `backendRequirements.md`

Upgrade the existing "Artisan reviews — include reviewer name" entry from `⚠️ NEEDS VERIFICATION` to `🔴 REQUIRED`, with a one-line user-facing consequence: "Until the customer name is returned on `GET /artisans/:id/reviews`, every review shows the author as 'Anonymous' which hurts review credibility."

## Files touched

- `src/components/marketplace/MessagingModal.tsx`
- `src/pages/marketplace/ProviderDetail.tsx`
- `backendRequirements.md`

No backend work, no new endpoints, no schema changes.
