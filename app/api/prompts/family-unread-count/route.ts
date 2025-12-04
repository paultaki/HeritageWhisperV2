import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * GET /api/prompts/family-unread-count
 * Returns the count of unseen family-submitted prompts for notification badges
 * Only counts pending prompts where seen_at IS NULL
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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Count unseen pending family prompts for this user
    const { count, error: countError } = await supabaseAdmin
      .from('family_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('storyteller_user_id', userId)
      .eq('status', 'pending')
      .is('seen_at', null);

    if (countError) {
      logger.error('Error counting unread family prompts:', countError);
      return NextResponse.json(
        { error: 'Failed to count unread prompts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });

  } catch (err) {
    logger.error('Error in GET /api/prompts/family-unread-count:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
