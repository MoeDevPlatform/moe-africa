# Phase 5 Report — Admin curation and artisan dashboard orders

**Date:** 2026-10-24  
**Requirements:** 6, 18, 19  
**Not in scope:** Requirement 33 payment/quotation workflow. No payment-link, quotation, or payment-processing work was added. Phase 6 was not started.

---

## 1. Audit and what changed

| Req | Finding | Change |
|-----|---------|--------|
| **6** Artisan name in curation pickers | Homepage sections (`featured_picks`, `featured_styles`, `seasonal_picks`) share `SectionDetail`. The browse list showed a price under the product name. Search results showed only the product name. Neither used the product’s artisan relationship, so identical names could not be told apart. | Public product list, product search, the admin product fallback, and the curated-item preview now include the artisan label from `provider.artisanProfile.brandName`, then business name, then the account name. The picker and the curated row show that label beside the product. Add, remove, reorder, and ranking are unchanged. |
| **18** Pending Orders card | The dashboard had Products, Rating, Total Orders, and Profile Views. `GET /artisans/me` had no pending count, and Total Orders stayed `—` because that aggregate is still not returned. | A Pending Orders card uses `pendingOrderCount` from `GET /artisans/me`. The count is orders for that artisan in the Pending view. The card links to `/artisan/dashboard?tab=orders&orderView=pending`. There is no separate artisan orders route; the orders screen is the dashboard Orders tab. |
| **19** Artisan order filters and status | `GET /orders` always filtered `customerId`, so an artisan saw none of the orders they fulfill. The panel called `PATCH /orders/:id`, which updates only the customer’s own order and skips transition checks. The panel’s next-status list (`in_progress`, `awaiting_payment`, `completed`) does not match the stored lifecycle. | Artisans now list orders where `providerId` is their user id. Customers still list only their own. Status changes from the artisan panel go to `PATCH /orders/:id/status`, which already rejects another artisan and illegal transitions. Filters are All, New Orders, Pending Orders, and Completed Orders. |

### Status mapping

Stored statuses were not renamed and none were added.

| Control | Stored statuses |
|---------|-----------------|
| New Orders | `pending` |
| Pending Orders | `pending`, `confirmed`, `in_progress`, `ready`, `shipped`, `approved` |
| Completed Orders | `delivered` |
| All | every order for that artisan, including `cancelled` and `rejected` |

New is the newly placed subset of Pending. The Pending card and the Pending filter use the same set, so a stored `pending` order is counted and shown when the card is opened. Confirming it removes it from New and leaves it in Pending. Delivering it moves it to Completed. `completed` and `awaiting_payment` are not stored by this lifecycle. Cancelled and rejected stay on All. No status values or legal transitions were added.

---

## 2. Files and APIs

### Backend

- `src/common/product-mapper.ts` — artisan display name
- `src/products/products.service.ts` — `artisanName` on the public list
- `src/search/search.service.ts` — `artisanName` on product search
- `src/admin/admin.service.ts` — `artisanName` on the admin product list; the existing `artisan` user-name column is unchanged
- `src/sections/sections.service.ts` — curated product preview includes `artisanName`
- `src/orders/artisan-order-views.ts` — view mapping
- `src/orders/orders.service.ts` — artisan list scoped by `providerId`; `view` query; summary counts
- `src/artisans/artisans.service.ts` — `pendingOrderCount` on `GET /artisans/me`

`PATCH /orders/:id` is still the customer update. `PATCH /orders/:id/status` remains the artisan and admin transition, with the existing ownership and transition checks.

### Frontend

- `src/pages/admin/SectionDetail.tsx`
- `src/pages/artisan/Dashboard.tsx`
- `src/components/artisan/ArtisanOrdersPanel.tsx`
- `src/lib/apiServices.ts`
- `src/data/mockData.ts`
- `tests/playwright/phase4-admin-order-filters.spec.ts`
- `tests/playwright/phase5-curation-orders.spec.ts`

---

## 3. Phase 4 filter tests

`tests/playwright/phase4-admin-order-filters.spec.ts` against `http://localhost:8080` and `http://localhost:3000`.

| Test | Result |
|------|--------|
| Admin orders: status, payment, search, and Clear | Passed |
| Admin custom orders: status and search | Passed after the assertion matched the data |

What the browser showed:

- `/admin/orders` loaded 4 orders. Pending returned 3 and hid ORD-002. Cancelled plus unpaid returned “No orders found.” Cancelled plus refunded returned only ORD-002. Search `Ankara` kept that row. Search `no-such-order-xyz` was empty. Clear restored 4 orders and emptied the search box.
- `/admin/custom-orders` loaded 3 pending requests. Accepted showed “No custom orders match these filters.” Search `Phase3` kept all 3 because the artisan name is Phase3 Eligible Studio. Search `silk wrap` kept only the Phase 3 description. Pending plus that search still showed that one row. Accepted plus that search was empty. Resetting both controls restored all 3.

