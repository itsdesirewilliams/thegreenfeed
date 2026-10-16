import "server-only";

/**
 * Supabase environment access (server-only).
 *
 * Values are never hard-coded. Configure them in `.env.local` (see
 * `.env.example` and the README) and in the Vercel project environment.
 *
 * The variable names match the Vercel configuration exactly: `SUPABASE_URL`
 * and `SUPABASE_PUBLISHABLE_KEY` (plus `SUPABASE_SECRET_KEY`). None of them is
 * prefixed with `NEXT_PUBLIC_`, so none is exposed to browser JavaScript — the
 * browser never talks to Supabase directly; submissions go through the
 * server-side `/api/survey` route.
 */
/**
 * Normalises a Supabase project URL. The value must be the bare project URL
 * (for example `https://<ref>.supabase.co`); if someone accidentally pasted the
 * REST base path with it, strip that suffix — otherwise supabase-js would
 * double the path (`/rest/v1/rest/v1/...`) and PostgREST rejects the request
 * with PGRST125 "Invalid path specified in request URL".
 */
function normalizeSupabaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = new URL(trimmed);
  parsed.pathname = "";
  return parsed.toString().replace(/\/+$/, "");
}

export const SUPABASE_URL = normalizeSupabaseUrl(
  process.env.SUPABASE_URL ?? "",
);

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

/** True when the server-side Supabase credentials have been provided. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

/**
 * Returns the server-side Supabase configuration or throws a descriptive error.
 * Call this from a route handler / component that can render a configuration
 * error, so a missing setup never crashes unrelated pages.
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and " +
        "SUPABASE_PUBLISHABLE_KEY to .env.local and the Vercel project " +
        "environment (see .env.example).",
    );
  }
  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };
}
