import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { getRequestSession, jsonError, jsonOk } from "@/lib/http";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+977${digits}`;
  if (digits.length === 13 && digits.startsWith("977")) return `+${digits}`;
  if (digits.length >= 10) return `+977${digits.slice(-10)}`;
  return `+977${digits.padStart(10, "0")}`;
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return jsonError(401, "Unauthorized");
  }

  const parseResult = updateProfileSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query<{ user_id: string }>(
      `SELECT user_id FROM company_users WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [session.companyUserId, session.companyId]
    );

    if (!existing.rowCount) {
      await client.query("ROLLBACK");
      return jsonError(404, "Profile not found");
    }

    const userId = existing.rows[0]!.user_id;

    if (input.fullName) {
      await client.query(
        `UPDATE users SET full_name = $1 WHERE id = $2`,
        [input.fullName, userId]
      );
    }

    if (input.email !== undefined) {
      const email = input.email.toLowerCase().trim();
      await client.query(
        `UPDATE users SET email = $1, email_verified_at = NULL WHERE id = $2`,
        [email, userId]
      );
    }

    if (input.phone !== undefined) {
      const phone = normalizePhone(input.phone);
      if (!/^\+977\d{10}$/.test(phone)) {
        await client.query("ROLLBACK");
        return jsonError(400, "Phone must be 10 digits or +977 followed by 10 digits");
      }
      await client.query(
        `UPDATE company_users SET phone = $1 WHERE id = $2 AND company_id = $3`,
        [phone, session.companyUserId, session.companyId]
      );
    }

    await client.query("COMMIT");
    return jsonOk({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return jsonError(
      500,
      error instanceof Error ? error.message : "Could not update profile"
    );
  } finally {
    client.release();
  }
}
