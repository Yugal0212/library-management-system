import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't need authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/success']
  
  // Check if it's a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if user is trying to access dashboard without being authenticated
  if (pathname.startsWith('/dashboard')) {
    // Try to get user from cookies (you'll need to implement cookie-based auth)
    const accessToken = request.cookies.get('accessToken')
    
    if (!accessToken) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Basic role-based route protection
    if (pathname.startsWith('/dashboard/admin')) {
      // For admin routes, we'll let AuthGuard handle detailed role checking
      // This is just a basic check
      return NextResponse.next()
    }
    
    if (pathname.startsWith('/dashboard/librarian')) {
      return NextResponse.next()
    }
    
    if (pathname.startsWith('/dashboard/patron')) {
      return NextResponse.next()
    }
  }
  
  // For root dashboard route, redirect to login if not authenticated
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const accessToken = request.cookies.get('accessToken')
    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
