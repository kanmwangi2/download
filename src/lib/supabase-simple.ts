/**
 * Simplified Supabase client to eliminate recursion issues
 */

// Simple client cache
let clientInstance: any = null;
let isCreating = false;

const isBrowser = () => typeof window !== 'undefined';

const hasValidEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key);
};

export async function getSupabaseClientAsync() {
  // Return immediately if we already have a client
  if (clientInstance) {
    return clientInstance;
  }

  // If not in browser, return mock
  if (!isBrowser()) {
    return createMockClient();
  }

  // If no env vars, return mock
  if (!hasValidEnv()) {
    return createMockClient();
  }

  // If already creating, wait for it
  if (isCreating) {
    let attempts = 0;
    while (isCreating && attempts < 100) { // Max 5 seconds
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }
    return clientInstance || createMockClient();
  }

  // Create new client
  isCreating = true;
  try {
    const { createBrowserClient } = await import('@supabase/ssr');
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    clientInstance = createMockClient();
  } finally {
    isCreating = false;
  }

  return clientInstance;
}

function createMockClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database' } }),
        }),
        single: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database' } }),
      }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Mock client - no database' } }),
    }),
  };
}

// Legacy exports for compatibility
export const getSupabaseClient = getSupabaseClientAsync;
export const createClient = getSupabaseClientAsync;
