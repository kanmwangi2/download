'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheetahIcon } from '@/components/icons/cheetah-icon'
import { Building, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClientAsync } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function ManualSetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    tinNumber: '',
    address: '',
    email: '',
    phone: '',
    primaryBusiness: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to create a company' })
      return
    }

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Company name is required' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = await getSupabaseClientAsync()

      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name.trim(),
          tin_number: formData.tinNumber.trim() || null,
          address: formData.address.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          primary_business: formData.primaryBusiness.trim() || null,
        })
        .select()
        .single()

      if (companyError) {
        throw new Error(`Failed to create company: ${companyError.message}`)
      }

      console.log('✅ Company created:', company)

      // Assign the user to the company
      const { error: assignmentError } = await supabase
        .from('user_company_assignments')
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: user.role === 'Primary Admin' || user.role === 'App Admin' ? user.role : 'Company Admin'
        })

      if (assignmentError) {
        throw new Error(`Failed to assign user to company: ${assignmentError.message}`)
      }

      console.log('✅ User assigned to company')

      // Update user metadata to select this company
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          selectedCompanyId: company.id,
          selectedCompanyName: company.name,
        }
      })

      if (metadataError) {
        console.warn('Failed to update user metadata:', metadataError)
      }

      setMessage({ 
        type: 'success', 
        text: `Company "${company.name}" created successfully! Redirecting to dashboard...` 
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.replace('/app/dashboard')
      }, 2000)

    } catch (error: any) {
      console.error('❌ Error creating company:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create company'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/select-company">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Company Selection
            </Link>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create New Company</CardTitle>
            <CardDescription>
              Set up a new company profile to start managing payroll
            </CardDescription>
          </CardHeader>

          <CardContent>
            {message && (
              <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : ''}`}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="tinNumber">TIN Number</Label>
                  <Input
                    id="tinNumber"
                    name="tinNumber"
                    value={formData.tinNumber}
                    onChange={handleInputChange}
                    placeholder="123456789"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="primaryBusiness">Primary Business</Label>
                  <Input
                    id="primaryBusiness"
                    name="primaryBusiness"
                    value={formData.primaryBusiness}
                    onChange={handleInputChange}
                    placeholder="Technology Services"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="info@company.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Business St, City, State, ZIP"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !formData.name.trim()}
                >
                  {isLoading ? 'Creating Company...' : 'Create Company'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <CheetahIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p>Cheetah Payroll - Modern HR & Payroll Management</p>
        </div>
      </div>
    </div>
  )
}
