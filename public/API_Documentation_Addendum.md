# API Documentation Addendum – Frontend Integration Update

**Author:** MOE Frontend Integration Analysis  
**Date:** 2026-03-07  
**Base Reference Documents:**  
- MOE API Documentation (Updated 30th August)  
- MOE API Schema (Updated 30th August)  
**Base URL:** `https://api.moe-africa.com`

---

> **Scope:** This document lists ONLY additions and modifications required for the MOE frontend to function. It does not replace or rewrite existing documentation. All conventions (auth header format, error codes, pagination shape, naming) from the original documentation apply throughout this addendum.

---

## Table of Contents

1. [New Object Schemas](#1-new-object-schemas)
2. [Modified Existing Schemas](#2-modified-existing-schemas)
3. [New Endpoints](#3-new-endpoints)
4. [Modified Existing Endpoints](#4-modified-existing-endpoints)
5. [Frontend Feature → API Mapping](#5-frontend-feature--api-mapping)

---

## 1. New Object Schemas

### 1.1 `UserPreference`

Stores personalisation preferences for a customer. Used by the MOE Curation / "For You" engine.

```ts
{
  id: number;
  userId: number;
  categories: Array<string>;       // service category slugs, e.g. ["tailoring","shoemaking"]
  styleTags: Array<string>;        // e.g. ["Modern","Afrocentric"]
  budget: number;                  // max budget in NGN
  updatedAt: string;               // ISO 8601 datetime
}
```

---

### 1.2 `ProductVariant`

Represents a customisable option on a product (colour, material, design, sole, heel, etc.).

```ts
{
  id: string;
  productId: number;
  name: string;                    // display name, e.g. "Blue & Gold"
  type: "color" | "material" | "design" | "sole" | "heel";
  value: string;                   // hex colour or keyword, e.g. "#1e40af" or "cotton"
  priceModifier: number;           // additional cost in NGN (0 for no change)
  imageUrl?: string;               // optional preview image URL
}
```

---

### 1.3 `CustomizationOrder`

Captures a complete product customisation submission from a customer.

```ts
{
  id: number;
  productId: number;
  customerId: number;
  selectedVariants: Record<string, string>;   // { variantType: variantId }
  selectedSize: string;
  selectedBodyType?: string;                  // tailoring only
  selectedFootType?: string;                  // shoemaking only
  measurements: Record<string, string>;       // field name → value
  notes?: string;
  basePrice: number;
  variantModifierTotal: number;
  customizationFee: number;
  finalPrice: number;
  rushOrder: boolean;
  rushOrderCost: number;
  estimatedDeliveryDays: number;
  status: "draft" | "submitted" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
```

---

### 1.4 `Order` (Customer-facing)

Full customer order object. Extends the existing order concept in the database schema.

```ts
{
  id: string;                      // e.g. "ORD-001"
  customerId: number;
  productId: number;
  productName: string;
  productImage: string;
  providerId: number;
  providerName: string;
  customizationId?: number;        // links to CustomizationOrder if custom
  isCustomOrder: boolean;
  status: "pending" | "awaiting_payment" | "in_progress" | "completed" | "cancelled";
  price: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paymentMethod: "paystack" | "flutterwave" | "bank_transfer" | "pay_on_delivery";
  paymentReference?: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  createdAt: string;
  updatedAt: string;
}
```

---

### 1.5 `ShippingAddress`

Used in checkout and order objects.

```ts
{
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;                 // ISO 3166-1 alpha-2 code, e.g. "NG"
  postalCode?: string;
}
```

---

### 1.6 `PaymentInitRequest`

Sent to the payment initialisation endpoint.

```ts
{
  orderId: string;
  amount: number;                  // in smallest currency unit (kobo for NGN)
  currency: string;                // e.g. "NGN"
  email: string;
  callbackUrl: string;
  gateway: "paystack" | "flutterwave";
  metadata?: Record<string, any>;
}
```

---

### 1.7 `PaymentInitResponse`

```ts
{
  paymentUrl: string;              // redirect URL for payment page
  reference: string;               // unique payment reference
  accessCode?: string;             // Paystack-specific
  txRef?: string;                  // Flutterwave-specific
}
```

---

### 1.8 `PaymentVerifyResponse`

```ts
{
  reference: string;
  status: "success" | "failed" | "pending";
  amount: number;
  currency: string;
  paidAt?: string;
  orderId: string;
}
```

---

### 1.9 `Message`

Individual message in a conversation between a customer and a service provider.

```ts
{
  id: number;
  conversationId: number;
  senderId: number;
  senderType: "customer" | "provider";
  content: string;
  sentAt: string;
  readAt?: string;
}
```

---

### 1.10 `Conversation`

Thread between a customer and a single service provider.

```ts
{
  id: number;
  customerId: number;
  providerId: number;
  providerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
```

---

### 1.11 `CartItem`

Represents one item in a customer's cart. Carts are server-persisted for logged-in users.

```ts
{
  id: string;
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  basePrice: number;
  finalPrice: number;
  category: string;
  selectedSize: string;
  selectedBodyType?: string;
  selectedVariants: Record<string, string>;
  measurements: Record<string, string>;
  notes?: string;
  quantity: number;
}
```

---

### 1.12 `WishlistItem`

```ts
{
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  category: string;
  imageUrl: string;
  styleTags: Array<string>;
  addedAt: string;
}
```

---

### 1.13 `Notification`

```ts
{
  id: number;
  userId: number;
  type: "order_update" | "message" | "promotion" | "system";
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
```

---

### 1.14 `Review`

Customer review of a service provider.

```ts
{
  id: number;
  providerId: number;
  customerId: number;
  orderId?: string;
  rating: number;                  // 1–5
  comment: string;
  createdAt: string;
}
```

---

### 1.15 `FilterMetadata`

Describes available filter facets for a product listing. Returned by listing endpoints.

```ts
{
  priceMin: number;
  priceMax: number;
  availableMaterials: Array<string>;
  availableStyleTags: Array<string>;
  availableStates: Array<string>;
  maxDeliveryDays: number;
}
```

---

### 1.16 `CustomerProfile` (extended `UserLoginResponse`)

The frontend Settings page and personalisation engine require a richer customer profile.

```ts
{
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: UserPreference;
  createdAt: string;
}
```

---

### 1.17 `AdminDashboardStats`

Aggregate stats returned for the admin dashboard overview.

```ts
{
  totalProviders: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeProviders: number;
  newProvidersThisMonth: number;
  newOrdersThisMonth: number;
}
```

---

### 1.18 `SupportTicket`

Created when a customer submits a support request via the Contact / Report pages.

```ts
{
  id: number;
  customerId?: number;             // null for unauthenticated submissions
  type: "contact" | "order_issue" | "report" | "return_request";
  orderId?: string;
  subject: string;
  description: string;
  email: string;
  status: "open" | "in_review" | "resolved" | "closed";
  createdAt: string;
}
```

---

## 2. Modified Existing Schemas

### 2.1 `ServiceProviderPublicInfo` — Additional Fields Required

The frontend provider card and artisan profile page display rating, review count, featured status, delivery estimate, hero image, custom orders availability, and style tags. The existing `ServiceProviderPublicInfo` schema must be extended:

| New Field             | Type           | Notes                                  |
|----------------------|----------------|---------------------------------------|
| `id`                 | `number`       | Needed for routing to `/marketplace/provider/{id}` |
| `rating`             | `number`       | Average star rating (1–5)              |
| `reviewCount`         | `number`       | Total number of reviews                |
| `featured`            | `boolean`      | Shown in Featured Artisans section    |
| `heroImageUrl?`       | `string`       | Provider banner / hero image           |
| `customOrdersEnabled` | `boolean`      | Displays "Custom Orders" badge         |
| `estimatedDeliveryDays` | `number`     | Used in product cards                  |
| `styleTags`           | `Array<string>`| Used for filter matching               |
| `serviceCategories`   | `Array<string>`| Category slugs e.g. `["tailoring"]`   |

---

### 2.2 `Product` — Additional Fields Required

| New Field         | Type           | Notes                                  |
|-------------------|----------------|---------------------------------------|
| `priceMin`        | `number`       | Renamed from `price`; range low       |
| `priceMax`        | `number`       | Range high                           |
| `currency`        | `string`       | e.g. `"NGN"`                         |
| `materials`       | `string`       | Used in filter + product detail      |
| `styleTags`       | `Array<string>`| Used in filter + "Complete Your Look"|
| `featured`        | `boolean`      | For Featured Products section        |
| `isBestSeller`    | `boolean`      | Best Sellers quick link              |
| `isTrending`      | `boolean`      | Trending Now quick link              |
| `isNewArrival`    | `boolean`      | New Arrivals quick link              |
| `discountPercent?`| `number`       | Deals section; null = no discount    |
| `originalPrice?`  | `number`       | Original price before discount       |

> **Note on `price`:** The existing `price: number` field in the schema should be interpreted as `priceMin`. Adding `priceMax` enables the price range display on the product detail page. If the backend cannot differentiate, a flat `price` is acceptable and `priceMin === priceMax`.

---

### 2.3 `GET /products` — Additional Query Parameters

The homepage filter bar and category products page require server-side filtering. Append the following optional query parameters to `GET /products`:

| New Parameter       | Type     | Description                  |
|---------------------|----------|------------------------------|
| `serviceCategoryId` | `number` | Filter by service category    |
| `productCategoryId` | `number` | Filter by product sub-category|
| `subcategory`       | `string` | Subcategory slug e.g. `"kaftans"` |
| `priceMin`          | `number` | Minimum price filter          |
| `priceMax`          | `number` | Maximum price filter          |
| `materials`         | `string` | Comma-separated material keywords |
| `styleTags`         | `string` | Comma-separated style tag keywords |
| `maxDeliveryDays`   | `number` | Filter by max delivery days   |
| `state`             | `string` | Filter by provider state/location |
| `featured`          | `boolean`| Featured products only        |
| `isBestSeller`      | `boolean`| Best sellers only             |
| `isTrending`        | `boolean`| Trending products only        |
| `isNewArrival`      | `boolean`| New arrivals only             |
| `sort`              | `string` | `"newest"`, `"price_asc"`, `"price_desc"`, `"rating"` |

---

### 2.4 `GET /service-providers/public-info` — Additional Query Parameters

| New Parameter | Type     | Description                  |
|---------------|----------|------------------------------|
| `state`       | `string` | Filter by location/state      |
| `styleTags`   | `string` | Comma-separated style tag keywords |
| `featured`    | `boolean`| Featured providers only       |
| `minRating`   | `number` | Minimum star rating           |
| `sort`        | `string` | `"rating"`, `"newest"`, `"featured"` |

---

### 2.5 `GET /service-providers/{id}/products` — Additional Query Parameters

Same new parameters as `GET /products` above (excluding `serviceCategoryId` since that is implied by the provider). Particularly needed: `subcategory`, `priceMin`, `priceMax`, `sort`.

---

## 3. New Endpoints

---

### 3.1 User Preference Management

#### `GET /customers/me/preferences`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves the authenticated customer's saved preferences |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `UserPreference`                            |

**Error Responses:**  
- `401 Unauthorized` — missing or invalid token  
- `404 Not Found` — no preferences set yet (return empty defaults)  

---

#### `PUT /customers/me/preferences`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Creates or replaces the authenticated customer's preferences |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  categories: Array<string>;
  styleTags: Array<string>;
  budget: number;
}
```

**Response Body Schema:** `UserPreference`

**Error Responses:**  
- `400 Bad Request` — invalid categories or styleTags values  
- `401 Unauthorized`  

---

#### `DELETE /customers/me/preferences`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Clears the authenticated customer's preferences |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

### 3.2 Personalised Recommendations

#### `GET /products/recommendations`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Returns personalised product recommendations based on stored or session preferences |
| Needs Authorization | false                                        |
| Query Parameters  | see below                                     |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Product>; pagination: Pagination; filterMeta: FilterMetadata }` |

**Query Parameters:**  
- `categories` — string, comma-separated (used for unauthenticated users passing session prefs)  
- `styleTags` — string, comma-separated  
- `budget` — number  
- `page` — number (optional)  
- `pageSize` — number (optional)  

> When the request includes a valid auth token, the backend should use the stored `UserPreference` and ignore query parameters.

---

#### `GET /service-providers/recommendations`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Returns personalised artisan recommendations  |
| Needs Authorization | false                                        |
| Query Parameters  | Same as `/products/recommendations`           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<ServiceProviderPublicInfo>; pagination: Pagination }` |

---

### 3.3 Product Variants

#### `GET /products/{id}/variants`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves all customisable variants for a product |
| Needs Authorization | false                                        |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `Array<ProductVariant>`                      |

---

#### `POST /products/{id}/variants`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Creates a product variant (admin only)         |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  name: string;
  type: "color" | "material" | "design" | "sole" | "heel";
  value: string;
  priceModifier: number;
  imageUrl?: string;
}
```

**Response Body Schema:** `ProductVariant`

---

#### `DELETE /products/{id}/variants/{variantId}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Deletes a product variant                       |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

### 3.4 Customisation Orders

#### `POST /customization-orders`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Submits a completed product customisation      |
| Needs Authorization | false (guest checkout supported)              |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
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
```

**Response Body Schema:** `CustomizationOrder`

**Error Responses:**  
- `400 Bad Request` — missing required fields  
- `404 Not Found` — product not found  

---

#### `GET /customization-orders/{id}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves a customisation order                 |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `CustomizationOrder`                         |

---

### 3.5 Customer Orders

#### `POST /orders`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Creates a new customer order (after cart checkout) |
| Needs Authorization | false (guest checkout supported)              |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  customerId?: number;
  items: Array<{
    productId: number;
    customizationId?: number;
    quantity: number;
    finalPrice: number;
  }>;
  shippingAddress: ShippingAddress;
  paymentMethod: "paystack" | "flutterwave" | "bank_transfer" | "pay_on_delivery";
  currency: string;
}
```

**Response Body Schema:** `Order`

---

#### `GET /orders`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves customer's orders                     |
| Needs Authorization | true                                         |
| Query Parameters  | `status?: string`, `isCustomOrder?: boolean`, `page?: number`, `pageSize?: number` |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Order>; pagination: Pagination }` |

---

#### `GET /orders/{id}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves a specific order                      |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `Order`                                     |

---

#### `PATCH /orders/{id}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Updates order status (admin / provider)        |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  status?: "pending" | "awaiting_payment" | "in_progress" | "completed" | "cancelled";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentReference?: string;
}
```

**Response Body Schema:** `Order`

---

### 3.6 Payment Processing

#### `POST /payments/initialize`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Initialises a payment transaction with Paystack or Flutterwave |
| Needs Authorization | false                                        |
| Query Parameters  | N/A                                           |

**Request Body Schema:** `PaymentInitRequest`

**Response Body Schema:** `PaymentInitResponse`

**Error Responses:**  
- `400 Bad Request` — invalid gateway or amount  
- `404 Not Found` — order not found  

> **Security Note:** This endpoint must be implemented as a server-side proxy (Edge Function). The payment gateway secret keys must NEVER be exposed to the frontend. The backend calls the gateway API internally and returns only the redirect URL.

---

#### `POST /payments/verify`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Verifies a completed payment via gateway reference |
| Needs Authorization | false                                        |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  reference: string;
  gateway: "paystack" | "flutterwave";
}
```

**Response Body Schema:** `PaymentVerifyResponse`

---

#### `POST /payments/webhook/paystack`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Webhook endpoint for Paystack payment events  |
| Needs Authorization | false (verified via `x-paystack-signature` header) |
| Query Parameters  | N/A                                           |
| Request Body Schema | Paystack webhook payload                      |
| Response Body Schema | N/A (200 OK acknowledgement)                 |

> **Note:** The backend must validate the `x-paystack-signature` header using the Paystack secret key before processing any webhook.

---

#### `POST /payments/webhook/flutterwave`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Webhook endpoint for Flutterwave payment events |
| Needs Authorization | false (verified via `verif-hash` header)     |
| Query Parameters  | N/A                                           |
| Request Body Schema | Flutterwave webhook payload                    |
| Response Body Schema | N/A (200 OK acknowledgement)                 |

---

### 3.7 Messaging

#### `GET /conversations`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves all conversations for the authenticated customer |
| Needs Authorization | true                                         |
| Query Parameters  | `page?: number`, `pageSize?: number`          |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Conversation>; pagination: Pagination }` |

---

#### `GET /conversations/{id}/messages`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves messages in a conversation            |
| Needs Authorization | true                                         |
| Query Parameters  | `page?: number`, `pageSize?: number`          |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Message>; pagination: Pagination }` |

