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

    // Fetch stories from Supabase
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("story_year", { ascending: false })
      .order("created_at", { ascending: false });

    if (storiesError) {
      console.error("Error fetching stories:", storiesError);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 }
      );
    }

    // Helper function to generate public URLs for photos
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs - these are invalid temporary URLs
      if (photoUrl.startsWith('blob:')) {
        console.warn('Blob URL found in database - this should not happen:', photoUrl);
        return null;
      }

      // If already a full URL (starts with http/https), use as-is
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
      }

      // Generate signed URL for storage path (valid for 1 week)
      // Using signed URLs instead of public URLs for better security
      const { data, error } = await supabaseAdmin.storage
        .from('photos')
        .createSignedUrl(photoUrl, 604800); // 1 week in seconds

      if (error) {
        console.error('Error creating signed URL for photo:', photoUrl, error);
        // Fallback to public URL
        const { data: publicData } = supabaseAdmin.storage
          .from('photos')
          .getPublicUrl(photoUrl);
        return publicData?.publicUrl || null;
      }

      return data?.signedUrl || null;
    };

    // Transform snake_case to camelCase for frontend compatibility
    // Also generate public URLs for all photos
    const transformedStories = await Promise.all((stories || []).map(async (story) => {
      // Process photos array to add public URLs and filter out invalid ones
      const photosWithUrls = await Promise.all(
        (story.photos || []).map(async (photo: any) => ({
          ...photo,
          url: await getPhotoUrl(photo.url)
        }))
      );
      const filteredPhotos = photosWithUrls.filter((photo: any) => photo.url !== null);

      // Process legacy photoUrl if exists
      const publicPhotoUrl = story.photo_url ? await getPhotoUrl(story.photo_url) : undefined;

      return {
        id: story.id,
        title: story.title,
        content: story.content || story.transcription,
        createdAt: story.created_at,
        updatedAt: story.updated_at,
        age: story.age || story.life_age,
        year: story.story_year,
        storyYear: story.story_year,
        lifeAge: story.life_age,
        includeInTimeline: story.include_in_timeline ?? true,
        includeInBook: story.include_in_book ?? true,
        isFavorite: story.is_favorite ?? false,
        photoUrl: publicPhotoUrl,
        hasPhotos: story.has_photos ?? false,
        photos: filteredPhotos,
        audioUrl: story.audio_url,
        transcription: story.transcription,
        wisdomTranscription: story.wisdom_transcription || story.wisdom_clip_text,
        wisdomClipText: story.wisdom_clip_text,
        followUpQuestions: story.follow_up_questions,
        wisdomClipUrl: story.wisdom_clip_url,
        durationSeconds: story.duration_seconds,
        emotions: story.emotions,
        pivotalCategory: story.pivotal_category,
        storyDate: story.story_date,
        photoTransform: story.photo_transform,
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

    // Process photos array - use filePath if available, otherwise extract from URL
    const processedPhotos = (body.photos || []).filter((photo: any) => {
      if (!photo.url && !photo.filePath) return false;
      // Skip blob URLs - these are invalid temporary URLs
      if (photo.url && photo.url.startsWith('blob:')) {
        console.warn('Blob URL found in photos array - filtering out:', photo.url);
        return false;
      }
      return true;
    }).map((photo: any) => {
      // If we have a filePath, use it as the url (for storage)
      if (photo.filePath) {
        return {
          ...photo,
          url: photo.filePath // Store the path, not the signed URL
        };
      }

      // If the URL is a signed Supabase URL, extract the path
      if (photo.url && photo.url.includes('supabase.co/storage/v1/object/sign/')) {
        // Extract the path from the signed URL
        const urlParts = photo.url.split('/');
        const pathStartIndex = urlParts.indexOf('photos') + 1;
        if (pathStartIndex > 0 && pathStartIndex < urlParts.length) {
          const filePath = urlParts.slice(pathStartIndex).join('/').split('?')[0];
          return {
            ...photo,
            url: `${decodeURIComponent(filePath)}` // Store the extracted path
          };
        }
      }

      // Otherwise keep the photo as-is (might be a path already)
      return photo;
    });

    // Prepare story data for Supabase (using snake_case)
    // Note: The database schema has 'transcription' field, not 'content'
    // Also note: formatted_content column doesn't exist in production DB
    const storyData: any = {
      user_id: user.id,
      title: body.title,
      transcription: body.transcription || body.content, // Main text field
      life_age: body.lifeAge || body.age,
      story_year: body.year || body.storyYear,
      include_in_timeline: body.includeInTimeline ?? true,
      include_in_book: body.includeInBook ?? true,
      is_favorite: body.isFavorite ?? false,
      photo_url: body.photoUrl && !body.photoUrl.startsWith('blob:') ? body.photoUrl : undefined,
      photos: processedPhotos,
      audio_url: body.audioUrl,
      wisdom_clip_text: body.wisdomClipText || body.wisdomTranscription,
      wisdom_clip_url: body.wisdomClipUrl,
      duration_seconds: body.durationSeconds || 0,
      emotions: body.emotions,
      pivotal_category: body.pivotalCategory,
      story_date: body.storyDate,
      photo_transform: body.photoTransform,
    };

    // Don't add formatted_content - column doesn't exist in production
    // This data can be generated on the fly when needed

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

    // Update user's story count - first get current count
    const { data: userData, error: getUserError } = await supabaseAdmin
      .from("users")
      .select("story_count")
      .eq("id", user.id)
      .single();

    if (!getUserError && userData) {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          story_count: (userData.story_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating story count:", updateError);
        // Don't fail the request, story was created successfully
      }
    }

    // Helper function to generate signed URLs for photos (same as in GET)
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs - these are invalid temporary URLs
      if (photoUrl.startsWith('blob:')) {
        console.warn('Blob URL found in database - this should not happen:', photoUrl);
        return null;
      }

      // If already a full URL (starts with http/https), use as-is
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
      }

      // Generate signed URL for storage path (valid for 1 week)
      const { data, error } = await supabaseAdmin.storage
        .from('photos')
        .createSignedUrl(photoUrl, 604800); // 1 week in seconds

      if (error) {
        console.error('Error creating signed URL for photo:', photoUrl, error);
        // Fallback to public URL
        const { data: publicData } = supabaseAdmin.storage
          .from('photos')
          .getPublicUrl(photoUrl);
        return publicData?.publicUrl || null;
      }

      return data?.signedUrl || null;
    };

    // Process photos array to add signed URLs
    const photosWithUrls = await Promise.all(
      (newStory.photos || []).map(async (photo: any) => ({
        ...photo,
        url: await getPhotoUrl(photo.url)
      }))
    );
    const filteredPhotos = photosWithUrls.filter((photo: any) => photo.url !== null);

    // Process legacy photoUrl if exists
    const publicPhotoUrl = newStory.photo_url ? await getPhotoUrl(newStory.photo_url) : undefined;

    // Transform the response to camelCase
    const transformedStory = {
      id: newStory.id,
      title: newStory.title,
      content: newStory.content || newStory.transcription,
      createdAt: newStory.created_at,
      updatedAt: newStory.updated_at,
      age: newStory.age || newStory.life_age,
      year: newStory.story_year,
      storyYear: newStory.story_year,
      includeInTimeline: newStory.include_in_timeline,
      includeInBook: newStory.include_in_book,
      isFavorite: newStory.is_favorite,
      photoUrl: publicPhotoUrl,
      hasPhotos: newStory.has_photos,
      formattedContent: newStory.formatted_content,
      photos: filteredPhotos, // Use photos with signed URLs
      audioUrl: newStory.audio_url,
      transcription: newStory.transcription,
      wisdomTranscription: newStory.wisdom_transcription || newStory.wisdom_clip_text,
      followUpQuestions: newStory.follow_up_questions,
      wisdomClipUrl: newStory.wisdom_clip_url,
      durationSeconds: newStory.duration_seconds,
      emotions: newStory.emotions,
      pivotalCategory: newStory.pivotal_category,
      storyDate: newStory.story_date,
      photoTransform: newStory.photo_transform,
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