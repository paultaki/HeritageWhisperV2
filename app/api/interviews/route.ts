/**
 * Interviews API
 * 
 * POST /api/interviews - Create a new interview record
 * GET /api/interviews - List user's interviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
    const {
      fullAudioUrl,
      mixedAudioUrl,
      durationSeconds,
      transcriptJson,
      theme,
    } = body;

    // 3. Validate required fields
    if (!fullAudioUrl) {
      return NextResponse.json(
        { error: 'fullAudioUrl is required' },
        { status: 400 }
      );
    }

    if (!durationSeconds || durationSeconds <= 0) {
      return NextResponse.json(
        { error: 'durationSeconds must be a positive number' },
        { status: 400 }
      );
    }

    if (!transcriptJson || !Array.isArray(transcriptJson)) {
      return NextResponse.json(
        { error: 'transcriptJson must be an array' },
        { status: 400 }
      );
    }

    // 4. Create interview record
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .insert({
        user_id: user.id,
        full_audio_url: fullAudioUrl,
        mixed_audio_url: mixedAudioUrl || null,
        duration_seconds: durationSeconds,
        transcript_json: transcriptJson,
        theme: theme || null,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('[Interviews API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create interview' },
        { status: 500 }
      );
    }

    logger.info('[Interviews API] Created interview:', interview.id);

    return NextResponse.json({
      id: interview.id,
      status: interview.status,
    }, { status: 201 });
  } catch (err) {
    logger.error('[Interviews API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // 2. Get user's interviews, most recent first
    const { data: interviews, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Interviews API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interviews' },
        { status: 500 }
      );
    }

    // 3. Transform to camelCase
    const transformedInterviews = interviews.map((i: any) => ({
      id: i.id,
      userId: i.user_id,
      fullAudioUrl: i.full_audio_url,
      mixedAudioUrl: i.mixed_audio_url,
      durationSeconds: i.duration_seconds,
      transcriptJson: i.transcript_json,
      theme: i.theme,
      status: i.status,
      detectedStories: i.detected_stories,
      storiesParsedAt: i.stories_parsed_at,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

    return NextResponse.json({ interviews: transformedInterviews });
  } catch (err) {
    logger.error('[Interviews API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
