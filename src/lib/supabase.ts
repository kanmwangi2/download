/**
 * Build-safe Supabase client
 * This file ensures no Supabase modules are loaded during build/static generation
 */

// Build-time safe mock client
const createMockClient = () => {
  console.warn('⚠️ Supabase: Using mock client - database operations will not work')
  console.warn('💡 To fix this: Set up environment variables in .env.local (see docs/environment-setup.md)')
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
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable: Please set up Supabase environment variables (see docs/environment-setup.md)' } }),
          select: () => Promise.resolve({ data: [], error: { message: 'Database connection unavailable: Please set up Supabase environment variables (see docs/environment-setup.md)' } }),
        }),
        single: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable: Please set up Supabase environment variables (see docs/environment-setup.md)' } }),
      }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable: Please set up Supabase environment variables (see docs/environment-setup.md)' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable: Please set up Supabase environment variables (see docs/environment-setup.md)' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Database connection unavailable: Please set up Supabase environment variables (see docs/environment-setup.md)' } }),
    }),
  }
}

// Runtime client cache
let runtimeClient: any = null
let isCreatingClient = false

// Check if we're in browser
const isBrowser = () => typeof window !== 'undefined'

// Check if we have environment variables
const hasEnvVars = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log('🔍 Supabase env check:', { 
    url: url ? `${url.substring(0, 20)}...` : 'missing', 
    key: key ? `${key.substring(0, 10)}...` : 'missing',
    hasUrl: !!url,
    hasKey: !!key
  })
  return url && key
}

// Create real client only at runtime in browser
async function createRealClient() {
  if (!isBrowser() || !hasEnvVars()) {
    console.log('🔄 Supabase: Environment not ready, returning mock client')
    return createMockClient()
  }

  try {
    console.log('🔄 Supabase: Importing Supabase modules...')
    // Dynamic import - only executed in browser at runtime
    const supabaseModule = await import('@supabase/ssr')
    
    console.log('🔄 Supabase: Creating browser client...')
    const client = supabaseModule.createBrowserClient(
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
    
    console.log('✅ Supabase: Real client created successfully')
    return client
  } catch (error) {
    console.warn('❌ Supabase: Failed to create real client:', error)
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
  console.log('🔄 Supabase: getSupabaseClientAsync called', { 
    isBrowser: isBrowser(), 
    hasEnvVars: hasEnvVars(),
    runtimeClient: !!runtimeClient,
    isCreatingClient
  })
  
  if (!isBrowser()) {
    console.log('🔄 Supabase: Returning mock client (not in browser)')
    return createMockClient()
  }
  
  if (!hasEnvVars()) {
    console.warn('⚠️ Supabase: Missing environment variables, returning mock client')
    return createMockClient()
  }
  
  if (runtimeClient) {
    return runtimeClient
  }
  
  if (isCreatingClient) {
    console.log('🔄 Supabase: Client creation in progress, waiting...')
    // Wait for the client creation to complete
    while (isCreatingClient && !runtimeClient) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    return runtimeClient || createMockClient()
  }
  
  console.log('🔄 Supabase: Creating runtime client...')
  isCreatingClient = true
  try {
    runtimeClient = await createRealClient()
    console.log('✅ Supabase: Runtime client created successfully')
  } catch (error) {
    console.error('❌ Supabase: Failed to create client:', error)
    runtimeClient = createMockClient()
  } finally {
    isCreatingClient = false
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