'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SupabaseTest() {
  const [status, setStatus] = useState<string>('Testing...')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    try {
      setStatus('Testing Supabase connection...')
      setError(null)

      // Test 1: Check if Supabase client is initialized
      const supabase = getSupabaseClient()
      console.log('Supabase client:', supabase)
      setStatus('✅ Supabase client initialized')

      // Test 2: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        setError('❌ Environment variables missing')
        return
      }
      
      setStatus('✅ Environment variables found')

      // Test 3: Test auth connection
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(`❌ Auth error: ${userError.message}`)
        return
      }

      setUser(user)
      setStatus('✅ Supabase connection successful')

    } catch (err: any) {
      setError(`❌ Connection failed: ${err.message}`)
      setStatus('❌ Failed')
    }
  }

  const testSignIn = async () => {
    try {
      setStatus('Testing sign in...')
      
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'CT@spcstech.com',
        password: 'password123'
      })

      if (error) {
        setError(`❌ Sign in failed: ${error.message}`)
        return
      }

      setUser(data.user)
      setStatus('✅ Sign in successful')

    } catch (err: any) {
      setError(`❌ Sign in error: ${err.message}`)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🔧 Supabase Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <strong>Status:</strong> {status}
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {user && (
          <div className="text-green-600 text-sm">
            <strong>Current User:</strong> {user.email}
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={testConnection} size="sm" className="w-full">
            Test Connection
          </Button>
          <Button onClick={testSignIn} size="sm" variant="outline" className="w-full">
            Test Sign In (CT@spcstech.com)
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <strong>Environment Check:</strong><br/>
          URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}<br/>
          Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
        </div>
      </CardContent>
    </Card>
  )
} 