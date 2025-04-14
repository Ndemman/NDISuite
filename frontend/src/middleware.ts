import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that are accessible without authentication
const publicPaths = ['/', '/login', '/register', '/password-reset', '/verify-email']

// Middleware function that runs on every request
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // DEVELOPMENT MODE: Authentication bypass enabled
  // This allows direct access to all routes without authentication
  // Remove this in production
  
  // Set a mock token in the response for dashboard access
  const response = NextResponse.next()
  
  // Only set the mock token if it doesn't already exist
  if (!request.cookies.get('access_token')?.value) {
    // Create mock tokens for development
    const mockToken = 'dev-token-' + Math.random().toString(36).substring(2, 15)
    const mockRefreshToken = 'dev-refresh-' + Math.random().toString(36).substring(2, 15)
    
    // Set cookies with the mock tokens
    response.cookies.set('access_token', mockToken, { 
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'strict'
    })
    
    response.cookies.set('refresh_token', mockRefreshToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'strict'
    })
  }
  
  // Special case: redirect from login/register directly to dashboard
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_vercel (Vercel internals)
     * 4. /static (public files)
     * 5. All files with extensions (e.g. favicon.ico)
     */
    '/((?!api|_next|_vercel|static|.*\\..*).*)',
  ],
}
