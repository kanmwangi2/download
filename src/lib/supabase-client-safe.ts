/**
 * Build-safe Supabase client wrapper
 * This module provides safe access to Supabase functionality that won't break during build time
 */

// Mock client for build/SSR environments
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

// For backward compatibility with existing sync code
export function getSupabaseClient() {
  // During build or SSR, return a mock client immediately
  if (typeof window === 'undefined') {
    return createMockClient() as any
  }

  // In browser, throw error to force async usage
  throw new Error('Use getSupabaseClientSafe() for safe async client access')
}

// Safe dynamic import wrapper for Supabase client
export async function getSupabaseClientSafe() {
  // Only import and use Supabase in browser environment
  if (typeof window === 'undefined') {
    // Return a mock client during build/SSR
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

  try {
    const { getSupabaseClient } = await import('./supabase')
    return await getSupabaseClient()
  } catch (error) {
    console.warn('Failed to load Supabase client:', error)
    // Return mock client on failure
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
}

// Safe auth utilities
export async function signInSafe(email: string, password: string) {
  if (typeof window === 'undefined') {
    return { data: null, error: null }
  }

  try {
    const { signIn } = await import('./supabase')
    return await signIn(email, password)
  } catch (error) {
    console.warn('Failed to sign in:', error)
    return { data: null, error: { message: 'Authentication unavailable' } }
  }
}

export async function signUpSafe(email: string, password: string, metadata?: { first_name?: string; last_name?: string }) {
  if (typeof window === 'undefined') {
    return { data: null, error: null }
  }

  try {
    const { signUp } = await import('./supabase')
    return await signUp(email, password, metadata)
  } catch (error) {
    console.warn('Failed to sign up:', error)
    return { data: null, error: { message: 'Registration unavailable' } }
  }
}

export async function signOutSafe() {
  if (typeof window === 'undefined') {
    return { error: null }
  }

  try {
    const { signOut } = await import('./supabase')
    return await signOut()
  } catch (error) {
    console.warn('Failed to sign out:', error)
    return { error: { message: 'Sign out unavailable' } }
  }
}

export async function getCurrentUserSafe() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const { getCurrentUser } = await import('./supabase')
    return await getCurrentUser()
  } catch (error) {
    console.warn('Failed to get current user:', error)
    return null
  }
}
