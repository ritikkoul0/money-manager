import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Temporarily allow all requests to debug the issue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/goals/:path*',
    '/investments/:path*',
    '/payments/:path*',
    '/salary/:path*',
    '/transfers/:path*',
  ],
};

// Made with Bob