The first custom-order run failed because the test treated `Phase3` as a description-only search. The filter was already matching artisan name as well. No product change was required for that failure.

---

## 4. Phase 5 Playwright

`tests/playwright/phase5-curation-orders.spec.ts`: **2 passed** in 55s. No production requests.

**Curation**

- On Best Sellers (`featured_picks`), Editor’s Recommendations (`featured_styles`), and Seasonal Picks (`seasonal_picks`), Ankara Midi Dress showed My Business and Emeka Dress showed Emeka Artisan.
- Search `Emeka Dress` returned product 25 with `artisanName: "Emeka Artisan"`.
- Add posted `{ itemType: "product", itemId: "25" }` to `featured_picks`. The curated row showed Emeka Dress and Emeka Artisan.
- Remove deleted that item. The section was empty again.

**Artisan orders**

- A local order was created through `POST /orders` as `phase3.customer@local.test` for product 72, owned by Phase2 Local Studio (user 14). It was created as `pending`. This is order **5**. It was left `confirmed` in `moe_dev`.
- Phase2 Local Studio’s Pending Orders card showed **0** while order 5 was still `pending`. That was the inconsistency corrected in the follow-up below.
- The card opened `/artisan/dashboard?tab=orders&orderView=pending`. The pending filter was active and, under the first mapping, the list was empty.
- New Orders showed “Phase2 API Variation Probe”, status pending, and count 1.
- The status control offered the legal next step. Choosing confirmed sent `PATCH /orders/5/status` with `{ status: "confirmed" }` and the response status was `confirmed`.
- After refresh, New Orders no longer listed it, the Pending card showed **1**, and Pending Orders showed the same order as confirmed.
- `phase3.artisan@local.test` received none of those orders (`summary.all` 0). `PATCH /orders/5/status` returned **403**. A fresh read by the owning artisan still returned `confirmed`.

---

## 5. Other checks

| Check | Result |
|-------|--------|
| Frontend `tsc --noEmit` | Pass |
| Backend `tsc --noEmit` | Pass |
| Jest `artisan-order-views.spec.ts` and `search.relevance.spec.ts` | 3 passed |

The local API was rebuilt and restarted on port 3000 so these requests hit the updated code. `moe_dev` was not reset or migrated.

---

## 6. Follow-up — Pending count includes newly placed orders

The first mapping treated Pending as only the later open statuses. A stored `pending` order incremented New Orders and left the Pending card at 0, so the card opened an empty list. That conflicted with Requirement 18: the dashboard has to make pending orders easy to find, and the stored status for a newly placed order is `pending`.

The labels were kept. The counts were aligned:

- **New Orders** remains the narrow view: status `pending` only.
- **Pending Orders**, the card, and `pendingOrderCount` now include that status plus `confirmed`, `in_progress`, `ready`, `shipped`, and `approved`.
- The card still opens `/artisan/dashboard?tab=orders&orderView=pending`.
- The filter hint states that newly placed orders also appear under Pending Orders.
- Transitions are unchanged. Another artisan still cannot list or update the order.

`tests/playwright/phase5-curation-orders.spec.ts` (pending-card test only) **passed** in 31.8s against localhost. Order **6** was created as `pending` for Phase2 Local Studio, which already had confirmed order 5. The card showed **2**. The pending filter was active and showed order 6 as pending. New Orders also showed it, with count 1. Confirming it sent `PATCH /orders/6/status` with `{ status: "confirmed" }`. After refresh, New Orders count was 0 and no longer listed it, the Pending card still showed **2**, and the pending filter showed order 6 as confirmed. `phase3.artisan@local.test` still received none of the orders, and `PATCH /orders/6/status` returned **403**. Order 6 remains `confirmed` in `moe_dev`.

Jest `artisan-order-views.spec.ts`: 2 passed. A `pending` row is counted in both New and Pending.

## 7. Unresolved

- Total Orders and Profile Views on the artisan dashboard still show `—`. `GET /artisans/me` does not return those aggregates. They were not part of this phase.
- The account that owns the older orders (user 1, ORD-001 through ORD-004) did not accept the local test password, so those rows were not used. Orders 5 and 6 are the local artisan-workflow rows. Both remain `confirmed`.
- Orders in `cancelled` or `rejected` are only in All. There is no fourth named filter for them.
- Featured Artisans is an artisan picker, not a product picker, so it does not show a product artisan line.
- Requirement 33 remains unapproved. Phase 6 has not been started.
