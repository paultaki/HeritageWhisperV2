/**
 * Single Interview API
 * 
 * GET /api/interviews/[id] - Get interview by ID
 * PATCH /api/interviews/[id] - Update interview
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 2. Fetch interview
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // 3. Transform to camelCase
    const transformed = {
      id: interview.id,
      userId: interview.user_id,
      fullAudioUrl: interview.full_audio_url,
      mixedAudioUrl: interview.mixed_audio_url,
      durationSeconds: interview.duration_seconds,
      transcriptJson: interview.transcript_json,
      theme: interview.theme,
      status: interview.status,
      detectedStories: interview.detected_stories,
      storiesParsedAt: interview.stories_parsed_at,
      createdAt: interview.created_at,
      updatedAt: interview.updated_at,
    };

    return NextResponse.json({ interview: transformed });
  } catch (err) {
    logger.error('[Interview API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // 2. Build update object (snake_case for database)
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Handle both camelCase and snake_case input
    if (body.status !== undefined) {
      updates.status = body.status;
    }
    if (body.detected_stories !== undefined || body.detectedStories !== undefined) {
      updates.detected_stories = body.detected_stories || body.detectedStories;
    }
    if (body.stories_parsed_at !== undefined || body.storiesParsedAt !== undefined) {
      updates.stories_parsed_at = body.stories_parsed_at || body.storiesParsedAt;
    }

    // 3. Update interview
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('[Interview API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update interview' },
        { status: 500 }
      );
    }

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // 4. Transform to camelCase
    const transformed = {
      id: interview.id,
      userId: interview.user_id,
      fullAudioUrl: interview.full_audio_url,
      mixedAudioUrl: interview.mixed_audio_url,
      durationSeconds: interview.duration_seconds,
      transcriptJson: interview.transcript_json,
      theme: interview.theme,
      status: interview.status,
      detectedStories: interview.detected_stories,
      storiesParsedAt: interview.stories_parsed_at,
      createdAt: interview.created_at,
      updatedAt: interview.updated_at,
    };

    return NextResponse.json({ interview: transformed });
  } catch (err) {
    logger.error('[Interview API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
