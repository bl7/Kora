# SalesSuite API Reference

Complete reference for all API routes, authentication, permissions, and request/response datatypes.

**Base URL:** `https://kora-sand.vercel.app` (production) or `http://localhost:3000` (local)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Company Roles & Permissions](#2-company-roles--permissions)
3. [Boss Portal (separate auth)](#3-boss-portal-separate-auth)
4. [Auth Routes (company users)](#4-auth-routes-company-users)
5. [Profile](#5-profile)
6. [Leads](#6-leads)
7. [Shops](#7-shops)
8. [Orders](#8-orders)
9. [Products](#9-products)
10. [Visits](#10-visits)
11. [Tasks](#11-tasks)
12. [Staff](#12-staff)
13. [Shop Assignments](#13-shop-assignments)
14. [Public / No Auth](#14-public--no-auth)

---

## 1. Authentication

### How Auth Works

- **Company users (managers, reps, etc.):** JWT via `Authorization: Bearer <token>` or cookie `kora_session`
- **Boss portal:** Cookie `kora_boss_session` only (no Bearer for boss routes)
- All errors: `{ ok: false, error: string }`
- **401:** Unauthorized — clear token, redirect to login
- **403 with `subscriptionExpired: true`:** Show Subscription Expired screen, clear token

### Headers (company user APIs)

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 2. Company Roles & Permissions

| Role        | Description                    |
|-------------|--------------------------------|
| `boss`      | Company owner, full access     |
| `manager`   | Admin, manage staff & data     |
| `rep`       | Field rep, limited to own data |
| `back_office` | Office staff, no field limits |

### Role Scoping

| Resource   | Rep Access |
|-----------|------------|
| Leads     | Only leads they **created** (list); created or **assigned** (single) |
| Shops     | Only shops **assigned** to them |
| Orders    | Only orders they **placed** |
| Visits    | Only their visits |
| Tasks     | Only tasks **assigned** to them |
| Staff     | Read-only (list); no create/update/deactivate |
| Shop assignments | No access |

---

## 3. Boss Portal (Separate Auth)

Boss routes use **cookie-based** auth only. No Bearer token.

### POST `/api/boss/auth/login`

**Request body:**
```ts
{
  email: string;      // email format, max 255 chars
  password: string;   // min 1, max 128 chars
}
```

**Response 200:**
```ts
{
  ok: true;
  boss: {
    id: string;       // UUID
    email: string;
    fullName: string;
  };
}
```
Sets `kora_boss_session` cookie.

---

### GET `/api/boss/auth/me`

**Response 200:**
```ts
{
  ok: true;
  boss: {
    id: string;
    email: string;
    fullName: string;
  };
}
```

---

### POST `/api/boss/auth/logout`

No body. Clears boss session cookie.

---

### GET `/api/boss/companies`

**Query params:**
- `q?: string` — search (company name, contact email)
- `page?: number` — default 1
- `limit?: number` — 5–50, default 10

**Response 200:**
```ts
{
  ok: true;
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    createdAt: string;          // ISO8601
    address: string;
    subscriptionEndsAt: string | null;
    subscriptionSuspended: boolean;
    staffLimit: number;
    contactEmail: string | null;
    contactPhone: string | null;
    staff: {
      total: number;
      active: number;
      inactive: number;
      invited: number;
    };
  }>;
  totals: {
    companies: number;
    activeSubscription: number;
    expiredSubscription: number;
  };
  totalCount: number;
  page: number;
  limit: number;
  recentSignups: Array<{ name: string; createdAt: string }>;
}
```

---

### PATCH `/api/boss/companies/[companyId]`

**Request body:**
```ts
{
  staffLimit: number;   // int 0–500
}
```

**Response 200:**
```ts
{ ok: true; staffLimit: number; }
```

---

### POST `/api/boss/companies/[companyId]/subscription`

**Request body (discriminated by `action`):**
```ts
| { action: "add_months"; months: number; note?: string; amountNotes?: string; kind?: "payment" | "complimentary"; }
| { action: "add_days"; days: number; note?: string; kind?: "grace" | "complimentary"; }
| { action: "suspend"; }
| { action: "resume"; }
```
- `months`: 1–120
- `days`: 1–365
- `note`: max 1000
- `amountNotes`: max 500

**Response 200 (add_months / add_days):**
```ts
{ ok: true; subscriptionEndsAt: string; }  // ISO8601
```

**Response 200 (suspend / resume):**
```ts
{ ok: true; }
```

---

### GET `/api/boss/bosses`

**Response 200:**
```ts
{
  ok: true;
  bosses: Array<{
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
  }>;
}
```

---

### POST `/api/boss/bosses`

**Request body:**
```ts
{
  email: string;      // email format, max 255
  password: string;   // min 8, max 128
  fullName?: string;  // max 255
}
```

**Response 200:**
```ts
{ ok: true; }
```

---

### PATCH `/api/boss/bosses/[bossId]`

**Request body:**
```ts
{
  email?: string;        // email format, max 255
  fullName?: string;     // max 255
  newPassword?: string;  // min 8, max 128 (only for self)
}
```

**Response 200:**
```ts
{ ok: true; }
```

---

### DELETE `/api/boss/bosses/[bossId]`

No body. Cannot delete self. **Response 200:** `{ ok: true; }`

---

## 4. Auth Routes (Company Users)

### POST `/api/auth/login`

**Request body:**
```ts
{
  email: string;           // email format, max 255
  password: string;        // min 8, max 128
  companySlug?: string;    // min 2, max 80 (optional, for multi-company users)
}
```

**Response 200:**
```ts
{
  ok: true;
  token: string;
  session: {
    userId: string;
    fullName: string;
    companyId: string;
    companySlug: string;
    companyName: string;
    companyUserId: string;
    role: "boss" | "manager" | "rep" | "back_office";
  };
}
```
Sets `kora_session` cookie.

**Errors:** 401 (invalid creds), 403 (email not verified).

---

### GET `/api/auth/me`

**Response 200:**
```ts
{
  ok: true;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: "boss" | "manager" | "rep" | "back_office";
    companyUserId: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    address: string;
    plan: string;
    subscriptionEndsAt: string | null;
    staffLimit: number;
    staffCount: number;
  };
}
```

**Response 403 (subscription expired):**
```ts
{
  ok: false;
  error: string;
  subscriptionExpired: true;
  companyName: string;
}
```

---

### POST `/api/auth/logout`

No body. Clears session cookie.

---

### POST `/api/auth/signup-company`

**Request body:**
```ts
{
  companyName: string;   // min 2, max 120
  companySlug?: string;  // min 2, max 80
  address: string;       // min 1, max 500
  fullName: string;      // min 2, max 120
  email: string;         // email format, max 255
  password: string;      // min 8, max 128
  phone: string;         // regex /^\+977\d{10}$/
  role?: "boss" | "manager";  // default "manager"
}
```

**Response 201:**
```ts
{
  ok: true;
  company: { id: string; name: string; slug: string; };
  user: { id: string; email: string; fullName: string; role: string; companyUserId: string; };
}
```

---

### GET `/api/auth/verify-email`

**Query:** `token: string` (required)

Redirects to `/auth/login`. No JSON response.

---

### POST `/api/auth/forgot-password`

**Request body:**
```ts
{ email: string; }  // email format, max 255
```

**Response 200:**
```ts
{ ok: true; message: string; }
```

---

### POST `/api/auth/reset-password`

**Request body:**
```ts
{
  token: string;    // min 1
  password: string; // min 8, max 128
}
```

**Response 200:**
```ts
{ ok: true; message: string; }
```

---

## 5. Profile

### PATCH `/api/profile`

**Request body:**
```ts
{
  fullName?: string;  // min 2, max 120
  email?: string;     // email format, max 255
  phone?: string;     // min 10, max 20; Nepal format +977XXXXXXXXX
}
```

**Response 200:**
```ts
{ ok: true; }
```

---

## 6. Leads

### GET `/api/manager/leads`

**Query params:**
- `status?: "new" | "contacted" | "qualified" | "converted" | "lost"`
- `q?: string` — search (name, contact_name, phone)

**Response 200:**
```ts
{ ok: true; leads: Array<LeadRow>; }
```
`LeadRow`: `id`, `name`, `contact_name`, `phone`, `email`, `address`, `status`, `notes`, `converted_at`, `created_at`, `updated_at`, `shop_name`, `assigned_rep_name` (snake_case).

---

### GET `/api/manager/leads/[leadId]`

**Response 200:**
```ts
{ ok: true; lead: LeadDetailRow; }
```
`LeadDetailRow` includes `assigned_rep_company_user_id`, `created_by_company_user_id`, `shop_name`, `assigned_rep_name`.

---

### POST `/api/manager/leads`

**Request body:**
```ts
{
  name: string;                    // min 1, max 200 (required)
  shopId?: string;                 // UUID
  contactName?: string;            // max 120
  phone?: string;                  // max 30
  email?: string;                  // email format, max 255
  address?: string;                // max 500
  assignedRepCompanyUserId?: string;  // UUID
  notes?: string;                  // max 2000
}
```

**Response 201:**
```ts
{ ok: true; lead: LeadRow; }
```

---

### PATCH `/api/manager/leads/[leadId]`

**Request body:**
```ts
{
  shopId?: string | null;
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status?: "new" | "contacted" | "qualified" | "converted" | "lost";
  assignedRepCompanyUserId?: string | null;  // Reps cannot change this
  notes?: string | null;
}
```

**Response 200:**
```ts
{ ok: true; lead: LeadRow; }
```

---

### DELETE `/api/manager/leads/[leadId]`

No body. **Roles:** boss, manager only. **Response 200:** `{ ok: true; deleted: true; }`

---

### POST `/api/manager/leads/[leadId]/convert-to-shop`

No body. **Roles:** boss, manager, rep (reps only for leads assigned to them or they created).

**Response 200:**
```ts
{
  ok: true;
  shop: { id: string; name: string };
  message: string;
}
```

---

## 7. Shops

### GET `/api/manager/shops`

**Query params:** `q?: string` — search (name, external_shop_code)

**Response 200:**
```ts
{ ok: true; shops: Array<ShopRow>; }
```
`ShopRow`: `id`, `external_shop_code`, `name`, `contact_name`, `phone`, `address`, `notes`, `latitude`, `longitude`, `geofence_radius_m`, `location_source`, `location_verified`, `assignment_count`, etc. (snake_case).

---

### GET `/api/manager/shops/[shopId]`

**Response 200:**
```ts
{ ok: true; shop: ShopRow; }
```

---

### POST `/api/manager/shops`

**Request body:**
```ts
{
  externalShopCode?: string;     // max 80
  name: string;                  // min 2, max 150
  contactName?: string;          // max 120
  phone?: string;                // max 30
  address?: string;              // max 500
  latitude: number;              // -90 to 90
  longitude: number;             // -180 to 180
  geofenceRadiusM?: number;      // int 1–500, default 60
  locationSource?: "manual_pin" | "gps_capture" | "imported";  // default "manual_pin"
  locationVerified?: boolean;    // default false
  locationAccuracyM?: number;    // 0–99999
  arrivalPromptEnabled?: boolean; // default true
  minDwellSeconds?: number;      // int min 0, default 120
  cooldownMinutes?: number;      // int min 0, default 30
  timezone?: string;             // max 64
}
```

**Response 201:**
```ts
{ ok: true; shop: ShopRow; }
```

---

### PATCH `/api/manager/shops/[shopId]`

**Request body:**
```ts
{
  externalShopCode?: string | null;
  name?: string;
  notes?: string | null;
  contactName?: string | null;
  phone?: string | null;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  geofenceRadiusM?: number;
  locationSource?: "manual_pin" | "gps_capture" | "imported";
  locationVerified?: boolean;
  locationAccuracyM?: number | null;
  arrivalPromptEnabled?: boolean;
  minDwellSeconds?: number;
  cooldownMinutes?: number;
  timezone?: string | null;
  isActive?: boolean;
}
```

**Response 200:**
```ts
{ ok: true; shop: ShopRow; }
```

---

## 8. Orders

### GET `/api/manager/orders`

**Query params:**
- `status?: string` — received, processing, shipped, closed, cancelled
- `q?: string` — search (order_number, shop name, placed_by name)
- `date_from?: string` — ISO8601
- `date_to?: string` — ISO8601
- `rep?: string` — placed_by company_user_id (UUID)
- `shop?: string` — shop_id (UUID)
- `sort?: "placed_at_asc" | "placed_at_desc"` — default placed_at_desc

**Response 200:**
```ts
{ ok: true; orders: Array<OrderRow>; }
```
`OrderRow`: `id`, `order_number`, `status`, `notes`, `total_amount`, `currency_code`, `placed_at`, `shop_id`, `shop_name`, `lead_name`, `placed_by_name`, `items`, etc. (snake_case).

---

### GET `/api/manager/orders/counts`

**Response 200:**
```ts
{
  ok: true;
  counts: {
    received: number;
    processing: number;
    shipped: number;
    closed: number;
    cancelled: number;
  };
}
```

---

### GET `/api/manager/orders/[orderId]`

**Response 200:**
```ts
{ ok: true; order: OrderDetailRow; }
```
`OrderDetailRow` includes `items` (array of `{ id, product_name, product_sku, quantity, unit_price, line_total, notes }`), `cancelled_by_name`, etc.

---

### POST `/api/manager/orders`

**Request body:**
```ts
{
  shopId?: string;      // UUID
  leadId?: string;      // UUID
  notes?: string;       // max 2000
  currencyCode?: string; // length 3, default "NPR"
  items: Array<{
    productId?: string;    // UUID
    productName: string;   // min 1, max 200 (required)
    productSku?: string;   // max 80
    quantity: number;      // positive (required)
    unitPrice: number;     // nonnegative (required)
    notes?: string;        // max 500
  }>;  // min 1 item
}
```

**Response 201:**
```ts
{ ok: true; order: OrderRow; }
```

---

### PATCH `/api/manager/orders/[orderId]`

**Request body:**
```ts
{
  status?: "processing" | "shipped" | "closed";  // boss/manager/back_office only; forward only
  notes?: string | null;
  shopId?: string | null;   // UUID; only when status=received
  leadId?: string | null;   // UUID; only when status=received
  items?: Array<{
    productId?: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;  // full replacement; only when status=received; min 1
}
```

**Response 200:**
```ts
{ ok: true; order: OrderRow; }
```

---

### POST `/api/manager/orders/[orderId]/cancel`

**Roles:** boss, manager, back_office (reps cannot cancel).

**Request body:**
```ts
{
  cancel_reason: "Customer requested" | "Out of stock" | "Duplicate order" | "Wrong address" | "Payment issue" | "Other";
  cancel_note?: string;  // max 2000
}
```

**Response 200:**
```ts
{ ok: true; order: OrderRow; }
```
Cancel allowed from `received`, `processing`, and (if `ALLOW_CANCEL_AFTER_SHIP=true`) `shipped`.

---

## 9. Products

### GET `/api/manager/products`

**Query params:**
- `q?: string` — search (name, sku)
- `status?: "active" | "inactive"`

**Response 200:**
```ts
{
  ok: true;
  products: Array<{
    id: string;
    sku: string;
    name: string;
    description: string | null;
    unit: string;
    is_active: boolean;
    current_price: number | null;
    currency_code: string | null;
    order_count: number;
    created_at: string;
    updated_at: string;
    ...
  }>;
}
```

---

### POST `/api/manager/products`

**Request body:**
```ts
{
  sku: string;           // min 1, max 80
  name: string;          // min 2, max 200
  description?: string;  // max 2000
  unit?: string;         // min 1, max 30, default "unit"
  price?: number;        // nonnegative
  currencyCode?: string; // length 3, default "NPR"
  status?: "active" | "inactive";
}
```

**Response 201:**
```ts
{ ok: true; product: ProductRow; }
```

---

### GET `/api/manager/products/[productId]`

**Response 200:**
```ts
{
  ok: true;
  product: ProductRow;
  prices: Array<{
    id: string;
    price: number;
    currency_code: string;
    starts_at: string;
    ends_at: string | null;
    created_at: string;
  }>;
}
```

---

### PATCH `/api/manager/products/[productId]`

**Request body:**
```ts
{
  sku?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
}
```

**Response 200:**
```ts
{ ok: true; product: ProductRow; }
```

---

### DELETE `/api/manager/products/[productId]`

No body. Fails if product is used in orders. **Response 200:** `{ ok: true; deleted: true; }`

---

### POST `/api/manager/products/[productId]/prices`

**Request body:**
```ts
{
  price: number;         // nonnegative
  currencyCode?: string; // length 3, default "NPR"
}
```

**Response 201:**
```ts
{ ok: true; price: { id, price, currency_code, starts_at, ends_at, created_at }; }
```

---

## 10. Visits

### GET `/api/manager/visits`

**Query params:**
- `shop?: string` — shop_id (UUID)
- `rep?: string` — rep_company_user_id (UUID)
- `date_from?: string` — ISO8601
- `date_to?: string` — ISO8601

**Response 200:**
```ts
{
  ok: true;
  visits: Array<{
    id: string;
    shop_id: string;
    rep_company_user_id: string;
    rep_name: string;
    started_at: string;
    ended_at: string | null;
    ...
  }>;
}
```

---

### POST `/api/manager/visits`

**Request body:**
```ts
{ shopId: string; }  // UUID
```

**Response 201:**
```ts
{ ok: true; visit: { id, shop_id, rep_company_user_id, started_at, ended_at }; }
```

---

### PATCH `/api/manager/visits/[visitId]`

**Request body:**
```ts
{ end: true; }
```

**Response 200:**
```ts
{ ok: true; visit: { id, shop_id, rep_company_user_id, started_at, ended_at }; }
```

---

## 11. Tasks

### GET `/api/manager/tasks`

**Query params:**
- `status?: "pending" | "completed" | "cancelled"`
- `rep?: string` — rep_company_user_id (UUID)

**Response 200:**
```ts
{ ok: true; tasks: Array<TaskRow>; }
```
`TaskRow`: `id`, `rep_company_user_id`, `rep_name`, `title`, `description`, `status`, `due_at`, `completed_at`, `lead_id`, `shop_id`, `created_at`, `updated_at` (snake_case).

---

### GET `/api/manager/tasks/[taskId]`

**Response 200:**
```ts
{ ok: true; task: TaskRow; }
```

---

### POST `/api/manager/tasks`

**Request body:**
```ts
{
  repCompanyUserId: string;   // UUID, must be active rep in company
  title: string;
  description?: string;
  dueAt: string;              // ISO8601
  leadId?: string;            // UUID
  shopId?: string;            // UUID
}
```

**Response 201:**
```ts
{ ok: true; task: TaskRow; }
```

---

### PATCH `/api/manager/tasks/[taskId]`

**Request body:**
```ts
{
  status?: "pending" | "completed" | "cancelled";
  dueAt?: string;    // ISO8601
  title?: string;
  description?: string;
}
```

**Response 200:**
```ts
{ ok: true; task: TaskRow; }
```

---

## 12. Staff

### GET `/api/manager/staff`

**Query params:**
- `q?: string` — search
- `status?: "active" | "inactive" | "invited"`
- `role?: "rep" | "manager" | "back_office" | "boss"`

**Response 200:**
```ts
{ ok: true; staff: Array<StaffRow>; }
```
`StaffRow`: `id`, `role`, `status`, `full_name`, `email`, `phone`, `manager_company_user_id`, `assignment_count`, etc. (snake_case).

---

### POST `/api/manager/staff`

**Request body:**
```ts
{
  email: string;              // email format
  fullName: string;           // min 2, max 120
  phone?: string;             // min 10, max 20; normalized to +977XXXXXXXXX
  role?: "manager" | "rep" | "back_office";  // default "rep"
  managerCompanyUserId?: string;  // UUID, for rep hierarchy
}
```

**Response 201:**
```ts
{ ok: true; staff: { id, role, status }; inviteSent: boolean; }
```

---

### PATCH `/api/manager/staff/[companyUserId]`

**Request body:**
```ts
{
  fullName?: string;
  email?: string;
  role?: "manager" | "rep" | "back_office";
  status?: "invited" | "active" | "inactive";
  phone?: string;
  managerCompanyUserId?: string | null;
}
```

**Response 200:**
```ts
{ ok: true; staff: StaffRow; }
```

---

### POST `/api/manager/staff/[companyUserId]/resend-invite`

No body. **Response 200:** `{ ok: true; }`

---

### GET `/api/manager/staff/[companyUserId]/deactivate-preview`

**Response 200:**
```ts
{
  ok: true;
  shops_only_this_rep: Array<{ shop_id: string; shop_name: string }>;
  shops_other_reps_too: Array<{ shop_id: string; shop_name: string }>;
}
```

---

### PATCH `/api/manager/staff/[companyUserId]/deactivate`

**Request body:**
```ts
{
  reassignments?: Record<string, string>;  // shopId -> repCompanyUserId (UUID)
}
```
Required for shops where this rep is the only one; provide reassignment to an active rep.

**Response 200:**
```ts
{ ok: true; }
```

---

### POST `/api/manager/staff/[companyUserId]/activate`

No body. **Response 200:** `{ ok: true; }`

---

## 13. Shop Assignments

### GET `/api/manager/shop-assignments`

**Response 200:**
```ts
{
  ok: true;
  assignments: Array<{
    id: string;
    shop_id: string;
    rep_company_user_id: string;
    is_primary: boolean;
  }>;
}
```

---

### POST `/api/manager/shop-assignments`

**Request body:**
```ts
{
  shopId: string;          // UUID
  repCompanyUserId: string; // UUID, must be rep in company
  isPrimary?: boolean;     // default false
}
```

**Response 201:**
```ts
{ ok: true; assignment: AssignmentRow; }
```

---

### DELETE `/api/manager/shop-assignments/[assignmentId]`

No body. **Response 200:** `{ ok: true; }`

---

## 14. Public / No Auth

### POST `/api/contact`

**Request body:**
```ts
{
  name: string;      // min 2, max 120
  company: string;   // min 2, max 200
  email: string;     // email format, max 255
  phone: string;     // regex /^\+977\d{10}$/
  teamSize: string;  // min 1
  message: string;   // min 10, max 2000
}
```

**Response 200:**
```ts
{ ok: true; message: string; }
```

---

### GET `/api/health/db`

No auth, no body.

**Response 200:**
```ts
{ ok: true; database: "connected"; result: number; }
```

**Response 500:**
```ts
{ ok: false; database: "disconnected"; error: string; }
```

---

## Naming Conventions

- **Request bodies:** camelCase (`shopId`, `repCompanyUserId`, `dueAt`)
- **Responses:** snake_case (`shop_id`, `rep_company_user_id`, `due_at`)

---

## Route Summary Table

| Path | GET | POST | PATCH | DELETE |
|------|-----|------|-------|--------|
| `/api/auth/login` | — | ✓ | — | — |
| `/api/auth/me` | ✓ | — | — | — |
| `/api/auth/logout` | — | ✓ | — | — |
| `/api/auth/signup-company` | — | ✓ | — | — |
| `/api/auth/verify-email` | ✓ | — | — | — |
| `/api/auth/forgot-password` | — | ✓ | — | — |
| `/api/auth/reset-password` | — | ✓ | — | — |
| `/api/profile` | — | — | ✓ | — |
| `/api/manager/leads` | ✓ | ✓ | — | — |
| `/api/manager/leads/[leadId]` | ✓ | — | ✓ | ✓ |
| `/api/manager/leads/[leadId]/convert-to-shop` | — | ✓ | — | — |
| `/api/manager/shops` | ✓ | ✓ | — | — |
| `/api/manager/shops/[shopId]` | ✓ | — | ✓ | — |
| `/api/manager/orders` | ✓ | ✓ | — | — |
| `/api/manager/orders/counts` | ✓ | — | — | — |
| `/api/manager/orders/[orderId]` | ✓ | — | ✓ | — |
| `/api/manager/orders/[orderId]/cancel` | — | ✓ | — | — |
| `/api/manager/products` | ✓ | ✓ | — | — |
| `/api/manager/products/[productId]` | ✓ | — | ✓ | ✓ |
| `/api/manager/products/[productId]/prices` | — | ✓ | — | — |
| `/api/manager/visits` | ✓ | ✓ | — | — |
| `/api/manager/visits/[visitId]` | — | — | ✓ | — |
| `/api/manager/tasks` | ✓ | ✓ | — | — |
| `/api/manager/tasks/[taskId]` | ✓ | — | ✓ | — |
| `/api/manager/staff` | ✓ | ✓ | — | — |
| `/api/manager/staff/[companyUserId]` | — | — | ✓ | — |
| `/api/manager/staff/[companyUserId]/resend-invite` | — | ✓ | — | — |
| `/api/manager/staff/[companyUserId]/deactivate` | — | — | ✓ | — |
| `/api/manager/staff/[companyUserId]/deactivate-preview` | ✓ | — | — | — |
| `/api/manager/staff/[companyUserId]/activate` | — | ✓ | — | — |
| `/api/manager/shop-assignments` | ✓ | ✓ | — | — |
| `/api/manager/shop-assignments/[assignmentId]` | — | — | — | ✓ |
| `/api/boss/auth/login` | — | ✓ | — | — |
| `/api/boss/auth/me` | ✓ | — | — | — |
| `/api/boss/auth/logout` | — | ✓ | — | — |
| `/api/boss/companies` | ✓ | — | — | — |
| `/api/boss/companies/[companyId]` | — | — | ✓ | — |
| `/api/boss/companies/[companyId]/subscription` | — | ✓ | — | — |
| `/api/boss/bosses` | ✓ | ✓ | — | — |
| `/api/boss/bosses/[bossId]` | — | — | ✓ | ✓ |
| `/api/contact` | — | ✓ | — | — |
| `/api/health/db` | ✓ | — | — | — |
