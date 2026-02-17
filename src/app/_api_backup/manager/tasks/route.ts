import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const createTaskSchema = z.object({
  repCompanyUserId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueAt: z.string().datetime().optional(),
  leadId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
});

/* ── GET — list tasks (reps see only their tasks) ── */

export async function GET(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() ?? "";
  const repId = searchParams.get("rep")?.trim() ?? "";

  const isRep = authResult.session.role === "rep";
  const conditions: string[] = ["t.company_id = $1"];
  const values: (string | number)[] = [authResult.session.companyId];
  let pos = 2;

  if (isRep) {
    conditions.push(`t.rep_company_user_id = $${pos}`);
    values.push(authResult.session.companyUserId);
    pos++;
  }
  if (repId && !isRep) {
    conditions.push(`t.rep_company_user_id = $${pos}`);
    values.push(repId);
    pos++;
  }
  if (status) {
    conditions.push(`t.status = $${pos}`);
    values.push(status);
    pos++;
  }

  const result = await getDb().query(
    `
    SELECT
      t.id,
      t.rep_company_user_id,
      t.title,
      t.description,
      t.status,
      t.due_at,
      t.completed_at,
      t.lead_id,
      t.shop_id,
      t.created_at,
      t.updated_at,
      u.full_name AS rep_name
    FROM tasks t
    JOIN company_users cu ON cu.id = t.rep_company_user_id AND cu.company_id = t.company_id
    JOIN users u ON u.id = cu.user_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC
    LIMIT 200
    `,
    values
  );

  return jsonOk({ tasks: result.rows });
}

/* ── POST — create task (assign to rep) ── */

export async function POST(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = createTaskSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;
  const companyId = authResult.session.companyId;

  const repExists = await getDb().query(
    `SELECT id FROM company_users WHERE id = $1 AND company_id = $2 AND status = 'active' LIMIT 1`,
    [input.repCompanyUserId, companyId]
  );
  if (!repExists.rowCount) {
    return jsonError(400, "repCompanyUserId must be an active user in this company");
  }

  const result = await getDb().query(
    `
    INSERT INTO tasks (company_id, rep_company_user_id, title, description, due_at, lead_id, shop_id)
    VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7)
    RETURNING id, rep_company_user_id, title, description, status, due_at, completed_at, lead_id, shop_id, created_at
    `,
    [
      companyId,
      input.repCompanyUserId,
      input.title,
      input.description ?? null,
      input.dueAt ?? null,
      input.leadId ?? null,
      input.shopId ?? null,
    ]
  );

  return jsonOk({ task: result.rows[0] }, 201);
}
