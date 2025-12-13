/**
 * Interview Save Stories API
 * 
 * POST /api/interviews/[id]/save-stories - Batch save approved stories from review
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { logActivityEvent } from '@/lib/activity';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface StoryToSave {
  tempId: string;
  title: string;
  transcription: string;
  audioUrl: string;
  durationSeconds: number;
  storyYear?: number;
  storyAge?: number;
  lifePhase?: string;
  lessonLearned?: string;
  photos?: Array<{
    id: string;
    filePath?: string;
    masterPath?: string;
    displayPath?: string;
    isHero?: boolean;
  }>;
  interviewStartMs?: number;
  interviewEndMs?: number;
}

interface SaveStoriesRequest {
  stories: StoryToSave[];
  saveAsFullInterview: boolean;
}

export async function POST(
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

    const { id: interviewId } = await params;

    // 2. Verify interview exists and belongs to user
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body: SaveStoriesRequest = await request.json();
    const { stories, saveAsFullInterview } = body;

    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      return NextResponse.json(
        { error: 'At least one story is required' },
        { status: 400 }
      );
    }

    logger.info('[Save Stories API] Saving', stories.length, 'stories for interview:', interviewId);

    // 4. Create story records
    const createdStories: Array<{ id: string; title: string }> = [];
    const errors: string[] = [];

    for (const story of stories) {
      try {
        logger.info('[Save Stories API] Processing story:', {
          tempId: story.tempId,
          title: story.title?.substring(0, 50),
          hasTranscription: !!story.transcription,
          transcriptionLength: story.transcription?.length,
          audioUrl: story.audioUrl?.substring(0, 50),
          durationSeconds: story.durationSeconds,
        });

        // Validate required fields
        if (!story.title || !story.transcription) {
          errors.push(`Story ${story.tempId}: Missing title or transcription`);
          continue;
        }

        // Prepare story record - only include columns that exist in the stories table
        // Note: created_at is automatically set by database default, so don't include it
        
        // Ensure duration is a valid integer
        const durationSecs = typeof story.durationSeconds === 'number' && story.durationSeconds > 0
          ? Math.round(story.durationSeconds)
          : interview.duration_seconds || 0;

        // Ensure story_year is a valid integer (sometimes it comes as string like "1980s")
        let storyYear: number | null = null;
        if (story.storyYear) {
          const parsed = parseInt(String(story.storyYear), 10);
          if (!isNaN(parsed) && parsed > 1800 && parsed < 2100) {
            storyYear = parsed;
          }
        }

        const storyRecord: Record<string, any> = {
          user_id: user.id,
          title: story.title.trim(),
          transcription: story.transcription,
          audio_url: story.audioUrl || interview.full_audio_url, // Fallback to full interview audio
          duration_seconds: durationSecs,
          include_in_book: true,
          include_in_timeline: true,
          is_favorite: false,
          recording_mode: 'audio', // Valid values: 'audio', 'text', 'photo_audio'
        };

        // Only add optional fields if they have valid values
        if (storyYear) storyRecord.story_year = storyYear;
        if (story.lifePhase && typeof story.lifePhase === 'string') {
          storyRecord.life_phase = story.lifePhase;
        }
        if (story.lessonLearned && typeof story.lessonLearned === 'string') {
          storyRecord.lesson_learned = story.lessonLearned.trim();
        }
        if (story.photos && Array.isArray(story.photos) && story.photos.length > 0) {
          storyRecord.photos = story.photos;
        }

        // Note: source_interview_id, interview_start_ms, interview_end_ms, story_age
        // columns may not exist yet in the stories table. Skip them for now to avoid errors.
        // TODO: Add these columns via migration:
        // ALTER TABLE stories ADD COLUMN source_interview_id UUID REFERENCES interviews(id);
        // ALTER TABLE stories ADD COLUMN interview_start_ms INTEGER;
        // ALTER TABLE stories ADD COLUMN interview_end_ms INTEGER;
        // ALTER TABLE stories ADD COLUMN story_age INTEGER;

        // Insert story
        logger.info('[Save Stories API] Inserting story record:', JSON.stringify(storyRecord, null, 2));
        
        const { data: createdStory, error: insertError } = await supabaseAdmin
          .from('stories')
          .insert(storyRecord)
          .select('id, title')
          .single();

        if (insertError) {
          logger.error('[Save Stories API] Insert error for story:', story.tempId, {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          });
          errors.push(`Story "${story.title}": ${insertError.message}`);
          continue;
        }

        createdStories.push({
          id: createdStory.id,
          title: createdStory.title,
        });

        // Log activity event
        try {
          await logActivityEvent({
            userId: user.id,
            actorId: user.id,
            eventType: 'story_recorded',
            storyId: createdStory.id,
            metadata: {
              source: 'interview',
              interviewId: interviewId,
            },
          });
        } catch (activityError) {
          // Don't fail the request if activity logging fails
          logger.warn('[Save Stories API] Failed to log activity:', activityError);
        }
      } catch (storyError) {
        logger.error('[Save Stories API] Error processing story:', story.tempId, storyError);
        errors.push(`Story "${story.title || story.tempId}": Processing error`);
      }
    }

    // 5. Update interview status
    const { error: updateError } = await supabaseAdmin
      .from('interviews')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', interviewId)
      .eq('user_id', user.id);

    if (updateError) {
      logger.warn('[Save Stories API] Failed to update interview status:', updateError);
    }

    // 6. Update user's story count
    try {
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('story_count')
        .eq('id', user.id)
        .single();

      if (currentUser) {
        await supabaseAdmin
          .from('users')
          .update({
            story_count: (currentUser.story_count || 0) + createdStories.length,
          })
          .eq('id', user.id);
      }
    } catch (countError) {
      logger.warn('[Save Stories API] Failed to update story count:', countError);
    }

    // 7. Return results
    const success = createdStories.length > 0;
    const status = errors.length > 0 && createdStories.length === 0 ? 500 : 
                   errors.length > 0 ? 207 : 201;

    logger.info('[Save Stories API] Completed:', {
      created: createdStories.length,
      errors: errors.length,
    });

    return NextResponse.json({
      success,
      created: createdStories.length,
      stories: createdStories,
      errors: errors.length > 0 ? errors : undefined,
    }, { status });
  } catch (err) {
    logger.error('[Save Stories API] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to save stories', details: errorMessage },
      { status: 500 }
    );
  }
}
