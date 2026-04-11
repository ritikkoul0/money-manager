export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/',
    '/goals/:path*',
    '/investments/:path*',
    '/payments/:path*',
    '/salary/:path*',
    '/transfers/:path*',
  ],
  runtime: 'nodejs',
};
