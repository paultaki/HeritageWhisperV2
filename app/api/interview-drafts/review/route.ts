import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Review Drafts API
 *
 * Saves review screen progress (story edits, photos, etc.) so users can resume later.
 * Stored in interview_drafts table with type='review'.
 *
 * GET - Fetch existing review draft
 * POST - Create/update review draft
 * DELETE - Remove review draft after successful save
 */

// GET - Fetch user's active review draft for a specific interview
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

    // 2. Get interview ID from query params
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json(
        { error: 'interviewId is required' },
        { status: 400 }
      );
    }

    // 3. Query for existing review draft
    const { data, error } = await supabaseAdmin
      .from('interview_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('interview_id', interviewId)
      .eq('draft_type', 'review')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Database error fetching review draft:', error);
      return NextResponse.json(
        { error: 'Failed to fetch draft' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ draft: null });
    }

    // 4. Transform response (snake_case → camelCase)
    const draft = {
      id: data.id,
      userId: data.user_id,
      interviewId: data.interview_id,
      reviewData: data.review_data, // Contains storyEdits, saveAsFullInterview, fullInterviewTitle
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ draft });
  } catch (err) {
    logger.error('Error in GET /api/interview-drafts/review:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update review draft
export async function POST(request: NextRequest) {
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

    // 2. Parse request body
    const body = await request.json();
    const { interviewId, storyEdits, saveAsFullInterview, fullInterviewTitle } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: 'interviewId is required' },
        { status: 400 }
      );
    }

    // 3. Package review data
    const reviewData = {
      storyEdits,
      saveAsFullInterview,
      fullInterviewTitle,
    };

    // 4. Check for existing draft
    const { data: existingDraft } = await supabaseAdmin
      .from('interview_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('interview_id', interviewId)
      .eq('draft_type', 'review')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result;

    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabaseAdmin
        .from('interview_drafts')
        .update({
          review_data: reviewData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Database error updating review draft:', error);
        return NextResponse.json(
          { error: 'Failed to update draft' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new draft
      const { data, error } = await supabaseAdmin
        .from('interview_drafts')
        .insert({
          user_id: user.id,
          interview_id: interviewId,
          draft_type: 'review',
          review_data: reviewData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Database error creating review draft:', error);
        return NextResponse.json(
          { error: 'Failed to create draft' },
          { status: 500 }
        );
      }

      result = data;
    }

    // 5. Transform response
    const draft = {
      id: result.id,
      userId: result.user_id,
      interviewId: result.interview_id,
      reviewData: result.review_data,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };

    return NextResponse.json({ draft }, { status: existingDraft ? 200 : 201 });
  } catch (err) {
    logger.error('Error in POST /api/interview-drafts/review:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove review draft (called after successful story save)
export async function DELETE(request: NextRequest) {
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

    // 2. Get interview ID from query params
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');

    let deleteQuery = supabaseAdmin
      .from('interview_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('draft_type', 'review');

    // If interviewId provided, delete specific draft; otherwise delete all review drafts
    if (interviewId) {
      deleteQuery = deleteQuery.eq('interview_id', interviewId);
    }

    const { error } = await deleteQuery;

    if (error) {
      logger.error('Database error deleting review draft:', error);
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error in DELETE /api/interview-drafts/review:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
