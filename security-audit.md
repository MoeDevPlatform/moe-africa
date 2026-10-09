# MOE Africa — Security Controls Audit

Last reviewed: 2026-10-09  
Scopes: Frontend (`moe-africa`) + Backend (`moe-backend` → https://moe-backend.duckdns.org)

---

## 1. Protected routes

| Area | Status | Notes |
|------|--------|-------|
| Admin portal (`/admin/*`) | **OK** | Wrapped in `ProtectedRoute` with `requiredRole="admin"`, redirect `/admin/login` |
| Artisan dashboard | **OK** | `ProtectedRoute` with `requiredRole="artisan"` |
| Customer cart/checkout/orders/messages/settings | **PARTIAL** | Routes exist without `ProtectedRoute`; API calls fail with 401 and client refresh/redirect handles session expiry. Prefer adding `ProtectedRoute` for UX consistency. |
| Admin login / public auth | **OK** | Public by design |

**Action:** Apply `ProtectedRoute` to `/marketplace/checkout`, `/marketplace/orders`, `/marketplace/messages`, `/marketplace/settings`, `/marketplace/wishlist` when unauthenticated access should soft-redirect to `/auth`.

---

## 2. Session expiry (JWT)

| Item | Current | Target |
|------|---------|--------|
| Access token TTL | ~8h (backend JWT config) | Keep 8h or shorten if product prefers |
| Refresh token | Stored in DB (`RefreshToken`), rotated on `/auth/refresh-token` | Confirm rotation issues new jti and revokes old |
| Client handling | `moeApi.ts` retries once on 401 via refresh | On refresh failure, clear tokens and redirect to `/auth` with toast |

**Action:** Verify `AUTH_TOKEN_EXPIRED` / 401 path clears both `moe_access_token` and `moe_refresh_token` and shows: “Your session has expired. Please sign in again.”

---

## 3. Refresh token rotation

| Check | Status |
|-------|--------|
| `POST /auth/refresh-token` | Exists |
| Rotates refresh token (new jti) | **Verify in `auth.service.refresh`** — expected to create new RefreshToken and revoke previous |
| Response shape | `{ token, refreshToken }` — matches frontend |

---

## 4. Inspect logout (token revocation)

| Check | Status |
|-------|--------|
| `POST /auth/logout` (JWT) | Calls `auth.logoutAll(userId)` — revokes refresh tokens (`revokedAt`) |
| Frontend clears storage | AuthContext logout must remove access + refresh keys |

**Action:** Confirm logout clears both localStorage keys and does not leave stale refresh tokens.

---

## 5. HTTPS

| Layer | Status |
|-------|--------|
| Frontend (Vercel) | HTTPS |
| Backend (Hetzner + Caddy / duckdns) | HTTPS via Caddy reverse proxy |

---

## 6. CORS

Configured in `moe-backend/src/main.ts`:

- `CORS_ORIGINS` env (comma-separated); if empty, `origin: true` (reflect request origin)
- `credentials: true`
- Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

**Recommendation:** In production set `CORS_ORIGINS` explicitly to:

```
https://moe-africa-mvp.vercel.app,https://moe-africa.com,https://www.moe-africa.com
```

(plus localhost for staging if needed). Avoid empty/`true` in production.

---

## 7. Input sanitization (Feature 15)

| Control | Status |
|---------|--------|
| Global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) | **OK** |
| Global trim pipe | **DONE** — `TrimStringsPipe` in `main.ts` |
| Strip HTML on free-text fields | **DONE** — free-text keys in TrimStringsPipe |
| `@IsEmail()` on auth DTOs | **OK** — login/register/forgot-password |
| Frontend trim-before-submit | **PARTIAL** — Auth, Contact, checkout trim; keep extending |

---

## 8. Rate limiting (Feature 16)

| Endpoint | Status | Target |
|----------|--------|--------|
| `POST /auth/login` | **DONE** | 5 / 60s via `@Throttle` |
| `POST /auth/register` | **DONE** | 5 / 60s |
| `POST /auth/forgot-password` | **DONE** | 3 / 5min |
| 429 body | **DONE** | `MoeThrottlerGuard` message |
| Frontend countdown | **DONE** | `useAuthRateLimitCooldown` |

`@nestjs/throttler` installed; `MoeThrottlerGuard` is the global APP_GUARD.

---

## 9. Password reset (Feature 3)

| Control | Status |
|---------|--------|
| Forgot-password always 200 (no email enumeration) | **DONE** |
| Reset token TTL 15 min | **DONE** — hashed token on User |
| HTTPS-only reset link to Vercel | **DONE** — `FRONTEND_URL` + `/auth/reset-password?token=` |

---

## 10. Summary of required follow-ups

1. Install and wire `@nestjs/throttler` on auth endpoints.  
2. Global string trim + HTML strip pipe.  
3. Harden CORS origins for production.  
4. Confirm refresh rotation + logout revocation end-to-end.  
5. Protect remaining customer authenticated routes in the router.  
6. Session-expired toast on failed refresh (verify all API paths).  

See also `backendRequirements.md` (Comprehensive Feature Sprint section) for endpoint contracts.
