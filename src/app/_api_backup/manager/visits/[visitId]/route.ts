import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const updateVisitSchema = z.object({
  end: z.literal(true).optional(),
  notes: z.string().max(5000).optional(),
});

/* ── GET — single visit ── */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ visitId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const { visitId } = await context.params;
  const companyId = authResult.session.companyId;
  const isRep = authResult.session.role === "rep";

  const result = await getDb().query(
    `
    SELECT
      v.id,
      v.shop_id,
      v.rep_company_user_id,
      v.started_at,
      v.ended_at,
      v.notes,
      v.created_at,
      v.updated_at,
      s.name AS shop_name,
      u.full_name AS rep_name
    FROM visits v
    JOIN shops s ON s.id = v.shop_id AND s.company_id = v.company_id
    JOIN company_users cu ON cu.id = v.rep_company_user_id AND cu.company_id = v.company_id
    JOIN users u ON u.id = cu.user_id
    WHERE v.id = $1 AND v.company_id = $2
      ${isRep ? "AND v.rep_company_user_id = $3" : ""}
    LIMIT 1
    `,
    isRep ? [visitId, companyId, authResult.session.companyUserId] : [visitId, companyId]
  );

  if (!result.rowCount) return jsonError(404, "Visit not found");
  return jsonOk({ visit: result.rows[0] });
}

/* ── PATCH — update/end a visit ── */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ visitId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = updateVisitSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const { end, notes } = parseResult.data;
  const { visitId } = await context.params;
  const companyId = authResult.session.companyId;
  const companyUserId = authResult.session.companyUserId;
  const isRep = authResult.session.role === "rep";

  const current = await getDb().query<{ rep_company_user_id: string; ended_at: string | null }>(
    `SELECT rep_company_user_id, ended_at FROM visits WHERE id = $1 AND company_id = $2 LIMIT 1`,
    [visitId, companyId]
  );
  if (!current.rowCount) return jsonError(404, "Visit not found");

  const row = current.rows[0]!;

  if (isRep && row.rep_company_user_id !== companyUserId) {
    return jsonError(403, "You can only update your own visits");
  }

  const updates: string[] = ["updated_at = NOW()"];
  const values: (string | boolean | null)[] = [visitId, companyId];
  let pos = 3;

  if (end && !row.ended_at) {
    updates.push(`ended_at = NOW()`);
  }

  if (notes !== undefined) {
    updates.push(`notes = $${pos}`);
    values.push(notes);
    pos++;
  }

  const result = await getDb().query(
    `
    UPDATE visits
    SET ${updates.join(", ")}
    WHERE id = $1 AND company_id = $2
    RETURNING id, shop_id, rep_company_user_id, started_at, ended_at, notes
    `,
    values
  );

  return jsonOk({ visit: result.rows[0] });
}

