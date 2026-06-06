# Follow-up fixes from review

Two leftover issues from the previous sprint plan. Everything else from the review checks out in code.

## Task A — Recover from existing-conversation conflict

**File:** `src/components/marketplace/MessagingModal.tsx` (inside `handleSendMessage`)

Today, if `messagingService.startConversation(providerId, content)` throws, the optimistic message flips to `status: "failed"`. The user then has to retry, but every retry hits the same error.

Note: a duplicate conversation should not normally return 409 — `startConversation` is documented as idempotent. Recovery here is defensive cover for edge cases (transient 5xx, response-shape drift, race between two tabs creating the same thread, etc.), not a fix for an expected conflict path.

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

Keep the "Artisan reviews — include reviewer name" entry as a frontend mapping gap (⚠️), not 🔴 REQUIRED. The typed DTO drops the customer object, so we don't actually know live responses lack a name field. Action: capture a real `GET /artisans/:id/reviews` payload first; only escalate to REQUIRED if no name-shaped field is present.

## Files touched

- `src/components/marketplace/MessagingModal.tsx`
- `src/pages/marketplace/ProviderDetail.tsx`
- `backendRequirements.md`

No backend work, no new endpoints, no schema changes.