---

#### `POST /conversations/{id}/messages`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Sends a message in a conversation               |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  content: string;
}
```

**Response Body Schema:** `Message`

---

#### `POST /conversations`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Starts a new conversation with a service provider |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  providerId: number;
  initialMessage: string;
}
```

**Response Body Schema:** `Conversation`

---

#### `PATCH /conversations/{id}/read`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Marks all messages in a conversation as read   |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

### 3.8 Wishlist

#### `GET /customers/me/wishlist`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves the authenticated customer's wishlist |
| Needs Authorization | true                                         |
| Query Parameters  | `page?: number`, `pageSize?: number`          |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<WishlistItem>; pagination: Pagination }` |

---

#### `POST /customers/me/wishlist`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Adds a product to the wishlist                   |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  productId: number;
}
```

**Response Body Schema:** `WishlistItem`

---

#### `DELETE /customers/me/wishlist/{productId}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Removes a product from the wishlist             |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

### 3.9 Cart (Server-persisted for logged-in users)

#### `GET /customers/me/cart`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves the authenticated customer's cart     |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ items: Array<CartItem>; subtotal: number; currency: string }` |

---

#### `POST /customers/me/cart`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Adds or updates a cart item                      |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | `CartItem` (without `id`)                      |
| Response Body Schema | `CartItem`                                   |

