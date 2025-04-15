/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable production source maps for better debugging
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Enable SWC minification instead of Terser for better performance
  swcMinify: true,
  
  // Configure compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable styled-components
    styledComponents: false,
  },
  
  // Configure webpack
  webpack: (config, { dev, isServer }) => {
    // Add optimization for SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Optimize packages
    if (!dev && !isServer) {
      // Replace React with Preact in production
      // Object.assign(config.resolve.alias, {
      //   'react/jsx-runtime': 'preact/jsx-runtime',
      //   react: 'preact/compat',
      //   'react-dom/test-utils': 'preact/test-utils',
      //   'react-dom': 'preact/compat',
      // });
      
      // Analyze bundle if ANALYZE is set
      if (process.env.ANALYZE) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }
    
    return config;
  },
  
  // Enable experimental features
  experimental: {
    // Enable optimizeCss for production
    optimizeCss: process.env.NODE_ENV === 'production',
  },
  
  // Configure headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Configure redirects
  async redirects() {
    return [];
  },
  
  // Configure rewrites
  async rewrites() {
    return [];
  },
  
  // Configure environment variables that should be available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Configure build output
  output: 'standalone',
  
  // Configure powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;
