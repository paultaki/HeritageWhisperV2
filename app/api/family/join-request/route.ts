import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Generate a secure random token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/family/join-request
// Public endpoint for requesting access to a storyteller's stories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storytellerId, visitorName, visitorEmail, relationship } = body;

    // Validate required fields
    if (!storytellerId) {
      return NextResponse.json(
        { error: 'Storyteller ID is required' },
        { status: 400 }
      );
    }

    if (!visitorName || visitorName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Your name is required' },
        { status: 400 }
      );
    }

    if (!visitorEmail || !visitorEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if storyteller exists
    const { data: storyteller, error: storytellerError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', storytellerId)
      .single();

    if (storytellerError || !storyteller) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // Check if this email already has access or pending invite
    const { data: existing } = await supabaseAdmin
      .from('family_members')
      .select('id, status')
      .eq('user_id', storytellerId)
      .eq('email', visitorEmail.toLowerCase())
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        // Already has access - get their token
        const { data: invite } = await supabaseAdmin
          .from('family_invites')
          .select('token')
          .eq('family_member_id', existing.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (invite?.token) {
          return NextResponse.json({
            success: true,
            token: invite.token,
            message: 'You already have access',
          });
        }
      }

      return NextResponse.json(
        { error: 'This email already has a pending invitation' },
        { status: 400 }
      );
    }

    // Check family member limit (max 15)
    const { count } = await supabaseAdmin
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', storytellerId);

    if ((count || 0) >= 15) {
      return NextResponse.json(
        { error: 'This storyteller has reached their family member limit' },
        { status: 400 }
      );
    }

    // Valid relationship values per database CHECK constraint
    const validRelationships = ['spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'];
    const sanitizedRelationship = relationship && validRelationships.includes(relationship.toLowerCase())
      ? relationship.toLowerCase()
      : 'other';

    // Create family member record
    const { data: familyMember, error: memberError } = await supabaseAdmin
      .from('family_members')
      .insert({
        user_id: storytellerId,
        email: visitorEmail.toLowerCase(),
        name: visitorName.trim(),
        relationship: sanitizedRelationship,
        permission_level: 'viewer',
        status: 'active', // Auto-approve for public join links
      })
      .select()
      .single();

    if (memberError || !familyMember) {
      console.error('Error creating family member:', memberError);
      return NextResponse.json(
        { error: 'Failed to create access request' },
        { status: 500 }
      );
    }

    // Generate secure token
    const inviteToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365); // 1 year for auto-approved joins

    // Create invite record with token
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
        { error: 'Failed to create access' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: inviteToken,
      message: 'Access granted',
    });
  } catch (error: any) {
    console.error('Error in join request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
