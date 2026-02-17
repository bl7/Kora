import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const updateTaskSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

/* ── GET — single task ── */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const { taskId } = await context.params;
  const companyId = authResult.session.companyId;
  const isRep = authResult.session.role === "rep";

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
    WHERE t.id = $1 AND t.company_id = $2
      ${isRep ? "AND t.rep_company_user_id = $3" : ""}
    LIMIT 1
    `,
    isRep ? [taskId, companyId, authResult.session.companyUserId] : [taskId, companyId]
  );

  if (!result.rowCount) return jsonError(404, "Task not found");
  return jsonOk({ task: result.rows[0] });
}

/* ── PATCH — update task ── */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = updateTaskSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;
  const { taskId } = await context.params;
  const companyId = authResult.session.companyId;
  const companyUserId = authResult.session.companyUserId;
  const isRep = authResult.session.role === "rep";

  const current = await getDb().query<{ rep_company_user_id: string }>(
    `SELECT rep_company_user_id FROM tasks WHERE id = $1 AND company_id = $2 LIMIT 1`,
    [taskId, companyId]
  );
  if (!current.rowCount) return jsonError(404, "Task not found");

  if (isRep && current.rows[0]!.rep_company_user_id !== companyUserId) {
    return jsonError(403, "You can only update tasks assigned to you");
  }

  const updates: string[] = [];
  const values: (string | null)[] = [];
  let pos = 1;

  if (input.status !== undefined) {
    updates.push(`status = $${pos}`);
    values.push(input.status);
    pos++;
    if (input.status === "completed") {
      updates.push("completed_at = COALESCE(completed_at, NOW())");
    }
  }
  if (input.dueAt !== undefined) {
    updates.push(`due_at = $${pos}`);
    values.push(input.dueAt);
    pos++;
  }
  if (input.title !== undefined) {
    updates.push(`title = $${pos}`);
    values.push(input.title);
    pos++;
  }
  if (input.description !== undefined) {
    updates.push(`description = $${pos}`);
    values.push(input.description);
    pos++;
  }

  if (!updates.length) return jsonError(400, "No fields provided to update");

  values.push(taskId, companyId);

  const result = await getDb().query(
    `
    UPDATE tasks SET ${updates.join(", ")}, updated_at = NOW()
    WHERE id = $${pos++} AND company_id = $${pos}
    RETURNING id, rep_company_user_id, title, description, status, due_at, completed_at, lead_id, shop_id, created_at, updated_at
    `,
    values
  );

  return jsonOk({ task: result.rows[0] });
}
