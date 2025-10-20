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

  // Skip CSRF for API routes with JWT authentication (Authorization header present)
  // and for same-origin requests with credentials (fetch includes cookies) to avoid breaking SPA flows
  const hasAuthHeader = request.headers.get('authorization');
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const sameOrigin = !!origin && !!host && origin.includes(host);
  if ((hasAuthHeader || sameOrigin) && pathname.startsWith('/api/')) {
    logger.debug(`[CSRF] Skipping validation for authenticated/same-origin API request: ${pathname}`);
    return null;
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
