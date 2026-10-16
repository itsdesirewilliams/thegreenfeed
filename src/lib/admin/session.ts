import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shared admin session primitives (no `server-only`, no `next/headers`).
 *
 * These are pure functions so the same verification can run both inside the
 * app (see `auth.ts`) and in the edge guard (`src/proxy.ts`). The proxy file
 * must not import modules that pull in request-scoped APIs, hence this split.
 */

export const SESSION_COOKIE = "gf_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
export const MIN_SECRET_LENGTH = 16;

export function getSessionSecret(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const secret = env.ADMIN_SESSION_SECRET ?? "";
  if (secret.length < MIN_SECRET_LENGTH) return null;
  return secret;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Creates a signed session cookie value valid for the TTL. */
export function createSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: "admin",
      iat: issuedAt,
      exp: issuedAt + SESSION_TTL_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Verifies signature and expiry of a session cookie value. */
export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(payload, secret);
  if (!safeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
