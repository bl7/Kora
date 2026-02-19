# SalesSuite API Documentation

**Version:** 1.0  
**Base URL:** `https://your-domain.com/api`  
**Authentication:** Session-based (HTTP-only cookies)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Attendance](#attendance)
3. [Leads](#leads)
4. [Orders](#orders)
5. [Products](#products)
6. [Shops & Assignments](#shops--assignments)
7. [Staff Management](#staff-management)
8. [Tasks](#tasks)
9. [Visits](#visits)
10. [Profile & Contact](#profile--contact)
11. [Email Templates](#email-templates)
12. [Database Schema](#database-schema)

---

## System

### GET `/api/health/db`
**Description:** Health check for database connection.

**Response (200):**
```json
{
  "ok": true,
  "database": "connected",
  "result": 1
}
```

**Response (500):**
```json
{
  "ok": false,
  "database": "disconnected",
  "error": "..."
}
```

---

## Authentication

### POST `/api/auth/login`
**Description:** Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "user@example.com",
    "phone": "+9779812345678",
    "role": "manager",
    "companyUserId": "uuid"
  },
  "company": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "address": "123 Main St",
    "plan": "starter",
    "subscriptionEndsAt": "2026-03-01T00:00:00Z",
    "staffLimit": 5,
    "staffCount": 3
  }
}
```

**Tables Accessed:**
- `users` (SELECT by email)
- `company_users` (SELECT by user_id)
- `companies` (SELECT by company_id)

---

### POST `/api/auth/signup-company`
**Description:** Register a new company and admin user.

**Request Body:**
```json
{
  "companyName": "Acme Inc",
  "companySlug": "acme-inc",
  "address": "123 Main St, Kathmandu",
  "fullName": "John Doe",
  "email": "john@acme.com",
  "password": "SecurePass123!",
  "phone": "+9779812345678",
  "role": "manager"
}
```

**Response (201):**
```json
{
  "ok": true,
  "company": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc"
  },
  "user": {
    "id": "uuid",
    "email": "john@acme.com",
    "fullName": "John Doe",
    "role": "manager",
    "companyUserId": "uuid"
  }
}
```

**Tables Accessed:**
- `companies` (INSERT)
- `users` (INSERT or SELECT if email exists)
- `company_users` (INSERT)
- `email_tokens` (INSERT for verification)

**Email Sent:** Email verification link

---

### POST `/api/auth/forgot-password`
**Description:** Request a password reset link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "If an account with that email exists, a reset link has been sent."
}
```

**Tables Accessed:**
- `users` (SELECT by email)
- `email_tokens` (INSERT)

**Email Sent:** Password reset link

---

### POST `/api/auth/reset-password`
**Description:** Reset password using a token.

**Request Body:**
```json
{
  "token": "uuid-token-from-email",
  "password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password has been reset. You can now log in."
}
```

**Tables Accessed:**
- `email_tokens` (SELECT and DELETE)
- `users` (UPDATE password_hash)

---

### GET `/api/auth/verify-email`
**Description:** Verify email address via token.

**Query Parameters:**
- `token` (string, required): Verification token from email

**Response:** Redirects to `/auth/login?verified=true`

**Tables Accessed:**
- `email_tokens` (SELECT and DELETE)
- `users` (UPDATE email_verified_at)
- `company_users` (UPDATE status to 'active')

---

### GET `/api/auth/me`
**Description:** Get current authenticated user's session details.

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@acme.com",
    "phone": "+9779812345678",
    "role": "manager",
    "companyUserId": "uuid"
  },
  "company": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "address": "123 Main St",
    "plan": "starter",
    "subscriptionEndsAt": "2026-03-01T00:00:00Z",
    "staffLimit": 5,
    "staffCount": 3
  }
}
```

**Tables Accessed:**
- `company_users` (SELECT)
- `users` (JOIN)
- `companies` (JOIN)

---

### POST `/api/auth/logout`
**Description:** Log out the current user.

**Response (200):**
```json
{
  "ok": true,
  "message": "Logged out"
}
```

**Tables Accessed:** None (clears session cookie)

---

## Attendance

### POST `/api/manager/attendance/clock-in`
**Description:** Start a work shift (clock in).

**Roles:** boss, manager, rep, back_office

**Request Body:**
```json
{
  "latitude": 27.7172,
  "longitude": 85.3240,
  "notes": "Starting my day at the office"
}
```

**Response (201):**
```json
{
  "ok": true,
  "log": {
    "id": "uuid",
    "clock_in_at": "2026-02-17T09:00:00Z"
  }
}
```

**Tables Accessed:**
- `attendance_logs` (SELECT to check active session, INSERT)

---

### POST `/api/manager/attendance/clock-out`
**Description:** End a work shift (clock out).

**Roles:** boss, manager, rep, back_office

**Request Body:**
```json
{
  "latitude": 27.7172,
  "longitude": 85.3240,
  "notes": "Completed all visits for the day"
}
```

**Response (200):**
```json
{
  "ok": true,
  "log": {
    "id": "uuid",
    "clock_in_at": "2026-02-17T09:00:00Z",
    "clock_out_at": "2026-02-17T17:30:00Z"
  }
}
```

**Tables Accessed:**
- `attendance_logs` (UPDATE)

---

### GET `/api/manager/attendance`
**Description:** List attendance logs.

**Roles:** boss, manager, rep, back_office (reps see only their own)

**Query Parameters:**
- `rep` (uuid, optional): Filter by rep ID (managers only)
- `date_from` (ISO timestamp, optional): Start date
- `date_to` (ISO timestamp, optional): End date

**Response (200):**
```json
{
  "ok": true,
  "logs": [
    {
      "id": "uuid",
      "rep_company_user_id": "uuid",
      "clock_in_at": "2026-02-17T09:00:00Z",
      "clock_out_at": "2026-02-17T17:30:00Z",
      "clock_in_latitude": 27.7172,
      "clock_in_longitude": 85.3240,
      "clock_out_latitude": 27.7180,
      "clock_out_longitude": 85.3250,
      "notes": "Productive day",
      "rep_name": "Jane Smith"
    }
  ]
}
```

**Tables Accessed:**
- `attendance_logs` (SELECT)
- `company_users` (JOIN)
- `users` (JOIN)

---

## Leads

### GET `/api/manager/leads`
**Description:** List leads.

**Roles:** boss, manager, rep, back_office (reps see only leads they created)

**Query Parameters:**
- `status` (string, optional): Filter by status (new, contacted, qualified, converted, lost)
- `q` (string, optional): Search by name, contact name, or phone

**Response (200):**
```json
{
  "ok": true,
  "leads": [
    {
      "id": "uuid",
      "name": "Downtown Electronics",
      "contact_name": "Ram Sharma",
      "phone": "+9779812345678",
      "email": "ram@downtown.com",
      "address": "Thamel, Kathmandu",
      "latitude": 27.7172,
      "longitude": 85.3240,
      "status": "qualified",
      "notes": "Interested in bulk order",
      "converted_at": null,
      "created_at": "2026-02-15T10:00:00Z",
      "updated_at": "2026-02-16T14:30:00Z",
      "shop_name": null,
      "assigned_rep_name": "Jane Smith"
    }
  ]
}
```

**Tables Accessed:**
- `leads` (SELECT)
- `shops` (LEFT JOIN)
- `company_users` (LEFT JOIN)
- `users` (LEFT JOIN)

---

### POST `/api/manager/leads`
**Description:** Create a new lead.

**Roles:** boss, manager, rep, back_office

**Request Body:**
```json
{
  "name": "Downtown Electronics",
  "shopId": "uuid",
  "contactName": "Ram Sharma",
  "phone": "+9779812345678",
  "email": "ram@downtown.com",
  "address": "Thamel, Kathmandu",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "assignedRepCompanyUserId": "uuid",
  "notes": "Referred by existing customer"
}
```

**Response (201):**
```json
{
  "ok": true,
  "lead": {
    "id": "uuid",
    "company_id": "uuid",
    "name": "Downtown Electronics",
    "contact_name": "Ram Sharma",
    "phone": "+9779812345678",
    "email": "ram@downtown.com",
    "address": "Thamel, Kathmandu",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "status": "new",
    "assigned_rep_company_user_id": "uuid",
    "notes": "Referred by existing customer",
    "created_at": "2026-02-17T10:00:00Z"
  }
}
```

**Tables Accessed:**
- `leads` (INSERT)

---

---

### GET `/api/manager/leads/[leadId]`
**Description:** Get lead details.

**Roles:** boss, manager, rep, back_office

**Response (200):**
```json
{
  "ok": true,
  "lead": {
    "id": "uuid",
    "name": "Downtown Electronics",
    "status": "qualified",
    "shop_name": "Related Shop Name",
    "assigned_rep_name": "Jane Smith",
    ...
  }
}
```

**Tables Accessed:**
- `leads` (SELECT)
- `shops` (LEFT JOIN)
- `company_users` (LEFT JOIN)
- `users` (LEFT JOIN)

---

### PATCH `/api/manager/leads/[leadId]`
**Description:** Update a lead.

**Roles:** boss, manager, rep (reps can only update leads they created or are assigned to, and cannot reassign)

**Request Body:**
```json
{
  "name": "Downtown Gadgets",
  "status": "contacted",
  "contactName": "Mr. Sharma",
  "phone": "+9779800000000",
  "email": "contact@downtowngadgets.com",
  "address": "New Road, Kathmandu",
  "notes": "Called and scheduled meeting for next week",
  "assignedRepCompanyUserId": "uuid" 
}
```
*(Note: `assignedRepCompanyUserId` can only be updated by boss/manager)*

**Response (200):**
```json
{
  "ok": true,
  "lead": { ... }
}
```

**Tables Accessed:**
- `leads` (UPDATE)

---

### DELETE `/api/manager/leads/[leadId]`
**Description:** Delete a lead.

**Roles:** boss, manager

**Response (200):**
```json
{
  "ok": true,
  "deleted": true
}
```

**Tables Accessed:**
- `leads` (DELETE)

---

### POST `/api/manager/leads/[leadId]/convert-to-shop`
**Description:** Convert a lead to a shop.

**Roles:** boss, manager

**Response (201):**
```json
{
  "ok": true,
  "shop": {
    "id": "uuid",
    "name": "Downtown Electronics",
    "latitude": 27.7172,
    "longitude": 85.3240,
    ...
  }
}
```

**Tables Accessed:**
- `leads` (SELECT, UPDATE)
- `shops` (INSERT)

---

## Orders

### GET `/api/manager/orders`
**Description:** List orders.

**Roles:** boss, manager, rep, back_office (reps see only orders they placed)

**Query Parameters:**
- `status` (string, optional): received, processing, shipped, closed, cancelled
- `q` (string, optional): Search by order number or shop name
- `shop` (uuid, optional): Filter by shop ID
- `rep` (uuid, optional): Filter by rep ID (managers only)
- `date_from` (ISO timestamp, optional)
- `date_to` (ISO timestamp, optional)

**Response (200):**
```json
{
  "ok": true,
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-20260217-001",
      "shop_id": "uuid",
      "shop_name": "Downtown Electronics",
      "lead_id": null,
      "placed_by_company_user_id": "uuid",
      "placed_by_name": "Jane Smith",
      "status": "processing",
      "notes": "Urgent delivery requested",
      "total_amount": 15000.00,
      "currency_code": "NPR",
      "placed_at": "2026-02-17T10:00:00Z",
      "processed_at": "2026-02-17T11:00:00Z",
      "shipped_at": null,
      "closed_at": null,
      "item_count": 3
    }
  ]
}
```

**Tables Accessed:**
- `orders` (SELECT)
- `shops` (LEFT JOIN)
- `company_users` (LEFT JOIN)
- `users` (LEFT JOIN)
- `order_items` (COUNT)

---

### POST `/api/manager/orders`
**Description:** Create a new order.

**Roles:** boss, manager, rep, back_office

**Request Body:**
```json
{
  "shopId": "uuid",
  "leadId": null,
  "notes": "Customer requested express delivery",
  "items": [
    {
      "productId": "uuid",
      "productName": "Widget A",
      "productSku": "WDG-001",
      "quantity": 10,
      "unitPrice": 500.00,
      "notes": "Red color preferred"
    },
    {
      "productId": "uuid",
      "productName": "Widget B",
      "productSku": "WDG-002",
      "quantity": 5,
      "unitPrice": 1000.00
    }
  ]
}
```

**Response (201):**
```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-20260217-001",
    "shop_id": "uuid",
    "status": "received",
    "total_amount": 10000.00,
    "placed_at": "2026-02-17T10:00:00Z",
    "items": [...]
  }
}
```

**Tables Accessed:**
- `orders` (INSERT, SELECT for order_number generation)
- `order_items` (INSERT multiple)

---

### GET `/api/manager/orders/counts`
**Description:** Get order counts by status.

**Roles:** boss, manager, rep, back_office

**Response (200):**
```json
{
  "ok": true,
  "counts": {
    "received": 5,
    "processing": 3,
    "shipped": 2,
    "closed": 10,
    "cancelled": 1
  }
}
```

**Tables Accessed:**
- `orders` (SELECT with GROUP BY status)

---

### GET `/api/manager/orders/[orderId]`
**Description:** Get order details with items.

**Roles:** boss, manager, rep, back_office

**Response (200):**
```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-20260217-001",
    "shop_id": "uuid",
    "shop_name": "Downtown Electronics",
    "status": "processing",
    "total_amount": 10000.00,
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": "Widget A",
        "product_sku": "WDG-001",
        "quantity": 10,
        "unit_price": 500.00,
        "line_total": 5000.00,
        "notes": "Red color"
      }
    ]
  }
}
```

**Tables Accessed:**
- `orders` (SELECT)
- `order_items` (SELECT)
- `shops` (LEFT JOIN)

---

### PATCH `/api/manager/orders/[orderId]`
**Description:** Update order status, notes, or items (when status is 'received').

**Roles:** boss, manager, back_office (reps can only edit items on orders they placed when status is 'received')

**Request Body:**
```json
{
  "status": "processing",
  "notes": "Order confirmed and being prepared",
  "items": [
    {
      "productId": "uuid",
      "productName": "Widget A",
      "productSku": "WDG-001",
      "quantity": 12,
      "unitPrice": 500.00
    }
  ]
}
```

**Response (200):**
```json
{
  "ok": true,
  "order": { ... }
}
```

**Tables Accessed:**
- `orders` (SELECT, UPDATE)
- `order_items` (DELETE, INSERT if items provided)

**Status Transitions:**
- `received` → `processing`
- `processing` → `shipped`
- `shipped` → `closed`

---

### POST `/api/manager/orders/[orderId]/cancel`
**Description:** Cancel an order.

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "cancel_reason": "Customer requested",
  "cancel_note": "Customer changed their mind about the order"
}
```

