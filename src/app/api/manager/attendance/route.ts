import { type NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

export async function GET(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const repId = searchParams.get("rep")?.trim() ?? "";
  const dateFrom = searchParams.get("date_from")?.trim() ?? "";
  const dateTo = searchParams.get("date_to")?.trim() ?? "";

  const isRep = authResult.session.role === "rep";
  const conditions: string[] = ["a.company_id = $1"];
  const values: (string | number)[] = [authResult.session.companyId];
  let pos = 2;

  if (isRep) {
    // Reps see only their own logs
    conditions.push(`a.rep_company_user_id = $${pos}`);
    values.push(authResult.session.companyUserId);
    pos++;
  } else if (repId) {
    // Managers can filter by rep
    conditions.push(`a.rep_company_user_id = $${pos}`);
    values.push(repId);
    pos++;
  }

  if (dateFrom) {
    conditions.push(`a.clock_in_at >= $${pos}::timestamptz`);
    values.push(dateFrom);
    pos++;
  }
  if (dateTo) {
    conditions.push(`a.clock_in_at <= $${pos}::timestamptz`);
    values.push(dateTo);
    pos++;
  }

  const db = getDb();
  const result = await db.query(
    `
    SELECT
      a.id,
      a.rep_company_user_id,
      a.clock_in_at,
      a.clock_out_at,
      a.clock_in_latitude,
      a.clock_in_longitude,
      a.clock_out_latitude,
      a.clock_out_longitude,
      a.notes,
      u.full_name AS rep_name
    FROM attendance_logs a
    JOIN company_users cu ON cu.id = a.rep_company_user_id AND cu.company_id = a.company_id
    JOIN users u ON u.id = cu.user_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY a.clock_in_at DESC
    LIMIT 1000
    `,
    values
  );

  return jsonOk({ logs: result.rows });
}
