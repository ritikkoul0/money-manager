import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    const isAuthPage = request.nextUrl.pathname === '/login';
    const isProtectedRoute = [
      '/',
      '/goals',
      '/investments',
      '/payments',
      '/salary',
      '/transfers',
    ].some(route =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`)
    );

    // Redirect to login if accessing protected route without token
    if (isProtectedRoute && !token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to home if accessing login page with valid token
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', {
      pathname: request.nextUrl.pathname,
      hasSecret: Boolean(process.env.NEXTAUTH_SECRET),
      nextAuthUrl: process.env.NEXTAUTH_URL,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (request.nextUrl.pathname === '/login') {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/goals/:path*',
    '/investments/:path*',
    '/payments/:path*',
    '/salary/:path*',
    '/transfers/:path*',
    '/login',
  ],
};

// Made with Bob
