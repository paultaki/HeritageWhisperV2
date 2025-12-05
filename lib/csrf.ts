/**
 * CSRF Protection
 *
 * Protects against Cross-Site Request Forgery attacks by:
 * 1. Generating unique tokens stored in httpOnly cookies
 * 2. Requiring tokens in headers for state-changing requests
 * 3. Using constant-time comparison to prevent timing attacks
 *
 * SECURITY: This implementation follows OWASP CSRF prevention guidelines
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_BYTE_LENGTH = 32;
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ============================================================================
// ORIGIN VALIDATION (CSRF Bypass Prevention)
// ============================================================================

/**
 * Explicit allowlist of trusted origins for development.
 * Only used when NODE_ENV !== 'production'.
 */
const DEV_TRUSTED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
]);

/**
 * Validates whether an origin is trusted for CSRF purposes.
 *
 * SECURITY RULES:
 * - Production: Requires HTTPS and exact host match (no .includes())
 * - Development: Only allows explicit localhost origins from allowlist
 * - Never uses substring matching which could be bypassed by crafted domains
 *
 * @param origin - The Origin header value from the request
 * @param expectedHost - The Host header value (e.g., "heritagewhisper.com")
 * @returns boolean - True only if origin is strictly trusted
 */
function isTrustedOrigin(origin: string | null, expectedHost: string | null): boolean {
  if (!origin || !expectedHost) {
    return false;
  }

  // Development: Check against explicit allowlist (no substring matching)
  if (process.env.NODE_ENV !== 'production') {
    if (DEV_TRUSTED_ORIGINS.has(origin)) {
      return true;
    }
  }

  // Parse origin for strict validation
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    // Invalid URL - not trusted
    logger.warn(`[CSRF] Invalid origin URL: ${origin}`);
    return false;
  }

  // Production: Require HTTPS protocol
  if (process.env.NODE_ENV === 'production') {
    if (parsedOrigin.protocol !== 'https:') {
      logger.warn(`[CSRF] Non-HTTPS origin rejected in production: ${origin}`);
      return false;
    }
  }

  // Strict host comparison - no .includes(), exact match only
  // This prevents bypass via subdomains (evil.heritagewhisper.com)
  // or crafted domains (heritagewhisper.com.evil.com)
  const originHost = parsedOrigin.host; // includes port if non-standard

  // Normalize expectedHost (remove port if origin doesn't have one on standard ports)
  const normalizedExpectedHost = expectedHost.split(':')[0];
  const originHostWithoutPort = originHost.split(':')[0];

  if (originHostWithoutPort !== normalizedExpectedHost) {
    logger.debug(`[CSRF] Origin host mismatch: ${originHost} !== ${expectedHost}`);
    return false;
  }

  return true;
}

function generateRandomToken(): string {
  const randomValues = new Uint8Array(TOKEN_BYTE_LENGTH);
  globalThis.crypto.getRandomValues(randomValues);

  let binary = '';
  randomValues.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return globalThis.btoa(binary);
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generates a cryptographically secure CSRF token
 * @returns Promise<string> - Base64-encoded token
 */
export async function generateCSRFToken(): Promise<string> {
  const token = generateRandomToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });

  logger.debug('[CSRF] Token generated and stored in cookie');
  return token;
}

/**
 * Validates CSRF token using constant-time comparison
 * @param token - Token from request header
 * @returns Promise<boolean> - True if valid
 */
export async function validateCSRFToken(token: string | null): Promise<boolean> {
  if (!token) {
    logger.warn('[CSRF] No token provided in request header');
    return false;
  }

  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!storedToken) {
    logger.warn('[CSRF] No token found in cookie');
    return false;
  }

  try {
    // Constant-time comparison to prevent timing attacks
    const isValid = timingSafeCompare(storedToken, token);

    if (!isValid) {
      logger.warn('[CSRF] Token mismatch detected');
    }

    return isValid;
  } catch (error) {
    // Catch any errors from buffer creation (invalid base64, length mismatch, etc.)
    logger.error('[CSRF] Token validation error:', error);
    return false;
  }
}

/**
 * Middleware to protect API routes from CSRF attacks
 * Validates CSRF tokens on state-changing requests (POST, PUT, PATCH, DELETE)
 *
 * @param request - Next.js request object
 * @returns NextResponse or null if validation passes
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const { method, url } = request;

  // Skip CSRF validation for safe methods (as per RFC 7231)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(method)) {
    return null; // Continue processing
  }

  // Skip CSRF validation for certain endpoints that handle their own auth
  const skipPaths = [
    '/api/auth/callback',        // OAuth callback
    '/api/webhooks/',            // Stripe webhooks use signature verification
    '/api/followups/contextual', // Public endpoint for generating follow-up questions
  ];

  const pathname = new URL(url).pathname;

  // ============================================================================
  // CSRF SKIP LOGIC (Strict Rules)
  // ============================================================================
  //
  // SECURITY: We ONLY skip CSRF validation for API routes when:
  // 1. An Authorization header is present (JWT/Bearer token auth)
  //    - These are programmatic API clients, not browser requests
  //    - They are not vulnerable to CSRF because cookies aren't used
  //
  // We do NOT skip CSRF just because the origin "looks same" because:
  // - Browser form submissions and fetch() with credentials need CSRF protection
  // - SameSite cookies alone are not sufficient protection
  // - Defense in depth requires token validation
  // ============================================================================

  const hasAuthHeader = !!request.headers.get('authorization');
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Only skip CSRF for Authorization header (API clients with bearer tokens)
  // These clients authenticate via token, not cookies, so CSRF doesn't apply
  if (hasAuthHeader && pathname.startsWith('/api/')) {
    logger.debug(`[CSRF] Skipping validation for token-authenticated API request: ${pathname}`);
    return null;
  }

  // Log origin validation for debugging (but don't skip CSRF based on it)
  if (origin && host) {
    const trusted = isTrustedOrigin(origin, host);
    if (!trusted) {
      logger.warn(`[CSRF] Untrusted origin detected: ${origin} (host: ${host})`);
    }
  }

  const shouldSkip = skipPaths.some(path => pathname.startsWith(path));

  if (shouldSkip) {
    logger.debug(`[CSRF] Skipping validation for ${pathname}`);
    return null;
  }

  // Get CSRF token from request header
  const token = request.headers.get(CSRF_HEADER_NAME) || request.headers.get(CSRF_HEADER_NAME.toUpperCase());

  // Validate token
  const isValid = await validateCSRFToken(token);

  if (!isValid) {
    logger.warn(`[CSRF] Invalid or missing token for ${method} ${pathname}`);
    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        details: 'Your session may have expired. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  // Token is valid, continue processing
  return null;
}

/**
 * Retrieves the current CSRF token or generates a new one
 * Use this in API routes that need to send the token to the client
 *
 * @returns Promise<string> - CSRF token
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existingToken) {
    return existingToken;
  }

  return generateCSRFToken();
}
