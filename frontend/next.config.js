/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
  // Add rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_URL}/:path*`,
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
              connect-src 'self' ${new URL(API_URL).origin} ws://${new URL(API_URL).host};
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
