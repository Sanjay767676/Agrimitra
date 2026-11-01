import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client.
 *
 * Uses the SERVICE ROLE key, which bypasses Row Level Security. This client
 * must ONLY ever be used on the backend - never ship the service role key to
 * the browser.
 *
 * Returns null when Supabase is not configured so the app keeps working with
 * the browser's localStorage fallback.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes("your-project") || serviceKey.startsWith("your_")) {
    cached = null;
    return cached;
  }

  cached = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}

/**
 * Verify a Supabase access token (sent by the frontend as a Bearer token) and
 * return the authenticated user, or null if the token is missing/invalid.
 */
export async function getUserFromToken(accessToken?: string) {
  const admin = getSupabaseAdmin();
  if (!admin || !accessToken) return null;
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}
