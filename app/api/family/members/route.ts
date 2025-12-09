import { NextRequest, NextResponse } from 'next/server';

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
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

    // For each member, fetch relevant expiration info
    const membersWithExpiration = await Promise.all(
      (members || []).map(async (member) => {
        if (member.status === 'pending') {
          // For pending members, get invite expiration
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
            inviteExpiresAt: invite?.expires_at || null,
          };
        } else if (member.status === 'active') {
          // For active members, get session expiration
          const { data: session } = await supabaseAdmin
            .from('family_sessions')
            .select('expires_at')
            .eq('family_member_id', member.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...member,
            sessionExpiresAt: session?.expires_at || null,
          };
        }
        return member;
      })
    );

    return NextResponse.json({
      members: membersWithExpiration,
      total: membersWithExpiration.length,
    });
  } catch (error) {
    console.error('Error in GET family members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
