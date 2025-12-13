import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Recent Interviews API
 *
 * Fetches the user's most recent interviews (ordered by created_at desc).
 * Used to check if there's a pending review draft.
 *
 * GET - Fetch recent interviews
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Validate session
    const authHeader = request.headers.get('authorization');
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

    // 2. Get limit from query params (default 1)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1', 10);

    // 3. Query for recent interviews (with status 'pending' - not yet saved to stories)
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .select('id, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'pending') // Only get interviews that haven't been saved yet
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 10)); // Max 10

    if (error) {
      logger.error('Database error fetching recent interviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interviews' },
        { status: 500 }
      );
    }

    // 4. Transform response (snake_case → camelCase)
    const interviews = (data || []).map((interview) => ({
      id: interview.id,
      createdAt: interview.created_at,
      status: interview.status,
    }));

    return NextResponse.json({ interviews });
  } catch (err) {
    logger.error('Error in GET /api/interviews/recent:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
