import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/prompts/family-mark-seen
 * Marks all unseen family-submitted prompts as seen for the authenticated user
 * Called when user visits the prompts page to clear notification badges
 */
export async function POST(request: NextRequest) {
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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Mark all unseen pending family prompts as seen
    const { data, error: updateError } = await supabaseAdmin
      .from('family_prompts')
      .update({ seen_at: new Date().toISOString() })
      .eq('storyteller_user_id', userId)
      .eq('status', 'pending')
      .is('seen_at', null)
      .select('id');

    if (updateError) {
      logger.error('Error marking family prompts as seen:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark prompts as seen' },
        { status: 500 }
      );
    }

    const markedCount = data?.length || 0;

    return NextResponse.json({
      success: true,
      markedCount,
    });

  } catch (err) {
    logger.error('Error in POST /api/prompts/family-mark-seen:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
