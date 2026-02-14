import { type NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

/** Returns which shops need reassignment (solo) vs which just remove this rep. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ companyUserId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(_request), [
    "boss",
    "manager",
  ]);
  if (!authResult.ok) return authResult.response;

  const { companyUserId } = await context.params;
  const db = getDb();

  const staff = await db.query<{ id: string }>(
    `SELECT id FROM company_users WHERE id = $1 AND company_id = $2 LIMIT 1`,
    [companyUserId, authResult.session.companyId]
  );
  if (!staff.rowCount) {
    return jsonError(404, "Staff member not found");
  }

  // Shops this rep is assigned to, with rep count per shop
  const rows = await db.query<{
    shop_id: string;
    shop_name: string;
    rep_count: string;
  }>(
    `
    WITH this_rep_shops AS (
      SELECT sa.shop_id, s.name AS shop_name
      FROM shop_assignments sa
      JOIN shops s ON s.id = sa.shop_id AND s.company_id = sa.company_id
      WHERE sa.company_id = $1 AND sa.rep_company_user_id = $2
    ),
    rep_counts AS (
      SELECT shop_id, COUNT(*)::text AS rep_count
      FROM shop_assignments
      WHERE company_id = $1
      GROUP BY shop_id
    )
    SELECT t.shop_id, t.shop_name, r.rep_count
    FROM this_rep_shops t
    JOIN rep_counts r ON r.shop_id = t.shop_id
    `,
    [authResult.session.companyId, companyUserId]
  );

  const shops_only_this_rep: { shop_id: string; shop_name: string }[] = [];
  const shops_other_reps_too: { shop_id: string; shop_name: string }[] = [];

  for (const row of rows.rows) {
    const count = parseInt(row.rep_count, 10);
    const item = { shop_id: row.shop_id, shop_name: row.shop_name };
    if (count <= 1) {
      shops_only_this_rep.push(item);
    } else {
      shops_other_reps_too.push(item);
    }
  }

  return jsonOk({
    shops_only_this_rep,
    shops_other_reps_too,
  });
}
