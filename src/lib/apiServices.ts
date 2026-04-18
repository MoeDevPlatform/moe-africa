/**
 * API Service Layer — wraps moeApi.ts with typed endpoints
 * matching the API Documentation Addendum.
 *
 * Every function gracefully falls back to mock data when the
 * backend is unreachable, so the frontend works offline.
 */

import { apiGet, apiPost, apiPatch, apiDelete, MoeApiError } from "./moeApi";
import {
  Product,
  Provider,
  products as mockProducts,
  providers as mockProviders,
  getProductById as mockGetProductById,
  getProviderById as mockGetProviderById,
  getProductsByProviderId as mockGetProductsByProviderId,
  getProvidersByCategory as mockGetProvidersByCategory,
} from "@/data/mockData";

// ─── Pagination ───────────────────────────────────────────
export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ─── Auth ─────────────────────────────────────────────────

export type UserRole = "customer" | "artisan" | "admin";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: CustomerProfile;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

// Mock auth fallback for offline/dev use
const mockAuthFallback = (
  name: string,
  email: string,
  role: UserRole = "customer",
): AuthResponse => ({
  token: "mock_access_token_" + Date.now(),
  refreshToken: "mock_refresh_token_" + Date.now(),
  user: {
    id: Date.now(),
    username: email.split("@")[0],
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  },
});

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return await apiPost<AuthResponse>("/auth/login", data);
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      return await apiPost<AuthResponse>("/auth/register", data);
    } catch {
      console.warn("[MOE] Backend unreachable — using mock register");
      return mockAuthFallback(data.name, data.email, data.role);
    }
  },
  logout: () => apiPost<void>("/auth/logout"),
  getProfile: () => apiGet<CustomerProfile>("/auth/profile"),
  updateProfile: (
    data: Partial<
      Pick<CustomerProfile, "name" | "email" | "phone" | "avatarUrl">
    >,
  ) => apiPatch<CustomerProfile>("/auth/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiPost<void>("/auth/change-password", data),
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const base = (import.meta.env?.VITE_API_BASE_URL ??
      import.meta.env?.VITE_MOE_API_BASE_URL ??
      "http://localhost:3000") as string;
    const token = localStorage.getItem("moe_access_token");
    const res = await fetch(`${base}/auth/profile/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new MoeApiError("Upload failed", res.status);
    return (await res.json()) as { avatarUrl: string };
  },
};

// ─── Artisan Profile ──────────────────────────────────────

export interface ArtisanProfile {
  id: number;
  userId: number;
  businessName: string;
  description: string;
  category: string;
  // Structured location (preferred). `location` kept for backward-compat reads only.
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  location?: string;
  storeImageUrl?: string;
  coverImageUrl?: string;
  images: string[];
  rating: number;
  verified: boolean;
  featured: boolean;
  createdAt: string;
}

async function uploadFileWithAuth(path: string, file: File): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);
  const base = (import.meta.env?.VITE_API_BASE_URL ??
    import.meta.env?.VITE_MOE_API_BASE_URL ??
    "http://localhost:3000") as string;
  const token = localStorage.getItem("moe_access_token");
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
}

export const artisanService = {
  getMyProfile: async (): Promise<ArtisanProfile> => {
    const p = await apiGet<ArtisanProfile>("/artisans/me");
    // Restore locally-stashed coverImageUrl if the backend doesn't return it yet
    if (p && !p.coverImageUrl) {
      const stashed = localStorage.getItem("moe_artisan_cover_url");
      if (stashed) p.coverImageUrl = stashed;
    }
    // Stash own userId so normalizeProvider can recognize the artisan
    // viewing their own public storefront and hydrate cover/store from cache.
    if (p?.userId != null) {
      localStorage.setItem("moe_self_user_id", String(p.userId));
    }
    return p;
  },
  updateProfile: async (
    data: Partial<ArtisanProfile> & Record<string, unknown>,
  ): Promise<ArtisanProfile> => {
    // Some backend DTOs reject unknown properties (whitelist). If `coverImageUrl`
    // isn't supported yet, stash it client-side and retry without it so the
    // rest of the profile still saves and the UI keeps showing the uploaded cover.
    try {
      return await apiPatch<ArtisanProfile>("/artisans/me", data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const rejectedCover =
        "coverImageUrl" in data &&
        /coverImageUrl/i.test(msg) &&
        /should not exist|not allowed|whitelist|unexpected/i.test(msg);
      if (!rejectedCover) throw err;

      const cover = data.coverImageUrl as string | undefined;
      if (typeof cover === "string" && cover) {
        localStorage.setItem("moe_artisan_cover_url", cover);
      }
      const { coverImageUrl: _omit, ...rest } = data;
      const result = await apiPatch<ArtisanProfile>("/artisans/me", rest);
      if (result && cover) result.coverImageUrl = cover;
      return result;
    }
  },
  getMyProducts: (page = 1, pageSize = 20) =>
    apiGet<PaginatedResponse<Product>>("/artisans/me/products", {
      page,
      pageSize,
    }),
  createProduct: (data: Record<string, unknown>) =>
    apiPost<Product>("/artisans/me/products", data),
  updateProduct: (id: number, data: Record<string, unknown>) =>
    apiPatch<Product>(`/artisans/me/products/${id}`, data),
  deleteProduct: (id: number) => apiDelete(`/artisans/me/products/${id}`),
  uploadProductImage: async (file: File): Promise<{ url: string }> => {
    const res = await uploadFileWithAuth("/artisans/me/products/upload-image", file);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new MoeApiError(body.message || "Image upload failed", res.status);
    }
    const body = await res.json().catch(() => ({}));
    const url = body?.url ?? body?.imageUrl ?? body?.data?.url ?? body?.data?.imageUrl ?? body?.location ?? body?.path;
    if (typeof url !== "string" || !url) {
      throw new MoeApiError("Image upload returned no URL", 500);
    }
    return { url };
  },
  uploadStoreImage: async (file: File): Promise<{ url: string }> => {
    const res = await uploadFileWithAuth("/artisans/me/upload-image", file);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new MoeApiError(body.message || "Store image upload failed", res.status);
    }
    const body = await res.json().catch(() => ({}));
    const url = body?.url ?? body?.imageUrl ?? body?.data?.url ?? body?.data?.imageUrl ?? body?.location ?? body?.path;
    if (typeof url !== "string" || !url) {
      throw new MoeApiError("Store image upload returned no URL", 500);
    }
    return { url };
  },
  uploadCoverImage: async (file: File): Promise<{ url: string }> => {
    // Try a dedicated cover endpoint first; fall back to the generic store image endpoint
    // if the backend hasn't shipped it yet. Either way we get a public URL we can persist
    // as `coverImageUrl` via PATCH /artisans/me.
    let res = await uploadFileWithAuth("/artisans/me/upload-cover", file);
    if (res.status === 404 || res.status === 405) {
      res = await uploadFileWithAuth("/artisans/me/upload-image", file);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new MoeApiError(body.message || "Cover image upload failed", res.status);
    }
    const body = await res.json().catch(() => ({}));
    const url = body?.url ?? body?.imageUrl ?? body?.data?.url ?? body?.data?.imageUrl ?? body?.location ?? body?.path;
    if (typeof url !== "string" || !url) {
      throw new MoeApiError("Cover image upload returned no URL", 500);
    }
    return { url };
  },
};

// ─── Customer Profile ─────────────────────────────────────

export interface CustomerProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  artisanProfile?: ArtisanProfile;
  preferences?: UserPreference;
  createdAt: string;
}

// ─── Preferences ──────────────────────────────────────────

export interface UserPreference {
  id: number;
  userId: number;
  categories: string[];
  styleTags: string[];
  budget: number;
  updatedAt: string;
}

export const preferencesService = {
  get: () => apiGet<UserPreference>("/customers/me/preferences"),
  update: (data: {
    categories: string[];
    styleTags: string[];
    budget: number;
  }) => apiPost<UserPreference>("/customers/me/preferences", data),
  clear: () => apiDelete("/customers/me/preferences"),
};

// ─── Products ─────────────────────────────────────────────

export interface ProductFilters {
  serviceCategoryId?: number;
  productCategoryId?: number;
  category?: string;
  subcategory?: string;
  priceMin?: number;
  priceMax?: number;
  materials?: string;
  styleTags?: string;
  maxDeliveryDays?: number;
  state?: string;
  featured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface FilterMetadata {
  priceMin: number;
  priceMax: number;
  availableMaterials: string[];
  availableStyleTags: string[];
  availableStates: string[];
  maxDeliveryDays: number;
}

export interface ProductsResponse {
  data: Product[];
  pagination: Pagination;
  filterMeta?: FilterMetadata;
}

async function fallbackProducts(
  filters?: ProductFilters,
): Promise<ProductsResponse> {
  let filtered = [...mockProducts];

  if (filters?.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }
  if (filters?.featured) {
    filtered = filtered.filter((p) => {
      const prov = mockGetProviderById(p.providerId);
      return prov?.featured;
    });
  }
  if (filters?.priceMin !== undefined) {
    filtered = filtered.filter(
      (p) => p.priceRange.max >= (filters.priceMin ?? 0),
    );
  }
  if (filters?.priceMax !== undefined) {
    filtered = filtered.filter(
      (p) => p.priceRange.min <= (filters.priceMax ?? Infinity),
    );
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return {
    data: filtered,
    pagination: {
      page: 1,
      pageSize: filtered.length,
      totalPages: 1,
      totalItems: filtered.length,
    },
  };
}

export const productsService = {
  list: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    try {
      return await apiGet<ProductsResponse>(
        "/products",
        filters as Record<string, unknown>,
      );
    } catch {
      return fallbackProducts(filters);
    }
  },

  getById: async (id: number): Promise<Product | undefined> => {
    try {
      return await apiGet<Product>(`/products/${id}`);
    } catch {
      return mockGetProductById(id);
    }
  },

  getByProvider: async (providerId: number): Promise<Product[]> => {
    try {
      const res = await apiGet<ProductsResponse>(
        `/service-providers/${providerId}/products`,
      );
      return res.data;
    } catch {
      return mockGetProductsByProviderId(providerId);
    }
  },

  getRecommendations: async (params?: {
    categories?: string;
    styleTags?: string;
    budget?: number;
  }): Promise<ProductsResponse> => {
    try {
      return await apiGet<ProductsResponse>(
        "/products/recommendations",
        params as Record<string, unknown>,
      );
    } catch {
      return fallbackProducts();
    }
  },
};

// ─── Providers ────────────────────────────────────────────

export interface ProviderFilters {
  category?: string;
  state?: string;
  styleTags?: string;
  featured?: boolean;
  minRating?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface ProvidersResponse {
  data: Provider[];
  pagination: Pagination;
}

async function fallbackProviders(
  filters?: ProviderFilters,
): Promise<ProvidersResponse> {
  let filtered = [...mockProviders];
  if (filters?.category) {
    filtered = mockGetProvidersByCategory(filters.category);
  }
  if (filters?.featured) {
    filtered = filtered.filter((p) => p.featured);
  }
  return {
    data: filtered,
    pagination: {
      page: 1,
      pageSize: filtered.length,
      totalPages: 1,
      totalItems: filtered.length,
    },
  };
}

// Normalize backend field aliases on a single provider record.
// Backend may return businessName/description/storeImageUrl instead of
// the canonical brandName/about/heroImage. Keep all tolerance here so
// every consumer (cards, lists, detail page) renders consistently.
//
// Self-view fallback: if this record belongs to the currently signed-in
// artisan AND the backend hasn't returned cover/store image yet, hydrate
// from the locally-stashed values so the artisan can at least preview
// their own storefront. Other visitors require the backend to actually
// return these fields (see backend_MoeV1.md).
const getSelfArtisanFallback = (raw: Record<string, any>) => {
  try {
    const rawUser = localStorage.getItem("moe_user");
    if (!rawUser) return null;
    const me = JSON.parse(rawUser) as { id?: number | string };
    const rawUserId = raw.userId ?? raw.user?.id;
    if (me?.id == null || rawUserId == null) return null;
    if (String(me.id) !== String(rawUserId)) return null;
    return {
      coverImageUrl: localStorage.getItem("moe_artisan_cover_url") || "",
      storeImageUrl: localStorage.getItem("moe_artisan_store_url") || "",
    };
  } catch {
    return null;
  }
};

const normalizeProvider = (raw: Record<string, any>): Provider => {
  const selfFallback = getSelfArtisanFallback(raw);
  return {
    ...(raw as Provider),
    brandName: raw.brandName ?? raw.businessName ?? raw.name ?? "",
    about: raw.about ?? raw.description ?? raw.bio ?? "",
    heroImage:
      raw.coverImageUrl ??
      raw.heroImage ??
      raw.storeImageUrl ??
      (Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : "") ??
      selfFallback?.coverImageUrl ??
      selfFallback?.storeImageUrl ??
      "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    category: raw.category ?? "",
    styleTags: Array.isArray(raw.styleTags) ? raw.styleTags : [],
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 0,
  };
};

export const providersService = {
  list: async (filters?: ProviderFilters): Promise<ProvidersResponse> => {
    try {
      const res = await apiGet<{ data: Record<string, any>[]; pagination: Pagination }>(
        "/service-providers/public-info",
        filters as Record<string, unknown>,
      );
      return {
        data: Array.isArray(res?.data) ? res.data.map(normalizeProvider) : [],
        pagination: res?.pagination ?? { page: 1, pageSize: 0, totalPages: 1, totalItems: 0 },
      };
    } catch {
      return fallbackProviders(filters);
    }
  },

  getById: async (id: number): Promise<Provider | undefined> => {
    try {
      const raw = await apiGet<Record<string, any>>(`/service-providers/${id}/public-info`);
      if (!raw) return mockGetProviderById(id);
      return normalizeProvider(raw);
    } catch {
      return mockGetProviderById(id);
    }
  },

  getByCategory: async (category: string): Promise<Provider[]> => {
    try {
      const res = await apiGet<{ data: Record<string, any>[] }>(
        "/service-providers/public-info",
        { category },
      );
      return Array.isArray(res?.data) ? res.data.map(normalizeProvider) : [];
    } catch {
      return mockGetProvidersByCategory(category);
    }
  },

  getRecommendations: async (params?: {
    categories?: string;
    styleTags?: string;
    budget?: number;
  }): Promise<ProvidersResponse> => {
    try {
      const res = await apiGet<{ data: Record<string, any>[]; pagination: Pagination }>(
        "/service-providers/recommendations",
        params as Record<string, unknown>,
      );
      return {
        data: Array.isArray(res?.data) ? res.data.map(normalizeProvider) : [],
        pagination: res?.pagination ?? { page: 1, pageSize: 0, totalPages: 1, totalItems: 0 },
      };
    } catch {
      return fallbackProviders();
    }
  },
};

// ─── Reviews ──────────────────────────────────────────────

export interface Review {
  id: number;
  providerId: number;
  customerId: number;
  orderId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const reviewsService = {
  getByProvider: async (
    providerId: number,
  ): Promise<PaginatedResponse<Review>> => {
    try {
      return await apiGet<PaginatedResponse<Review>>(
        `/service-providers/${providerId}/reviews`,
      );
    } catch {
      return {
        data: [],
        pagination: { page: 1, pageSize: 0, totalPages: 0, totalItems: 0 },
      };
    }
  },
  create: (
    providerId: number,
    data: { rating: number; comment: string; orderId?: string },
  ) => apiPost<Review>(`/service-providers/${providerId}/reviews`, data),
};

// ─── Orders ───────────────────────────────────────────────

export interface OrderItem {
  productId: number;
  customizationId?: number;
  quantity: number;
  finalPrice: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface Order {
  id: string;
  customerId: number;
  productId: number;
  productName: string;
  productImage: string;
  providerId: number;
  providerName: string;
  customizationId?: number;
  isCustomOrder: boolean;
  status:
    | "pending"
    | "awaiting_payment"
    | "in_progress"
    | "completed"
    | "cancelled";
  price: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paymentMethod:
    | "paystack"
    | "flutterwave"
    | "bank_transfer"
    | "pay_on_delivery";
  paymentReference?: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerId?: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod:
    | "paystack"
    | "flutterwave"
    | "bank_transfer"
    | "pay_on_delivery";
  currency: string;
}

/**
 * Service-layer mapper: normalises any backend Order shape mismatch into our
 * canonical `Order` interface. Keep all defensive normalisation here so UI
 * components never have to.
 *
 * Known/expected backend shape variations (logged in backend_MoeV1.md):
 *   - `productName` may arrive as `product.name`
 *   - `providerName` may arrive as `provider.name` or `provider.businessName`
 *   - `productImage` may arrive as `product.images[0]`
 *   - `price` may arrive as `totalAmount` or `finalPrice`
 */
function normalizeOrder(raw: Record<string, unknown>): Order {
  const r = raw as Record<string, unknown> & {
    product?: { name?: string; images?: string[] };
    provider?: { name?: string; businessName?: string };
  };
  return {
    id: String(r.id ?? ""),
    customerId: Number(r.customerId ?? 0),
    productId: Number(r.productId ?? 0),
    productName: (r.productName as string) ?? r.product?.name ?? "Unknown product",
    productImage:
      (r.productImage as string) ?? r.product?.images?.[0] ?? "/placeholder.svg",
    providerId: Number(r.providerId ?? 0),
    providerName:
      (r.providerName as string) ??
      r.provider?.name ??
      r.provider?.businessName ??
      "Unknown artisan",
    customizationId: r.customizationId as number | undefined,
    isCustomOrder: Boolean(r.isCustomOrder ?? false),
    status: (r.status as Order["status"]) ?? "pending",
    price: Number(r.price ?? r.totalAmount ?? r.finalPrice ?? 0),
    currency: (r.currency as string) ?? "NGN",
    shippingAddress: (r.shippingAddress as ShippingAddress) ?? {
      firstName: "", lastName: "", phone: "",
      addressLine1: "", city: "", state: "", country: "",
    },
    paymentMethod: (r.paymentMethod as Order["paymentMethod"]) ?? "bank_transfer",
    paymentReference: r.paymentReference as string | undefined,
    paymentStatus: (r.paymentStatus as Order["paymentStatus"]) ?? "unpaid",
    createdAt: (r.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (r.updatedAt as string) ?? new Date().toISOString(),
  };
}

export const ordersService = {
  list: async (params?: {
    status?: string;
    isCustomOrder?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const res = await apiGet<PaginatedResponse<Record<string, unknown>>>(
      "/orders",
      params as Record<string, unknown>,
    );
    return {
      ...res,
      data: (res.data ?? []).map(normalizeOrder),
    };
  },
  getById: async (id: string): Promise<Order> => {
    const raw = await apiGet<Record<string, unknown>>(`/orders/${id}`);
    return normalizeOrder(raw);
  },
  create: async (data: CreateOrderRequest) => {
    return apiPost<Order>("/orders", data);
  },
  update: async (
    id: string,
    data: {
      status?: string;
      paymentStatus?: string;
      paymentReference?: string;
    },
  ) => {
    return apiPatch<Order>(`/orders/${id}`, data);
  },
};

// ─── Customization Orders ─────────────────────────────────

export interface CreateCustomizationRequest {
  productId: number;
  customerId?: number;
  selectedVariants: Record<string, string>;
  selectedSize: string;
  selectedBodyType?: string;
  selectedFootType?: string;
  measurements: Record<string, string>;
  notes?: string;
  rushOrder: boolean;
}

export interface CustomizationOrder {
  id: number;
  productId: number;
  customerId: number;
  selectedVariants: Record<string, string>;
  selectedSize: string;
  selectedBodyType?: string;
  selectedFootType?: string;
  measurements: Record<string, string>;
  notes?: string;
  basePrice: number;
  variantModifierTotal: number;
  customizationFee: number;
  finalPrice: number;
  rushOrder: boolean;
  rushOrderCost: number;
  estimatedDeliveryDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const customizationService = {
  create: (data: CreateCustomizationRequest) =>
    apiPost<CustomizationOrder>("/customization-orders", data),
  getById: (id: number) =>
    apiGet<CustomizationOrder>(`/customization-orders/${id}`),
};

// ─── Custom Order Requests ────────────────────────────────

export interface CustomOrderRequest {
  providerId: number;
  productId?: number;
  description: string;
  material?: string;
  color?: string;
  fittingStyle?: string;
  measurements?: Record<string, string>;
  additionalNotes?: string;
  referenceImageUrl?: string;
}

export const customOrderService = {
  create: (data: CustomOrderRequest) =>
    apiPost<{ id: number; status: string }>("/orders/custom-requests", data),
};

// ─── Payments ─────────────────────────────────────────────

export interface PaymentInitRequest {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  callbackUrl: string;
  gateway: "paystack" | "flutterwave";
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResponse {
  paymentUrl: string;
  reference: string;
  accessCode?: string;
  txRef?: string;
}

export interface PaymentVerifyResponse {
  reference: string;
  status: "success" | "failed" | "pending";
  amount: number;
  currency: string;
  paidAt?: string;
  orderId: string;
}

export const paymentsService = {
  initialize: (data: PaymentInitRequest) =>
    apiPost<PaymentInitResponse>("/payments/initialize", data),
  verify: (data: { reference: string; gateway: "paystack" | "flutterwave" }) =>
    apiPost<PaymentVerifyResponse>("/payments/verify", data),
};

// ─── Messaging ────────────────────────────────────────────

export interface Conversation {
  id: number;
  customerId: number;
  providerId: number;
  providerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: "customer" | "provider";
  content: string;
  sentAt: string;
  readAt?: string;
}

export const messagingService = {
  listConversations: (params?: { page?: number; pageSize?: number }) =>
    apiGet<PaginatedResponse<Conversation>>(
      "/conversations",
      params as Record<string, unknown>,
    ),
  getMessages: (
    conversationId: number,
    params?: { page?: number; pageSize?: number },
  ) =>
    apiGet<PaginatedResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      params as Record<string, unknown>,
    ),
  sendMessage: (conversationId: number, content: string) =>
    apiPost<Message>(`/conversations/${conversationId}/messages`, { content }),
  startConversation: (providerId: number, initialMessage: string) =>
    apiPost<Conversation>("/conversations", { providerId, initialMessage }),
  markRead: (conversationId: number) =>
    apiPatch<void>(`/conversations/${conversationId}/read`),
};

// ─── Wishlist (API sync for logged-in users) ──────────────

export interface WishlistItemApi {
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  // Preferred single price; legacy priceMin/priceMax kept for backward-compat with older backend payloads.
  price?: number;
  priceMin?: number;
  priceMax?: number;
  priceRange?: { min: number; max: number };
  currency: string;
  category: string;
  imageUrl: string;
  styleTags: string[];
  addedAt: string;
}

export const wishlistService = {
  list: () =>
    apiGet<PaginatedResponse<WishlistItemApi>>("/customers/me/wishlist"),
  add: (productId: number) =>
    apiPost<WishlistItemApi>("/customers/me/wishlist", { productId }),
  remove: (productId: number) =>
    apiDelete(`/customers/me/wishlist/${productId}`),
};

// ─── Cart (API sync for logged-in users) ──────────────────

export interface CartItemApi {
  id: string;
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  basePrice: number;
  finalPrice: number;
  category: string;
  selectedSize?: string;
  selectedBodyType?: string;
  selectedVariants: Record<string, string>;
  measurements: Record<string, string>;
  notes?: string;
  quantity: number;
}

export const cartService = {
  list: () => apiGet<PaginatedResponse<CartItemApi>>("/customers/me/cart"),
  add: (item: Omit<CartItemApi, "id">) =>
    apiPost<CartItemApi>("/customers/me/cart", item),
  update: (id: string, item: Partial<CartItemApi>) =>
    apiPatch<CartItemApi>(`/customers/me/cart/${id}`, item),
  remove: (id: string) => apiDelete(`/customers/me/cart/${id}`),
  clear: () => apiDelete("/customers/me/cart"),
};

// ─── Notifications ────────────────────────────────────────

export interface Notification {
  id: number;
  userId: number;
  type: "order_update" | "message" | "promotion" | "system";
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export const notificationsService = {
  list: () => apiGet<PaginatedResponse<Notification>>("/notifications"),
  markRead: (id: number) => apiPatch<void>(`/notifications/${id}/read`),
  markAllRead: () => apiPatch<void>("/notifications/read-all"),
};

// ─── Support Tickets ──────────────────────────────────────

export interface SupportTicket {
  id: number;
  customerId?: number;
  type: "contact" | "order_issue" | "report" | "return_request";
  orderId?: string;
  subject: string;
  description: string;
  email: string;
  status: "open" | "in_review" | "resolved" | "closed";
  createdAt: string;
}

export const supportService = {
  create: (data: Omit<SupportTicket, "id" | "status" | "createdAt">) =>
    apiPost<SupportTicket>("/support/tickets", data),
  list: () => apiGet<PaginatedResponse<SupportTicket>>("/support/tickets"),
};

// ─── Product Variants ─────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: number;
  name: string;
  type: "color" | "material" | "design" | "sole" | "heel";
  value: string;
  priceModifier: number;
  imageUrl?: string;
}

export const variantsService = {
  getByProduct: async (productId: number): Promise<ProductVariant[]> => {
    try {
      return await apiGet<ProductVariant[]>(`/products/${productId}/variants`);
    } catch {
      return [];
    }
  },
};

// ─── Addresses ────────────────────────────────────────────

export interface AddressApi {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

// Backend DTO accepts only `addressLine1`, `city`, `state`, `country`, `isDefault`.
// It REJECTS `label`, `street`, and `addressLine2` ("property X should not exist").
// We translate at the service boundary and stash the user's label client-side only
// (in a localStorage map keyed by address id) so the friendlier { label, street }
// shape survives until the backend supports it.
interface BackendAddress {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

const ADDRESS_LABELS_KEY = "moe_address_labels";
const readLabels = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(ADDRESS_LABELS_KEY) || "{}"); }
  catch { return {}; }
};
const writeLabel = (id: string, label: string) => {
  const all = readLabels();
  all[id] = label;
  try { localStorage.setItem(ADDRESS_LABELS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
};

const toApi = (a: BackendAddress, fallbackLabel?: string): AddressApi => ({
  id: a.id,
  label: readLabels()[a.id] ?? fallbackLabel ?? "Address",
  street: a.addressLine1,
  city: a.city,
  state: a.state,
  country: a.country,
  isDefault: a.isDefault,
});

const toBackend = (data: Partial<Omit<AddressApi, "id">>) => {
  const out: Record<string, unknown> = {};
  if (data.street !== undefined) out.addressLine1 = data.street;
  if (data.city !== undefined) out.city = data.city;
  if (data.state !== undefined) out.state = data.state;
  if (data.country !== undefined) out.country = data.country;
  if (data.isDefault !== undefined) out.isDefault = data.isDefault;
  // NOTE: deliberately NOT sending `label` or `addressLine2` — backend rejects them.
  return out;
};

export const addressesService = {
  list: async (): Promise<AddressApi[]> => {
    try {
      const res = await apiGet<{ data: BackendAddress[] } | BackendAddress[]>(
        "/customers/me/addresses",
      );
      const arr = Array.isArray(res) ? res : (res?.data ?? []);
      return arr.map((a) => toApi(a));
    } catch {
      return [];
    }
  },
  create: async (data: Omit<AddressApi, "id" | "isDefault">) => {
    const created = await apiPost<BackendAddress>("/customers/me/addresses", toBackend(data));
    if (data.label) writeLabel(created.id, data.label);
    return toApi(created, data.label);
  },
  update: async (id: string, data: Partial<Omit<AddressApi, "id">>) => {
    const updated = await apiPatch<BackendAddress>(`/customers/me/addresses/${id}`, toBackend(data));
    if (data.label) writeLabel(id, data.label);
    return toApi(updated, data.label);
  },
  remove: (id: string) => apiDelete(`/customers/me/addresses/${id}`),
  setDefault: async (id: string) => {
    const updated = await apiPatch<BackendAddress>(`/customers/me/addresses/${id}/default`);
    return toApi(updated);
  },
};

// ─── Search ───────────────────────────────────────────────

export interface SearchResponse {
  products: Product[];
  providers: Provider[];
  categories: { id: string; name: string }[];
}

export const searchService = {
  search: async (q: string, type = "all"): Promise<SearchResponse> => {
    try {
      return await apiGet<SearchResponse>("/search", { q, type });
    } catch {
      // Fallback to mock search
      const lq = q.toLowerCase();
      return {
        products: mockProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(lq) ||
            p.tags.some((t) => t.toLowerCase().includes(lq)),
        ),
        providers: mockProviders.filter(
          (p) =>
            p.brandName.toLowerCase().includes(lq) ||
            p.category.toLowerCase().includes(lq),
        ),
        categories: [],
      };
    }
  },
};

// ─── Payment Methods ──────────────────────────────────────
//
// IMPORTANT: never POST raw card numbers (PAN) or CVV to the backend. Frontend
// stores only tokenised/safe metadata. In production, integrate Paystack or
// Stripe tokenisation and forward only the resulting token + safe metadata.

export interface PaymentMethodApi {
  id: string;
  brand: string; // "VISA" | "Mastercard" | etc.
  last4: string;
  expiry: string; // "MM/YY"
  cardholderName: string;
  billingAddressId?: string;
  isDefault: boolean;
  createdAt?: string;
}

export const paymentMethodsService = {
  list: async (): Promise<PaymentMethodApi[]> => {
    try {
      const res = await apiGet<{ data: PaymentMethodApi[] }>(
        "/customers/me/payment-methods",
      );
      return res.data ?? [];
    } catch {
      return [];
    }
  },
  create: (data: Omit<PaymentMethodApi, "id" | "isDefault" | "createdAt">) =>
    apiPost<PaymentMethodApi>("/customers/me/payment-methods", data),
  // Single-resource delete by ID. NEVER call this without a specific ID — there
  // is no blanket-collection delete endpoint by design.
  remove: (id: string) => {
    if (!id) {
      throw new Error("paymentMethodsService.remove requires an ID");
    }
    return apiDelete(`/customers/me/payment-methods/${id}`);
  },
  setDefault: (id: string) =>
    apiPatch<PaymentMethodApi>(`/customers/me/payment-methods/${id}/default`),
};
