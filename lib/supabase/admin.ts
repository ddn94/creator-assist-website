import { createClient } from "@supabase/supabase-js";
import { supabaseEnv, supabaseServiceRoleKey } from "@/lib/supabase/env";

/**
 * Server-only client that bypasses RLS. Use only after requireAdmin().
 * Needed because public.waitlist has no select grant for authenticated users.
 */
export function createServiceClient() {
  const key = supabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it from Project Settings → API (secret key).",
    );
  }
  const { url } = supabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
