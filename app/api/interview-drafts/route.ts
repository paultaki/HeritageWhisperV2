import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Interview Drafts API
 *
 * Auto-saves interview progress to prevent data loss.
 * Drafts are automatically cleaned up after 24 hours.
 *
 * GET - Fetch existing draft (< 24 hours old)
 * POST - Create/update draft with transcript
 * DELETE - Remove draft after successful save
 */

// GET - Fetch user's active draft
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

    // 2. Query for existing draft (< 24 hours old)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('interview_drafts')
      .select('*')
      .eq('user_id', user.id)
      .gte('updated_at', twentyFourHoursAgo)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Database error fetching draft:', error);
      return NextResponse.json(
        { error: 'Failed to fetch draft' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ draft: null });
    }

    // 3. Transform response (snake_case → camelCase)
    const draft = {
      id: data.id,
      userId: data.user_id,
      transcriptJson: data.transcript_json,
      theme: data.theme,
      sessionDuration: data.session_duration,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ draft });
  } catch (err) {
    logger.error('Error in GET /api/interview-drafts:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update draft
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
    const { transcriptJson, theme, sessionDuration } = body;

    if (!transcriptJson || !Array.isArray(transcriptJson)) {
      return NextResponse.json(
        { error: 'transcriptJson is required and must be an array' },
        { status: 400 }
      );
    }

    // 3. Check for existing draft
    const { data: existingDraft } = await supabaseAdmin
      .from('interview_drafts')
      .select('id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result;

    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabaseAdmin
        .from('interview_drafts')
        .update({
          transcript_json: transcriptJson,
          theme: theme || null,
          session_duration: sessionDuration || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Database error updating draft:', error);
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
          transcript_json: transcriptJson,
          theme: theme || null,
          session_duration: sessionDuration || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Database error creating draft:', error);
        return NextResponse.json(
          { error: 'Failed to create draft' },
          { status: 500 }
        );
      }

      result = data;
    }

    // 4. Transform response
    const draft = {
      id: result.id,
      userId: result.user_id,
      transcriptJson: result.transcript_json,
      theme: result.theme,
      sessionDuration: result.session_duration,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };

    return NextResponse.json({ draft }, { status: existingDraft ? 200 : 201 });
  } catch (err) {
    logger.error('Error in POST /api/interview-drafts:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove draft (called after successful story save)
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

    // 2. Delete all drafts for this user (clean slate after successful save)
    const { error } = await supabaseAdmin
      .from('interview_drafts')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      logger.error('Database error deleting draft:', error);
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error in DELETE /api/interview-drafts:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
