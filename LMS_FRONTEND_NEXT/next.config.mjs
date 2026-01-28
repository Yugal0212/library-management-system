/** @type {import('next').NextConfig} */

/**
 * Dynamic rewrite for /api to backend server on the same network.
 * This allows frontend to work with both localhost and network IP.
 */
const getBackendUrl = () => {
  // Use environment variable if set (for production)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // Use window.location in browser, fallback to localhost for build
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000/api`;
  }
  // Default for build/server
  return 'http://localhost:8000/api';
};

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ];
  },
}

export default nextConfig
