import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_token", request.url));
  }

  const userId = await consumeToken(token, "email_verify");

  if (!userId) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid_or_expired_token", request.url)
    );
  }

  // Mark email as verified
  await getDb().query(
    `UPDATE users SET email_verified_at = NOW() WHERE id = $1 AND email_verified_at IS NULL`,
    [userId]
  );

  // Redirect to login with success message
  return NextResponse.redirect(new URL("/auth/login?verified=true", request.url));
}

