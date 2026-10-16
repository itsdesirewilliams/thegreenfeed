import "server-only";

import { createHash, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  getSessionSecret,
  verifySessionToken,
} from "./session";

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
 *
 * The pure crypto lives in `./session` so `src/proxy.ts` can verify the cookie
 * before any admin route renders. Defense in depth: every admin page and export
 * route still calls `requireAdmin`/`requireAdminApi` independently.
 */

export {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
};

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
