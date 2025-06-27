import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns for different access levels
const PUBLIC_ROUTES = ['/signin', '/signup', '/'];
const AUTH_REQUIRED_ROUTES = ['/select-company', '/manual-setup'];
const APP_ROUTES = ['/app'];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get auth cookies to determine if user is logged in
  const hasAuthTokens = req.cookies.has('sb-access-token') || 
                       req.cookies.has('supabase-auth-token') ||
                       req.cookies.get('sb-localhost-auth-token');

  console.log('🔒 Middleware: Route check', {
    pathname,
    hasAuthTokens: !!hasAuthTokens
  });

  // Handle public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Allow access to public routes
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!hasAuthTokens) {
    console.log('🚫 Middleware: No auth tokens, redirecting to /signin');
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Allow auth required routes
  if (AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Handle app routes - these will be checked client-side for company selection
  if (APP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
