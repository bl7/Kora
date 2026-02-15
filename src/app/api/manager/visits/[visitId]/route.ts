import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const updateVisitSchema = z.object({
  end: z.literal(true).optional(),
});

/* ── PATCH — end a visit ── */

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
  if (row.ended_at) return jsonError(400, "Visit is already ended");

  if (isRep && row.rep_company_user_id !== companyUserId) {
    return jsonError(403, "You can only end your own visits");
  }

  const result = await getDb().query(
    `
    UPDATE visits
    SET ended_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND company_id = $2
    RETURNING id, shop_id, rep_company_user_id, started_at, ended_at
    `,
    [visitId, companyId]
  );

  return jsonOk({ visit: result.rows[0] });
}
