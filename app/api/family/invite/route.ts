import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Resend } from 'resend';
import { FamilyInviteEmail } from '@/lib/emails/family-invite';
import { logActivityEvent } from '@/lib/activity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Generate a secure random token (32 bytes = 64 hex characters)
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, relationship } = body;

    console.log('Family invite request:', { email, name, relationship });

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user already has this family member
    const { data: existing } = await supabaseAdmin
      .from('family_members')
      .select('id, status')
      .eq('user_id', user.id)
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
      .eq('user_id', user.id);

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
        user_id: user.id,
        email: email.toLowerCase(),
        name: name || null,
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

    // Get user's profile info for email
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('firstName, lastName')
      .eq('id', user.id)
      .single();

    const senderName = userProfile
      ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      : 'A family member';

    // Send email with Resend
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/family/access?token=${inviteToken}`;
    
    try {
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

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailError) {
          console.error('Error sending email:', emailError);
          // Still log to console as fallback
          console.log('=== FAMILY INVITE (Email failed, console backup) ===');
          console.log('To:', email);
          console.log('From:', senderName);
          console.log('Link:', inviteUrl);
          console.log('Expires:', expiresAt.toISOString());
          console.log('===================================================');
        } else {
          console.log('✅ Family invite email sent:', emailData?.id);
          // Also log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('=== FAMILY INVITE (Email sent) ===');
            console.log('To:', email);
            console.log('Link:', inviteUrl);
            console.log('===================================');
          }
        }
      } else {
        // No Resend API key - log to console only
        console.log('=== FAMILY INVITE (No Resend API key, console only) ===');
        console.log('To:', email);
        console.log('From:', senderName);
        console.log('Link:', inviteUrl);
        console.log('Expires:', expiresAt.toISOString());
        console.log('=======================================================');
      }
    } catch (emailError) {
      console.error('Exception sending email:', emailError);
      // Fallback to console
      console.log('=== FAMILY INVITE (Exception, console backup) ===');
      console.log('To:', email);
      console.log('From:', senderName);
      console.log('Link:', inviteUrl);
      console.log('Expires:', expiresAt.toISOString());
      console.log('=================================================');
    }

    // Log invite_sent activity event (async, non-blocking)
    console.log('[Family Invite] Logging invite_sent activity for:', familyMember.email);
    logActivityEvent({
      userId: user.id,
      actorId: user.id,
      familyMemberId: familyMember.id,
      eventType: 'invite_sent',
      metadata: {
        email: familyMember.email,
        name: familyMember.name,
        relationship: familyMember.relationship,
      },
    }).then((result) => {
      console.log('[Family Invite] ✅ Activity logged:', result);
    }).catch((error) => {
      console.error('[Family Invite] ❌ Failed to log invite_sent activity:', error);
    });

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
