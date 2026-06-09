import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getPublicEnvValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export const supabaseUrl = getPublicEnvValue(import.meta.env.VITE_SUPABASE_URL);
export const supabaseAnonKey = getPublicEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }

  return browserClient;
}
