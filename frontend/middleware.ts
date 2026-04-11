import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the token
  // NextAuth automatically uses NEXTAUTH_SECRET from your env
  const token = await getToken({ 
    req: request,
    // We explicitly use the Vercel-provided secret here
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isAuthPage = pathname === '/login';
  
  // Define protected routes
  const protectedRoutes = ['/', '/goals', '/investments', '/payments', '/salary', '/transfers'];
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // 2. Logic: Not logged in + trying to access protected route
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 3. Logic: Logged in + trying to access login page
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
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
};
