

# Frontend Fixes + Backend Spec Generation

## Key Findings from Inspection

1. **FIX 4 (User profile update)** — The previous plan said "mostly correct." Reality: the `authService.updateProfile()` call **does exist and is wired** in Settings.tsx line 352. However, it sends ALL fields every time (name, email, phone), not just changed ones. This needs fixing to only send deltas.

2. **FIX 5 (Password update)** — The Security tab (lines 374-396) has 3 password inputs rendered but **completely unwired**: no React state, no API call. The "Update Password" button just fires a fake toast. This must be fully wired to `authService.changePassword()`.

3. **FIX 3 (Business profile update)** — `handleSaveProfile` in Dashboard.tsx (line 68-76) sends the entire `businessForm` object every time. Needs to diff against original and omit unchanged fields.

4. **Seed file gap** — The plan must explicitly use Prisma nested writes (`artisanProfile: { create: { products: { create: [...] } } }`) to guarantee correct foreign key relations, not raw `artisanId` strings.

---

## PART 1 — Frontend Changes

### File: `src/components/artisan/AddProductModal.tsx`
- Replace URL text input with `<input type="file" accept="image/jpeg,image/png,image/webp">`
- Add 5MB size validation with inline error
- Upload via new `artisanService.uploadProductImage(file)` → `POST /artisans/me/products/upload-image` (multipart)
- Show thumbnail previews with remove buttons, cap at 5 images
- Show upload progress state (spinning indicator per file)
- Relax validation: only name, description, category, priceMin, priceMax required
- Extract and display API error messages inline on submit failure

### File: `src/lib/apiServices.ts`
- Add `uploadProductImage` method using `FormData` + fetch/axios with `Content-Type: multipart/form-data`
- Ensure `MoeApiError` message extraction is used in all catch blocks

### File: `src/pages/marketplace/Settings.tsx`
- **Security tab (lines 374-396)**: Wire up password form with React state (`currentPassword`, `newPassword`, `confirmPassword`)
- Add show/hide eye icon toggle on each password input
- Client-side validation: block submit if `newPassword !== confirmPassword`, show inline error
- On submit: call `authService.changePassword({ currentPassword, newPassword })`
- Success toast on 200, inline error on failure
- Clear fields after success
- **Account tab (line 352)**: Diff current values against original user data, only send changed fields

### File: `src/pages/artisan/Dashboard.tsx`
- **handleSaveProfile (line 68)**: Compare `businessForm` against original `artisanProfile` values, only include fields that actually changed in the PATCH payload
- Extract and display API error message from catch block instead of generic toast

---

## PART 2 — Backend Spec Files (`/backend-spec/`)

13 files generated as complete, copy-paste-ready NestJS code:

| File | Content |
|------|---------|
| `prisma/schema-additions.prisma` | Product, ArtisanProfile, User model additions with comments |
| `src/products/dto/create-product.dto.ts` | class-validator DTO, optional fields marked |
| `src/artisans/dto/update-artisan-profile.dto.ts` | All fields `@IsOptional()` |
| `src/users/dto/update-user-profile.dto.ts` | All fields `@IsOptional()`, email has `@IsEmail()` |
| `src/auth/dto/change-password.dto.ts` | `@MinLength(8)` on newPassword |
| `src/products/products.controller.ts` | POST create + POST upload-image with FileInterceptor |
| `src/products/products.service.ts` | Prisma create + Multer disk storage to `/uploads/products/` |
| `src/artisans/artisans.controller.ts` | PATCH profile |
| `src/artisans/artisans.service.ts` | Partial update with `Object.fromEntries` filter |
| `src/auth/auth.controller.ts` | PATCH profile + POST change-password |
| `src/auth/auth.service.ts` | Profile update + bcrypt password flow |
| `prisma/seed.ts` | 5 artisans, 20 products using **nested writes**: `prisma.user.create({ data: { ..., artisanProfile: { create: { ..., products: { create: [...] } } } } })` |
| `MARKETPLACE_BACKEND_FIXES.md` | Step-by-step integration guide, env vars, testing checklist, common failure points |

### Seed file detail
Each of the 5 artisan users will be created with a single `prisma.user.create()` call using nested `artisanProfile.create` containing nested `products.create` array — this guarantees correct `userId` and `artisanId` foreign keys through Prisma's relation system, not raw ID strings.

---

## Files Summary

**Modified (4):**
- `src/components/artisan/AddProductModal.tsx`
- `src/lib/apiServices.ts`
- `src/pages/marketplace/Settings.tsx`
- `src/pages/artisan/Dashboard.tsx`

**Created (13):**
- All files under `backend-spec/`

