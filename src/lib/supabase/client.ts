import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/**
 * Browser-side Supabase client using the publishable key only.
 *
 * Import this from Client Components. Row Level Security must be configured
 * for any table this client touches. Never pass a secret/service-role key here.
 */
export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
