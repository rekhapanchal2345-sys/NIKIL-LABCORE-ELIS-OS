const path = require('path');

const rawTarget = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const targetApi = rawTarget.replace('localhost', '127.0.0.1');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate double-render API calls in dev mode
  compress: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false, // Prevents floating Next.js dev badge from overlapping sidebar settings button

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${targetApi}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;