# SalesSuite Mobile App – API Integration Guide

Use this document to implement all API routes in the React Native (Android) mobile app. Base URL: `https://kora-sand.vercel.app`

---

## 1. Base configuration

```ts
export const env = {
  apiBaseUrl: "https://kora-sand.vercel.app",
} as const;
```

**Headers for all authenticated requests:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Error handling:** All errors return `{ ok: false, error: "message" }`. On 401, clear token and go to login. On 403 with `subscriptionExpired: true`, show Subscription Expired screen.

---

## 2. Auth

### Login
**POST** `/api/auth/login`  
No auth header.

**Body:** `{ email, password, companySlug? }`

**Success (200):**
```json
{
  "ok": true,
  "token": "eyJ...",
  "session": { "userId", "fullName", "companyId", "companySlug", "companyName", "companyUserId", "role" }
}
```

Store `token` in secure storage. Use it for `Authorization: Bearer <token>` on all subsequent requests.

**Errors:** 401 (invalid creds), 403 (email not verified)

---

### Current session
**GET** `/api/auth/me`

**Success (200):**
```json
{
  "ok": true,
  "user": { "id", "fullName", "email", "phone", "role", "companyUserId" },
  "company": { "id", "name", "slug", "address", "subscriptionEndsAt", "staffLimit", "staffCount" }
}
```

**403 with subscriptionExpired:** `{ ok: false, error: "...", subscriptionExpired: true, companyName }` → Show Subscription Expired screen, clear token.

---

### Logout
**POST** `/api/auth/logout`  
On mobile: clear stored token, navigate to login.

---

## 3. Profile

**PATCH** `/api/profile`  
**Body:** `{ fullName?, email?, phone? }`  
Phone format: Nepal `+977XXXXXXXXX` (10 digits).

---

## 4. Leads

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/manager/leads` | List leads |
| GET | `/api/manager/leads/[leadId]` | Single lead |
| POST | `/api/manager/leads` | Create lead |
| PATCH | `/api/manager/leads/[leadId]` | Update lead |
| POST | `/api/manager/leads/[leadId]/convert-to-shop` | Convert lead to shop |

**GET list – Query:** `status` (new|contacted|qualified|converted|lost), `q` (search)  
**Reps:** Only leads they created.

**POST create – Body:**
```json
{
  "name": "string",
  "shopId": "uuid",
  "contactName": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "assignedRepCompanyUserId": "uuid",
  "notes": "string"
}
```
`name` required. Others optional.

**PATCH update – Body:** `{ shopId?, name?, contactName?, phone?, email?, address?, status?, assignedRepCompanyUserId?, notes? }`  
**Reps:** Only leads they created or are assigned to; cannot reassign (`assignedRepCompanyUserId`).

**POST convert-to-shop:** No body. Creates shop from lead, links lead. Reps: only for leads assigned to them or they created.

---

## 5. Shops

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/manager/shops` | List shops |
| GET | `/api/manager/shops/[shopId]` | Single shop |
| PATCH | `/api/manager/shops/[shopId]` | Update shop (boss/manager only) |

**GET list – Query:** `q` (search)  
**Reps:** Only shops assigned to them. Others: all shops.

**Shop response includes:** `id`, `name`, `contact_name`, `phone`, `address`, `notes`, `latitude`, `longitude`, `geofence_radius_m`, `assignment_count`, etc.

**PATCH – Body:** `{ notes?, name?, contactName?, phone?, address?, ... }`  
For ShopDetailScreen "Notes" section: use `notes`. Boss/manager only.

---

