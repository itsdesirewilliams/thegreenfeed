import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/**
 * Server-side Supabase client using the publishable key. Subject to Row Level
 * Security. Use for reads that should be visible to logged-in/anonymous
 * visitors according to your policies.
 */
export function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Privileged server-only client using `SUPABASE_SECRET_KEY`.
 *
 * This bypasses Row Level Security, so only call it from a trusted server
 * context (a Route Handler or Server Action) after validating input. Never
 * import this function into a Client Component and never expose the key with a
 * `NEXT_PUBLIC_` prefix.
 */
export function createAdminSupabaseClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it to .env.local if you are using " +
        "the server-side survey insert route (see .env.example).",
    );
  }
  const { url } = getSupabaseConfig();
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
