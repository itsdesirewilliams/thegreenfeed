/**
 * Supabase environment access.
 *
 * Values are never hard-coded. Configure them in `.env.local` (see
 * `.env.example` and the README). The public URL and publishable key are safe
 * to expose to the browser; the secret key must never be read in client code.
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
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** True when the public Supabase credentials have been provided. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

/**
 * Returns the public Supabase configuration or throws a descriptive error.
 * Call this from a route handler / component that can render a configuration
 * error, so a missing setup never crashes unrelated pages.
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local (see .env.example).",
    );
  }
  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };
}
