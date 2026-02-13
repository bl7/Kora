import { type NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { getRequestSession, jsonError, jsonOk } from "@/lib/http";

type MeRow = {
  user_id: string;
  full_name: string;
  email: string;
  company_id: string;
  company_slug: string;
  company_name: string;
  company_user_id: string;
  role: "boss" | "manager" | "rep" | "back_office";
};

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return jsonError(401, "Unauthorized");
  }

  const result = await getDb().query<MeRow>(
    `
    SELECT
      u.id AS user_id,
      u.full_name,
      u.email,
      c.id AS company_id,
      c.slug AS company_slug,
      c.name AS company_name,
      cu.id AS company_user_id,
      cu.role
    FROM company_users cu
    JOIN users u ON u.id = cu.user_id
    JOIN companies c ON c.id = cu.company_id
    WHERE cu.id = $1
      AND cu.company_id = $2
      AND c.status = 'active'
      AND cu.status = 'active'
    LIMIT 1
    `,
    [session.companyUserId, session.companyId]
  );

  const row = result.rows[0];
  if (!row) {
    return jsonError(401, "Unauthorized");
  }

  return jsonOk({
    user: {
      id: row.user_id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      companyUserId: row.company_user_id,
    },
    company: {
      id: row.company_id,
      name: row.company_name,
      slug: row.company_slug,
    },
  });
}

