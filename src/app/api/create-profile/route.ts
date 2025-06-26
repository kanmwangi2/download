import { createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { userId, firstName, lastName, email } = await request.json()

    console.log('🔄 Creating user profile via API:', {
      userId,
      firstName,
      lastName,
      email
    })

    const supabaseAdmin = createServiceRoleClient()

    // Create user profile using admin client
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error (server):', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      
      return NextResponse.json(
        { 
          error: true, 
          message: profileError.message,
          details: profileError.details || profileError.hint 
        },
        { status: 400 }
      )
    }

    console.log('✅ User profile created successfully:', profileData)
    
    return NextResponse.json({ 
      success: true, 
      profile: profileData 
    })

  } catch (error) {
    console.error('Error in create-profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}