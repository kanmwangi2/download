// Safe Supabase client loader for build environments
export async function loadSupabaseClient() {
  // During build time, don't load the actual client
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
    }
  }

  // Dynamically import the client only when safe
  const { getSupabaseClient } = await import('@/lib/supabase')
  return getSupabaseClient()
}

// Safe wrapper for auth operations
export async function safeAuthOperation<T>(
  operation: (client: any) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return fallback
    }
    
    const client = await loadSupabaseClient()
    return await operation(client)
  } catch (error) {
    console.error('Safe auth operation failed:', error)
    return fallback
  }
}
