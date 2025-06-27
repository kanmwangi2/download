import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl?.substring(0, 20) + '...',
      environment: process.env.NODE_ENV
    });

    const hasSupabaseUrl = !!supabaseUrl && 
      supabaseUrl !== 'https://your-project-id.supabase.co' && 
      supabaseUrl.includes('supabase.co');
    
    const hasSupabaseKey = !!supabaseAnonKey && 
      supabaseAnonKey !== 'your_supabase_anon_key_here' && 
      supabaseAnonKey.length > 50;
    
    const hasServiceKey = !!supabaseServiceKey && 
      supabaseServiceKey !== 'your_supabase_service_role_key_here' && 
      supabaseServiceKey.length > 50;

    const isConfigured = hasSupabaseUrl && hasSupabaseKey && hasServiceKey;

    let error = '';
    if (!hasSupabaseUrl) error += 'Missing or invalid NEXT_PUBLIC_SUPABASE_URL. ';
    if (!hasSupabaseKey) error += 'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. ';
    if (!hasServiceKey) error += 'Missing or invalid SUPABASE_SERVICE_ROLE_KEY. ';

    const response = {
      hasSupabaseUrl,
      hasSupabaseKey: hasSupabaseKey && hasServiceKey,
      isConfigured,
      error: error || undefined,
      debug: {
        urlSet: !!supabaseUrl,
        anonKeySet: !!supabaseAnonKey,
        serviceKeySet: !!supabaseServiceKey,
        environment: process.env.NODE_ENV
      }
    };

    console.log('Configuration response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Configuration check error:', error);
    return NextResponse.json({
      hasSupabaseUrl: false,
      hasSupabaseKey: false,
      isConfigured: false,
      error: 'Failed to check configuration: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}
