import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const clockInSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = clockInSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const { latitude, longitude, notes } = parseResult.data;
  const companyId = authResult.session.companyId;
  const companyUserId = authResult.session.companyUserId;

  const db = getDb();

  // Check for existing active session
  const activeSession = await db.query(
    `SELECT id FROM attendance_logs WHERE company_id = $1 AND rep_company_user_id = $2 AND clock_out_at IS NULL LIMIT 1`,
    [companyId, companyUserId]
  );

  if (activeSession.rowCount) {
    return jsonError(400, "You already have an active clock-in session. Please clock out first.");
  }

  const result = await db.query(
    `
    INSERT INTO attendance_logs (
      company_id,
      rep_company_user_id,
      clock_in_latitude,
      clock_in_longitude,
      notes
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, clock_in_at
    `,
    [companyId, companyUserId, latitude ?? null, longitude ?? null, notes ?? null]
  );

  return jsonOk({ log: result.rows[0] }, 201);
}
