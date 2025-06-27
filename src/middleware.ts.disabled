import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const PUBLIC_ROUTES = ['/signin', '/signup', '/'];

export function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;

    // Skip middleware for static files and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    // Allow public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.next();
    }

    // For now, allow all other routes - auth will be handled client-side
    return NextResponse.next();
  } catch (error) {
    // If middleware fails, allow the request to proceed
    return NextResponse.next();
  }
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
