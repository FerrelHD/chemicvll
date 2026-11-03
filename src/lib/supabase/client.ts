import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null or placeholder to signal demo/mock mode
    return null;
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

