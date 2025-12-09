import { NextRequest, NextResponse } from 'next/server';
import { getPasskeySession } from "@/lib/iron-session";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/accounts/available
 * Returns list of storytellers the authenticated user can access
 * (Family Sharing V3 - Multi-Tenant Account System)
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | undefined;
    let userEmail: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
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
        logger.error('[AvailableAccounts] Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }
      userId = user.id;
      userEmail = user.email;
    }

    // Get user's email if not already set
    if (!userEmail) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      userEmail = userData?.email;
    }

    logger.debug('[AvailableAccounts] Fetching collaborations for user:', userId, 'email:', userEmail);

    // Use the RPC function to get available storytellers
    const { data: storytellers, error: rpcError } = await supabaseAdmin.rpc(
      'get_user_collaborations',
      { p_user_id: userId }
    );

    let finalStorytellers = storytellers || [];

    if (rpcError) {
      // If the RPC function doesn't exist yet, do direct query
      if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
        logger.warn('[AvailableAccounts] RPC function not yet created - using direct query');
        finalStorytellers = [];
      } else {
        logger.error('[AvailableAccounts] RPC error:', rpcError);
        // Continue with direct query fallback
        finalStorytellers = [];
      }
    }

    logger.debug('[AvailableAccounts] RPC returned', finalStorytellers.length, 'storytellers');

    // Fallback: If RPC returns only self (owner), also check family_members directly
    // This handles case sensitivity issues and ensures we don't miss any relationships
    if (userEmail && finalStorytellers.length <= 1) {
      logger.debug('[AvailableAccounts] Checking family_members directly for email:', userEmail);

      // Case-insensitive email match using ILIKE
      const { data: familyAccess, error: familyError } = await supabaseAdmin
        .from('family_members')
        .select(`
          user_id,
          relationship,
          permission_level,
          last_accessed_at,
          users!inner (
            id,
            name,
            email
          )
        `)
        .ilike('email', userEmail)  // Case-insensitive match
        .eq('status', 'active');

      if (familyError) {
        logger.error('[AvailableAccounts] Family members query error:', familyError);
      } else if (familyAccess && familyAccess.length > 0) {
        logger.debug('[AvailableAccounts] Found', familyAccess.length, 'family relationships via direct query');

        // Add any family members not already in the list
        const existingIds = new Set(finalStorytellers.map((s: any) => s.storyteller_id));

        for (const fm of familyAccess) {
          if (!existingIds.has(fm.user_id)) {
            const storyteller = (fm as any).users;
            finalStorytellers.push({
              storyteller_id: fm.user_id,
              storyteller_name: storyteller?.name || storyteller?.email || 'Storyteller',
              permission_level: fm.permission_level || 'viewer',
              relationship: fm.relationship,
              last_viewed_at: fm.last_accessed_at,
            });
            logger.debug('[AvailableAccounts] Added family member:', storyteller?.name, 'via direct query');
          }
        }
      }
    }

    // Ensure self is always in the list
    const hasOwn = finalStorytellers.some((s: any) => s.storyteller_id === userId);
    if (!hasOwn) {
      const { data: selfData } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      finalStorytellers.unshift({
        storyteller_id: userId,
        storyteller_name: selfData?.name || 'My Stories',
        permission_level: 'owner',
        relationship: null,
        last_viewed_at: null,
      });
    }

    logger.debug('[AvailableAccounts] Final count:', finalStorytellers.length, 'storytellers');

    // Map database snake_case to camelCase for frontend
    const mappedStorytellers = finalStorytellers.map((st: any) => ({
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
    logger.error('[AvailableAccounts] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
