import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const clockOutSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = clockOutSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const { latitude, longitude, notes } = parseResult.data;
  const companyId = authResult.session.companyId;
  const companyUserId = authResult.session.companyUserId;

  const db = getDb();

  // Find the active session to clock out
  const activeSession = await db.query(
    `
    UPDATE attendance_logs
    SET clock_out_at = NOW(),
        clock_out_latitude = $1,
        clock_out_longitude = $2,
        notes = COALESCE($3, notes),
        updated_at = NOW()
    WHERE company_id = $4
      AND rep_company_user_id = $5
      AND clock_out_at IS NULL
    RETURNING id, clock_in_at, clock_out_at
    `,
    [latitude ?? null, longitude ?? null, notes ?? null, companyId, companyUserId]
  );

  if (!activeSession.rowCount) {
    return jsonError(400, "No active clock-in session found to clock out from.");
  }

  return jsonOk({ log: activeSession.rows[0] });
}
