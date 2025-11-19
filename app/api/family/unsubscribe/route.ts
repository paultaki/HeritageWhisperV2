import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Generate an unsubscribe token for a family member
 * Format: {familyMemberId}.{hmacSignature}
 *
 * This is used by email templates to create unsubscribe links
 */
export function generateUnsubscribeToken(familyMemberId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(familyMemberId);
  const signature = hmac.digest('hex');
  return `${familyMemberId}.${signature}`;
}

/**
 * Verify an unsubscribe token and extract the family member ID
 * Returns the family member ID if valid, null otherwise
 */
function verifyUnsubscribeToken(token: string): string | null {
  try {
    const [familyMemberId, providedSignature] = token.split('.');

    if (!familyMemberId || !providedSignature) {
      return null;
    }

    // Regenerate the signature
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(familyMemberId);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return familyMemberId;
    }

    return null;
  } catch (error) {
    logger.error('[Unsubscribe] Token verification error:', error);
    return null;
  }
}

/**
 * Unsubscribe Endpoint
 *
 * GET /api/family/unsubscribe?token={token}
 *
 * Allows family members to opt-out of story notification emails.
 * Token format: {familyMemberId}.{hmacSignature}
 *
 * This endpoint is called when family members click the "Unsubscribe" link
 * in notification emails. It updates their email_notifications preference to false.
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // STEP 1: Extract and Validate Token
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      logger.warn('[Unsubscribe] No token provided');
      return NextResponse.redirect(
        new URL('/unsubscribe?error=missing-token', request.url)
      );
    }

    const familyMemberId = verifyUnsubscribeToken(token);

    if (!familyMemberId) {
      logger.warn('[Unsubscribe] Invalid token provided');
      return NextResponse.redirect(
        new URL('/unsubscribe?error=invalid-token', request.url)
      );
    }

    // ========================================================================
    // STEP 2: Fetch Family Member
    // ========================================================================
    const { data: familyMember, error: fetchError } = await supabaseAdmin
      .from('family_members')
      .select('id, name, email, email_notifications')
      .eq('id', familyMemberId)
      .single();

    if (fetchError || !familyMember) {
      logger.error('[Unsubscribe] Family member not found:', fetchError);
      return NextResponse.redirect(
        new URL('/unsubscribe?error=not-found', request.url)
      );
    }

    // ========================================================================
    // STEP 3: Check If Already Unsubscribed
    // ========================================================================
    if (familyMember.email_notifications === false) {
      logger.info(`[Unsubscribe] Already unsubscribed: ${familyMember.email}`);
      return NextResponse.redirect(
        new URL('/unsubscribe?status=already-unsubscribed', request.url)
      );
    }

    // ========================================================================
    // STEP 4: Update Email Notifications Preference
    // ========================================================================
    const { error: updateError } = await supabaseAdmin
      .from('family_members')
      .update({ email_notifications: false })
      .eq('id', familyMemberId);

    if (updateError) {
      logger.error('[Unsubscribe] Failed to update preference:', updateError);
      return NextResponse.redirect(
        new URL('/unsubscribe?error=update-failed', request.url)
      );
    }

    logger.info(`[Unsubscribe] ✅ Successfully unsubscribed: ${familyMember.email}`);

    // ========================================================================
    // STEP 5: Redirect to Success Page
    // ========================================================================
    return NextResponse.redirect(
      new URL(`/unsubscribe?status=success&name=${encodeURIComponent(familyMember.name || 'there')}`, request.url)
    );

  } catch (error: any) {
    logger.error('[Unsubscribe] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/unsubscribe?error=unexpected', request.url)
    );
  }
}

/**
 * Resubscribe Endpoint (optional - for future use)
 *
 * POST /api/family/unsubscribe/resubscribe
 *
 * Allows family members to opt back in to notifications if they change their mind.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    const familyMemberId = verifyUnsubscribeToken(token);

    if (!familyMemberId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('family_members')
      .update({ email_notifications: true })
      .eq('id', familyMemberId);

    if (updateError) {
      logger.error('[Resubscribe] Failed to update preference:', updateError);
      return NextResponse.json(
        { error: 'Update failed' },
        { status: 500 }
      );
    }

    logger.info(`[Resubscribe] ✅ Successfully resubscribed family member: ${familyMemberId}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully resubscribed to notifications',
    });

  } catch (error: any) {
    logger.error('[Resubscribe] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
