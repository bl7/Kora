import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const bodySchema = z.object({
  reassignments: z.record(z.string().uuid(), z.string().uuid()).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyUserId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), [
    "boss",
    "manager",
  ]);
  if (!authResult.ok) return authResult.response;

  const { companyUserId } = await context.params;
  const parseResult = bodySchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const reassignments = parseResult.data.reassignments ?? {};
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const staff = await client.query<{ user_id: string; role: string }>(
      `SELECT user_id, role FROM company_users WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [companyUserId, authResult.session.companyId]
    );
    if (!staff.rowCount) {
      await client.query("ROLLBACK");
      return jsonError(404, "Staff member not found");
    }

    const rows = await client.query<{
      shop_id: string;
      rep_count: string;
    }>(
      `
      WITH this_rep_shops AS (
        SELECT shop_id FROM shop_assignments
        WHERE company_id = $1 AND rep_company_user_id = $2
      ),
      rep_counts AS (
        SELECT shop_id, COUNT(*)::text AS rep_count
        FROM shop_assignments WHERE company_id = $1
        GROUP BY shop_id
      )
      SELECT t.shop_id, r.rep_count
      FROM this_rep_shops t
      JOIN rep_counts r ON r.shop_id = t.shop_id
      `,
      [authResult.session.companyId, companyUserId]
    );

    const soloShopIds: string[] = [];
    const otherRepShopIds: string[] = [];
    for (const row of rows.rows) {
      const count = parseInt(row.rep_count, 10);
      if (count <= 1) soloShopIds.push(row.shop_id);
      else otherRepShopIds.push(row.shop_id);
    }

    for (const shopId of soloShopIds) {
      const newRepId = reassignments[shopId];
      if (!newRepId) {
        await client.query("ROLLBACK");
        return jsonError(
          400,
          `Shop ${shopId} has no other reps. Provide reassignments[${shopId}] with an active rep to reassign before deactivating.`
        );
      }
      const otherRep = await client.query(
        `SELECT id FROM company_users WHERE id = $1 AND company_id = $2 AND role = 'rep' AND status = 'active' LIMIT 1`,
        [newRepId, authResult.session.companyId]
      );
      if (!otherRep.rowCount) {
        await client.query("ROLLBACK");
        return jsonError(400, `reassignments[${shopId}] must be an active rep in this company`);
      }
      await client.query(
        `DELETE FROM shop_assignments WHERE company_id = $1 AND shop_id = $2 AND rep_company_user_id = $3`,
        [authResult.session.companyId, shopId, companyUserId]
      );
      await client.query(
        `INSERT INTO shop_assignments (company_id, shop_id, rep_company_user_id, is_primary)
         VALUES ($1, $2, $3, FALSE)
         ON CONFLICT (company_id, shop_id, rep_company_user_id) DO NOTHING`,
        [authResult.session.companyId, shopId, newRepId]
      );
    }

    await client.query(
      `DELETE FROM shop_assignments WHERE company_id = $1 AND rep_company_user_id = $2`,
      [authResult.session.companyId, companyUserId]
    );

    await client.query(
      `UPDATE company_users SET status = 'inactive' WHERE id = $1 AND company_id = $2`,
      [companyUserId, authResult.session.companyId]
    );

    await client.query("COMMIT");
    return jsonOk({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return jsonError(
      500,
      error instanceof Error ? error.message : "Could not deactivate"
    );
  } finally {
    client.release();
  }
}
