import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * GET /api/accounts/available
 * Returns list of storytellers the authenticated user can access
 * (Family Sharing V3 - Multi-Tenant Account System)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[AvailableAccounts] Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    console.log('[AvailableAccounts] Fetching collaborations for user:', user.id);

    // Use the RPC function to get available storytellers
    const { data: storytellers, error: rpcError } = await supabaseAdmin.rpc(
      'get_user_collaborations',
      { p_user_id: user.id }
    );

    if (rpcError) {
      console.error('[AvailableAccounts] RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Failed to fetch available accounts' },
        { status: 500 }
      );
    }

    console.log('[AvailableAccounts] Found', storytellers?.length || 0, 'storytellers');
    console.log('[AvailableAccounts] Raw storyteller data:', JSON.stringify(storytellers, null, 2));

    // Map database snake_case to camelCase for frontend
    const mappedStorytellers = (storytellers || []).map((st: any) => ({
      storytellerId: st.storyteller_id,
      storytellerName: st.storyteller_name,
      permissionLevel: st.permission_level,
      relationship: st.relationship,
      lastViewedAt: st.last_viewed_at,
    }));

    // Return the storytellers array
    return NextResponse.json({
      storytellers: mappedStorytellers,
    });

  } catch (err) {
    console.error('[AvailableAccounts] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
