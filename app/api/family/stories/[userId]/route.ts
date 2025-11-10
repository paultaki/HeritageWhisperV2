import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get family session token from header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      );
    }

    // Verify family session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select(`
        id,
        family_member_id,
        expires_at,
        family_members (
          id,
          user_id,
          email,
          name,
          relationship
        )
      `)
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      console.error('Family session not found:', sessionError);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const familyMember = (session as any).family_members;

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Verify userId matches the storyteller (defense-in-depth)
    if (familyMember.user_id !== userId) {
      console.error('User ID mismatch:', {
        familyMemberUserId: familyMember.user_id,
        requestedUserId: userId,
      });
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // SECURITY: Filter at database level using verified family member's user_id
    // This prevents enumeration attacks even if application logic is bypassed
    const { data: allStories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', familyMember.user_id)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });
    
    // Filter for public stories (include_in_timeline OR include_in_book in metadata)
    const stories = (allStories || []).filter((story: any) => {
      const includeInTimeline = story.metadata?.include_in_timeline ?? true;
      const includeInBook = story.metadata?.include_in_book ?? true;
      return includeInTimeline || includeInBook;
    });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      console.error('Query details:', {
        userId,
        errorCode: storiesError.code,
        errorMessage: storiesError.message,
        errorDetails: storiesError.details,
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch stories',
          details: process.env.NODE_ENV === 'development' ? storiesError.message : undefined
        },
        { status: 500 }
      );
    }

    // Update last_active_at for session
    await supabaseAdmin
      .from('family_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', session.id);

    // Update family member last_accessed_at and increment access_count
    await supabaseAdmin
      .from('family_members')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (familyMember.access_count || 0) + 1,
      })
      .eq('id', session.family_member_id);

    // Fetch storyteller's user data for birth year calculations
    const { data: storytellerUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, birth_year')
      .eq('id', familyMember.user_id)
      .single();

    if (userError) {
      console.warn('[Family Stories API] Failed to fetch storyteller:', userError);
    }

    // Helper function to generate signed URLs for photos
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs
      if (photoUrl.startsWith("blob:")) {
        return null;
      }

      // If already a full URL, use as-is
      if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
        return photoUrl;
      }

      // Generate signed URL for storage path
      const { data, error } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(
          photoUrl.startsWith("photo/") ? photoUrl : `photo/${photoUrl}`,
          604800, // 1 week
        );

      if (error) {
        console.error("Error creating signed URL for photo:", photoUrl, error);
        return null;
      }

      return data?.signedUrl || null;
    };

    // Transform stories to match frontend expectations (camelCase)
    const transformedStories = await Promise.all(
      stories.map(async (story: any) => {
        // Handle photos from top-level photos column
        let photos = [];
        if (story.photos) {
          photos = await Promise.all(
            (story.photos || []).map(async (photo: any) => {
              // Generate signed URLs for dual WebP versions
              const displayUrl = photo.displayPath
                ? await getPhotoUrl(photo.displayPath) // 550px WebP for web display
                : null;

              const masterUrl = photo.masterPath
                ? await getPhotoUrl(photo.masterPath) // 2400px WebP for printing
                : null;

              // Fallback to original file if not yet migrated to WebP
              const legacyUrl = !displayUrl && (photo.url || photo.filePath)
                ? await getPhotoUrl(photo.url || photo.filePath)
                : null;

              return {
                ...photo,
                displayUrl,
                masterUrl,
                url: displayUrl || legacyUrl, // Primary display uses 550px WebP
              };
            }),
          );
        }

        const photoUrl = await getPhotoUrl(story.photo_url);

        return {
          id: story.id,
          title: story.title,
          transcript: story.transcription || story.transcript,
          audioUrl: story.audio_url,
          storyYear: story.year,
          ageAtStory: story.metadata?.life_age,
          heroPhotoUrl: photoUrl,
          photos: photos,
          photoUrl: photoUrl,
          wisdomText: story.wisdom_clip_text,
          createdAt: story.created_at,
          includeInTimeline: story.metadata?.include_in_timeline ?? true,
          includeInBook: story.metadata?.include_in_book ?? true,
        };
      })
    );

    // Map storyteller data to camelCase
    const storytellerData = storytellerUser ? {
      id: storytellerUser.id,
      name: storytellerUser.name,
      birthYear: storytellerUser.birth_year,
    } : null;

    return NextResponse.json({
      stories: transformedStories,
      storyteller: storytellerData, // Include storyteller metadata
      total: transformedStories.length,
    });
  } catch (error) {
    console.error('Error in family stories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
