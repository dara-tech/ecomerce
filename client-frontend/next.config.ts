import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
        permanent: false,
      },
      {
        source: '/categories/new',
        destination: '/products?sort=newest',
        permanent: false,
      },
      {
        source: '/categories/sale',
        destination: '/products',
        permanent: false,
      },
      {
        source: '/categories/:slug',
        destination: '/products',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backend =
      process.env.BACKEND_PROXY_URL || 'http://107.175.91.211/ecomerce/api';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'live.staticflickr.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
