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

export async function GET(req: NextRequest) {
  try {
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

    // Fetch all family members for this user
    const { data: members, error: membersError } = await supabaseAdmin
      .from('family_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch family members' },
        { status: 500 }
      );
    }

    // For each pending member, check if they have an active invite
    const membersWithInvites = await Promise.all(
      (members || []).map(async (member) => {
        if (member.status === 'pending') {
          const { data: invite } = await supabaseAdmin
            .from('family_invites')
            .select('expires_at, used_at')
            .eq('family_member_id', member.id)
            .is('used_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...member,
            inviteExpired: invite ? new Date(invite.expires_at) < new Date() : false,
          };
        }
        return member;
      })
    );

    return NextResponse.json({
      members: membersWithInvites,
      total: membersWithInvites.length,
    });
  } catch (error) {
    console.error('Error in GET family members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
