// Environment validation for build time
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }
  }

  return {
    isValid: missing.length === 0,
    missing
  }
}

// Call validation immediately only in browser environment
if (typeof window !== 'undefined') {
  validateEnvironment()
}