## 6. Orders

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/manager/orders` | List orders |
| GET | `/api/manager/orders/[orderId]` | Single order |
| POST | `/api/manager/orders` | Create order |
| PATCH | `/api/manager/orders/[orderId]` | Update order |
| POST | `/api/manager/orders/[orderId]/cancel` | Cancel (boss/manager/back_office) |

**GET list – Query:** `status`, `q`, `date_from`, `date_to`, `rep`, `shop`, `sort` (placed_at_asc|placed_at_desc)  
**Reps:** Only their orders.

**POST create – Body:**
```json
{
  "shopId": "uuid",
  "leadId": "uuid",
  "notes": "string",
  "currencyCode": "NPR",
  "items": [
    { "productId": "uuid", "productName": "string", "productSku": "string", "quantity": 1, "unitPrice": 100, "notes": "string" }
  ]
}
```
At least 1 item; `productName`, `quantity`, `unitPrice` required per item.

**PATCH update** (edit order when status is `"received"`):
- **Body:** `{ items?, shopId?, leadId?, notes?, status? }`
- **Items:** Full replacement – send complete array to add/change/remove.
- **Reps:** Can edit items, shop, lead, notes on orders they placed. Cannot change status.
- **Status:** Boss/manager/back_office only; forward only: received→processing→shipped→closed.

**ShopDetailScreen "View all" orders:** `GET /api/manager/orders?shop={shopId}`

---

## 7. Products

**GET** `/api/manager/products`  
**Query:** `q`, `status` (active|inactive)

View only. Use when creating/editing orders to pick products.

**Response:** `{ ok: true, products: [{ id, sku, name, description, unit, is_active, current_price, currency_code, ... }] }`

---

## 8. Visits (rep-specific per shop)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/manager/visits` | List visits |
| POST | `/api/manager/visits` | Start visit |
| PATCH | `/api/manager/visits/[visitId]` | End visit |

**GET list – Query:** `shop` (shop_id), `rep`, `date_from`, `date_to`  
**Reps:** Only their visits.

**POST start – Body:** `{ "shopId": "uuid" }`  
**Reps:** Only for shops assigned to them.

**PATCH end – Body:** `{ "end": true }`

**Usage:** ShopDetailScreen – call `GET /api/manager/visits?shop={shopId}` for "Last visit" and "Visit history". Start visit when rep arrives; end when leaving.

---

## 9. Tasks (assigned to reps)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/manager/tasks` | List tasks |
| GET | `/api/manager/tasks/[taskId]` | Single task |
| POST | `/api/manager/tasks` | Create task (boss/manager only) |
| PATCH | `/api/manager/tasks/[taskId]` | Update task |

**GET list – Query:** `status` (pending|completed|cancelled), `rep`  
**Reps:** Only tasks assigned to them.

**POST create – Body:**
```json
{
  "repCompanyUserId": "uuid",
  "title": "string",
  "description": "string",
  "dueAt": "ISO8601",
  "leadId": "uuid",
  "shopId": "uuid"
}
```

**PATCH update – Body:** `{ status?, dueAt?, title?, description? }`  
Reps can complete (`status: "completed"`), reschedule (`dueAt`), or update their own tasks.

---

## 10. Naming conventions

- **Request bodies:** camelCase (`shopId`, `repCompanyUserId`, `dueAt`)
- **Responses:** snake_case (`shop_id`, `rep_company_user_id`, `due_at`)

---

## 11. Feature wiring summary

| Screen / Feature | API calls |
|------------------|-----------|
| Login | POST /api/auth/login |
| App launch / session | GET /api/auth/me |
| Profile | GET /api/auth/me, PATCH /api/profile |
| Leads list | GET /api/manager/leads |
| Lead detail | GET /api/manager/leads/[leadId] |
| Add lead | POST /api/manager/leads |
| Update lead status | PATCH /api/manager/leads/[leadId] |
| Convert lead to customer | POST /api/manager/leads/[leadId]/convert-to-shop |
| Shops list | GET /api/manager/shops |
| Shop detail | GET /api/manager/shops/[shopId] |
| Shop notes (view) | In shop response |
| Shop notes (edit) | PATCH /api/manager/shops/[shopId] (boss/manager) |
| Shop visit history | GET /api/manager/visits?shop={shopId} |
| Start visit | POST /api/manager/visits |
| End visit | PATCH /api/manager/visits/[visitId] |
| Orders list | GET /api/manager/orders |
| Orders by shop | GET /api/manager/orders?shop={shopId} |
| Order detail | GET /api/manager/orders/[orderId] |
| Create order | POST /api/manager/orders |
| Edit order | PATCH /api/manager/orders/[orderId] (when status=received) |
| Products (for order) | GET /api/manager/products |
| Tasks list | GET /api/manager/tasks |
| Task detail | GET /api/manager/tasks/[taskId] |
| Complete task | PATCH /api/manager/tasks/[taskId] |

---

## 12. Health check

**GET** `/api/health/db`  
No auth. Use to verify API availability before/during use.
