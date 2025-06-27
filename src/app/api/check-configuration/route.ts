import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const hasSupabaseUrl = !!supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co';
    const hasSupabaseKey = !!supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here';
    const hasServiceKey = !!supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here';

    const isConfigured = hasSupabaseUrl && hasSupabaseKey && hasServiceKey;

    let error = '';
    if (!hasSupabaseUrl) error += 'Missing or invalid NEXT_PUBLIC_SUPABASE_URL. ';
    if (!hasSupabaseKey) error += 'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. ';
    if (!hasServiceKey) error += 'Missing or invalid SUPABASE_SERVICE_ROLE_KEY. ';

    return NextResponse.json({
      hasSupabaseUrl,
      hasSupabaseKey: hasSupabaseKey && hasServiceKey,
      isConfigured,
      error: error || undefined
    });

  } catch (error) {
    return NextResponse.json({
      hasSupabaseUrl: false,
      hasSupabaseKey: false,
      isConfigured: false,
      error: 'Failed to check configuration'
    });
  }
}
