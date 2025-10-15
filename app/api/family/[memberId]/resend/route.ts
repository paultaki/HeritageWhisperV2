import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
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

    // Verify the family member belongs to this user
    const { data: member, error: memberError } = await supabaseAdmin
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .eq('user_id', user.id)
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

    // Get user's profile info for email
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('firstName, lastName')
      .eq('id', user.id)
      .single();

    const senderName = userProfile
      ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      : 'A family member';

    // TODO: Send email via Resend
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/family/access?token=${inviteToken}`;
    
    console.log('=== RESEND FAMILY INVITE ===');
    console.log('To:', member.email);
    console.log('From:', senderName);
    console.log('Link:', inviteUrl);
    console.log('Expires:', expiresAt.toISOString());
    console.log('============================');

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
