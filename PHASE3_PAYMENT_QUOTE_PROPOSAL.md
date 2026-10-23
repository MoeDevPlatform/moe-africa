# Requirement 33 — Quote / payment link proposal (NOT IMPLEMENTED)

Phase 3 wired customer visibility of custom-order **status** and **artisanResponse** text via `GET /custom-orders/me` on My Orders → Custom Orders. Accept/decline + free-text response already exist.

## What exists today
- Artisan accept/decline with `artisanResponse` string
- Customer notifications → `/marketplace/orders?tab=custom`
- No quote amount, payment URL, or paid status on `CustomOrder`

## Proposed (needs separate approval)
1. Optional fields on `CustomOrder`: `quoteAmount`, `quoteCurrency`, `paymentLink`, `quoteSentAt`
2. Artisan/admin “Send quote” action that fills those fields and notifies the customer
3. Customer UI shows amount + “Pay” only when `paymentLink` is a validated URL from the artisan/admin
4. Do **not** auto-create catalogue checkout orders or mark paid without payment-provider confirmation

## Risk
Introduces payment expectations and possible phishing if free-text links are shown without validation. Prefer allowlisted payment domains or in-app checkout later.

**Awaiting your explicit approval before any schema or payment-link implementation.**
