import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { 
          error: 'Missing Supabase configuration',
          details: 'Please check your environment variables. See docs/blueprint.md for setup instructions.',
          isFirstUser: true // Default to true for safety
        },
        { status: 500 }
      );
    }

    // Use service role key to bypass RLS for this check
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking user profiles:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: error.message,
          isFirstUser: true // Default to true for safety
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      isFirstUser: !profiles || profiles.length === 0,
      existingProfiles: profiles || []
    });

  } catch (error) {
    console.error('API error in check-first-user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        isFirstUser: true // Default to true for safety
      },
      { status: 500 }
    );
  }
}
