
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseClient() {
  // Handle missing environment variables during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  // Create a single supabase client for interacting with your database
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}

// Alias for compatibility with existing code
export const getSupabaseClientAsync = getSupabaseClient;
