import { z } from "zod";

import { getSessionCookieName, signSessionToken, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
  companySlug: z.string().min(2).max(80).optional(),
});

type MembershipRow = {
  user_id: string;
  full_name: string;
  password_hash: string;
  email_verified_at: Date | null;
  company_id: string;
  company_slug: string;
  company_name: string;
  company_user_id: string;
  role: "boss" | "manager" | "rep" | "back_office";
};

export async function POST(request: Request) {
  const parseResult = loginSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const email = parseResult.data.email.toLowerCase().trim();
  const { password, companySlug } = parseResult.data;

  const db = getDb();
  const membership = await db.query<MembershipRow>(
    `
    SELECT
      u.id AS user_id,
      u.full_name,
      u.password_hash,
      u.email_verified_at,
      c.id AS company_id,
      c.slug AS company_slug,
      c.name AS company_name,
      cu.id AS company_user_id,
      cu.role
    FROM users u
    JOIN company_users cu ON cu.user_id = u.id AND cu.status = 'active'
    JOIN companies c ON c.id = cu.company_id AND c.status = 'active'
    WHERE u.email = $1
      AND ($2::text IS NULL OR c.slug = $2)
    ORDER BY cu.created_at ASC
    LIMIT 1
    `,
    [email, companySlug ?? null]
  );

  const row = membership.rows[0];
  if (!row) {
    return jsonError(401, "Invalid credentials");
  }

  const passwordValid = await verifyPassword(password, row.password_hash);
  if (!passwordValid) {
    return jsonError(401, "Invalid credentials");
  }

  // Check if email is verified
  if (!row.email_verified_at) {
    return jsonError(
      403,
      "Please verify your email address before logging in. Check your inbox for the verification link."
    );
  }

  await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [row.user_id]);

  const token = await signSessionToken({
    userId: row.user_id,
    companyId: row.company_id,
    companyUserId: row.company_user_id,
    role: row.role,
  });

  const response = jsonOk({
    token,
    session: {
      userId: row.user_id,
      fullName: row.full_name,
      companyId: row.company_id,
      companySlug: row.company_slug,
      companyName: row.company_name,
      companyUserId: row.company_user_id,
      role: row.role,
    },
  });

  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

