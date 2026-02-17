import { type NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(_request), [
    "boss",
    "manager",
    "back_office",
  ]);
  if (!authResult.ok) return authResult.response;

  const { assignmentId } = await context.params;
  const db = getDb();

  const result = await db.query(
    `DELETE FROM shop_assignments
     WHERE id = $1 AND company_id = $2
     RETURNING id`,
    [assignmentId, authResult.session.companyId]
  );

  if (!result.rowCount) {
    return jsonError(404, "Assignment not found");
  }

  return jsonOk({ ok: true });
}
