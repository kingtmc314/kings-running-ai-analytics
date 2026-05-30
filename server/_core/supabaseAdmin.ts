// =============================================================
// Server-side Supabase Admin Client
// Uses service role key for JWT verification and admin ops
// =============================================================
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_adminClient) {
    if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
      throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    _adminClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _adminClient;
}

/**
 * Verify a Supabase JWT access token and return the user.
 * Returns null if the token is invalid or expired.
 */
export async function verifySupabaseToken(accessToken: string) {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
