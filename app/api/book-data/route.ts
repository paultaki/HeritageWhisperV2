import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    console.log('[Book Data API] Request received');

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      console.log('[Book Data API] No userId provided');
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('[Book Data API] Fetching stories for userId:', userId);

    // Fetch stories using admin client (bypasses RLS)
    // Note: Database uses different column names (year, transcript, wisdom_text, etc.)
    const { data: stories, error } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: true });

    if (error) {
      console.error('[Book Data API] Supabase error:', error);
      return NextResponse.json({
        error: 'Failed to fetch stories',
        details: error.message
      }, { status: 500 });
    }

    console.log('[Book Data API] Found', stories?.length || 0, 'stories');

    // Transform database column names to match expected format
    const transformedStories = (stories || []).map(story => ({
      id: story.id,
      userId: story.user_id,
      title: story.title,
      audioUrl: story.audio_url,
      transcription: story.transcript,
      storyYear: story.year,
      storyDate: story.story_date,
      lifeAge: story.life_age,
      photoUrl: story.photo_url,
      photos: story.photos,
      wisdomClipText: story.wisdom_text,
      includeInBook: true, // All stories returned are included in book
    }));

    return NextResponse.json({ stories: transformedStories });

  } catch (error) {
    console.error('Book data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book data' },
      { status: 500 }
    );
  }
}
