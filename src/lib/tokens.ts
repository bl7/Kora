import { randomBytes, createHash } from "crypto";
import { getDb } from "@/lib/db";

/**
 * Generate a random token and store its hash in the DB.
 * Returns the plain-text token (to be sent in the email link).
 */
export async function createToken(
  userId: string,
  type: "email_verify" | "password_reset",
  expiresInMs: number
) {
  const plainToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + expiresInMs);

  // Invalidate any existing unused tokens of the same type for this user
  await getDb().query(
    `UPDATE tokens SET used_at = NOW() WHERE user_id = $1 AND type = $2 AND used_at IS NULL`,
    [userId, type]
  );

  await getDb().query(
    `INSERT INTO tokens (user_id, type, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, type, tokenHash, expiresAt.toISOString()]
  );

  return plainToken;
}

/**
 * Verify a token: checks hash, expiry, and that it hasn't been used.
 * If valid, marks it as used and returns the associated user_id.
 */
export async function consumeToken(
  plainToken: string,
  type: "email_verify" | "password_reset"
): Promise<string | null> {
  const tokenHash = hashToken(plainToken);

  const result = await getDb().query(
    `
    UPDATE tokens
    SET used_at = NOW()
    WHERE token_hash = $1
      AND type = $2
      AND used_at IS NULL
      AND expires_at > NOW()
    RETURNING user_id
    `,
    [tokenHash, type]
  );

  if (!result.rowCount) return null;
  return result.rows[0].user_id as string;
}

function hashToken(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}

