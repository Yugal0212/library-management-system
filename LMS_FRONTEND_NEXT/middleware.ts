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
    // Try to get user from cookies
    const accessToken = request.cookies.get('accessToken')
    
    if (!accessToken) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      const response = NextResponse.redirect(loginUrl)
      
      // Add cache control headers to prevent caching of redirect
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }
    
    // For authenticated dashboard routes, add no-cache headers
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }
  
  // For root dashboard route, redirect to login if not authenticated
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const accessToken = request.cookies.get('accessToken')
    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      
      // Add cache control headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
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
