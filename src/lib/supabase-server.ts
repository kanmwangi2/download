import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client for use in server components and API routes
export async function createServerComponentClient() {
  // Only create client if we have the required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
      ...(process.env.NODE_ENV === 'production' && process.env.VERCEL ? {
        realtime: {
          params: { eventsPerSecond: -1 }
        }
      } : {})
    }
  )
}

// For API routes that need service role access
export function createServiceRoleClient() {
  // Only create client if we have the required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase service role environment variables')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
      realtime: {
        // Disable realtime for service role client
        params: { eventsPerSecond: -1 }
      }
    }
  )
} 