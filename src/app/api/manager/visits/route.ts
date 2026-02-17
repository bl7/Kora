import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const createVisitSchema = z.object({
  shopId: z.string().uuid(),
});

/* ── GET — list visits (rep-specific: reps see only their visits) ── */

export async function GET(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shop")?.trim() ?? "";
  const repId = searchParams.get("rep")?.trim() ?? "";
  const dateFrom = searchParams.get("date_from")?.trim() ?? "";
  const dateTo = searchParams.get("date_to")?.trim() ?? "";

  const isRep = authResult.session.role === "rep";
  const conditions: string[] = ["v.company_id = $1"];
  const values: (string | number)[] = [authResult.session.companyId];
  let pos = 2;

  if (isRep) {
    conditions.push(`v.rep_company_user_id = $${pos}`);
    values.push(authResult.session.companyUserId);
    pos++;
  }
  if (shopId) {
    conditions.push(`v.shop_id = $${pos}`);
    values.push(shopId);
    pos++;
  }
  if (repId && !isRep) {
    conditions.push(`v.rep_company_user_id = $${pos}`);
    values.push(repId);
    pos++;
  }
  if (dateFrom) {
    conditions.push(`v.started_at >= $${pos}::timestamptz`);
    values.push(dateFrom);
    pos++;
  }
  if (dateTo) {
    conditions.push(`v.started_at <= $${pos}::timestamptz`);
    values.push(dateTo);
    pos++;
  }

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
      s.name AS shop_name,
      u.full_name AS rep_name
    FROM visits v
    JOIN shops s ON s.id = v.shop_id AND s.company_id = v.company_id
    JOIN company_users cu ON cu.id = v.rep_company_user_id AND cu.company_id = v.company_id
    JOIN users u ON u.id = cu.user_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY v.started_at DESC
    LIMIT 200
    `,
    values
  );

  return jsonOk({ visits: result.rows });
}

/* ── POST — start a visit ── */

export async function POST(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = createVisitSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const { shopId } = parseResult.data;
  const companyId = authResult.session.companyId;
  const companyUserId = authResult.session.companyUserId;
  const isRep = authResult.session.role === "rep";

  if (isRep) {
    const assigned = await getDb().query(
      `SELECT 1 FROM shop_assignments WHERE company_id = $1 AND shop_id = $2 AND rep_company_user_id = $3 LIMIT 1`,
      [companyId, shopId, companyUserId]
    );
    if (!assigned.rowCount) {
      return jsonError(403, "You can only start visits at shops assigned to you");
    }
  }

  const shopExists = await getDb().query(
    `SELECT id FROM shops WHERE id = $1 AND company_id = $2 LIMIT 1`,
    [shopId, companyId]
  );
  if (!shopExists.rowCount) {
    return jsonError(404, "Shop not found");
  }

  const result = await getDb().query(
    `
    INSERT INTO visits (company_id, shop_id, rep_company_user_id)
    VALUES ($1, $2, $3)
    RETURNING id, shop_id, rep_company_user_id, started_at, ended_at
    `,
    [companyId, shopId, companyUserId]
  );

  return jsonOk({ visit: result.rows[0] }, 201);
}