---

#### `DELETE /customers/me/cart/{itemId}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Removes a cart item                              |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

#### `DELETE /customers/me/cart`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Clears the entire cart                           |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

### 3.10 Reviews

#### `GET /service-providers/{id}/reviews`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves reviews for a service provider        |
| Needs Authorization | false                                        |
| Query Parameters  | `page?: number`, `pageSize?: number`, `sort?: "newest" | "highest" | "lowest"` |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Review>; pagination: Pagination; averageRating: number; totalReviews: number }` |

---

#### `POST /service-providers/{id}/reviews`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Submits a review for a service provider         |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  orderId?: string;
  rating: number;      // 1–5
  comment: string;
}
```

**Response Body Schema:** `Review`

**Error Responses:**  
- `400 Bad Request` — rating out of range  
- `409 Conflict` — review already submitted for this order  

---

### 3.11 Notifications

#### `GET /customers/me/notifications`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves notifications for the authenticated user |
| Needs Authorization | true                                         |
| Query Parameters  | `read?: boolean`, `page?: number`, `pageSize?: number` |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Notification>; pagination: Pagination; unreadCount: number }` |

---

#### `PATCH /customers/me/notifications/{id}/read`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Marks a notification as read                     |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

#### `PATCH /customers/me/notifications/read-all`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Marks all notifications as read                  |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | N/A                                         |

---

### 3.12 Customer Profile

#### `GET /customers/me`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves the authenticated customer's profile |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `CustomerProfile`                            |

---

#### `PATCH /customers/me`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Updates the authenticated customer's profile   |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  name?: string;
  phone?: string;
  avatarUrl?: string;
}
```

