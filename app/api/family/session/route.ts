/**
 * Family Session API
 *
 * Manages HttpOnly cookie-based family sessions for XSS protection.
 *
 * Flow:
 * - POST: Called by /api/family/verify to set the HttpOnly cookie
 * - GET: Returns session info (non-sensitive) for client-side state
 * - DELETE: Clears the session cookie (logout)
 *
 * Security:
 * - Token is NEVER exposed to JavaScript (HttpOnly)
 * - Cookie is secure in production (HTTPS only)
 * - SameSite=Lax prevents CSRF on state-changing requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Cookie configuration
const COOKIE_NAME = 'family_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getCookieOptions(maxAge: number = COOKIE_MAX_AGE) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/**
 * POST: Set family session cookie
 *
 * Called internally by /api/family/verify after creating the session.
 * Expects { token, expiresAt, ...sessionInfo } in the body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, expiresAt, storytellerId, storytellerName, familyMemberName, relationship, permissionLevel } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate that this token exists in the database
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select('id, expires_at')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    // Calculate maxAge from expiresAt
    const expiresAtDate = new Date(expiresAt);
    const now = new Date();
    const maxAgeSeconds = Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000);

    if (maxAgeSeconds <= 0) {
      return NextResponse.json(
        { error: 'Session already expired' },
        { status: 400 }
      );
    }

    // Build response with Set-Cookie header
    const response = NextResponse.json({ ok: true });

    // Set the HttpOnly cookie with the token
    response.cookies.set(COOKIE_NAME, token, getCookieOptions(maxAgeSeconds));

    return response;
  } catch (error) {
    console.error('[Family Session API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get current session info (non-sensitive data only)
 *
 * Returns session details for client-side state management.
 * The token itself is NEVER returned - only metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, session: null },
        { status: 200 }
      );
    }

    // Look up session in database
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select(`
        id,
        expires_at,
        absolute_expires_at,
        last_active_at,
        family_members!inner (
          id,
          name,
          relationship,
          permission_level,
          user_id,
          users!inner (
            id,
            name
          )
        )
      `)
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      // Invalid token - clear the cookie
      const response = NextResponse.json(
        { authenticated: false, session: null, error: 'Invalid session' },
        { status: 200 }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now >= expiresAt) {
      // Session expired - clear the cookie
      const response = NextResponse.json(
        { authenticated: false, session: null, expired: true },
        { status: 200 }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const familyMember = (session as any).family_members;
    const storyteller = familyMember?.users;

    // Return session info (NOT the token!)
    return NextResponse.json({
      authenticated: true,
      session: {
        storytellerId: familyMember?.user_id,
        storytellerName: storyteller?.name || 'Family Member',
        familyMemberName: familyMember?.name || 'Guest',
        relationship: familyMember?.relationship,
        permissionLevel: familyMember?.permission_level || 'viewer',
        expiresAt: session.expires_at,
        // Compute firstAccess as false since they're checking existing session
        firstAccess: false,
      },
    });
  } catch (error) {
    console.error('[Family Session API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Clear family session cookie (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    // If there was a token, invalidate it in the database
    if (token) {
      await supabaseAdmin
        .from('family_sessions')
        .delete()
        .eq('token', token);
    }

    // Clear the cookie
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('[Family Session API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
