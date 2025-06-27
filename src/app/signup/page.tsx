'use client'

import { useState } from 'react'
import { signUp } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)



  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      console.log('🔄 Starting sign-up process...')
      
      // Check if this will be the first user
      const { data: existingProfiles } = await fetch('/api/check-first-user').then(res => res.json())
      const isFirstUser = !existingProfiles || existingProfiles.length === 0
      const userRole = isFirstUser ? 'Primary Admin' : 'Company Admin'
      
      console.log(`🔄 User will be assigned role: ${userRole} (first user: ${isFirstUser})`)
      
      // Step 1: Create auth user with role in metadata
      const { data: authData, error: authError } = await signUp(
        email, 
        password, 
        { 
          first_name: firstName, 
          last_name: lastName,
          role: userRole
        }
      )

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`)
      }

      console.log('✅ Auth user created:', {
        userId: authData.user?.id,
        email: authData.user?.email,
        role: userRole
      })

      // Step 2: Create user profile via API endpoint
      if (authData.user) {
        console.log('🔄 Creating user profile via API...')
        
        const profileResponse = await fetch('/api/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: authData.user.id,
            firstName,
            lastName,
            email,
            role: userRole
          })
        })

        const profileResult = await profileResponse.json()

        if (!profileResponse.ok || profileResult.error) {
          throw new Error(`Profile creation failed: ${profileResult.message} ${profileResult.details ? '- ' + profileResult.details : ''}`)
        }

        console.log('✅ User profile created:', profileResult.profile)
      }

      setMessage({
        type: 'success',
        text: `✅ Account created successfully as ${userRole}! You can now sign in.`
      })

      // Clear form
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')

      // Auto-redirect to sign in after 3 seconds
      setTimeout(() => {
        window.location.href = '/signin'
      }, 3000)

    } catch (error: any) {
      console.error('❌ Sign-up error:', error)
      setMessage({
        type: 'error',
        text: `❌ Sign-up failed: ${error.message}`
      })
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>🔐 Create Account</CardTitle>
          <CardDescription>
            Create your Cheetah Payroll account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '🔄 Creating Account...' : '🚀 Create Account'}
            </Button>
          </form>

          {message && (
            <Alert className={`mt-4 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
              {message.type === 'success' && (
                <div className="mt-3">
                  <Button 
                    onClick={() => window.location.href = '/signin'}
                    className="w-full"
                    variant="outline"
                  >
                    🔐 Go to Sign In
                  </Button>
                </div>
              )}
            </Alert>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a 
                href="/signin" 
                className="text-blue-600 hover:text-blue-500 font-medium underline"
              >
                Sign in here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 