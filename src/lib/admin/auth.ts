import "server-only";

import {
  createHmac,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Admin authentication (server-only).
 *
 * Threat model: a small student project on free tiers. There is a single admin
 * identity. Credentials never live in source control; they come from Vercel
 * environment variables. Sessions are a signed, HTTP-only, same-site cookie.
 *
 * Environment variables (names only — never commit values):
 *   - ADMIN_SESSION_SECRET : 32+ chars, signs the session cookie. Required.
 *   - ADMIN_PASSWORD_HASH  : preferred. Format `scrypt:<saltHex>:<hashHex>`.
 *   - ADMIN_PASSWORD       : fallback plaintext, compared in constant time.
 *
 * If ADMIN_SESSION_SECRET is missing, or neither password variable is set, the
 * admin area stays disabled and sign-in reports that it is not configured.
 */

export const SESSION_COOKIE = "gf_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const MIN_SECRET_LENGTH = 16;

function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (secret.length < MIN_SECRET_LENGTH) return null;
  return secret;
}

export function isAdminConfigured(): boolean {
  return (
    getSessionSecret() !== null &&
    Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD)
  );
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Constant-time password check against the configured hash or plaintext. */
export function verifyAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const parts = hash.split(":");
    if (parts.length === 3 && parts[0] === "scrypt") {
      const [, saltHex, expectedHex] = parts;
      try {
        const salt = Buffer.from(saltHex, "hex");
        const expected = Buffer.from(expectedHex, "hex");
        const actual = scryptSync(password, salt, expected.length);
        return safeEqual(actual, expected);
      } catch {
        return false;
      }
    }
    return false;
  }

  const plaintext = process.env.ADMIN_PASSWORD;
  if (plaintext) {
    const a = createHash("sha256").update(password).digest();
    const b = createHash("sha256").update(plaintext).digest();
    return safeEqual(a, b);
  }

  return false;
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
    JSON.stringify({ sub: "admin", iat: issuedAt, exp: issuedAt + SESSION_TTL_SECONDS }),
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
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (!safeEqual(a, b)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** True when the current request carries a valid admin session. */
export async function hasAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Page guard: redirect to the login screen when not authenticated. */
export async function requireAdmin(): Promise<void> {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}

/**
 * Route-handler guard. Returns true when allowed; the caller must return a
 * 401/redirect itself when this is false.
 */
export async function requireAdminApi(): Promise<boolean> {
  return hasAdminSession();
}
