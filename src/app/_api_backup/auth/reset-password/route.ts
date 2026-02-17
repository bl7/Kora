import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { consumeToken } from "@/lib/tokens";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parseResult = schema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const { token, password } = parseResult.data;

  const userId = await consumeToken(token, "password_reset");

  if (!userId) {
    return jsonError(400, "Invalid or expired reset link. Please request a new one.");
  }

  const passwordHash = await hashPassword(password);

  await getDb().query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    passwordHash,
    userId,
  ]);

  return jsonOk({ message: "Password has been reset. You can now log in." });
}

