import { z } from "zod";

import { getDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { sendPasswordReset } from "@/lib/mail";
import { createToken } from "@/lib/tokens";

const schema = z.object({
  email: z.email().max(255),
});

export async function POST(request: Request) {
  const parseResult = schema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, "Please provide a valid email address");
  }

  const email = parseResult.data.email.toLowerCase().trim();

  // Look up user — always return 200 to avoid email enumeration
  const userResult = await getDb().query<{ id: string; full_name: string }>(
    `SELECT id, full_name FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (userResult.rowCount) {
    const user = userResult.rows[0];
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    try {
      const token = await createToken(user.id, "password_reset", 60 * 60 * 1000); // 1 hour
      const resetUrl = `${origin}/auth/reset-password?token=${token}`;
      await sendPasswordReset(email, user.full_name, resetUrl);
    } catch (err) {
      console.error("[mail] Failed to send password reset:", err);
    }
  }

  // Always return OK to prevent email enumeration
  return jsonOk({ message: "If an account with that email exists, a reset link has been sent." });
}