**Valid cancel_reason values:**
- "Customer requested"
- "Out of stock"
- "Duplicate order"
- "Wrong address"
- "Payment issue"
- "Other"

**Response (200):**
```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "status": "cancelled",
    "cancelled_at": "2026-02-17T12:00:00Z",
    "cancel_reason": "Customer requested",
    "cancel_note": "Customer changed their mind"
  }
}
```

**Tables Accessed:**
- `orders` (SELECT, UPDATE)

---

## Products

### GET `/api/manager/products`
**Description:** List products.

**Roles:** boss, manager, rep, back_office

**Query Parameters:**
- `q` (string, optional): Search by name or SKU
- `status` (string, optional): active, inactive

**Response (200):**
```json
{
  "ok": true,
  "products": [
    {
      "id": "uuid",
      "name": "Widget A",
      "sku": "WDG-001",
      "description": "High-quality widget for all purposes",
      "unit": "piece",
      "is_active": true,
      "current_price": 500.00,
      "currency_code": "NPR",
      "order_count": 15,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

**Tables Accessed:**
- `products` (SELECT)
- `product_prices` (LEFT JOIN for current price)
- `order_items` (COUNT for order_count)

---

### POST `/api/manager/products`
**Description:** Create a new product.

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "name": "Widget A",
  "sku": "WDG-001",
  "description": "High-quality widget",
  "unit": "piece",
  "price": 500.00
}
```