**Response Body Schema:** `CustomerProfile`

---

#### `POST /auth/register`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Registers a new customer account                 |
| Needs Authorization | false                                        |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  name: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
}
```

**Response Body Schema:** `LoginResponse` (as defined in existing schema doc)

---

#### `POST /auth/refresh-token`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Refreshes an expired JWT                         |
| Needs Authorization | false                                        |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  refreshToken: string;
}
```

**Response Body Schema:**  
```ts
{
  token: string;
  refreshToken: string;
}
```

---

### 3.13 Support Tickets

#### `POST /support/tickets`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Creates a support ticket from the Contact Us, Report Issue, or Order Support pages |
| Needs Authorization | false                                        |
| Query Parameters  | N/A                                           |

**Request Body Schema:**  
```ts
{
  customerId?: number;
  type: "contact" | "order_issue" | "report" | "return_request";
  orderId?: string;
  subject: string;
  description: string;
  email: string;
}
```

**Response Body Schema:** `SupportTicket`

---

#### `GET /support/tickets/{id}`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves a support ticket by ID                 |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `SupportTicket`                              |

---

### 3.14 Admin Dashboard

#### `GET /admin/stats`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Returns aggregate statistics for the admin dashboard overview |
| Needs Authorization | true                                         |
| Query Parameters  | N/A                                           |
| Request Body Schema | N/A                                         |
| Response Body Schema | `AdminDashboardStats`                        |

