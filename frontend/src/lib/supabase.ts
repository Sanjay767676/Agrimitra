import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Browser Supabase client (anon key). Used for authentication.
 * Returns null when Supabase is not configured so the app can fall back to
 * localStorage-only mode.
 */
export const supabase: SupabaseClient | null =
  url && anonKey && !anonKey.startsWith("your_")
    ? createClient(url, anonKey)
    : null;

export const isSupabaseConfigured = supabase !== null;