**Response (201):**
```json
{
  "ok": true,
  "product": {
    "id": "uuid",
    "name": "Widget A",
    "sku": "WDG-001",
    "description": "High-quality widget",
    "unit": "piece",
    "is_active": true,
    "created_at": "2026-02-17T10:00:00Z"
  }
}
```

**Tables Accessed:**
- `products` (INSERT)
- `product_prices` (INSERT)

---

### GET `/api/manager/products/[productId]`
**Description:** Get product details.

**Roles:** boss, manager, rep, back_office

**Response (200):**
```json
{
  "ok": true,
  "product": {
    "id": "uuid",
    "name": "Widget A",
    "sku": "WDG-001",
    "current_price": 500.00,
    ...
  }
}
```

**Tables Accessed:**
- `products` (SELECT)
- `product_prices` (LEFT JOIN)

---

### PATCH `/api/manager/products/[productId]`
**Description:** Update product details.

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "name": "Widget A Pro",
  "description": "Enhanced version",
  "unit": "piece",
  "isActive": true
}
```

**Response (200):**
```json
{
  "ok": true,
  "product": { ... }
}
```

**Tables Accessed:**
- `products` (UPDATE)

---

### DELETE `/api/manager/products/[productId]`
**Description:** Delete a product (only if not used in any orders).

**Roles:** boss, manager, back_office

**Response (200):**
```json
{
  "ok": true,
  "deleted": true
}
```

**Tables Accessed:**
- `order_items` (SELECT COUNT)
- `products` (DELETE)

---

### POST `/api/manager/products/[productId]/prices`
**Description:** Set a new price (closes previous price).

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "price": 550.00,
  "currencyCode": "NPR"
}
```

