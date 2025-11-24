import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getPasskeySession } from "@/lib/iron-session";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function DELETE(
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
    const { data: member } = await supabaseAdmin
      .from('family_members')
      .select('id, user_id')
      .eq('id', memberId)
      .single();

    if (!member || member.user_id !== userId) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Delete the family member (cascade will delete invites and sessions)
    const { error: deleteError } = await supabaseAdmin
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error deleting family member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove family member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      removed: true,
    });
  } catch (error) {
    console.error('Error in DELETE family member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
