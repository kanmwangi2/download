'use client'

import { useState } from 'react'
import { setupDatabaseTables } from '@/lib/simple-database-setup'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

export default function SetupDatabasePage() {
  const [isSetupRunning, setIsSetupRunning] = useState(false)
  const [setupResult, setSetupResult] = useState<string>('')
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  const handleSetupDatabase = async () => {
    setIsSetupRunning(true)
    setSetupResult('')
    setSetupStatus('running')
    setProgress(0)
    
    // Capture console output
    const originalLog = console.log
    const originalError = console.error
    let output = ''
    
    console.log = (...args) => {
      output += args.join(' ') + '\n'
      originalLog(...args)
      
      // Update progress based on steps
      if (args[0]?.includes('Creating database tables')) setProgress(20)
      if (args[0]?.includes('Creating companies table')) setProgress(30)
      if (args[0]?.includes('Creating user_profiles table')) setProgress(40)
      if (args[0]?.includes('Creating staff_members table')) setProgress(50)
      if (args[0]?.includes('Creating payroll_runs table')) setProgress(60)
      if (args[0]?.includes('Enabling Row Level Security')) setProgress(70)
      if (args[0]?.includes('Inserting test data')) setProgress(80)
      if (args[0]?.includes('Database setup completed')) setProgress(100)
    }
    
    console.error = (...args) => {
      output += 'ERROR: ' + args.join(' ') + '\n'
      originalError(...args)
    }

    try {
      const result = await setupDatabaseTables()
      
      if (result) {
        setSetupStatus('success')
      } else {
        setSetupStatus('error')
      }
      
      setSetupResult(output)
    } catch (error) {
      setSetupStatus('error')
      setSetupResult(output + `\nUnexpected error: ${error}`)
    } finally {
      // Restore console
      console.log = originalLog
      console.error = originalError
      setIsSetupRunning(false)
    }
  }

  const getStatusColor = () => {
    switch (setupStatus) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'running': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusMessage = () => {
    switch (setupStatus) {
      case 'success': return '🎉 Database setup completed!'
      case 'error': return '❌ Setup failed'
      case 'running': return '🔄 Setting up database...'
      default: return '⏳ Ready to setup database'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🗄️ Database Setup</CardTitle>
          <CardDescription>
            Create all required tables and initial data in your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              ⚠️ <strong>Important:</strong> This will create tables in your Supabase database. 
              Make sure you have your credentials set up correctly in your <code>.env.local</code> file.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleSetupDatabase}
                disabled={isSetupRunning}
                size="lg"
              >
                {isSetupRunning ? '🔄 Setting up...' : '🚀 Setup Database'}
              </Button>
              <div className={`font-medium ${getStatusColor()}`}>
                {getStatusMessage()}
              </div>
            </div>

            {isSetupRunning && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Progress: {progress}%</div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </div>

          {setupResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Setup Results:</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                {setupResult}
              </pre>
              
              {setupStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800">🎉 Setup Successful!</h4>
                  <p className="text-green-700 mt-2">
                    Your database is now ready! You can now:
                  </p>
                  <ul className="list-disc list-inside text-green-700 mt-2 space-y-1">
                    <li>Test user registration at <a href="/signup" className="underline">/signup</a></li>
                    <li>Check your Supabase dashboard to see the tables</li>
                    <li>Start using the application</li>
                  </ul>
                </div>
              )}
              
              {setupStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800">❌ Setup Failed</h4>
                  <p className="text-red-700 mt-2">
                    Check the error messages above and ensure:
                  </p>
                  <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                    <li>Your Supabase credentials are correct</li>
                    <li>Your service role key has admin permissions</li>
                    <li>Your Supabase project is active</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800">📋 What This Setup Does:</h4>
            <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
              <li>✅ Creates companies table</li>
              <li>✅ Creates user_profiles table</li>
              <li>✅ Creates user_company_assignments table</li>
              <li>✅ Creates staff_members table</li>
              <li>✅ Creates payroll_runs table</li>
              <li>✅ Creates audit_logs table</li>
              <li>✅ Enables Row Level Security (RLS)</li>
              <li>✅ Inserts test company data</li>
            </ul>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800">🔗 Next Steps After Setup:</h4>
            <div className="mt-2 space-y-2">
              <div>
                <a href="/signup" className="text-blue-600 hover:underline font-medium">
                  → Test User Registration (/signup)
                </a>
                <p className="text-sm text-gray-600">Create a test user and verify data is saved</p>
              </div>
              <div>
                <a href="/test-supabase" className="text-blue-600 hover:underline font-medium">
                  → Test Supabase Connection (/test-supabase)
                </a>
                <p className="text-sm text-gray-600">Verify all tables exist and connections work</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 