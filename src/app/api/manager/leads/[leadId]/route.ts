import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const updateLeadSchema = z.object({
  shopId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  contactName: z.string().max(120).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
  assignedRepCompanyUserId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/* ── PATCH — update lead ── */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = updateLeadSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;
  const { leadId } = await context.params;
  const companyId = authResult.session.companyId;

  const updates: string[] = [];
  const values: Array<string | null> = [];
  let pos = 1;

  if (input.shopId !== undefined) { updates.push(`shop_id = $${pos}`); values.push(input.shopId); pos++; }
  if (input.name !== undefined) { updates.push(`name = $${pos}`); values.push(input.name); pos++; }
  if (input.contactName !== undefined) { updates.push(`contact_name = $${pos}`); values.push(input.contactName); pos++; }
  if (input.phone !== undefined) { updates.push(`phone = $${pos}`); values.push(input.phone); pos++; }
  if (input.email !== undefined) { updates.push(`email = $${pos}`); values.push(input.email); pos++; }
  if (input.address !== undefined) { updates.push(`address = $${pos}`); values.push(input.address); pos++; }
  if (input.status !== undefined) {
    updates.push(`status = $${pos}`);
    values.push(input.status);
    pos++;
    // Auto-set converted_at when status becomes 'converted'
    if (input.status === "converted") {
      updates.push(`converted_at = COALESCE(converted_at, NOW())`);
    }
  }
  if (input.assignedRepCompanyUserId !== undefined) {
    updates.push(`assigned_rep_company_user_id = $${pos}`);
    values.push(input.assignedRepCompanyUserId);
    pos++;
  }
  if (input.notes !== undefined) { updates.push(`notes = $${pos}`); values.push(input.notes); pos++; }

  if (!updates.length) return jsonError(400, "No fields provided to update");

  values.push(leadId, companyId);

  const result = await getDb().query(
    `UPDATE leads SET ${updates.join(", ")} WHERE id = $${pos++} AND company_id = $${pos} RETURNING *`,
    values
  );

  if (!result.rowCount) return jsonError(404, "Lead not found");
  return jsonOk({ lead: result.rows[0] });
}

/* ── DELETE — delete lead ── */

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const { leadId } = await context.params;

  const result = await getDb().query(
    `DELETE FROM leads WHERE id = $1 AND company_id = $2 RETURNING id`,
    [leadId, authResult.session.companyId]
  );

  if (!result.rowCount) return jsonError(404, "Lead not found");
  return jsonOk({ deleted: true });
}

