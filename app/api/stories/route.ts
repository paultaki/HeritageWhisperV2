import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
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
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Fetch stories from Supabase database
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (storiesError) {
      console.error("Error fetching stories:", storiesError);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 }
      );
    }

    // Helper function to generate signed URLs for photos
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs
      if (photoUrl.startsWith('blob:')) {
        return null;
      }

      // If already a full URL, use as-is
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
      }

      // Generate signed URL for storage path
      const { data, error } = await supabaseAdmin.storage
        .from('heritage-whisper-files')
        .createSignedUrl(photoUrl.startsWith('photo/') ? photoUrl : `photo/${photoUrl}`, 604800);

      if (error) {
        console.error('Error creating signed URL for photo:', photoUrl, error);
        return null;
      }

      return data?.signedUrl || null;
    };

    // Transform to match frontend expectations
    const transformedStories = await Promise.all((stories || []).map(async (story) => {
      // Handle photos if stored as JSON
      let photos = [];
      if (story.metadata?.photos) {
        photos = await Promise.all(
          (story.metadata.photos || []).map(async (photo: any) => ({
            ...photo,
            url: await getPhotoUrl(photo.url || photo.filePath)
          }))
        );
      }

      const photoUrl = await getPhotoUrl(story.photo_url);

      return {
        id: story.id,
        title: story.title || "Untitled Story",
        content: story.transcript,
        transcription: story.transcript,
        createdAt: story.created_at,
        updatedAt: story.updated_at,
        age: story.metadata?.life_age || story.metadata?.age,
        year: story.year,
        storyYear: story.year,
        lifeAge: story.metadata?.life_age,
        includeInTimeline: story.metadata?.include_in_timeline ?? true,
        includeInBook: story.metadata?.include_in_book ?? true,
        isFavorite: story.metadata?.is_favorite ?? false,
        photoUrl: photoUrl,
        photos: photos,
        audioUrl: story.audio_url,
        wisdomTranscription: story.wisdom_text,
        wisdomClipText: story.wisdom_text,
        wisdomClipUrl: story.wisdom_clip_url,
        durationSeconds: story.duration_seconds,
        emotions: story.emotions,
        pivotalCategory: story.metadata?.pivotal_category,
        storyDate: story.metadata?.story_date,
        photoTransform: story.metadata?.photo_transform,
      };
    }));

    return NextResponse.json({ stories: transformedStories });
  } catch (error) {
    console.error("Stories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
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
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Process photos array
    const processedPhotos = (body.photos || []).filter((photo: any) => {
      if (!photo.url && !photo.filePath) return false;
      if (photo.url && photo.url.startsWith('blob:')) {
        return false;
      }
      return true;
    }).map((photo: any) => {
      if (photo.filePath) {
        return {
          ...photo,
          url: photo.filePath
        };
      }
      return photo;
    });

    // Prepare story data for Supabase using actual schema
    // Note: duration_seconds has a check constraint (must be between 1 and 120)
    const duration = body.durationSeconds || 30; // Default to 30 seconds if not provided
    const constrainedDuration = Math.max(1, Math.min(120, duration)); // Ensure between 1-120

    const storyData = {
      user_id: user.id,
      title: body.title || "Untitled Story",
      transcript: body.transcription || body.content,
      year: body.year || body.storyYear,
      audio_url: body.audioUrl && !body.audioUrl.startsWith('blob:') ? body.audioUrl : undefined,
      wisdom_text: body.wisdomClipText || body.wisdomTranscription,
      wisdom_clip_url: body.wisdomClipUrl,
      duration_seconds: constrainedDuration,
      emotions: body.emotions,
      photo_url: body.photoUrl && !body.photoUrl.startsWith('blob:') ? body.photoUrl : undefined,
      is_saved: true,
      metadata: {
        life_age: body.lifeAge || body.age,
        include_in_timeline: body.includeInTimeline ?? true,
        include_in_book: body.includeInBook ?? true,
        is_favorite: body.isFavorite ?? false,
        photos: processedPhotos,
        pivotal_category: body.pivotalCategory,
        story_date: body.storyDate,
        photo_transform: body.photoTransform,
        actual_duration: body.durationSeconds, // Store actual duration in metadata
      }
    };

    // Save the story to Supabase
    const { data: newStory, error: insertError } = await supabaseAdmin
      .from("stories")
      .insert(storyData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating story:", insertError);
      return NextResponse.json(
        { error: "Failed to create story", details: insertError.message },
        { status: 500 }
      );
    }

    // Transform the response
    const transformedStory = {
      id: newStory.id,
      title: newStory.title,
      content: newStory.transcript,
      transcription: newStory.transcript,
      createdAt: newStory.created_at,
      updatedAt: newStory.updated_at,
      year: newStory.year,
      storyYear: newStory.year,
      lifeAge: newStory.metadata?.life_age,
      includeInTimeline: newStory.metadata?.include_in_timeline,
      includeInBook: newStory.metadata?.include_in_book,
      isFavorite: newStory.metadata?.is_favorite,
      photoUrl: newStory.photo_url,
      photos: newStory.metadata?.photos || [],
      audioUrl: newStory.audio_url,
      wisdomTranscription: newStory.wisdom_text,
      wisdomClipText: newStory.wisdom_text,
      wisdomClipUrl: newStory.wisdom_clip_url,
      durationSeconds: newStory.duration_seconds,
      emotions: newStory.emotions,
      pivotalCategory: newStory.metadata?.pivotal_category,
      storyDate: newStory.metadata?.story_date,
      photoTransform: newStory.metadata?.photo_transform,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    console.error("Story creation error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}