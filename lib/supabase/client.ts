import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

const configuredSupabaseUrl = supabaseUrl;
const configuredSupabaseAnonKey = supabaseAnonKey;

export const supabase = createClient(
  configuredSupabaseUrl,
  configuredSupabaseAnonKey,
);

export async function checkSupabaseConnection() {
  const response = await fetch(`${configuredSupabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: configuredSupabaseAnonKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase health check failed with status ${response.status}.`);
  }

  return true;
}
