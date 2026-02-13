import { type NextRequest, NextResponse } from "next/server";

import {
  getSessionCookieName,
  type CompanyRole,
  type SessionPayload,
  verifySessionToken,
} from "@/lib/auth";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export async function getRequestSession(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function ensureRole(
  session: SessionPayload | null,
  allowedRoles: CompanyRole[]
) {
  if (!session) {
    return { ok: false as const, response: jsonError(401, "Unauthorized") };
  }

  if (!allowedRoles.includes(session.role)) {
    return { ok: false as const, response: jsonError(403, "Forbidden") };
  }

  return { ok: true as const, session };
}

