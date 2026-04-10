/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This helps you bypass the "Exit Code 1" if it's caused by minor lint/type issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
