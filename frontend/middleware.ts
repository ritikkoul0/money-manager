import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This forces the middleware to run in a way that is compatible 
// with Vercel's Edge environment and prevents __dirname errors.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // 1. Get the token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // In production, NextAuth uses secure cookies (prefixed with __Secure-)
      // Setting secureCookie helps getToken find the right cookie in the Edge environment
      secureCookie: process.env.NODE_ENV === "production",
    });

    const isAuthPage = pathname === '/login';
    
    // Define protected routes
    const protectedRoutes = ['/', '/goals', '/investments', '/payments', '/salary', '/transfers'];
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    // 2. Logic: Not logged in + trying to access protected route
    if (isProtectedRoute && !token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // 3. Logic: Logged in + trying to access login page
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If the middleware fails, we redirect to login as a safety measure
    // rather than letting the whole app 500.
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes
     * 2. /_next (standard Next.js assets)
     * 3. Static files (images, favicon, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