**Response (201):**
```json
{
  "ok": true,
  "price": {
    "id": "uuid",
    "product_id": "uuid",
    "price": 550.00,
    "currency_code": "NPR",
    "starts_at": "2026-02-17T10:00:00Z",
    "ends_at": null
  }
}
```

**Tables Accessed:**
- `products` (SELECT to verify existence)
- `product_prices` (UPDATE to close previous, INSERT new)

---

## Shops & Assignments

### GET `/api/manager/shops`
**Description:** List shops.

**Roles:** boss, manager, rep, back_office

**Query Parameters:**
- `q` (string, optional): Search by name
- `status` (string, optional): active, inactive

**Response (200):**
```json
{
  "ok": true,
  "shops": [
    {
      "id": "uuid",
      "external_shop_code": "SHOP-001",
      "name": "Downtown Electronics",
      "latitude": 27.7172,
      "longitude": 85.3240,
      "geofence_radius_m": 100,
      "is_active": true,
      "assignment_count": 2,
      "created_at": "2026-01-10T10:00:00Z"
    }
  ]
}
```

**Tables Accessed:**
- `shops` (SELECT)
- `shop_assignments` (COUNT)

---

### POST `/api/manager/shops`
**Description:** Create a new shop.

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "name": "Downtown Electronics",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "geofenceRadius": 100,
  "externalShopCode": "SHOP-001",
  "notes": "Main branch in Thamel"
}
```

**Response (201):**
```json
{
  "ok": true,
  "shop": {
    "id": "uuid",
    "name": "Downtown Electronics",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "geofence_radius_m": 100,
    "is_active": true,
    "created_at": "2026-02-17T10:00:00Z"
  }
}
```

**Tables Accessed:**
- `shops` (INSERT)

---

### GET `/api/manager/shops/[shopId]`
**Description:** Get shop details.

**Roles:** boss, manager, rep, back_office

**Response (200):**
```json
{
  "ok": true,
  "shop": {
    "id": "uuid",
    "name": "Downtown Electronics",
    "latitude": 27.7172,
    "longitude": 85.3240,
    ...
  }
}
```

**Tables Accessed:**
- `shops` (SELECT)

---

### PATCH `/api/manager/shops/[shopId]`
**Description:** Update shop details.

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "name": "Downtown Electronics - Thamel",
  "isActive": true,
  "notes": "Updated contact information"
}
```

