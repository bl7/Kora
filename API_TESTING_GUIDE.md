# API Testing Checklist

This guide provides a structured checklist for testing the SalesSuite API. Routes are ordered by dependency (e.g., you need to log in before creating a shop).

## 1. System & Authentication
*These endpoints must be tested first.*

- [ ] **Database Health**
  - `GET /api/health/db`
  - **Expect:** 200 OK `{ "ok": true, "database": "connected" }`

- [ ] **Company Signup** (Creates Admin User)
  - `POST /api/auth/signup-company`
  - **Body:** `{ companyName, companySlug, address, fullName, email, password, phone, role: "manager" }`
  - **Expect:** 201 Created

- [ ] **Login**
  - `POST /api/auth/login`
  - **Body:** `{ email, password }`
  - **Expect:** 200 OK + `Set-Cookie` header

- [ ] **Get Current User**
  - `GET /api/auth/me`
  - **Expect:** 200 OK `{ user: {...}, company: {...} }`

- [ ] **Logout**
  - `POST /api/auth/logout`
  - **Expect:** 200 OK (Cookie cleared)

---

## 2. Staff Management
*Requires Manager/Boss Login.*

- [ ] **List Staff**
  - `GET /api/manager/staff`
  - **Expect:** 200 OK `[ { ... }, ... ]`

- [ ] **Invite Staff**
  - `POST /api/manager/staff`
  - **Body:** `{ fullName, email, phone, role: "rep" }`
  - **Expect:** 201 Created

- [ ] **Update Staff**
  - `PATCH /api/manager/staff/[id]`
  - **Body:** `{ fullName, role }`
  - **Expect:** 200 OK

- [ ] **Deactivate Staff**
  - `POST /api/manager/staff/[id]/deactivate`
  - **Body:** `{ reassignments: {} }` (optional)
  - **Expect:** 200 OK

---

## 3. Core Resources (Shops & Products)
*Requires Manager/Boss Login.*

- [ ] **List Shops**
  - `GET /api/manager/shops`
  - **Expect:** 200 OK

- [ ] **Create Shop**
  - `POST /api/manager/shops`
  - **Body:** `{ name, latitude, longitude, geofenceRadius, externalShopCode }`
  - **Expect:** 201 Created

- [ ] **Get Shop Details**
  - `GET /api/manager/shops/[id]`
  - **Expect:** 200 OK

- [ ] **Update Shop**
  - `PATCH /api/manager/shops/[id]`
  - **Body:** `{ name, isActive }`
  - **Expect:** 200 OK

- [ ] **List Products**
  - `GET /api/manager/products`
  - **Expect:** 200 OK

- [ ] **Create Product**
  - `POST /api/manager/products`
  - **Body:** `{ name, sku, unit, price }`
  - **Expect:** 201 Created

- [ ] **Update Product Price**
  - `POST /api/manager/products/[id]/prices`
  - **Body:** `{ price, currencyCode }`
  - **Expect:** 201 Created

---

## 4. Operational Flows
*Test with "Manager" and "Rep" roles.*

### Leads
- [ ] **Create Lead**
  - `POST /api/manager/leads`
  - **Body:** `{ name, contactName, phone, assignedRepCompanyUserId }`
  - **Expect:** 201 Created
- [ ] **List Leads**
  - `GET /api/manager/leads`
  - **Expect:** 200 OK
- [ ] **Convert Lead to Shop**
  - `POST /api/manager/leads/[id]/convert-to-shop`
  - **Expect:** 201 Created `{ shop: {...} }`

### Orders
- [ ] **Create Order**
  - `POST /api/manager/orders`
  - **Body:** `{ shopId, items: [{ productId, quantity, unitPrice }] }`
  - **Expect:** 201 Created
- [ ] **List Orders**
  - `GET /api/manager/orders`
  - **Expect:** 200 OK
- [ ] **Update Order Status**
  - `PATCH /api/manager/orders/[id]`
  - **Body:** `{ status: "processing" }`
  - **Expect:** 200 OK
- [ ] **Cancel Order**
  - `POST /api/manager/orders/[id]/cancel`
  - **Body:** `{ cancel_reason: "Customer requested" }`
  - **Expect:** 200 OK

### Visits & Attendance
- [ ] **Clock In**
  - `POST /api/manager/attendance/clock-in`
  - **Body:** `{ latitude, longitude }`
  - **Expect:** 201 Created
- [ ] **Start Visit**
  - `POST /api/manager/visits`
  - **Body:** `{ shopId }`
  - **Expect:** 201 Created
- [ ] **End Visit**
  - `PATCH /api/manager/visits/[id]`
  - **Body:** `{ endedAt: "..." }`
  - **Expect:** 200 OK
- [ ] **Clock Out**
  - `POST /api/manager/attendance/clock-out`
  - **Body:** `{ latitude, longitude }`
  - **Expect:** 200 OK

### Tasks
- [ ] **Create Task**
  - `POST /api/manager/tasks`
  - **Body:** `{ title, repCompanyUserId, dueAt }`
  - **Expect:** 201 Created
- [ ] **Complete Task**
  - `PATCH /api/manager/tasks/[id]`
  - **Body:** `{ status: "completed" }`
  - **Expect:** 200 OK
