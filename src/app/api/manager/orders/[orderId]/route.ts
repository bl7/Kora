import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const updateOrderSchema = z.object({
  status: z.enum(["received", "processing", "shipped", "closed"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/* ── PATCH — update order status / notes ── */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = updateOrderSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;
  const { orderId } = await context.params;
  const companyId = authResult.session.companyId;

  const updates: string[] = [];
  const values: Array<string | null> = [];
  let pos = 1;

  if (input.status !== undefined) {
    updates.push(`status = $${pos}`);
    values.push(input.status);
    pos++;

    // Set timestamp columns based on status
    if (input.status === "processing") {
      updates.push(`processed_at = COALESCE(processed_at, NOW())`);
    } else if (input.status === "shipped") {
      updates.push(`shipped_at = COALESCE(shipped_at, NOW())`);
    } else if (input.status === "closed") {
      updates.push(`closed_at = COALESCE(closed_at, NOW())`);
    }
  }

  if (input.notes !== undefined) {
    updates.push(`notes = $${pos}`);
    values.push(input.notes);
    pos++;
  }

  if (!updates.length) return jsonError(400, "No fields provided to update");

  values.push(orderId, companyId);

  const result = await getDb().query(
    `UPDATE orders SET ${updates.join(", ")} WHERE id = $${pos++} AND company_id = $${pos} RETURNING *`,
    values
  );

  if (!result.rowCount) return jsonError(404, "Order not found");
  return jsonOk({ order: result.rows[0] });
}

