"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAdminConfigured,
  sessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin/auth";

export type LoginState = { error?: string };

/**
 * Server Action for the admin sign-in form. Runs on the server only; Next.js
 * verifies the request Origin for Server Actions, and the session cookie is
 * HTTP-only + same-site. Every protected page and export route re-checks the
 * session independently — this action is not the only line of defence.
 */
export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return { error: "Admin sign-in is not configured on this deployment." };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Enter your password." };
  }
  if (!verifyAdminPassword(password)) {
    return { error: "Incorrect password." };
  }

  const token = createSessionToken();
  if (!token) {
    return { error: "Admin sign-in is not configured on this deployment." };
  }

  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  redirect("/admin");
}

/** Clears the session cookie and returns to the login screen. */
export async function logoutAction(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
