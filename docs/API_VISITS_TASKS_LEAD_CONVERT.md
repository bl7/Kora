# Visits, Tasks & Lead Convert – API Reference

Base URL: `https://kora-sand.vercel.app`  
Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`

---

## Lead – Convert to Shop

**POST** `/api/manager/leads/[leadId]/convert-to-shop`

Creates a shop from the lead (name, contact, address, etc.) and sets the lead status to `converted` with `shop_id` linked.

**Roles:** Boss, manager, rep (reps only for leads assigned to them or they created)

**Body:** None

**Success (200):**
```json
{
  "ok": true,
  "shop": { "id": "uuid", "name": "Shop Name" },
  "message": "Lead converted to shop. You can now place orders for this shop."
}
```

**Errors:** 400 (already converted), 403 (rep, lead not assigned/created by you), 404 (lead not found)

---

## Visits (rep-specific per shop)

### List visits

**GET** `/api/manager/visits`

**Query params:** `shop` (shop_id), `rep` (company_user_id), `date_from`, `date_to`

**Reps:** Only their own visits

**Success (200):**
```json
{
  "ok": true,
  "visits": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "rep_company_user_id": "uuid",
      "started_at": "2025-02-14T10:00:00.000Z",
      "ended_at": "2025-02-14T10:30:00.000Z",
      "shop_name": "Shop Name",
      "rep_name": "John Doe"
    }
  ]
}
```

### Start visit

**POST** `/api/manager/visits`

**Body:** `{ "shopId": "uuid" }`

**Reps:** Only for shops assigned to them

**Success (201):**
```json
{
  "ok": true,
  "visit": {
    "id": "uuid",
    "shop_id": "uuid",
    "rep_company_user_id": "uuid",
    "started_at": "2025-02-14T10:00:00.000Z",
    "ended_at": null
  }
}
```

### End visit

**PATCH** `/api/manager/visits/[visitId]`

**Body:** `{ "end": true }`

**Reps:** Only their own visits

**Success (200):**
```json
{
  "ok": true,
  "visit": {
    "id": "uuid",
    "shop_id": "uuid",
    "rep_company_user_id": "uuid",
    "started_at": "...",
    "ended_at": "2025-02-14T10:30:00.000Z"
  }
}
```

---

## Tasks (assigned to reps)

### List tasks

**GET** `/api/manager/tasks`

**Query params:** `status` (pending|completed|cancelled), `rep` (company_user_id)

**Reps:** Only tasks assigned to them

**Success (200):**
```json
{
  "ok": true,
  "tasks": [
    {
      "id": "uuid",
      "rep_company_user_id": "uuid",
      "title": "Follow up on lead",
      "description": null,
      "status": "pending",
      "due_at": "2025-02-15T09:00:00.000Z",
      "completed_at": null,
      "lead_id": "uuid",
      "shop_id": null,
      "rep_name": "John Doe"
    }
  ]
}
```

### Single task

**GET** `/api/manager/tasks/[taskId]`

### Create task (boss/manager only)

**POST** `/api/manager/tasks`

**Body:**
```json
{
  "repCompanyUserId": "uuid",
  "title": "Call back customer",
  "description": "Optional notes",
  "dueAt": "2025-02-15T09:00:00.000Z",
  "leadId": "uuid",
  "shopId": "uuid"
}
```

**Success (201):**
```json
{
  "ok": true,
  "task": { "id": "uuid", ... }
}
```

### Update task

**PATCH** `/api/manager/tasks/[taskId]`

**Body:** `{ "status"?: "pending"|"completed"|"cancelled", "dueAt"?: string|null, "title"?, "description"? }`

**Reps:** Only tasks assigned to them. Can complete, reschedule, or update their own tasks.

---

## Single lead

**GET** `/api/manager/leads/[leadId]`

**Reps:** Only leads they created or are assigned to

**Success (200):**
```json
{
  "ok": true,
  "lead": {
    "id": "uuid",
    "shop_id": null,
    "name": "Lead Name",
    "contact_name": null,
    "phone": null,
    "email": null,
    "address": null,
    "status": "new",
    "notes": null,
    "converted_at": null,
    "assigned_rep_company_user_id": null,
    "created_by_company_user_id": "uuid",
    "shop_name": null,
    "assigned_rep_name": null,
    ...
  }
}
```

---

## Single shop & notes

**GET** `/api/manager/shops/[shopId]` – single shop (reps: assigned only)

**PATCH** `/api/manager/shops/[shopId]` – update shop, incl. `notes` (boss/manager only)

**Body:** `{ "notes": "Free-form notes about the shop" }`

Shops list and single shop responses now include `notes`.
