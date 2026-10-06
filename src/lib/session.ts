import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "preditiva_session";
const SESSION_HOURS = 8;

type SessionPayload = {
  role: "admin";
  username: string;
  expiresAt: number;
};

function requiredSecret(): string {
  const secret = process.env.PREDITIVA_AUTH_SECRET?.trim();
  if (!secret || secret.length < 24) {
    throw new Error("PREDITIVA_AUTH_SECRET ausente ou muito curta.");
  }
  return secret;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string): string {
  return createHmac("sha256", requiredSecret()).update(payload).digest("base64url");
}

export function authenticateAdmin(username: string, password: string): boolean {
  const expectedUser = process.env.PREDITIVA_ADMIN_USER?.trim();
  const expectedPassword = process.env.PREDITIVA_ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPassword);
}

export function createSessionToken(username: string): string {
  const payload: SessionPayload = {
    role: "admin",
    username,
    expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, receivedSignature, extra] = token.split(".");
  if (!encoded || !receivedSignature || extra || !safeEqual(signature(encoded), receivedSignature)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (parsed.role !== "admin" || typeof parsed.username !== "string" || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}
