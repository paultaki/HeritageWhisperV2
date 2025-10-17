/**
 * CSRF Token API
 *
 * GET /api/csrf - Generates and returns a CSRF token
 *
 * SECURITY: This endpoint:
 * 1. Generates a cryptographically secure token
 * 2. Stores it in an httpOnly cookie (prevents XSS)
 * 3. Returns the token to the client for use in request headers
 *
 * USAGE:
 * Frontend should call this endpoint on app load and store the token
 * Include token in X-CSRF-Token header for all state-changing requests
 */

import { NextResponse } from 'next/server';
import { getOrCreateCSRFToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Generate or retrieve existing CSRF token
    const token = await getOrCreateCSRFToken();

    logger.debug('[CSRF API] Token generated successfully');

    return NextResponse.json({
      token,
      expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    });
  } catch (error) {
    logger.error('[CSRF API] Failed to generate token:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
