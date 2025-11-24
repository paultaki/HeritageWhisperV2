import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Resend } from 'resend';
import { FamilyInviteEmail } from '@/lib/emails/family-invite';
import { logActivityEvent } from '@/lib/activity';

import { getPasskeySession } from "@/lib/iron-session";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (support both Supabase JWT and Passkey session)
    let userId: string | null = null;

    // Try Supabase JWT first
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (!authError && user) {
        userId = user.id;
      }
    }

    // Fall back to passkey session if no Supabase JWT
    if (!userId) {
      const passkeySession = await getPasskeySession();
      if (passkeySession?.userId) {
        userId = passkeySession.userId;
      }
    }

    // If no valid auth method found
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the family member belongs to this user
    const { data: member, error: memberError } = await supabaseAdmin
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Only allow resend for pending or active members
    if (member.status === 'suspended') {
      return NextResponse.json(
        { error: 'Cannot resend invite to suspended member' },
        { status: 400 }
      );
    }

    // Generate new secure token
    const inviteToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create new invite record
    const { error: inviteError } = await supabaseAdmin
      .from('family_invites')
      .insert({
        family_member_id: member.id,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send email in background (non-blocking)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/family/access?token=${inviteToken}`;

    // Fire-and-forget: Send email without blocking response
    (async () => {
      try {
        // Get user's profile info for email
        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', userId)
          .single();

        const senderName = userProfile?.name || 'A family member';

        // Only initialize Resend if API key is available
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);

          const emailContent = FamilyInviteEmail({
            storytellerName: senderName,
            familyMemberName: member.name,
            relationship: member.relationship,
            magicLink: inviteUrl,
            expiresAt: expiresAt.toISOString(),
          });

          const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: member.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          if (emailError) {
            console.error('Error sending email:', emailError);
          }
        } else {
          // No Resend API key configured - email will not be sent
          console.error('Resend API key not configured - cannot send email');
        }

        // Log invite_resent activity event
        await logActivityEvent({
          userId: userId,
          actorId: userId,
          familyMemberId: member.id,
          eventType: 'invite_resent',
          metadata: {
            email: member.email,
            name: member.name,
            relationship: member.relationship,
            status: member.status,
          },
        });
      } catch (error) {
        console.error('[Family Resend] Background task error:', error);
      }
    })();

    return NextResponse.json({
      success: true,
      inviteSent: true,
      ...(process.env.NODE_ENV === 'development' && { inviteUrl }),
    });
  } catch (error) {
    console.error('Error in resend invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
