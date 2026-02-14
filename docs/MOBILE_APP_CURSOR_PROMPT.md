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
  - Reps: only leads they created (`created_by_company_user_id`)
- `POST /api/manager/leads` – create lead  
  - Body: `{ name, shopId?, contactName?, phone?, email?, address?, assignedRepCompanyUserId?, notes? }`
- `PATCH /api/manager/leads/[leadId]` – update lead (incl. status)  
  - Body: `{ shopId?, name?, contactName?, phone?, email?, address?, status?, assignedRepCompanyUserId?, notes? }`  
  - **Note:** Current API allows boss/manager only. Reps need backend change to update their own leads.
- `DELETE /api/manager/leads/[leadId]` – delete lead (boss/manager only; app may not expose)

### Shops
- `GET /api/manager/shops` – list shops  
  - Query: `q` (search)  
  - **Note:** Current API allows boss/manager/back_office only, not rep. Reps need their assigned shops. Backend must either add rep support with filter by `shop_assignments`, or provide a rep-specific shops endpoint.

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
- `PATCH /api/manager/orders/[orderId]` – update order (status forward only: received→processing→shipped→closed)  
  - Body: `{ status?, notes? }`  
  - **Note:** Boss/manager/back_office only; reps typically only create and view.
- `POST /api/manager/orders/[orderId]/cancel` – cancel order (boss/manager/back_office; app may not expose)

### Products
- `GET /api/manager/products` – list products (view only)  
  - Query: `q`, `status` (active|inactive)

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

1. ~~**Bearer token auth**~~ – Done: `getRequestSession` accepts `Authorization: Bearer <token>`.
2. ~~**Login response**~~ – Done: Login returns `token` in the JSON body.
3. **Shops for reps:** Allow rep role on `GET /api/manager/shops` and filter results by `shop_assignments` where `rep_company_user_id = current user`.
4. **Lead update for reps:** Allow rep role on `PATCH /api/manager/leads/[leadId]` and restrict updates to leads where `created_by_company_user_id = current user` OR `assigned_rep_company_user_id = current user`.

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
