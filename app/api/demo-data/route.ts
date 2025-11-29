import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DEMO_USER_ID = '38ad3036-e423-4e41-a3f3-020664a1ee0e';
const SEVEN_DAYS = 7 * 24 * 60 * 60; // seconds

export async function GET() {
  try {
    // Fetch user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', DEMO_USER_ID)
      .single();

    // Fetch stories
    const { data: stories } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('created_at', { ascending: false });

    // Fetch treasures
    const { data: treasures } = await supabase
      .from('treasures')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('created_at', { ascending: false });

    // Generate fresh signed URLs for all media
    for (const story of stories || []) {
      // Sign audio URLs
      if (story.audio_url?.includes('heritage-whisper-files')) {
        const path = story.audio_url.split('/heritage-whisper-files/')[1]?.split('?')[0];
        if (path) {
          const { data: signedUrl } = await supabase.storage
            .from('heritage-whisper-files')
            .createSignedUrl(path, SEVEN_DAYS);
          if (signedUrl) story.audio_url = signedUrl.signedUrl;
        }
      }

      // Sign photo URLs
      if (story.photos) {
        for (const photo of story.photos) {
          if (photo.displayPath) {
            const { data: signedUrl } = await supabase.storage
              .from('heritage-whisper-files')
              .createSignedUrl(photo.displayPath, SEVEN_DAYS);
            if (signedUrl) photo.displayUrl = signedUrl.signedUrl;
          }
          if (photo.masterPath) {
            const { data: signedUrl } = await supabase.storage
              .from('heritage-whisper-files')
              .createSignedUrl(photo.masterPath, SEVEN_DAYS);
            if (signedUrl) photo.masterUrl = signedUrl.signedUrl;
          }
        }
      }
    }

    // Sign profile photo
    if (user?.profile_photo_url?.includes('heritage-whisper-files')) {
      const path = user.profile_photo_url.split('/heritage-whisper-files/')[1]?.split('?')[0];
      if (path) {
        const { data: signedUrl } = await supabase.storage
          .from('heritage-whisper-files')
          .createSignedUrl(path, SEVEN_DAYS);
        if (signedUrl) user.profile_photo_url = signedUrl.signedUrl;
      }
    }

    // Sign treasure photos
    for (const treasure of treasures || []) {
      if (treasure.photo_path) {
        const { data: signedUrl } = await supabase.storage
          .from('heritage-whisper-files')
          .createSignedUrl(treasure.photo_path, SEVEN_DAYS);
        if (signedUrl) treasure.photo_url = signedUrl.signedUrl;
      }
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SEVEN_DAYS * 1000).toISOString(),
      note: "Signed URLs generated on-demand. Fresh URLs on each request.",
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        birthYear: user?.birth_year,
        bio: user?.bio,
        profilePhotoUrl: user?.profile_photo_url,
        profileInterests: user?.profile_interests,
        storyCount: stories?.length || 0,
        createdAt: user?.created_at,
      },
      stories: stories?.map(story => ({
        id: story.id,
        title: story.title,
        year: story.story_year,
        storyDate: story.story_date,
        transcript: story.transcription,
        wisdomText: story.wisdom_clip_text,
        audioUrl: story.audio_url,
        durationSeconds: story.duration_seconds,
        photos: story.photos || [],
        includeInBook: story.include_in_book,
        includeInTimeline: story.include_in_timeline,
        isFavorite: story.is_favorite,
        createdAt: story.created_at,
        updatedAt: story.updated_at,
      })) || [],
      treasures: treasures?.map(treasure => ({
        id: treasure.id,
        title: treasure.title,
        description: treasure.description,
        year: treasure.year,
        photoUrl: treasure.photo_url,
        photoPath: treasure.photo_path,
        transform: treasure.transform,
        createdAt: treasure.created_at,
      })) || [],
      stats: {
        totalStories: stories?.length || 0,
        totalTreasures: treasures?.length || 0,
        storiesWithAudio: stories?.filter(s => s.audio_url).length || 0,
        storiesWithPhotos: stories?.filter(s => s.photos && s.photos.length > 0).length || 0,
        storiesWithWisdom: stories?.filter(s => s.wisdom_clip_text).length || 0,
      }
    };

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('Error generating demo data:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo data' },
      { status: 500 }
    );
  }
}
