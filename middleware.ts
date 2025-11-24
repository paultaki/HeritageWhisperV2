/**
 * Next.js Middleware
 *
 * Runs on every request before reaching route handlers
 * Used for: CSRF protection, auth checks, rate limiting
 *
 * SECURITY: This middleware enforces CSRF protection on all API routes
 * PERFORMANCE: Runs at the Edge Runtime for minimal latency
 */

import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from './lib/csrf';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Continue to the next middleware or route handler
  return NextResponse.next();
}

/**
 * Middleware Configuration
 *
 * matcher: Specifies which routes this middleware runs on
 * - Includes: All API routes
 * - Excludes: Static files, Next.js internals, favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
