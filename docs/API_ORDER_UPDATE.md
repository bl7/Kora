# PATCH /api/manager/orders/[orderId] – Update Order

Edit order contents (items, shop, lead, notes) or change status.

**Route:** `PATCH {apiBaseUrl}/api/manager/orders/{orderId}`  
**Example:** `PATCH https://kora-sand.vercel.app/api/manager/orders/abc-123-uuid`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

---

## When to allow editing

- **Items, shopId, leadId, notes:** Only when `order.status === "received"`.
- **Status:** Boss, manager, back_office only; reps cannot change status.
- Hide or disable Edit when status is `processing`, `shipped`, `closed`, or `cancelled`.

---

## Request body (camelCase)

| Field   | Type   | Required | Notes                                                             |
|---------|--------|----------|-------------------------------------------------------------------|
| `items` | array  | No*      | Full replacement – send the complete list of items to keep        |
| `shopId`| uuid   | No       | Shop UUID or `null`                                               |
| `leadId`| uuid   | No       | Lead UUID or `null`                                               |
| `notes` | string | No       | Order notes (max 2000 chars)                                      |
| `status`| enum   | No       | `"processing"` \| `"shipped"` \| `"closed"` – reps cannot send     |

\* At least one of `items`, `shopId`, `leadId`, `notes`, or `status` must be sent.

---

## Item shape

Same as create order:

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

---

## Editing items

- You **replace** all items with the `items` array you send.
- **Add:** Include all existing items + the new one.
- **Change quantity:** Include all items with updated `quantity`.
- **Remove:** Include all items except the one to remove.
- `total_amount` is recalculated by the backend.

---

## Examples

### Change quantity

```json
{
  "items": [
    { "productName": "Product A", "quantity": 3, "unitPrice": 100 },
    { "productName": "Product B", "quantity": 1, "unitPrice": 250 }
  ]
}
```

### Add item

```json
{
  "items": [
    { "productName": "Product A", "quantity": 2, "unitPrice": 100 },
    { "productName": "Product B", "quantity": 1, "unitPrice": 250 },
    { "productName": "Product C", "quantity": 1, "unitPrice": 75 }
  ]
}
```

### Remove item

```json
{
  "items": [
    { "productName": "Product B", "quantity": 1, "unitPrice": 250 }
  ]
}
```

### Change shop only

```json
{
  "shopId": "new-shop-uuid"
}
```

### Edit notes only

```json
{
  "notes": "Updated delivery instructions"
}
```

---

## Response (200)

```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-20250214-0001",
    "status": "received",
    "notes": "...",
    "total_amount": "550.00",
    "currency_code": "NPR",
    "shop_id": "uuid",
    "shop_name": "...",
    "items": [
      { "id": "uuid", "product_name": "...", "quantity": 2, "unit_price": 100, "line_total": 200, ... }
    ],
    ...
  }
}
```

---

## Error responses

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Order contents can only be edited when status is received | items/shop/lead edit on non-received order |
| 400 | At least one item is required | `items` array is empty |
| 400 | No fields provided to update | Empty body |
| 403 | You can only edit orders you placed | Rep edited another rep's order |
| 403 | Reps cannot change order status | Rep sent `status` |
| 404 | Order not found | Invalid orderId or company |

---

## Roles

| Role       | Can edit items/shop/lead/notes | Can change status |
|------------|------------------------------|-------------------|
| Rep        | Yes, on orders they placed   | No                |
| Manager    | Yes                          | Yes               |
| Boss       | Yes                          | Yes               |
| Back office| Yes                          | Yes               |
