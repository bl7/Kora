# SalesSuite Mobile App – Cursor Prompt

Use this document as the single source of truth when building the React Native (Android) mobile app for SalesSuite staff.

---

## 1. Overview

- **App type:** React Native (Expo recommended), Android
- **Purpose:** Staff-facing app for reps, managers, and back_office
- **No signup in app** – users are invited via the web dashboard and log in with email/password
- **API base:** `https://kora-sand.vercel.app`
- **Auth:** Bearer token (JWT). The backend must accept `Authorization: Bearer <token>` for API requests (in addition to cookies). Login must return the token in the response body for the app to store it.

---

## 2. Environment Configuration

Create `env.ts` (or similar) in the mobile project:

```ts
export const env = {
  apiBaseUrl: "https://kora-sand.vercel.app",
} as const;
```

Use `env.apiBaseUrl` for all API requests (e.g. `${env.apiBaseUrl}/api/auth/login`).

---

## 3. Authentication

### Login

**POST** `/api/auth/login`

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "********",
  "companySlug": "acme"  // optional – if user belongs to multiple companies
}
```

**Success (200):**
```json
{
  "ok": true,
  "session": {
    "userId": "uuid",
    "fullName": "John Doe",
    "companyId": "uuid",
    "companySlug": "acme",
    "companyName": "Acme Inc",
    "companyUserId": "uuid",
    "role": "rep" | "manager" | "boss" | "back_office"
  }
}
```

**Important:** The response includes a `token` field. Store it in secure storage and send it as `Authorization: Bearer <token>` on all subsequent API requests.

**Errors:**
- 400: Invalid body (e.g. invalid email format)
- 401: Invalid credentials
- 403: Email not verified – message: "Please verify your email address before logging in. Check your inbox for the verification link."

### Current user / session

**GET** `/api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+9779812345678",
    "role": "rep" | "manager" | "boss" | "back_office",
    "companyUserId": "uuid"
  },
  "company": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme",
    "address": "123 Main St",
    "subscriptionEndsAt": "2025-12-31T23:59:59.000Z",
    "staffLimit": 5,
    "staffCount": 3
  }
}
```

**Subscription expired / suspended (403):**
```json
{
  "ok": false,
  "error": "Subscription expired or suspended. Please contact support.",
  "subscriptionExpired": true,
  "companyName": "Acme Inc"
}
```

**401:** Missing or invalid token.

### Logout

**POST** `/api/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "ok": true,
  "message": "Logged out"
}
```

On mobile, logout means: clear stored token and navigate to login screen. The backend clears the cookie; for Bearer auth, simply discarding the token is sufficient.

---

## 4. Subscription Expiry & Suspension

### When it happens

- `subscription_ends_at` is null or in the past
- `subscription_suspended` is true

The `/api/auth/me` endpoint returns **403** with `subscriptionExpired: true` when the company’s subscription is expired or suspended.

### What the app should do

1. **On every authenticated request** (especially `GET /api/auth/me`): If the response is 403 and the body contains `subscriptionExpired: true`:
   - Clear the stored token
   - Navigate to a dedicated “Subscription Expired” screen
   - Do not allow access to any app features

2. **Subscription Expired screen** should:
   - Show the company name if provided (`companyName` from the 403 response)
   - Explain that access has expired or been suspended
   - Tell the user to contact support to renew
   - Provide a “Contact support” action (e.g. mailto:support@salessuite.com)
   - Provide a “Back to login” action (clears token and returns to login screen)

3. **Optional:** On app launch, if a token exists, call `GET /api/auth/me` first. If 403 with `subscriptionExpired: true`, show the Subscription Expired screen immediately.

---

## 5. Role-Based Access (App Scope)

| Feature | Rep | Manager | Boss | Back office |
|--------|-----|---------|------|-------------|
| Login | ✓ | ✓ | ✓ | ✓ |
| Profile (view/edit) | ✓ | ✓ | ✓ | ✓ |
| Leads – list | Own only | All | All | All |
| Leads – add | ✓ | ✓ | ✓ | ✓ |
| Leads – update status | Own only | All | All | N/A* |
| Shops – list | Assigned only | All | All | All |
| Orders – create | Assigned shops only | Any shop | Any shop | N/A |
| Orders – list | Own only | Own** | All | Own** |
| Orders – view single | Own only | Any | Any | Own |
| Products – list (view only) | ✓ | ✓ | ✓ | ✓ |

\* Back office: confirm if they need lead updates; current API may restrict.  
\** For managers/back_office, clarify if “own” means orders they placed or all company orders. Current API: reps see only their orders; managers/back_office see all (no `placed_by` filter).

**Products:** View only. No create/edit/delete from the app.

**Boss:** May have full access in the app or be treated like manager; confirm product requirements.

---

## 6. API Routes Reference

All routes are under `https://kora-sand.vercel.app`. Send `Authorization: Bearer <token>` on every request except login.

### Auth
- `POST /api/auth/login` – body: `{ email, password, companySlug? }` – no auth header
- `GET /api/auth/me` – returns user + company
- `POST /api/auth/logout` – clears server-side session

