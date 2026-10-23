# Phase 3 Report — Custom orders, messaging, reviews, validation

**Date:** 2026-10-23  
**Requirements:** 13, 14, 15, 29, 30, 32, 33  
**Environment:** Local FE (`:8080`) + Nest (`:3000`) + `moe_dev`. No production mutations.  
**Payment/quote:** Proposal only — see `PHASE3_PAYMENT_QUOTE_PROPOSAL.md`.

---

## 1. Requirements

| Req | Audit | Root cause / fix | Verified |
|-----|--------|------------------|----------|
| **13** | Budget Min/Max fields are useful (stored + validated) — **kept**. Reference upload was a plain file input. | Dashed clickable upload zone, preview thumbs, clearer labels. | Playwright: image select + preview before submit |
| **14** | 403 for non-customer / ineligible artisan was correct but opaque; CTA could show when only `customOrdersEnabled`. | Clearer BE role message; FE maps 403; CTA requires `isCustomOrderEligible === true`. | API: short create OK; ineligible artisan returns clear message |
| **15** | Dashboard activity = messages only. | `GET /admin/reviews` + dashboard merge; link to artisan detail. | Playwright: seeded review visible on admin dashboard |
| **29** | No top-of-form guidance. | Guidance block + description help text. | Playwright: `custom-order-guidance` visible |
| **30** | Thread resolved only via full list → “Conversation not found”; no FAB. | `GET /conversations/:id`; MessageThread uses it; `FloatingMessagesButton` with unread badge. Admin deep link → `/admin/messages/:id`. | Playwright: open seeded conversation, FAB visible, send message |
| **32** | FE+BE min 50; no max 200. | Required non-empty, max 200 aligned FE/BE; counter copy updated. | API short OK; >200 rejected; unit tests updated |
| **33** | Customer could not see commissions; no quote/payment. | `listMine` + Orders Custom tab shows status + `artisanResponse`. Quote/payment **not** built — proposal doc. | Playwright: submitted request appears under Custom Orders |

---

## 2. Files changed

### Backend
- `src/custom-orders/dto/create-custom-order.dto.ts`
- `src/custom-orders/custom-orders.service.ts`
- `src/messaging/conversations.controller.ts` / `conversations.service.ts`
- `src/admin/admin.controller.ts` / `admin.service.ts`

### Frontend
- `src/lib/customOrderForm.ts`
- `src/components/marketplace/CustomOrderRequestModal.tsx`
- `src/components/marketplace/FloatingMessagesButton.tsx` (new)
- `src/pages/marketplace/MessageThread.tsx`
- `src/pages/marketplace/Orders.tsx`
- `src/pages/marketplace/ProviderDetail.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/App.tsx`
- `src/lib/apiServices.ts`
- `tests/custom-order-rules.test.ts`
- `tests/playwright/phase3-custom-messaging.spec.ts`

### Docs
- `PHASE3_PAYMENT_QUOTE_PROPOSAL.md`
- `PHASE3_REPORT.md`

**DB schema:** none.

---

## 3. Playwright (local)

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
PLAYWRIGHT_ADMIN_EMAIL=phase2.admin@local.test \
PLAYWRIGHT_ADMIN_PASSWORD=password123 \
PLAYWRIGHT_CUSTOMER_EMAIL=phase3.customer@local.test \
PLAYWRIGHT_CUSTOMER_PASSWORD=password123 \
PHASE3_ARTISAN_ID=16 PHASE3_CONVERSATION_ID=4 \
npx playwright test tests/playwright/phase3-custom-messaging.spec.ts --project=chromium --reporter=list
```

**Result:** 3 passed, 1 flaky (passed on retry) — overall green.

| Test | Outcome |
|------|---------|
| Description guidance / max 200 | Passed (retry) |
| Submit + reference image + Orders tab | Passed |
| Conversation + FAB + send | Passed |
| Admin dashboard reviews | Passed |

### Unit tests
`bun test tests/custom-order-rules.test.ts` → **8 pass, 0 fail** (no 50-char minimum, max 200 enforced).

### API smoke (local)
- `POST /custom-orders` description `"Short ok desc"` → **201 pending**
- Description 201 chars → validation error max 200
- Artisan 17 ineligible → clear Forbidden message
- `GET /conversations/4` → Phase3 Eligible Studio
- `GET /admin/reviews` → seeded review present

---

## 4. Limitations

| Item | Note |
|------|------|
| Quote / payment links | **Blocked** pending separate approval (`PHASE3_PAYMENT_QUOTE_PROPOSAL.md`) |
| Req 20 | Untouched |
| Production browser E2E | Not re-run with mutations (by design). Deploy FE/BE for customers to see Phase 3 UX. |
| Empty-conversation FAB path | Inbox empty-state for brand-new customer not separately automated this phase |
| Artisan cannot send chat messages | Existing BE rule preserved |

---

## 5. Stop — Phase 4 gate

Phase 3 complete. **Do not start Phase 4** until you explicitly approve it.

Optional next: approve payment/quote proposal, and/or deploy Phase 3 to VPS for read-only UI checks.