---

#### `GET /admin/orders`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Retrieves all orders (admin view with full details) |
| Needs Authorization | true                                         |
| Query Parameters  | `status?: string`, `providerId?: number`, `page?: number`, `pageSize?: number` |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ data: Array<Order>; pagination: Pagination }` |

---

### 3.15 Search

#### `GET /search`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Full-text search across products and service providers |
| Needs Authorization | false                                        |
| Query Parameters  | see below                                     |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ products: Array<Product>; providers: Array<ServiceProviderPublicInfo>; total: number }` |

**Query Parameters:**  
- `q` — string, search query (required)  
- `type` — `"products"` | `"providers"` | `"all"` (default: `"all"`)  
- `serviceCategoryId` — number (optional)  
- `page` — number (optional)  
- `pageSize` — number (optional)  

---

### 3.16 Delivery Estimate

#### `GET /delivery/estimate`

| Field             | Value                                         |
|-------------------|-----------------------------------------------|
| Description       | Returns a dynamic delivery estimate for a product and location |
| Needs Authorization | false                                        |
| Query Parameters  | `productId: number`, `state: string`, `country: string`, `rushOrder?: boolean` |
| Request Body Schema | N/A                                         |
| Response Body Schema | `{ estimatedDays: number; rushOrderDays: number; rushOrderCost: number; }` |

