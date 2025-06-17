import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // For now, let's simplify middleware to avoid multiple Supabase instances
  // We'll check for auth tokens in cookies instead
  const authToken = req.cookies.get('sb-access-token')?.value
  const refreshToken = req.cookies.get('sb-refresh-token')?.value
  const hasSession = authToken && refreshToken

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  const authRoutes = ['/auth/signin', '/auth/signup']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Redirect to signin if accessing protected route without session
  if (isProtectedRoute && !hasSession) {
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.ip ?? '127.0.0.1'
    const rateLimitKey = `rate_limit:${ip}`
    
    // This would typically use Redis or similar for production
    // For now, we'll just add headers for monitoring
    res.headers.set('X-RateLimit-IP', ip)
    res.headers.set('X-RateLimit-Timestamp', Date.now().toString())
  }

  return res
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
