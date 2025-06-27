/**
 * Build-safe server Supabase client
 */

// Mock client for build/unsafe environments
const createMockClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
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

// Check if environment is safe for Supabase
const isSafeForSupabase = () => {
  return typeof process !== 'undefined' && 
         process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         // Only run in actual server environment, not during build
         (process.env.VERCEL || process.env.NODE_ENV === 'development')
}

// Server-side Supabase client for use in server components and API routes
export async function createServerComponentClient() {
  // Always return mock during build or if env not safe
  if (!isSafeForSupabase()) {
    return createMockClient() as any
  }

  try {
    // Dynamic imports only in safe server environment
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        realtime: {
          params: { eventsPerSecond: -1 }
        }
      }
    )
  } catch (error) {
    console.warn('Failed to create server Supabase client:', error)
    return createMockClient() as any
  }
}

// For API routes that need service role access
export function createServiceRoleClient() {
  // Return mock during build or if environment not ready
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Service role client: Missing environment variables, returning mock')
    return createMockClient() as any
  }

  try {
    // Dynamic import for service role client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js')
    
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('✅ Service role client created successfully')
    return client
  } catch (error) {
    console.warn('Failed to create service role client:', error)
    return createMockClient() as any
  }
} 