
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseClient() {
  // Create a single supabase client for interacting with your database
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
