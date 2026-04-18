

# Plan v2 — Final Frontend Hardening Pass (confirmed)

Acknowledged: text-only fallback depends on backend accepting `images: []` (or omitted). I'll send `images` as **optional** — omit the field entirely when empty rather than sending `[]` — to maximise compatibility with either DTO shape. Will be flagged in `backend_MoeV1.md` as a test-immediately item.

## 1. Wishlist
No frontend change. Documented as backend-broken in `backend_MoeV1.md`.

## 2. Add Product — Image Upload (`AddProductModal.tsx`)
- Re-enable multi-image picker (JPEG/PNG/WebP, 5MB each, max 5).
- Upload via `artisanService.uploadProductImage`.
- **Graceful upload failure**: catch errors, show inline per-file message *"Image upload is temporarily unavailable — the server is not ready yet."*
- **Text-only fallback**: if no images uploaded, omit `images` from payload entirely (do not send empty array). Submit succeeds even if upload endpoint is down.
- Flag in `backend_MoeV1.md`: *"Confirm `POST /artisans/me/products` accepts a payload with `images` omitted or empty — test immediately."*

## 3. Settings — Searchable Country/State Combobox
- Replace Country and State `<Select>` with shadcn `Command` + `Popover`.
- Searchable, scrollable (max-h-72), clear selected value.
- **On country change**: clear State value AND reset State combobox search input AND clear City.
- **On address save failure**: inline banner at top of form *"Unable to save address — please try again or contact support."* + toast.

## 4. Payment Form — Realistic UX (`Settings.tsx` PaymentModal)

Brand detection (apply in this order — specific before broad):
1. Amex (`34`, `37`)
2. Verve (`5061`, `6500`)
3. Mastercard (`51-55`, `2221-2720`)
4. Visa (`4`)
5. Discover (`6011`, `65`)

Length enforcement (before Luhn):
- Amex → exactly **15** digits
- Visa/Mastercard/Verve/Discover → exactly **16** digits
- Other → inline *"Card number must be 15 (Amex) or 16 digits."*

Then Luhn → reject invalid with *"Invalid card number."*

Other fields:
- Expiry MM/YY, reject past *"Card has expired."*
- CVV: 4 Amex / 3 others, masked.
- Cardholder: required, `/^[A-Za-z\s'-]+$/`.
- Submit disabled until valid.
- Masking preserved (focus = digits, blur = `•••• •••• •••• 1234`).
- POST only safe fields: `brand`, `last4`, `expiry`, `cardholderName`, `billingAddressId`.

## 5. `backend_MoeV1.md` — Top-of-section 🔴 status badges
Each broken endpoint section starts with:
```
🔴 STILL BROKEN — confirmed not implemented
```
Sections flagged:
- Wishlist GET/POST/DELETE — not persisting
- `POST /artisans/me/upload-image` — returns "Cannot POST"
- `POST /customers/me/payment-methods` — returns "Cannot POST"
- Address — frontend uses correct plural; backend may have singular route bug
- **NEW**: Product DTO — confirm `images` is optional (test text-only submission)

## Files Changed

| File | Action |
|------|--------|
| `src/components/artisan/AddProductModal.tsx` | Re-enable image upload; graceful failure; omit `images` when empty |
| `src/pages/marketplace/Settings.tsx` | Searchable Country/State combobox; inline save error; brand-ordered Luhn payment form |
| `backend_MoeV1.md` | 🔴 top-of-section badges + product DTO `images` optional check |

No new dependencies.