---

## 4. Modified Existing Endpoints

### 4.1 `PATCH /products/{id}` — Expanded Request Body

The current schema only allows `name` and `description` to be updated. The admin product form requires additional fields:

**Additional optional fields in the request body:**
```ts
{
  price?: number;
  productCategoryIds?: Array<number>;
  estimatedDeliveryDays?: number;
  enabled?: boolean;
  formURL?: string;
  featured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  discountPercent?: number;
  originalPrice?: number;
  materials?: string;
  styleTags?: Array<string>;
}
```

---

### 4.2 `GET /service-providers/{id}` — Change Authorization to Optional

**Original:** `Needs Authorization: true`  
**Required:** `Needs Authorization: false` (or optionally authenticated)

**Reason:** The marketplace provider detail page (`/marketplace/provider/{id}`) is publicly accessible and requires no login to view.

---

### 4.3 `POST /products` — Additional Fields in Request Body

The existing `POST /products` request body should accept the new Product fields:

```ts
{
  // existing fields retained
  materials?: string;
  styleTags?: Array<string>;
  featured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  discountPercent?: number;
  originalPrice?: number;
  priceMax?: number;
}
```

---

## 5. Frontend Feature → API Mapping

| Frontend Feature                     | Required Endpoint(s)                                                                 | Schema(s) Used                          |
|------------------------------------|-------------------------------------------------------------------------------------|---------------------------------------|
| Homepage — personalised recommendations | `GET /products/recommendations`, `GET /service-providers/recommendations`          | `Product`, `ServiceProviderPublicInfo`, `UserPreference` |
| Homepage — filter bar (price, material, tags, delivery) | `GET /products` (with new query params), `GET /service-providers/public-info`       | `Product`, `FilterMetadata`            |
| Homepage — featured artisans section | `GET /service-providers/public-info?featured=true`                                 | `ServiceProviderPublicInfo`             |
| Homepage — featured products section | `GET /products?featured=true`                                                      | `Product`                              |
| Homepage — deals section            | `GET /products?discountPercent_gt=0`                                               | `Product`                              |
| Homepage — styles for you           | `GET /products/recommendations` with style tags                                    | `Product`, `UserPreference`            |
| Homepage — recently viewed          | Client-side `localStorage` (no API call required)                                 | —                                     |
| Categories mega menu — Browse All (category) | `GET /products?serviceCategoryId={id}`                                            | `Product`                              |
| Categories mega menu — subcategory links | `GET /products?subcategory={slug}`                                                | `Product`                              |
| Categories mega menu — View All Artisans | `GET /service-providers/public-info?serviceCategoryId={id}`                       | `ServiceProviderPublicInfo`             |
| Search bar                        | `GET /search?q={query}`                                                             | `Product`, `ServiceProviderPublicInfo` |
| All Products page                 | `GET /products` (with filters + sort params)                                       | `Product`, `FilterMetadata`            |
| All Artisans page                | `GET /service-providers/public-info` (with filters + sort)                         | `ServiceProviderPublicInfo`             |
| Category Products page           | `GET /products?serviceCategoryId={id}`                                            | `Product`                              |
| Category Artisans page           | `GET /service-providers/public-info?serviceCategoryId={id}`                       | `ServiceProviderPublicInfo`             |
| Provider detail page             | `GET /service-providers/{id}/public-info`, `GET /service-providers/{id}/products`, `GET /service-providers/{id}/reviews` | `ServiceProviderPublicInfo`, `Product`, `Review` |
| Product detail page              | `GET /products/{id}`, `GET /products/{id}/images`, `GET /products/{id}/variants`   | `Product`, `ProductImage`, `ProductVariant` |
| Product customisation modal      | `GET /products/{id}/variants`, `POST /customization-orders`                        | `ProductVariant`, `CustomizationOrder` |
| Delivery estimate widget         | `GET /delivery/estimate`                                                           | delivery estimate response             |
| "Complete Your Look" section    | `GET /products?styleTags={tags}`                                                  | `Product`                              |
| Customer reviews on product/provider | `GET /service-providers/{id}/reviews`, `POST /service-providers/{id}/reviews`    | `Review`                              |
| Cart (logged-out)               | `localStorage` only                                                                | `CartItem`                            |
| Cart (logged-in)                | `GET /customers/me/cart`, `POST /customers/me/cart`, `DELETE /customers/me/cart/{itemId}` | `CartItem`                            |
| Wishlist (logged-out)           | `localStorage` only                                                                | `WishlistItem`                        |
| Wishlist (logged-in)            | `GET /customers/me/wishlist`, `POST /customers/me/wishlist`, `DELETE /customers/me/wishlist/{productId}` | `WishlistItem`                        |
| Checkout — shipping form        | Country/state data is client-side; submission: `POST /orders`                     | `ShippingAddress`, `Order`            |
| Checkout — payment              | `POST /payments/initialize` → redirect → `POST /payments/verify`                  | `PaymentInitRequest`, `PaymentInitResponse`, `PaymentVerifyResponse` |
| Customer orders list            | `GET /orders`                                                                      | `Order`                              |
| Customer order detail           | `GET /orders/{id}`                                                                 | `Order`                              |
| Messages / conversations       | `GET /conversations`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages`, `POST /conversations` | `Conversation`, `Message`            |
| Notifications                  | `GET /customers/me/notifications`, `PATCH .../read`                              | `Notification`                       |
| Settings / profile page        | `GET /customers/me`, `PATCH /customers/me`, `PUT /customers/me/preferences`       | `CustomerProfile`, `UserPreference` |
| Auth — login                  | `POST /auth/login` (existing)                                                     | `LoginRequest`, `LoginResponse`     |
| Auth — register               | `POST /auth/register`                                                             | —                                   |
| Auth — logout                | `POST /auth/logout` (existing)                                                    | —                                   |
| Auth — token refresh         | `POST /auth/refresh-token`                                                        | —                                   |
| Support — Contact Us          | `POST /support/tickets` with `type: "contact"`                                  | `SupportTicket`                     |
| Support — Order Support       | `POST /support/tickets` with `type: "order_issue"`                              | `SupportTicket`                     |
| Support — Report Issue        | `POST /support/tickets` with `type: "report"`                                   | `SupportTicket`                     |
| Support — Track Order         | `GET /orders/{id}` (public, by order reference)                                 | `Order`                            |
| Admin — Dashboard stats       | `GET /admin/stats`                                                               | `AdminDashboardStats`               |
| Admin — Providers list/manage | `GET /service-providers`, `POST /service-providers`, `PATCH /service-providers/{id}` (existing) | `ServiceProvider`                  |
| Admin — Products list/manage  | `GET /products`, `POST /products`, `PATCH /products/{id}` (existing + modified)  | `Product`                         |
| Admin — Categories manage     | `GET /service-categories`, `POST /service-categories`, `PATCH /service-categories/{id}` (existing) | `ServiceCategory`                 |
| Admin — Orders manage         | `GET /admin/orders`, `PATCH /orders/{id}`                                        | `Order`                          |
| Admin — Media manage          | `POST /products/{id}/images`, `DELETE /products/{id}/images/{imageId}` (existing) | `ProductImage`                   |

---

## Notes on Error Response Consistency

All new endpoints must follow the same error response format as documented in the original API documentation. All errors must return appropriate HTTP status codes with a JSON body.

---

## Notes on Pagination

All list endpoints returning more than one item must support the `page` and `pageSize` query parameters and return the `Pagination` object in their response, consistent with existing endpoints.

---

*End of API Documentation Addendum – Frontend Integration Update*
