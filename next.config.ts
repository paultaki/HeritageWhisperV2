import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tjycibrhoammxohemyhq.supabase.co",
        pathname: "/**",
      },
    ],
    // Aggressive caching for better performance
    minimumCacheTTL: 31536000, // 1 year in seconds
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'], // Use WebP for better compression
  },
  // Security Headers - Protect against common web vulnerabilities
  async headers() {
    // Content Security Policy - Prevents XSS attacks
    // Note: Avoid "upgrade-insecure-requests" in development to prevent https upgrade on localhost
    const isProd = process.env.NODE_ENV === 'production';
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tailwindcss.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://*.supabase.co;
      font-src 'self' https://fonts.gstatic.com;
      media-src 'self' blob: https://*.supabase.co;
      connect-src 'self' blob: https://*.supabase.co https://api.openai.com https://ai-gateway.vercel.sh https://api.assemblyai.com wss://*.supabase.co;
      worker-src 'self' blob:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      ${isProd ? 'upgrade-insecure-requests;' : ''}
    `.replace(/\s{2,}/g, ' ').trim();

    // CORS origin per environment (relaxed in development)
    const devOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const prodOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com';
    const allowOrigin = isProd ? prodOrigin : devOrigin;

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking attacks
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME type sniffing
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains', // Force HTTPS for 1 year
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Legacy XSS protection (modern browsers use CSP)
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Control referrer information
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()', // Restrict browser features
          },
        ],
      },
      {
        // CORS configuration for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowOrigin,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours - cache preflight requests
          },
        ],
      },
    ];
  },
};

export default nextConfig;
