import fs from 'fs';
import path from 'path';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import {
  API_BASE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  requireAdminCredentials,
} from './env';
import {
  SEED_PASSWORD,
  imagePath,
  seedArtisanEmail,
  taggedName,
  type SeedArtisan,
  type SeedProduct,
} from '../fixtures/seedArtisans';

export { API_BASE, ADMIN_EMAIL, ADMIN_PASSWORD };

export interface SeedResult {
  artisanIndex: number;
  email: string;
  userId?: number;
  artisanProfileId?: number;
  businessName: string;
  productIds: number[];
  productNames: string[];
  storeImageUrl?: string;
  coverImageUrl?: string;
  errors: string[];
}

async function readJson(res: APIResponse): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { raw: await res.text() };
  }
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function assertOk(res: APIResponse, label: string): Promise<any> {
  const body = await readJson(res);
  if (!res.ok()) {
    const msg =
      body?.message ||
      body?.error ||
      (typeof body === 'string' ? body : JSON.stringify(body));
    throw new Error(`${label} failed (${res.status()}): ${msg}`);
  }
  return body;
}

/** Register a brand-new artisan. Never logs into an existing account. */
export async function registerArtisan(
  request: APIRequestContext,
  artisan: SeedArtisan,
): Promise<{ token: string; refreshToken?: string; user?: any }> {
  const email = seedArtisanEmail(artisan.index);
  const name = `${artisan.firstName} ${artisan.lastName}`;

  const registerRes = await request.post(`${API_BASE}/auth/register`, {
    data: {
      name,
      email,
      password: SEED_PASSWORD,
      role: 'artisan',
      serviceCategories: artisan.serviceCategories,
      phone: `+23480${String(10000000 + artisan.index).slice(0, 8)}`,
    },
  });

  if (!registerRes.ok()) {
    const body = await readJson(registerRes);
    throw new Error(
      `Register ${email} failed (${registerRes.status()}): ${JSON.stringify(body)}. ` +
        `Refusing to sign in to an existing account (no overwrite).`,
    );
  }

  const body = await registerRes.json();
  if (!body.token) throw new Error(`Register ${email} returned no token`);
  return { token: body.token, refreshToken: body.refreshToken, user: body.user };
}

/** API admin login — prefer `signInAdminViaUi` for portal approval workflows. */
export async function loginAdmin(request: APIRequestContext): Promise<string> {
  requireAdminCredentials();
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body = await assertOk(res, 'Admin login');
  if (!body.token) throw new Error('Admin login returned no token');
  return body.token as string;
}

export async function uploadImage(
  request: APIRequestContext,
  token: string,
  endpoint: string,
  filename: string,
  fieldName = 'file',
): Promise<string> {
  const fullPath = imagePath(filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image not found: ${fullPath}`);
  }
  const buffer = fs.readFileSync(fullPath);
  const res = await request.post(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      [fieldName]: {
        name: path.basename(filename),
        mimeType: 'image/jpeg',
        buffer,
      },
    },
  });
  const body = await assertOk(res, `Upload ${filename} → ${endpoint}`);
  const url =
    body?.url ??
    body?.imageUrl ??
    body?.data?.url ??
    body?.data?.imageUrl ??
    body?.location ??
    body?.path;
  if (typeof url !== 'string' || !url) {
    throw new Error(`Upload ${filename} returned no URL: ${JSON.stringify(body)}`);
  }
  return url;
}

export async function updateArtisanProfile(
  request: APIRequestContext,
  token: string,
  artisan: SeedArtisan,
  urls: { storeImageUrl?: string; coverImageUrl?: string },
): Promise<any> {
  const businessName = taggedName(artisan.businessName);
  const res = await request.patch(`${API_BASE}/artisans/me`, {
    headers: authHeaders(token),
    data: {
      businessName,
      brandName: businessName,
      description: artisan.description,
      about: artisan.description,
      category: artisan.category,
      serviceCategories: artisan.serviceCategories,
      country: artisan.country,
      state: artisan.state,
      city: artisan.city,
      address: artisan.address,
      styleTags: artisan.styleTags,
      customOrdersEnabled: true,
      ...(urls.storeImageUrl
        ? { storeImageUrl: urls.storeImageUrl, heroImage: urls.storeImageUrl }
        : {}),
      ...(urls.coverImageUrl ? { coverImageUrl: urls.coverImageUrl } : {}),
    },
  });
  return assertOk(res, `PATCH profile ${businessName}`);
}

export async function createProduct(
  request: APIRequestContext,
  token: string,
  product: SeedProduct,
  imageUrl: string,
): Promise<{ id: number; name: string; status?: string }> {
  const name = taggedName(product.name);
  const res = await request.post(`${API_BASE}/artisans/me/products`, {
    headers: authHeaders(token),
    data: {
      name,
      description: product.description,
      category: product.category,
      currency: 'NGN',
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      materials: product.materials,
      estimatedDelivery: product.estimatedDelivery,
      tags: product.tags,
      images: [imageUrl],
      isNewArrival: true,
    },
  });
  const body = await assertOk(res, `Create product ${name}`);
  const id = body?.id ?? body?.data?.id;
  if (id == null) {
    throw new Error(`Product create missing id: ${JSON.stringify(body)}`);
  }
  return { id: Number(id), name: body.name ?? name, status: body.status };
}

export async function getMyProfile(
  request: APIRequestContext,
  token: string,
): Promise<any> {
  const res = await request.get(`${API_BASE}/artisans/me`, {
    headers: authHeaders(token),
  });
  return assertOk(res, 'GET /artisans/me');
}

export async function listMyProducts(
  request: APIRequestContext,
  token: string,
): Promise<any[]> {
  const res = await request.get(`${API_BASE}/artisans/me/products?pageSize=50`, {
    headers: authHeaders(token),
  });
  const body = await assertOk(res, 'GET /artisans/me/products');
  return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
}

export async function deleteMyProduct(
  request: APIRequestContext,
  token: string,
  productId: number,
): Promise<void> {
  const res = await request.delete(`${API_BASE}/artisans/me/products/${productId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok() && res.status() !== 404) {
    await assertOk(res, `DELETE product ${productId}`);
  }
}

export async function approveArtisan(
  request: APIRequestContext,
  adminToken: string,
  artisanProfileId: number,
): Promise<void> {
  const res = await request.patch(
    `${API_BASE}/admin/artisans/${artisanProfileId}/status`,
    {
      headers: authHeaders(adminToken),
      data: { status: 'approved' },
    },
  );
  await assertOk(res, `Approve artisan ${artisanProfileId}`);
}

export async function approveProduct(
  request: APIRequestContext,
  adminToken: string,
  productId: number,
): Promise<void> {
  const res = await request.patch(
    `${API_BASE}/admin/products/${productId}/status`,
    {
      headers: authHeaders(adminToken),
      data: { status: 'approved' },
    },
  );
  await assertOk(res, `Approve product ${productId}`);
}

/** Live API caps pageSize (~100). Walk pages until exhausted. */
async function listAllPages(
  request: APIRequestContext,
  path: string,
  label: string,
  pageSize = 100,
  maxPages = 20,
): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await request.get(
      `${API_BASE}${path}${sep}page=${page}&pageSize=${pageSize}`,
    );
    const body = await assertOk(res, `${label} page ${page}`);
    const chunk = Array.isArray(body?.data) ? body.data : [];
    all.push(...chunk);
    const totalPages = Number(body?.pagination?.totalPages) || 1;
    if (chunk.length === 0 || page >= totalPages) break;
  }
  return all;
}

