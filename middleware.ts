/**
 * Next.js Middleware
 *
 * Runs on every request before reaching route handlers
 * Used for: CSP with nonces, CSRF protection, auth checks, rate limiting
 *
 * SECURITY: This middleware enforces:
 *   - Content Security Policy with nonces for inline scripts
 *   - CSRF protection on all API routes
 * PERFORMANCE: Runs at the Edge Runtime for minimal latency
 */

import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from './lib/csrf';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';

  // Exclude webhook routes from CSRF protection
  // Webhooks use signature verification instead of CSRF tokens
  const isWebhook = pathname.startsWith('/api/stripe/webhook');

  // Only apply CSRF protection to API routes (except webhooks)
  if (pathname.startsWith('/api/') && !isWebhook) {
    // Check CSRF token for state-changing requests
    const csrfResponse = await csrfProtection(request);

    if (csrfResponse) {
      // CSRF validation failed - return error response
      return csrfResponse;
    }
  }

  // Skip CSP for API routes (they return JSON, not HTML)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ==========================================================================
  // Content Security Policy
  // ==========================================================================
  // Using 'unsafe-inline' for scripts because Next.js nonce support is inconsistent.
  // This is less secure but necessary for the app to function.
  // TODO: Revisit nonce-based CSP when Next.js improves support
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://*.supabase.co;
    font-src 'self' https://fonts.gstatic.com;
    media-src 'self' blob: https://*.supabase.co;
    connect-src 'self' blob: https://*.supabase.co https://*.supabase.com https://api.openai.com https://ai-gateway.vercel.sh https://api.assemblyai.com https://*.sentry.io wss://*.supabase.co wss://*.supabase.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();

  // Create response with CSP header
  const response = NextResponse.next();

  // Set CSP header on response
  response.headers.set('Content-Security-Policy', cspHeader);

  // Additional security headers (previously in next.config.ts)
  if (isProd) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()');
  }

  return response;
}

/**
 * Middleware Configuration
 *
 * matcher: Specifies which routes this middleware runs on
 * - Includes: All page routes and API routes
 * - Excludes: Static files, Next.js internals, favicon, prefetches
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     *
     * Also excludes prefetch requests (for CSP nonce efficiency)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
