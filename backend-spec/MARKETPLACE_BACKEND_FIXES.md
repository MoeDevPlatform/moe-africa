# Marketplace Backend Fixes — Integration Guide

This folder (/backend-spec/) contains ready-to-use NestJS + Prisma files for your backend repo. **These files do NOT run inside the React frontend project** — copy them into your NestJS backend.

---

## Step-by-Step Integration

### Step 1 — Prisma Schema

1. Open prisma/schema.prisma in your backend repo
2. Add the fields listed in backend-spec/prisma/schema-additions.prisma to your existing User model
3. Add the ArtisanProfile and Product models from that same file
4. Run:
   npx prisma migrate dev --name add_marketplace_models
   npx prisma generate

### Step 2 — Copy DTO Files

| Source (this folder) | Destination (backend repo) |
|---|---|
| src/products/dto/create-product.dto.ts | src/products/dto/create-product.dto.ts |
| src/artisans/dto/update-artisan-profile.dto.ts | src/artisans/dto/update-artisan-profile.dto.ts |
| src/users/dto/update-user-profile.dto.ts | src/users/dto/update-user-profile.dto.ts |
| src/auth/dto/change-password.dto.ts | src/auth/dto/change-password.dto.ts |

### Step 3 — Copy Controllers & Services

Products module (create new module if it doesn't exist):
- Copy src/products/products.controller.ts → src/products/products.controller.ts
- Copy src/products/products.service.ts → src/products/products.service.ts
- Create src/products/products.module.ts:
  import { Module } from '@nestjs/common';
  import { ProductsController } from './products.controller';
  import { ProductsService } from './products.service';
  import { PrismaModule } from '../prisma/prisma.module';

  @Module({
    imports: [PrismaModule],
    controllers: [ProductsController],
    providers: [ProductsService],
  })
  export class ProductsModule {}
- Add ProductsModule to AppModule imports

Artisans module (create new module if it doesn't exist):
- Copy src/artisans/artisans.controller.ts → src/artisans/artisans.controller.ts
- Copy src/artisans/artisans.service.ts → src/artisans/artisans.service.ts
- Create src/artisans/artisans.module.ts (same pattern as above)
- Add ArtisansModule to AppModule imports

Auth module (update existing):
- Open your existing auth.controller.ts and add the two methods from src/auth/auth.controller.ts
- Open your existing auth.service.ts and add the two methods from src/auth/auth.service.ts
- Make sure UpdateUserProfileDto and ChangePasswordDto are imported

### Step 4 — File Upload Setup

1. Install dependencies (if not already installed):
   npm install @nestjs/platform-express multer uuid
   npm install -D @types/multer @types/uuid

2. Create the upload directory:
   mkdir -p uploads/products

3. Serve static files. In app.module.ts, add:
   import { ServeStaticModule } from '@nestjs/serve-static';
   import { join } from 'path';

   @Module({
     imports: [
       ServeStaticModule.forRoot({
         rootPath: join(__dirname, '..', 'uploads'),
         serveRoot: '/uploads',
       }),
       // ... other modules
     ],
   })
   Install if needed: npm install @nestjs/serve-static

### Step 5 — Run the Seed

1. Copy backend-spec/prisma/seed.ts → prisma/seed.ts in your backend repo
2. Add to package.json:
   "prisma": {
     "seed": "ts-node prisma/seed.ts"
   }
3. Run:
   npx prisma db seed

### Step 6 — Environment Variables

Ensure these are set in your .env:

| Variable | Example | Required |
|---|---|---|
| DATABASE_URL | postgresql://user:pass@localhost:5432/moe_db | Yes |
| JWT_SECRET | your-secret-key-here | Yes |
| JWT_EXPIRES_IN | 15m | Yes |
| JWT_REFRESH_EXPIRES_IN | 7d | Yes |

### Step 7 — Testing Checklist

After integration, verify each endpoint:

- [ ] POST /artisans/me/products — Create a product (auth required)
- [ ] POST /artisans/me/products/upload-image — Upload an image file
- [ ] GET /artisans/me/products — List artisan's products
- [ ] DELETE /artisans/me/products/:id — Delete a product
- [ ] GET /artisans/me — Get artisan profile
- [ ] PATCH /artisans/me — Update artisan profile (partial)
- [ ] PATCH /auth/profile — Update user profile (partial)
- [ ] POST /auth/change-password — Change password
- [ ] Seeded data appears in marketplace (5 artisans, 20 products)

### Common Failure Points

1. "Cannot find module 'prisma/prisma.service'" — Your PrismaService might be at a different path. Update imports to match your project structure.

2. "User does not have artisan profile" — The product creation requires the user to have an ArtisanProfile record. Ensure your registration flow creates one for artisan users, or seed the data first.

3. "Column 'xxx' does not exist" — You forgot to run npx prisma migrate dev. The schema changes must be applied before the code can use them.

4. File upload returns 413 — Your reverse proxy (Nginx/Apache) has a body size limit. Add client_max_body_size 10M; to your Nginx config.

5. CORS errors on file upload — Multipart requests may trigger CORS preflight. Ensure your NestJS CORS config allows Content-Type: multipart/form-data from your frontend origin.

### Rollback

To undo the Prisma migration:
npx prisma migrate resolve --rolled-back add_marketplace_models
Then manually remove the model blocks from schema.prisma and run npx prisma generate.

---

## Files in This Folder

| File | Type | Purpose |
|---|---|---|
| prisma/schema-additions.prisma | Schema | Product, ArtisanProfile, User model additions |
| prisma/seed.ts | Seed | 5 artisans, 20 products with nested Prisma writes |
| src/products/dto/create-product.dto.ts | DTO | Product creation validation |
| src/products/products.controller.ts | Controller | Create product + upload image |
| src/products/products.service.ts | Service | Product CRUD with Prisma |
| src/artisans/dto/update-artisan-profile.dto.ts | DTO | Partial profile update |
| src/artisans/artisans.controller.ts | Controller | Get/update artisan profile |
| src/artisans/artisans.service.ts | Service | Profile read/update |
| src/users/dto/update-user-profile.dto.ts | DTO | User profile update |
| src/auth/dto/change-password.dto.ts | DTO | Password change validation |
| src/auth/auth.controller.ts | Controller | Profile update + password change |
| src/auth/auth.service.ts | Service | Profile update + bcrypt password |
