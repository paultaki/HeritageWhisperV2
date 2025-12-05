/**
 * Family Session Refresh API
 *
 * Refreshes family session expiry (up to 90-day absolute limit).
 *
 * Security (Dec 2024):
 * - Reads session token from HttpOnly cookie (preferred)
 * - Falls back to Authorization header for legacy support
 * - Updates cookie with new expiry
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COOKIE_NAME = 'family_session';

function getCookieOptions(maxAgeSeconds: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Get token from HttpOnly cookie (preferred) or Authorization header (legacy)
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value;

    // Fallback to Authorization header for legacy support
    if (!token) {
      const authHeader = req.headers.get('authorization');
      token = authHeader?.split(' ')[1];
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      );
    }

    // Get the current session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select('id, family_member_id, expires_at, absolute_expires_at, last_active_at')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const absoluteExpiresAt = new Date(session.absolute_expires_at);

    // Check if absolute expiry has passed (cannot be extended)
    if (now >= absoluteExpiresAt) {
      return NextResponse.json(
        {
          error: 'Session has reached absolute expiry limit',
          requiresNewLink: true
        },
        { status: 401 }
      );
    }

    // Check if session has expired (past renewable window)
    if (now >= expiresAt) {
      return NextResponse.json(
        {
          error: 'Session expired - please use magic link again',
          requiresNewLink: true
        },
        { status: 401 }
      );
    }

    // Calculate new expiry date (30 days from now)
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    // Cap at absolute expiry
    const finalExpiresAt = newExpiresAt > absoluteExpiresAt
      ? absoluteExpiresAt
      : newExpiresAt;

    // Update session with new expiry and last_active_at
    const { error: updateError } = await supabaseAdmin
      .from('family_sessions')
      .update({
        expires_at: finalExpiresAt.toISOString(),
        last_active_at: now.toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 500 }
      );
    }

    // Update family member's last_accessed_at
    await supabaseAdmin
      .from('family_members')
      .update({
        last_accessed_at: now.toISOString(),
      })
      .eq('id', session.family_member_id);

    // Calculate days until expiry
    const daysUntilExpiry = Math.floor(
      (finalExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate new cookie maxAge
    const maxAgeSeconds = Math.floor((finalExpiresAt.getTime() - now.getTime()) / 1000);

    // Build response with updated cookie
    const response = NextResponse.json({
      success: true,
      expiresAt: finalExpiresAt.toISOString(),
      absoluteExpiresAt: session.absolute_expires_at,
      daysUntilExpiry,
      message: 'Session refreshed successfully',
    });

    // Update the HttpOnly cookie with new expiry
    response.cookies.set(COOKIE_NAME, token, getCookieOptions(maxAgeSeconds));

    return response;
  } catch (error) {
    console.error('Error in refresh session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
