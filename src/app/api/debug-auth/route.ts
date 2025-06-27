import { createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Supabase environment variables not configured' 
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Debugging auth for email:', email)

    // Create admin client inside function
    const supabaseAdmin = createServiceRoleClient()

    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const user = authUsers.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json({
        exists: false,
        message: 'User not found in auth.users table',
        totalUsers: authUsers.users.length
      })
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    return NextResponse.json({
      exists: true,
      authUser: {
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        metadata: user.user_metadata
      },
      profile: profile || null,
      profileError: profileError?.message || null
    })

  } catch (error: any) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 