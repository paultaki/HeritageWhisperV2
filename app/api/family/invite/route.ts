import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { FamilyInviteEmail } from '@/lib/emails/family-invite';
import { logActivityEvent } from '@/lib/activity';

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Generate a secure random token (32 bytes = 64 hex characters)
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, relationship } = body;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
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

    // Check if user already has this family member
    const { data: existing } = await supabaseAdmin
      .from('family_members')
      .select('id, status')
      .eq('user_id', userId)
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already invited' },
        { status: 400 }
      );
    }

    // Check family member limit (max 10)
    const { count } = await supabaseAdmin
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { error: 'Maximum 10 family members allowed' },
        { status: 400 }
      );
    }

    // Create family member record
    const { data: familyMember, error: memberError } = await supabaseAdmin
      .from('family_members')
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        name: name.trim(),
        relationship: relationship || null,
        permission_level: 'viewer', // All family members are viewers (read-only)
        status: 'pending',
      })
      .select()
      .single();

    if (memberError || !familyMember) {
      console.error('Error creating family member:', memberError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Generate secure token
    const inviteToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days from now

    // Create invite record
    const { error: inviteError } = await supabaseAdmin
      .from('family_invites')
      .insert({
        family_member_id: familyMember.id,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      // Rollback: delete family member
      await supabaseAdmin
        .from('family_members')
        .delete()
        .eq('id', familyMember.id);

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
            familyMemberName: name,
            relationship,
            magicLink: inviteUrl,
            expiresAt: expiresAt.toISOString(),
          });

          const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
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

        // Log invite_sent activity event
        await logActivityEvent({
          userId: userId,
          actorId: userId,
          familyMemberId: familyMember.id,
          eventType: 'invite_sent',
          metadata: {
            email: familyMember.email,
            name: familyMember.name,
            relationship: familyMember.relationship,
          },
        });
      } catch (error) {
        console.error('[Family Invite] Background task error:', error);
      }
    })();

    return NextResponse.json({
      success: true,
      memberId: familyMember.id,
      inviteSent: true,
      // For development: include the link
      ...(process.env.NODE_ENV === 'development' && { inviteUrl }),
    });
  } catch (error: any) {
    console.error('Error in family invite:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create invitation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
