/** @type {import('next').NextConfig} */
// Prefer API_URL inside Docker, then browser var, then localhost fallback
const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';

const nextConfig = {
  trailingSlash: true,   // Keeps trailing slashes on every route
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
  // Add rewrites for API proxy
  async rewrites() {
    // Custom rewrite function to ensure trailing slashes are preserved
    return [
      {
        source: '/api/v1/:path*/',  // Match paths with trailing slash
        destination: `${API_URL}/:path*/`,  // Preserve trailing slash in destination
      },
      {
        source: '/api/v1/:path*',  // Match paths without trailing slash
        destination: `${API_URL}/:path*`,  // Keep as-is for non-trailing slash paths
      },
    ];
  },
  // Add Content Security Policy headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob:;
              font-src 'self';
              connect-src 'self' ${new URL(API_URL).origin} ws://${new URL(API_URL).host} http://localhost:8000;
              frame-src 'self';
              object-src 'none';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig
