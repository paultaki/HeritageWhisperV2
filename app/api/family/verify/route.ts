/**
 * Family Invite Verification API
 *
 * Validates family invite tokens and creates sessions stored as HttpOnly cookies.
 *
 * Security improvements (Dec 2024):
 * - Session token is set as HttpOnly cookie, NOT returned in response body
 * - This prevents XSS attacks from stealing the session token
 * - Client receives session info but never sees the actual token
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logActivityEvent } from '@/lib/activity';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Cookie configuration for HttpOnly family session
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

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteToken = searchParams.get('token');

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invite token is required' },
        { status: 400 }
      );
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('family_invites')
      .select(`
        id,
        family_member_id,
        expires_at,
        used_at,
        family_members (
          id,
          user_id,
          email,
          name,
          relationship,
          status,
          first_accessed_at
        )
      `)
      .eq('token', inviteToken)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired' },
        { status: 400 }
      );
    }

    // Check if token already used
    if (invite.used_at) {
      // Token was already used, but we can still create a session
      // This allows the user to access again if they lost their session
    }

    const familyMember = (invite as any).family_members;

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Mark invite as used (first time only)
    if (!invite.used_at) {
      const { error: inviteUpdateError } = await supabaseAdmin
        .from('family_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invite.id);

      if (inviteUpdateError) {
        console.error('Failed to mark invite as used:', inviteUpdateError);
      }

      // Update family member status to active
      const { error: statusUpdateError } = await supabaseAdmin
        .from('family_members')
        .update({
          status: 'active',
          first_accessed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          access_count: 1,
        })
        .eq('id', familyMember.id);

      if (statusUpdateError) {
        console.error('Failed to update family member status:', statusUpdateError);
      }

      // Log family_member_joined activity event (async, non-blocking)
      logActivityEvent({
        userId: familyMember.user_id, // Storyteller
        actorId: undefined, // No specific actor yet (family member hasn't created account)
        familyMemberId: familyMember.id,
        eventType: 'family_member_joined',
        metadata: {
          email: familyMember.email,
          name: familyMember.name,
          relationship: familyMember.relationship,
        },
      }).catch((error) => {
        console.error('[Family Verify] Failed to log family_member_joined activity:', error);
      });
    } else {
      // Update last accessed time and increment count
      const { error: accessUpdateError } = await supabaseAdmin
        .from('family_members')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (familyMember.access_count || 0) + 1,
        })
        .eq('id', familyMember.id);

      if (accessUpdateError) {
        console.error('Failed to update access count:', accessUpdateError);
      }
    }

    // SECURITY: Session rotation - invalidate old sessions before creating new one
    // This prevents long-lived compromised tokens from remaining valid
    await supabaseAdmin
      .from('family_sessions')
      .delete()
      .eq('family_member_id', familyMember.id);

    // Create a new family session (30 days renewable, can be extended up to 90-day absolute limit)
    const sessionToken = generateSecureToken();
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);

    // Absolute expiry is the maximum session lifetime (90 days, cannot be extended)
    const absoluteExpiresAt = new Date();
    absoluteExpiresAt.setDate(absoluteExpiresAt.getDate() + 90);

    const { error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .insert({
        family_member_id: familyMember.id,
        token: sessionToken,
        user_agent: req.headers.get('user-agent') || null,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        expires_at: sessionExpiresAt.toISOString(),
        absolute_expires_at: absoluteExpiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('Error creating family session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // SECURITY: Cleanup expired sessions (housekeeping)
    await supabaseAdmin
      .from('family_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Get user info for context
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', familyMember.user_id)
      .single();

    if (userError) {
      console.error('Error fetching user info:', userError);
    }

    console.log('Verify token response:', {
      storytellerId: familyMember.user_id,
      userInfoId: userInfo?.id,
      familyMemberId: familyMember.id,
    });

    // Calculate cookie maxAge in seconds
    const now = new Date();
    const maxAgeSeconds = Math.floor((sessionExpiresAt.getTime() - now.getTime()) / 1000);

    // Build response WITHOUT the session token (security: token stays server-side only)
    const response = NextResponse.json({
      valid: true,
      // NOTE: sessionToken is intentionally NOT included - it's set as HttpOnly cookie
      expiresAt: sessionExpiresAt.toISOString(),
      familyMember: {
        id: familyMember.id,
        name: familyMember.name,
        relationship: familyMember.relationship,
        permissionLevel: familyMember.permission_level || 'viewer',
      },
      storyteller: {
        id: familyMember.user_id,
        name: userInfo?.name || 'Your family member',
      },
    });

    // Set HttpOnly cookie with the session token
    // This prevents XSS attacks from stealing the token via JavaScript
    response.cookies.set(COOKIE_NAME, sessionToken, getCookieOptions(maxAgeSeconds));

    return response;
  } catch (error) {
    console.error('Error in verify token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
