## Verification documents — upload rules (backend enforcement needed)

Frontend now blocks pending/approved re-uploads and double-clicks, but the server must enforce the same rules:
- Add nullable columns `documentName String?`, `documentKey String?` (= `type`, or `other:<slug>` of the name), `replacesDocumentId Int?`, `supersededAt DateTime?` to `VerificationDocument`. Additive; no rows deleted.
- Accept `documentName` + `documentKey` multipart fields (whitelist them in the DTO); require `documentName` when `type=other`.
- `POST /artisans/verification/documents`: if the latest active doc for (artisan, documentKey) is `pending` or `approved` → 409. If `rejected` → create the new row as `pending`, set `supersededAt` on the old one (keep it; admins still see history).
- Duplicate root cause to check: one request must create exactly one row (check the controller isn't calling create twice / the interceptor isn't retrying). Wrap create in a unique partial index on (artisanId, documentKey) WHERE supersededAt IS NULL.
- `businessType: "individual" | "registered_business"` on the artisan profile (currently kept in the browser per user); CAC only applies to registered businesses.

