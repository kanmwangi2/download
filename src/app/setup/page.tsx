'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ConfigStatus {
  hasSupabaseUrl: boolean
  hasSupabaseKey: boolean
  isConfigured: boolean
  error?: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/check-configuration')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        hasSupabaseUrl: false,
        hasSupabaseKey: false,
        isConfigured: false,
        error: 'Failed to check configuration'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Checking configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status?.isConfigured) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Configuration Complete
            </CardTitle>
            <CardDescription>
              Your Cheetah Payroll application is properly configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Environment variables are configured correctly.
                <br />
                ✅ Supabase connection is ready.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-4">
              <Button asChild>
                <a href="/signup">Create Account</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/signin">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            Setup Required
          </CardTitle>
          <CardDescription>
            Please configure your environment variables to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {status?.error || 'Configuration incomplete'}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {status?.hasSupabaseUrl ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>Supabase URL configured</span>
            </div>
            <div className="flex items-center gap-2">
              {status?.hasSupabaseKey ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>Supabase keys configured</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Copy <code>.env.example</code> to <code>.env.local</code></li>
              <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener" className="text-blue-600 underline">supabase.com</a></li>
              <li>Fill in your Supabase credentials in <code>.env.local</code></li>
              <li>Run the database setup scripts from <code>docs/</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>

          <Button onClick={checkConfiguration}>
            Check Configuration Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
