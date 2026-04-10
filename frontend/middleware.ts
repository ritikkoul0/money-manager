import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

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