### Profile
- `PATCH /api/profile` – body: `{ fullName?, email?, phone? }` – update own profile  
  - Phone format: Nepal `+977XXXXXXXXX` (10 digits after +977)

### Leads
- `GET /api/manager/leads` – list leads  
  - Query: `status` (new|contacted|qualified|converted|lost), `q` (search)
  - Reps: only leads they created
- `GET /api/manager/leads/[leadId]` – single lead  
  - Reps: only leads they created or are assigned to
- `POST /api/manager/leads` – create lead  
  - Body: `{ name, shopId?, contactName?, phone?, email?, address?, assignedRepCompanyUserId?, notes? }`
- `PATCH /api/manager/leads/[leadId]` – update lead (incl. status)  
  - Body: `{ shopId?, name?, contactName?, phone?, email?, address?, status?, assignedRepCompanyUserId?, notes? }`  
  - Reps: only leads they created or are assigned to; cannot reassign
- `POST /api/manager/leads/[leadId]/convert-to-shop` – convert lead to shop (creates shop, sets lead status)  
  - Boss/manager/rep (reps only for leads assigned to them or they created)
- `DELETE /api/manager/leads/[leadId]` – delete lead (boss/manager only; app may not expose)

### Shops
- `GET /api/manager/shops` – list shops  
  - Query: `q` (search)  
  - Reps: only shops assigned to them. Boss/manager/back_office: all shops.
- `GET /api/manager/shops/[shopId]` – single shop  
  - Reps: only assigned shops
- `PATCH /api/manager/shops/[shopId]` – update shop (boss/manager only)  
  - Body: `{ name?, notes?, contactName?, phone?, address?, ... }`

### Orders
- `GET /api/manager/orders` – list orders  
  - Query: `status`, `q`, `date_from`, `date_to`, `rep` (company_user_id), `shop` (shop_id), `sort` (placed_at_asc|placed_at_desc)  
  - Reps: automatically filtered to `placed_by_company_user_id = self`
- `POST /api/manager/orders` – create order  
  - Body: `{ shopId?, leadId?, notes?, currencyCode? (default "NPR"), items: [{ productId?, productName, productSku?, quantity, unitPrice, notes? }] }`  
  - At least one item required. If `leadId` provided, lead is auto-converted.  
  - **Reps:** Only allow creating orders for shops in their shops list (assigned shops). The app should restrict the shop picker to those shops.
- `GET /api/manager/orders/[orderId]` – single order details  
  - Reps: only if they placed it
- `PATCH /api/manager/orders/[orderId]` – update order  
  - Body: `{ status?, notes?, shopId?, leadId?, items? }`  
  - **Status:** Forward only (received→processing→shipped→closed). Boss/manager/back_office only.
  - **Items, shopId, leadId:** Only when status is `"received"`. Replaces items entirely – send full array.
  - **Reps:** Can edit `items`, `shopId`, `leadId`, `notes` on orders they placed (when status is received). Cannot change status.
- `POST /api/manager/orders/[orderId]/cancel` – cancel order (boss/manager/back_office; app may not expose)

### Products
- `GET /api/manager/products` – list products (view only)  
  - Query: `q`, `status` (active|inactive)

### Visits (rep-specific per shop)
- `GET /api/manager/visits` – list visits  
  - Query: `shop` (shop_id), `rep` (company_user_id), `date_from`, `date_to`  
  - Reps: only their own visits
- `POST /api/manager/visits` – start visit  
  - Body: `{ shopId }`  
  - Reps: only for shops assigned to them
- `PATCH /api/manager/visits/[visitId]` – end visit  
  - Body: `{ end: true }`  
  - Reps: only their own visits

### Tasks (assigned to reps)
- `GET /api/manager/tasks` – list tasks  
  - Query: `status` (pending|completed|cancelled), `rep` (company_user_id)  
  - Reps: only tasks assigned to them
- `GET /api/manager/tasks/[taskId]` – single task
- `POST /api/manager/tasks` – create/assign task (boss/manager only)  
  - Body: `{ repCompanyUserId, title, description?, dueAt?, leadId?, shopId? }`
- `PATCH /api/manager/tasks/[taskId]` – update task (complete, reschedule)  
  - Body: `{ status?, dueAt?, title?, description? }`  
  - Reps: only tasks assigned to them

---

## 6.1 Order Update (Edit Order Contents) – Mobile Guide

Use **PATCH** `/api/manager/orders/[orderId]` to edit an order **only when status is `"received"`**.

### When to show "Edit order"

- Show an **Edit** action on an order detail screen when `order.status === "received"`.
- Hide or disable Edit when status is `processing`, `shipped`, `closed`, or `cancelled`.

### Request body (camelCase)

| Field   | Type   | Required | Notes                                                                 |
|---------|--------|----------|-----------------------------------------------------------------------|
| `items` | array  | No*      | Full replacement – send the complete list of items you want to keep   |
| `shopId`| uuid   | No       | Shop UUID or `null`                                                   |
| `leadId`| uuid   | No       | Lead UUID or `null`                                                   |
| `notes` | string | No       | Order notes (max 2000 chars)                                          |
| `status`| enum   | No       | `"processing"` \| `"shipped"` \| `"closed"` – **reps cannot send this** |

