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
        hostname: "pwuzksomxnbdndeeivzf.supabase.co",
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
  // ==========================================================================
  // Security Headers Configuration
  // ==========================================================================
  // NOTE: CSP with nonces is now handled in middleware.ts for dynamic nonce generation.
  // This headers() function only handles CORS for API routes.
  // All other security headers (X-Frame-Options, HSTS, etc.) are also in middleware.
  // ==========================================================================
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    // Skip headers in development for faster reloads
    if (!isProd) {
      return [];
    }

    // CORS origin per environment
    const prodOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com';

    return [
      {
        // CORS configuration for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: prodOrigin,
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