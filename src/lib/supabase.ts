/**
 * Build-safe Supabase client
 * This file ensures no Supabase modules are loaded during build/static generation
 */

// Build-time safe mock client
const createMockClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        select: () => Promise.resolve({ data: [], error: null }),
      }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
})

// Runtime client cache
let runtimeClient: any = null

// Check if we're in browser
const isBrowser = () => typeof window !== 'undefined'

// Check if we have environment variables
const hasEnvVars = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Create real client only at runtime in browser
async function createRealClient() {
  if (!isBrowser() || !hasEnvVars()) {
    return createMockClient()
  }

  try {
    // Dynamic import - only executed in browser at runtime
    const supabaseModule = await import('@supabase/ssr')
    
    return supabaseModule.createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: { eventsPerSecond: 10 },
          heartbeatIntervalMs: 30000,
        },
        global: {
          headers: { 'X-Client-Info': 'cheetah-payroll' }
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        }
      }
    )
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    return createMockClient()
  }
}

// Main client function - always returns immediately
export function getSupabaseClient() {
  // During build or SSR, always return mock immediately
  if (!isBrowser()) {
    return createMockClient() as any
  }
  
  // In browser, return cached client or create one
  if (!runtimeClient) {
    // Create client asynchronously but return mock synchronously for now
    createRealClient().then(client => {
      runtimeClient = client
    }).catch(() => {
      runtimeClient = createMockClient()
    })
    
    // Return mock immediately while real client loads
    return createMockClient() as any
  }
  
  return runtimeClient
}

// Async version that waits for real client
export async function getSupabaseClientAsync() {
  if (!isBrowser()) {
    return createMockClient()
  }
  
  if (!runtimeClient) {
    runtimeClient = await createRealClient()
  }
  
  return runtimeClient
}

// Legacy function for backward compatibility
export function createClient() {
  return createMockClient() as any
}

// Auth utilities - all use async client
export const signIn = async (email: string, password: string) => {
  const client = await getSupabaseClientAsync()
  return await client.auth.signInWithPassword({ email, password })
}

export const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => {
  const client = await getSupabaseClientAsync()
  return await client.auth.signUp({ 
    email, 
    password,
    ...(metadata && { options: { data: metadata } })
  })
}

export const signOut = async () => {
  const client = await getSupabaseClientAsync()
  return await client.auth.signOut()
}

export const getCurrentUser = async () => {
  const client = await getSupabaseClientAsync()
  const { data: { user } } = await client.auth.getUser()
  return user
}

// Type definitions
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          tin_number: string | null
          address: string | null
          email: string | null
          phone: string | null
          primary_business: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tin_number?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          primary_business?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tin_number?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          primary_business?: string | null
          updated_at?: string
        }
      }
      // Add more table types as we create them
    }
  }
}