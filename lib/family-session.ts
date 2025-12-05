/**
 * Family Session Utilities
 *
 * Server-side helpers for reading family session from HttpOnly cookies.
 * Used by API routes to authenticate family member requests.
 *
 * Security:
 * - Tokens are stored in HttpOnly cookies (not accessible to JavaScript)
 * - This module provides the server-side interface to read them
 * - Client-side code should use the /api/family/session endpoint instead
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const FAMILY_SESSION_COOKIE = 'family_session';

export interface FamilySessionData {
  sessionId: string;
  familyMemberId: string;
  storytellerId: string;
  storytellerName: string;
  familyMemberName: string;
  relationship: string | null;
  permissionLevel: 'viewer' | 'contributor';
  expiresAt: string;
}

/**
 * Get family session token from either:
 * 1. HttpOnly cookie (preferred, secure)
 * 2. Authorization header (legacy fallback during migration)
 *
 * Returns the raw token string or null if not found.
 */
export async function getFamilySessionToken(request: NextRequest): Promise<string | null> {
  // First, try to get from HttpOnly cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(FAMILY_SESSION_COOKIE)?.value;

  if (cookieToken) {
    return cookieToken;
  }

  // Fallback: Check Authorization header (legacy support during migration)
  // This allows existing sessions to continue working
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
}

/**
 * Validate family session and return session data.
 *
 * This is the main function API routes should use to authenticate
 * family member requests.
 *
 * Returns null if session is invalid or expired.
 */
export async function validateFamilySession(
  request: NextRequest
): Promise<FamilySessionData | null> {
  const token = await getFamilySessionToken(request);

  if (!token) {
    return null;
  }

  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select(`
        id,
        expires_at,
        absolute_expires_at,
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
      return null;
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now >= expiresAt) {
      return null;
    }

    const familyMember = (session as any).family_members;
    const storyteller = familyMember?.users;

    return {
      sessionId: session.id,
      familyMemberId: familyMember.id,
      storytellerId: familyMember.user_id,
      storytellerName: storyteller?.name || 'Family Member',
      familyMemberName: familyMember.name || 'Guest',
      relationship: familyMember.relationship,
      permissionLevel: familyMember.permission_level || 'viewer',
      expiresAt: session.expires_at,
    };
  } catch (error) {
    console.error('[Family Session] Validation error:', error);
    return null;
  }
}

/**
 * Check if a family session token is valid (quick check without full data).
 *
 * Useful for middleware or quick authorization checks.
 */
export async function isFamilySessionValid(request: NextRequest): Promise<boolean> {
  const token = await getFamilySessionToken(request);

  if (!token) {
    return false;
  }

  try {
    const { data: session, error } = await supabaseAdmin
      .from('family_sessions')
      .select('id, expires_at')
      .eq('token', token)
      .single();

    if (error || !session) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    return now < expiresAt;
  } catch {
    return false;
  }
}

/**
 * Get the storyteller ID for the current family session.
 *
 * Returns null if no valid session exists.
 * This is a convenience function for API routes that only need the storyteller ID.
 */
export async function getFamilySessionStorytellerId(
  request: NextRequest
): Promise<string | null> {
  const session = await validateFamilySession(request);
  return session?.storytellerId || null;
}