\* At least one of `items`, `shopId`, `leadId`, `notes`, or `status` must be sent.

### Item shape (same as create order)

```json
{
  "productId": "uuid",
  "productName": "string",
  "productSku": "string",
  "quantity": 1,
  "unitPrice": 100,
  "notes": "string"
}
```

- `productName`, `quantity`, `unitPrice` required per item
- `productId`, `productSku`, `notes` optional
- `items` must have at least 1 item

### Editing items

- You **replace** all items with the `items` array you send.
- To add: include all existing items + the new one.
- To change quantity: include all items with updated `quantity`.
- To remove: include all items except the one to remove.
- `total_amount` is recalculated by the backend.

### Example: Change quantity of one item

Current order has 2 items. You want to change quantity of the first from 2 to 3:

```json
{
  "items": [
    { "productName": "Product A", "quantity": 3, "unitPrice": 100 },
    { "productName": "Product B", "quantity": 1, "unitPrice": 250 }
  ]
}
```

### Example: Add a new item

```json
{
  "items": [
    { "productName": "Product A", "quantity": 2, "unitPrice": 100 },
    { "productName": "Product B", "quantity": 1, "unitPrice": 250 },
    { "productName": "Product C", "quantity": 1, "unitPrice": 75 }
  ]
}
```

### Example: Remove an item

```json
{
  "items": [
    { "productName": "Product B", "quantity": 1, "unitPrice": 250 }
  ]
}
```

### Example: Change shop only

```json
{
  "shopId": "new-shop-uuid"
}
```

### Example: Edit notes only

```json
{
  "notes": "Updated delivery instructions"
}
```

### Response (200)

```json
{
  "ok": true,
  "order": { /* full order object with updated items, shop_id, lead_name, etc. */ }
}
```

### Error responses

- **400** – `"Order contents can only be edited when status is received"` – items/shop/lead edit attempted on a non-received order
- **400** – `"At least one item is required"` – `items` array is empty
- **403** – `"You can only edit orders you placed"` – rep tried to edit another rep's order
- **403** – `"Reps cannot change order status"` – rep sent `status` in the body

### Role summary

| Role          | Can edit items/shop/lead/notes | Can change status |
|---------------|--------------------------------|-------------------|
| Rep           | Yes, on orders they placed     | No                |
| Manager       | Yes                            | Yes               |
| Boss          | Yes                            | Yes               |
| Back office   | Yes                            | Yes               |

---

## 7. Response Shapes (Summary)

### Leads
```ts
// GET /api/manager/leads
{ ok: true, leads: Array<{
  id: string, name: string, contact_name: string | null, phone: string | null,
  email: string | null, address: string | null, status: "new"|"contacted"|"qualified"|"converted"|"lost",
  notes: string | null, converted_at: string | null, created_at: string, updated_at: string,
  shop_name: string | null, assigned_rep_name: string | null
}> }
```

### Shops
```ts
// GET /api/manager/shops
{ ok: true, shops: Array<{
  id: string, external_shop_code: string | null, name: string, contact_name: string | null,
  phone: string | null, address: string | null, latitude: number, longitude: number,
  geofence_radius_m: number, is_active: boolean, assignment_count: number, ...
}> }
```

### Orders
```ts
// GET /api/manager/orders
{ ok: true, orders: Array<{
  id: string, order_number: string, status: "received"|"processing"|"shipped"|"closed"|"cancelled",
  total_amount: string, currency_code: string, placed_at: string, shop_id: string, shop_name: string,
  lead_name: string | null, placed_by_name: string, items: Array<{...}>, ...
}> }
```

### Products
```ts
// GET /api/manager/products
{ ok: true, products: Array<{
  id: string, sku: string, name: string, description: string | null, unit: string,
  is_active: boolean, current_price: number | null, currency_code: string | null, ...
}> }
```

---

## 8. Error Handling

All API errors follow:
```json
{ "ok": false, "error": "Human-readable message" }
```

Status codes:
- 400: Bad request (validation, invalid input)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (role or subscription)
- 404: Not found
- 500: Server error

For 401: clear token, go to login.  
For 403 with `subscriptionExpired: true`: show Subscription Expired screen (see §4).

---

## 9. Backend Prerequisites (Before/During App Build)

The existing backend may need these changes for full mobile support:

1. ~~**Bearer token auth**~~ – Done
2. ~~**Login response**~~ – Done
3. ~~**Shops for reps**~~ – Done: reps get assigned shops only
4. ~~**Lead convert**~~ – Done: `POST /api/manager/leads/[leadId]/convert-to-shop`
5. ~~**Visits**~~ – Done: GET, POST, PATCH
6. ~~**Tasks**~~ – Done: GET, POST, PATCH

---

## 10. Product Branding

- **App name:** SalesSuite
- **Legal entity (footer/legal only):** SalesSuite Private Limited

---

## 11. Out of Scope (Iteration 1)

- Geofencing, arrival detection, dwell time – planned for iteration 2
- Signup in app
- iOS (Android only for now)
- Offline mode / sync
