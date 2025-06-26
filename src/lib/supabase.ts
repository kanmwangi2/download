import { createBrowserClient } from '@supabase/ssr'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables')
  }
}

// Client-side Supabase client
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      realtime: {
        // Optimize realtime settings for production
        params: {
          eventsPerSecond: 10,
        },
        // Disable during build or if window is undefined
        heartbeatIntervalMs: typeof window !== 'undefined' ? 30000 : 0,
      },
      global: {
        headers: {
          'X-Client-Info': 'cheetah-payroll'
        }
      }
    }
  )
}

// Singleton client instance for browser
let supabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createClient()
  }
  
  if (!supabase) {
    supabase = createClient()
  }
  return supabase
}

// Auth utilities
export const signIn = async (email: string, password: string) => {
  const client = getSupabaseClient()
  return await client.auth.signInWithPassword({ email, password })
}

export const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => {
  const client = getSupabaseClient()
  return await client.auth.signUp({ 
    email, 
    password,
    ...(metadata && { options: { data: metadata } })
  })
}

export const signOut = async () => {
  const client = getSupabaseClient()
  return await client.auth.signOut()
}

export const getCurrentUser = async () => {
  const client = getSupabaseClient()
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