export async function listPublicProviders(
  request: APIRequestContext,
  pageSize = 100,
): Promise<any[]> {
  return listAllPages(
    request,
    '/service-providers/public-info',
    'GET public providers',
    pageSize,
  );
}

export async function listPublicProducts(
  request: APIRequestContext,
  pageSize = 100,
): Promise<any[]> {
  return listAllPages(request, '/products', 'GET public products', pageSize);
}

/**
 * Create one artisan + 5 products via the same backend endpoints the Vercel
 * app uses after email/password sign-up (POST /auth/register → PATCH /artisans/me
 * → POST upload → POST /artisans/me/products). Does not touch existing users.
 */
export async function seedOneArtisan(
  request: APIRequestContext,
  artisan: SeedArtisan,
): Promise<SeedResult> {
  const businessName = taggedName(artisan.businessName);
  const result: SeedResult = {
    artisanIndex: artisan.index,
    email: seedArtisanEmail(artisan.index),
    businessName,
    productIds: [],
    productNames: [],
    errors: [],
  };

  const auth = await registerArtisan(request, artisan);
  result.userId = auth.user?.id;

  let storeImageUrl: string | undefined;
  let coverImageUrl: string | undefined;
  try {
    storeImageUrl = await uploadImage(
      request,
      auth.token,
      '/artisans/me/upload-image',
      artisan.profileImageFile,
    );
    result.storeImageUrl = storeImageUrl;
  } catch (e) {
    result.errors.push(`store image: ${(e as Error).message}`);
  }
  try {
    coverImageUrl = await uploadImage(
      request,
      auth.token,
      '/artisans/me/upload-cover',
      artisan.coverImageFile,
    );
    result.coverImageUrl = coverImageUrl;
  } catch (e) {
    try {
      coverImageUrl = await uploadImage(
        request,
        auth.token,
        '/artisans/me/upload-image',
        artisan.coverImageFile,
      );
      result.coverImageUrl = coverImageUrl;
    } catch (e2) {
      result.errors.push(`cover image: ${(e2 as Error).message}`);
    }
  }

  const profile = await updateArtisanProfile(request, auth.token, artisan, {
    storeImageUrl,
    coverImageUrl,
  });
  result.artisanProfileId = profile?.id ?? profile?.artisanProfileId;
  if (!result.artisanProfileId) {
    const me = await getMyProfile(request, auth.token);
    result.artisanProfileId = me?.id;
  }

  for (const product of artisan.products) {
    try {
      const imageUrl = await uploadImage(
        request,
        auth.token,
        '/artisans/me/products/upload-image',
        product.imageFile,
      );
      const created = await createProduct(request, auth.token, product, imageUrl);
      result.productIds.push(created.id);
      result.productNames.push(created.name);
    } catch (e) {
      result.errors.push(`product "${product.name}": ${(e as Error).message}`);
    }
  }

  return result;
}

/** Login as a seeded artisan (for cleanup / verification only). */
export async function loginSeedArtisan(
  request: APIRequestContext,
  index: number,
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: seedArtisanEmail(index), password: SEED_PASSWORD },
  });
  const body = await assertOk(res, `Login seed artisan ${index}`);
  return body.token as string;
}
