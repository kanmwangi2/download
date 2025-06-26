// Build-time safety checks
export function isBuildTime(): boolean {
  return (
    typeof window === 'undefined' && 
    (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build')
  )
}

export function isServerSide(): boolean {
  return typeof window === 'undefined'
}

export function canUseSupabase(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Safe Supabase client creation
export function createSafeSupabaseClient() {
  if (isBuildTime() || !canUseSupabase()) {
    return null
  }
  
  // Only import and create client if safe to do so
  const { getSupabaseClient } = require('@/lib/supabase')
  return getSupabaseClient()
}