**Response (200):**
```json
{
  "ok": true,
  "shop": { ... }
}
```

**Tables Accessed:**
- `shops` (UPDATE)

---

### GET `/api/manager/shop-assignments`
**Description:** List all shop-rep assignments.

**Roles:** boss, manager, back_office

**Response (200):**
```json
{
  "ok": true,
  "assignments": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "rep_company_user_id": "uuid",
      "is_primary": true
    }
  ]
}
```

**Tables Accessed:**
- `shop_assignments` (SELECT)

---

### POST `/api/manager/shop-assignments`
**Description:** Assign a rep to a shop.

**Roles:** boss, manager, back_office

**Request Body:**
```json
{
  "shopId": "uuid",
  "repCompanyUserId": "uuid",
  "isPrimary": true
}
```

**Response (201):**
```json
{
  "ok": true,
  "assignment": {
    "id": "uuid",
    "shop_id": "uuid",
    "rep_company_user_id": "uuid",
    "is_primary": true,
    "assigned_at": "2026-02-17T10:00:00Z"
  }
}
```

**Tables Accessed:**
- `shops` (SELECT to verify)
- `company_users` (SELECT to verify rep)
- `shop_assignments` (UPDATE to clear other primary flags if isPrimary=true, INSERT/UPDATE)

---

### DELETE `/api/manager/shop-assignments/[assignmentId]`
**Description:** Remove a shop-rep assignment.

**Roles:** boss, manager, back_office

**Response (200):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `shop_assignments` (DELETE)

---

## Staff Management

### GET `/api/manager/staff`
**Description:** List staff members.

**Roles:** boss, manager

**Query Parameters:**
- `status` (string, optional): active, invited, inactive
- `role` (string, optional): rep, manager, back_office
- `q` (string, optional): Search by name, email, or phone

**Response (200):**
```json
{
  "ok": true,
  "staff": [
    {
      "company_user_id": "uuid",
      "user_id": "uuid",
      "full_name": "Jane Smith",
      "email": "jane@acme.com",
      "role": "rep",
      "status": "active",
      "phone": "+9779812345678",
      "manager_company_user_id": null,
      "created_at": "2026-01-15T10:00:00Z",
      "email_verified_at": "2026-01-15T10:30:00Z",
      "last_login_at": "2026-02-17T09:00:00Z",
      "assigned_shops_count": 5
    }
  ],
  "counts": {
    "active": 10,
    "invited": 2,
    "inactive": 1
  }
}
```

**Tables Accessed:**
- `company_users` (SELECT)
- `users` (JOIN)
- `shop_assignments` (COUNT for assigned_shops_count)

---

### POST `/api/manager/staff`
**Description:** Invite a new staff member.

