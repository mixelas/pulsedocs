import { createBrowserClient } from '@supabase/ssr';

/**
 * Validates and retrieves Supabase environment variables.
 * Fails fast at client instantiation time to catch configuration errors early.
 */
function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables. Check .env.local');
  }

  return { url, anonKey };
}

/**
 * Browser-side Supabase client factory.
 * Uses @supabase/ssr for proper cookie handling in client components.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
