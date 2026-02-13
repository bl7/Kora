import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const createLeadSchema = z.object({
  shopId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  contactName: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().max(500).optional(),
  assignedRepCompanyUserId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});


/* ── GET — list leads ── */

export async function GET(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";

  const result = await getDb().query(
    `
    SELECT
      l.id,
      l.name,
      l.contact_name,
      l.phone,
      l.email,
      l.address,
      l.status,
      l.notes,
      l.converted_at,
      l.created_at,
      l.updated_at,
      s.name AS shop_name,
      u.full_name AS assigned_rep_name
    FROM leads l
    LEFT JOIN shops s ON s.id = l.shop_id AND s.company_id = l.company_id
    LEFT JOIN company_users cu ON cu.id = l.assigned_rep_company_user_id AND cu.company_id = l.company_id
    LEFT JOIN users u ON u.id = cu.user_id
    WHERE l.company_id = $1
      AND ($2::text = '' OR l.status = $2)
      AND ($3::text = '' OR l.name ILIKE '%' || $3 || '%' OR l.contact_name ILIKE '%' || $3 || '%' OR COALESCE(l.phone, '') ILIKE '%' || $3 || '%')
    ORDER BY l.created_at DESC
    LIMIT 200
    `,
    [authResult.session.companyId, status, q]
  );

  return jsonOk({ leads: result.rows });
}

/* ── POST — create lead ── */

export async function POST(request: NextRequest) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = createLeadSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;

  try {
    const result = await getDb().query(
      `
      INSERT INTO leads (
        company_id,
        shop_id,
        name,
        contact_name,
        phone,
        email,
        address,
        assigned_rep_company_user_id,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        authResult.session.companyId,
        input.shopId ?? null,
        input.name,
        input.contactName ?? null,
        input.phone ?? null,
        input.email ?? null,
        input.address ?? null,
        input.assignedRepCompanyUserId ?? null,
        input.notes ?? null,
      ]
    );

    return jsonOk({ lead: result.rows[0] }, 201);
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Could not create lead");
  }
}

