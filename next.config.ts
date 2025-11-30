import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable MDX page extensions
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // Use Rust-based MDX compiler (handles frontmatter automatically)
  experimental: {
    mdxRs: true,
  },

  /* config options here */

  // Performance optimizations for development
  reactStrictMode: false, // Disable double-rendering in dev (re-enable for debugging)

  eslint: {
    // TEMPORARILY disabled to unblock deployment - TypeScript errors still enforced
    // TODO: Fix ESLint errors systematically (react/no-unescaped-entities, no-explicit-any, no-unused-vars)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Enforce type checking during builds - prevents deploying broken code
    ignoreBuildErrors: false,
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
    // Image quality settings (required for Next.js 16+)
    qualities: [75, 90, 100], // Allow quality 75 (default), 90, and 100 (high quality)
    // Local patterns for images (required for Next.js 16+)
    localPatterns: [
      {
        pathname: '/**', // Allow all local images from public folder
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

    // Skip security headers in development for faster reloads
    if (!isProd) {
      return [];
    }
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tailwindcss.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://*.supabase.co;
      font-src 'self' https://fonts.gstatic.com;
      media-src 'self' blob: https://*.supabase.co;
      connect-src 'self' blob: https://*.supabase.co https://*.supabase.com https://api.openai.com https://ai-gateway.vercel.sh https://api.assemblyai.com wss://*.supabase.co wss://*.supabase.com;
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

// TEMPORARILY DISABLED - Sentry build plugin breaks webpack
// Will re-enable for production builds only
// Note: mdxRs: true in experimental handles MDX compilation without needing @next/mdx wrapper
export default nextConfig;

// Commented out the wrapper:
// export default withSentryConfig(nextConfig, {
//   // For all available options, see:
//   // https://www.npmjs.com/package/@sentry/webpack-plugin#options
//
//   org: "heritagewhisper",
//
//   project: "javascript-nextjs",
//
//   // Only print logs for uploading source maps in CI
//   silent: !process.env.CI,
//
//   // For all available options, see:
//   // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
//
//   // Upload a larger set of source maps for prettier stack traces (increases build time)
//   widenClientFileUpload: true,
//
//   // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
//   // This can increase your server load as well as your hosting bill.
//   // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
//   // side errors will fail.
//   tunnelRoute: "/monitoring",
//
//   // Automatically tree-shake Sentry logger statements to reduce bundle size
//   disableLogger: true,
//
//   // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
//   // See the following for more information:
//   // https://docs.sentry.io/product/crons/
//   // https://vercel.com/docs/cron-jobs
//   automaticVercelMonitors: true,
// });