**Roles:** boss, manager

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+9779812345678",
  "role": "rep"
}
```

**Response (201):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `users` (INSERT or SELECT if exists)
- `company_users` (INSERT)
- `email_tokens` (INSERT for verification)

**Email Sent:** Staff invitation with credentials

---

### PATCH `/api/manager/staff/[companyUserId]`
**Description:** Update staff member details.

**Roles:** boss, manager

**Request Body:**
```json
{
  "fullName": "Jane Smith-Doe",
  "email": "jane.doe@acme.com",
  "phone": "+9779812345679",
  "role": "manager"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `company_users` (SELECT, UPDATE)
- `users` (UPDATE)

---

### POST `/api/manager/staff/[companyUserId]/resend-invite`
**Description:** Resend invitation email to a staff member.

**Roles:** boss, manager

**Response (200):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `company_users` (SELECT)
- `users` (SELECT)
- `email_tokens` (INSERT)

**Email Sent:** Staff invitation with credentials

---

### GET `/api/manager/staff/[companyUserId]/deactivate-preview`
**Description:** Preview what happens when deactivating a rep (shows shops that need reassignment).

**Roles:** boss, manager

**Response (200):**
```json
{
  "ok": true,
  "shops_only_this_rep": [
    {
      "shop_id": "uuid",
      "shop_name": "Downtown Electronics"
    }
  ],
  "shops_other_reps_too": [
    {
      "shop_id": "uuid",
      "shop_name": "Uptown Store"
    }
  ]
}
```

**Tables Accessed:**
- `shop_assignments` (SELECT with GROUP BY)
- `shops` (JOIN)

---

### POST `/api/manager/staff/[companyUserId]/deactivate`
**Description:** Deactivate a staff member.

**Roles:** boss, manager

**Request Body:**
```json
{
  "reassignments": {
    "shop-uuid-1": "new-rep-uuid",
    "shop-uuid-2": "new-rep-uuid"
  }
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `company_users` (UPDATE status to 'inactive')
- `shop_assignments` (DELETE or UPDATE for reassignments)

---

### POST `/api/manager/staff/[companyUserId]/activate`
**Description:** Reactivate an inactive staff member.

**Roles:** boss, manager

**Response (200):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `company_users` (UPDATE status to 'active')

---

## Tasks

### GET `/api/manager/tasks`
**Description:** List tasks.

**Roles:** boss, manager, rep (reps see only their own tasks)

**Query Parameters:**
- `status` (string, optional): pending, completed, cancelled
- `rep` (uuid, optional): Filter by rep ID (managers only)
- `date_from` (ISO timestamp, optional)
- `date_to` (ISO timestamp, optional)

**Response (200):**
```json
{
  "ok": true,
  "tasks": [
    {
      "id": "uuid",
      "rep_company_user_id": "uuid",
      "title": "Follow up with Downtown Electronics",
      "description": "Discuss bulk order pricing",
      "status": "pending",
      "due_at": "2026-02-20T10:00:00Z",
      "completed_at": null,
      "lead_id": "uuid",
      "shop_id": null,
      "created_at": "2026-02-17T10:00:00Z",
      "rep_name": "Jane Smith"
    }
  ]
}
```

**Tables Accessed:**
- `tasks` (SELECT)
- `company_users` (JOIN)
- `users` (JOIN)

---

### POST `/api/manager/tasks`
**Description:** Create a task and assign to a rep.

**Roles:** boss, manager

**Request Body:**
```json
{
  "repCompanyUserId": "uuid",
  "title": "Follow up with lead",
  "description": "Discuss pricing and delivery timeline",
  "dueAt": "2026-02-20T10:00:00Z",
  "leadId": "uuid",
  "shopId": null
}
```

**Response (201):**
```json
{
  "ok": true,
  "task": {
    "id": "uuid",
    "rep_company_user_id": "uuid",
    "title": "Follow up with lead",
    "status": "pending",
    "due_at": "2026-02-20T10:00:00Z",
    "created_at": "2026-02-17T10:00:00Z"
  }
}
```

**Tables Accessed:**
- `company_users` (SELECT to verify rep)
- `tasks` (INSERT)

---

### GET `/api/manager/tasks/[taskId]`
**Description:** Get task details.

**Roles:** boss, manager, rep

**Response (200):**
```json
{
  "ok": true,
  "task": { ... }
}
```

**Tables Accessed:**
- `tasks` (SELECT)

---

### PATCH `/api/manager/tasks/[taskId]`
**Description:** Update task (status, notes, etc.).

**Roles:** boss, manager, rep (reps can only update their own tasks)

**Request Body:**
```json
{
  "status": "completed",
  "description": "Completed - order placed"
}
```

**Response (200):**
```json
{
  "ok": true,
  "task": { ... }
}
```

**Tables Accessed:**
- `tasks` (UPDATE)

---

## Visits

### GET `/api/manager/visits`
**Description:** List shop visits.

**Roles:** boss, manager, rep, back_office (reps see only their own)

**Query Parameters:**
- `shop` (uuid, optional): Filter by shop ID
- `rep` (uuid, optional): Filter by rep ID (managers only)
- `date_from` (ISO timestamp, optional)
- `date_to` (ISO timestamp, optional)

**Response (200):**
```json
{
  "ok": true,
  "visits": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "rep_company_user_id": "uuid",
      "started_at": "2026-02-17T10:00:00Z",
      "ended_at": "2026-02-17T11:30:00Z",
      "notes": "Discussed new product line, placed order",
      "created_at": "2026-02-17T10:00:00Z",
      "shop_name": "Downtown Electronics",
      "rep_name": "Jane Smith"
    }
  ]
}
```

**Tables Accessed:**
- `visits` (SELECT)
- `shops` (JOIN)
- `company_users` (JOIN)
- `users` (JOIN)

---

### POST `/api/manager/visits`
**Description:** Start a shop visit (check in).

**Roles:** boss, manager, rep

**Request Body:**
```json
{
  "shopId": "uuid"
}
```

**Response (201):**
```json
{
  "ok": true,
  "visit": {
    "id": "uuid",
    "shop_id": "uuid",
    "rep_company_user_id": "uuid",
    "started_at": "2026-02-17T10:00:00Z",
    "ended_at": null
  }
}
```

**Tables Accessed:**
- `shop_assignments` (SELECT to verify rep is assigned - reps only)
- `shops` (SELECT to verify shop exists)
- `visits` (INSERT)

---

### GET `/api/manager/visits/[visitId]`
**Description:** Get visit details.

**Roles:** boss, manager, rep, back_office

**Response (200):**
```json
{
  "ok": true,
  "visit": { ... }
}
```

**Tables Accessed:**
- `visits` (SELECT)

---

### PATCH `/api/manager/visits/[visitId]`
**Description:** End a visit or update notes.

**Roles:** boss, manager, rep

**Request Body:**
```json
{
  "endedAt": "2026-02-17T11:30:00Z",
  "notes": "Productive meeting, order placed"
}
```

**Response (200):**
```json
{
  "ok": true,
  "visit": { ... }
}
```

**Tables Accessed:**
- `visits` (UPDATE)

---

## Profile & Contact

### PATCH `/api/profile`
**Description:** Update own profile.

**Roles:** All authenticated users

**Request Body:**
```json
{
  "fullName": "John Doe Jr.",
  "email": "john.doe@acme.com",
  "phone": "+9779812345679"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Tables Accessed:**
- `company_users` (SELECT, UPDATE phone)
- `users` (UPDATE full_name, email)

---

### POST `/api/contact`
**Description:** Submit contact form (public endpoint).

**Roles:** None (public)

**Request Body:**
```json
{
  "name": "Potential Customer",
  "company": "ABC Corp",
  "email": "contact@abc.com",
  "phone": "+9779812345678",
  "teamSize": "10-50",
  "message": "Interested in a demo of your product"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Your message has been sent successfully."
}
```

**Tables Accessed:** None

**Emails Sent:**
- Notification to company admin
- Confirmation to user

---

## Email Templates

### 1. Email Verification
**Trigger:** Company signup (`POST /api/auth/signup-company`)

**Subject:** "Verify your SalesSuite account"

**Content:**
```
Hi {fullName},

Please verify your email by clicking the link below:

{verifyUrl}

This link expires in 24 hours.

— SalesSuite
```

**HTML Version:** Styled button with verification link

---

### 2. Password Reset
**Trigger:** Forgot password request (`POST /api/auth/forgot-password`)

**Subject:** "Reset your SalesSuite password"

**Content:**
```
Hi {fullName},

You requested a password reset. Click the link below:

{resetUrl}

This link expires in 1 hour. If you didn't request this, ignore this email.

— SalesSuite
```

**HTML Version:** Styled button with reset link

---

### 3. Staff Invitation
**Trigger:** New staff member added (`POST /api/manager/staff`)

**Subject:** "You've been added to {companyName} on SalesSuite"

**Content:**
```
Hi {fullName},

You've been added as a team member at {companyName} on SalesSuite.

Your login credentials:
Email: {email}
Password: {generatedPassword}

Log in at: {loginUrl}

Please change your password after your first login.

— SalesSuite
```

**HTML Version:** Styled card with credentials in a highlighted box

---

### 4. Contact Form Notification (to Company)
**Trigger:** Contact form submission (`POST /api/contact`)

**Subject:** "New demo request from {name} at {company}"

**Content:**
```
New demo request:

Name: {name}
Company: {company}
Email: {email}
Phone: {phone}
Team Size: {teamSize}

Message:
{message}

— SalesSuite Demo Request
```

**HTML Version:** Styled card with contact details

---

### 5. Contact Form Confirmation (to User)
**Trigger:** Contact form submission (`POST /api/contact`)

**Subject:** "We've received your message"

**Content:**
```
Hi {name},

Thank you for reaching out to SalesSuite. We've received your message and will get back to you as soon as possible.

— SalesSuite Team
```

**HTML Version:** Simple styled confirmation

---

## Database Schema

### Core Tables

#### `users`
Global user table (shared across companies).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Unique email address |
| full_name | TEXT | User's full name |
| password_hash | TEXT | Bcrypt hashed password |
| email_verified_at | TIMESTAMPTZ | When email was verified |
| last_login_at | TIMESTAMPTZ | Last login timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `companies`
Company/organization table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Company name |
| slug | TEXT | Unique URL-friendly identifier |
| address | TEXT | Company address |
| status | TEXT | active, suspended, deleted |
| plan | TEXT | Subscription plan (starter, pro, enterprise) |
| subscription_ends_at | TIMESTAMPTZ | Subscription expiry date |
| subscription_suspended | BOOLEAN | Manual suspension flag |
| staff_limit | INTEGER | Max staff allowed (default: 5) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `company_users`
Links users to companies with roles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| user_id | UUID | FK to users |
| role | TEXT | boss, manager, rep, back_office |
| status | TEXT | invited, active, inactive |
| phone | TEXT | Company-specific phone |
| manager_company_user_id | UUID | FK to manager (optional) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `email_tokens`
Temporary tokens for email verification and password reset.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (token value) |
| user_id | UUID | FK to users |
| token_type | TEXT | email_verify, password_reset |
| expires_at | TIMESTAMPTZ | Expiration timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

### Business Tables

#### `shops`
Physical shop/store locations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| external_shop_code | TEXT | Optional external identifier |
| name | TEXT | Shop name |
| latitude | DOUBLE PRECISION | GPS latitude |
| longitude | DOUBLE PRECISION | GPS longitude |
| geofence_radius_m | INTEGER | Geofence radius in meters |
| is_active | BOOLEAN | Active status |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `shop_assignments`
Assigns reps to shops.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| shop_id | UUID | FK to shops |
| rep_company_user_id | UUID | FK to company_users |
| is_primary | BOOLEAN | Primary rep flag |
| assigned_at | TIMESTAMPTZ | Assignment timestamp |

---

#### `products`
Product catalog.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| name | TEXT | Product name |
| sku | TEXT | Stock keeping unit (unique per company) |
| description | TEXT | Product description |
| unit | TEXT | Unit of measure (piece, kg, liter, etc.) |
| is_active | BOOLEAN | Active status |
| metadata | JSONB | Additional product data |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `product_prices`
Price history for products.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| product_id | UUID | FK to products |
| price | NUMERIC(12,2) | Price amount |
| currency_code | CHAR(3) | Currency (NPR, USD, etc.) |
| starts_at | TIMESTAMPTZ | Price start date |
| ends_at | TIMESTAMPTZ | Price end date (NULL = current) |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

#### `leads`
Potential customers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| shop_id | UUID | FK to shops (optional) |
| name | TEXT | Lead name |
| contact_name | TEXT | Contact person |
| phone | TEXT | Phone number |
| email | TEXT | Email address |
| address | TEXT | Physical address |
| status | TEXT | new, contacted, qualified, converted, lost |
| assigned_rep_company_user_id | UUID | FK to company_users |
| created_by_company_user_id | UUID | FK to company_users (creator) |
| notes | TEXT | Additional notes |
| converted_at | TIMESTAMPTZ | Conversion timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `orders`
Customer orders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| order_number | TEXT | Human-readable order number |
| shop_id | UUID | FK to shops (optional) |
| lead_id | UUID | FK to leads (optional) |
| placed_by_company_user_id | UUID | FK to company_users |
| status | TEXT | received, processing, shipped, closed, cancelled |
| notes | TEXT | Order notes |
| total_amount | NUMERIC(14,2) | Total order value |
| currency_code | CHAR(3) | Currency |
| placed_at | TIMESTAMPTZ | Order placement time |
| processed_at | TIMESTAMPTZ | Processing start time |
| shipped_at | TIMESTAMPTZ | Shipping time |
| closed_at | TIMESTAMPTZ | Completion time |
| cancelled_at | TIMESTAMPTZ | Cancellation time |
| cancelled_by_company_user_id | UUID | FK to company_users |
| cancel_reason | TEXT | Cancellation reason |
| cancel_note | TEXT | Cancellation notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `order_items`
Line items in orders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| order_id | UUID | FK to orders |
| product_id | UUID | FK to products (optional) |
| product_name | TEXT | Product name (snapshot) |
| product_sku | TEXT | Product SKU (snapshot) |
| quantity | NUMERIC(12,3) | Quantity ordered |
| unit_price | NUMERIC(12,2) | Unit price (snapshot) |
| line_total | NUMERIC(14,2) | Computed: quantity × unit_price |
| notes | TEXT | Item-specific notes |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

#### `visits`
Rep visits to shops.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| shop_id | UUID | FK to shops |
| rep_company_user_id | UUID | FK to company_users |
| started_at | TIMESTAMPTZ | Visit start time |
| ended_at | TIMESTAMPTZ | Visit end time (NULL = ongoing) |
| notes | TEXT | Visit notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `tasks`
Tasks assigned to reps.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| rep_company_user_id | UUID | FK to company_users |
| title | TEXT | Task title |
| description | TEXT | Task description |
| status | TEXT | pending, completed, cancelled |
| due_at | TIMESTAMPTZ | Due date/time |
| completed_at | TIMESTAMPTZ | Completion timestamp |
| lead_id | UUID | FK to leads (optional) |
| shop_id | UUID | FK to shops (optional) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### `attendance_logs`
Employee clock-in/out records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | FK to companies |
| rep_company_user_id | UUID | FK to company_users |
| clock_in_at | TIMESTAMPTZ | Clock-in timestamp |
| clock_out_at | TIMESTAMPTZ | Clock-out timestamp (NULL = still clocked in) |
| clock_in_latitude | DOUBLE PRECISION | Clock-in GPS latitude |
| clock_in_longitude | DOUBLE PRECISION | Clock-in GPS longitude |
| clock_out_latitude | DOUBLE PRECISION | Clock-out GPS latitude |
| clock_out_longitude | DOUBLE PRECISION | Clock-out GPS longitude |
| notes | TEXT | Shift notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

## Notes

### Authentication
- Session cookies are HTTP-only and secure in production
- Sessions expire after inactivity
- Password requirements: minimum 8 characters

### Permissions
- **boss/manager**: Full access to all company data
- **back_office**: Similar to manager but cannot manage staff
- **rep**: Limited to own data (visits, tasks, orders placed by them)

### Data Validation
- Phone numbers must be in format: `+977XXXXXXXXXX` (Nepal)
- Coordinates: latitude (-90 to 90), longitude (-180 to 180)
- All UUIDs are version 4

### Rate Limiting
Not currently implemented but recommended for production.

### Pagination
Most list endpoints return up to 200 records. Implement pagination for production use.
