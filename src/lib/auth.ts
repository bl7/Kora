import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

export type CompanyRole = "boss" | "manager" | "rep" | "back_office" | "dispatch_supervisor";

export type SessionPayload = {
  userId: string;
  companyId: string;
  companyUserId: string;
  role: CompanyRole;
};

const SESSION_COOKIE_NAME = "kora_session";

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signSessionToken(payload: SessionPayload) {
  const secret = getJwtSecret();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);

  return payload as SessionPayload;
}

function getJwtSecret() {
  const value = process.env.JWT_SECRET;

  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set");
  }

  // Local development fallback to avoid blocking setup before env hardening.
  const effectiveSecret = value ?? "kora-dev-only-jwt-secret-change-me";
  return new TextEncoder().encode(effectiveSecret);
}

