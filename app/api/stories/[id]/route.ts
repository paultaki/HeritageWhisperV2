import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET single story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
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
        { status: 401 },
      );
    }

    // Fetch the story from Supabase database
    const { data: story, error: fetchError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Helper function to generate signed URLs for photos
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs
      if (photoUrl.startsWith("blob:")) {
        return null;
      }

      // If already a full URL (starts with http/https), use as-is
      if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
        return photoUrl;
      }

      // Generate signed URL for storage path (valid for 1 week)
      const { data, error } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(
          photoUrl.startsWith("photo/") ? photoUrl : `photo/${photoUrl}`,
          604800,
        );

      if (error) {
        logger.error("Error creating signed URL for photo:", photoUrl, error);
        return null;
      }

      return data?.signedUrl || null;
    };

    // Process photos array from metadata
    let photos = [];
    if (story.metadata?.photos) {
      logger.debug(
        "[GET /api/stories/[id]] Raw photos from DB:",
        story.metadata.photos,
      );
      photos = await Promise.all(
        (story.metadata.photos || []).map(async (photo: any) => {
          const photoPath = photo.url || photo.filePath;
          const signedUrl = await getPhotoUrl(photoPath);
          logger.debug(
            "[GET /api/stories/[id]] Photo path:",
            photoPath,
            "-> Signed URL:",
            signedUrl,
          );
          return {
            ...photo,
            url: signedUrl,
            filePath: photoPath, // Preserve the storage path
          };
        }),
      );
      logger.debug("[GET /api/stories/[id]] Processed photos:", photos);
    }

    // Process legacy photoUrl if exists
    const photoUrl = story.photo_url
      ? await getPhotoUrl(story.photo_url)
      : null;

    // Transform to frontend-compatible format (from Supabase snake_case to camelCase)
    const transformedStory = {
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

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    logger.error("Story fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 },
    );
  }
}

// PUT update story
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
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
        { status: 401 },
      );
    }

    const body = await request.json();

    // First, fetch the existing story to get current values
    const { data: existingStory, error: fetchError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingStory) {
      logger.error("Story fetch error:", fetchError);
      return NextResponse.json(
        { error: "Story not found or unauthorized" },
        { status: 404 },
      );
    }

    // Process photos array - use filePath if available, otherwise extract from URL
    const processedPhotos =
      body.photos !== undefined
        ? (body.photos || [])
            .filter((photo: any) => {
              if (!photo.url && !photo.filePath) return false;
              // Skip blob URLs - these are invalid temporary URLs
              if (photo.url && photo.url.startsWith("blob:")) {
                logger.warn(
                  "Blob URL found in photos array - filtering out:",
                  photo.url,
                );
                return false;
              }
              return true;
            })
            .map((photo: any) => {
              // If we have a filePath, use it as the url (for storage)
              if (photo.filePath) {
                return {
                  ...photo,
                  url: photo.filePath, // Store the path, not the signed URL
                };
              }

              // If the URL is a signed Supabase URL, extract the path
              if (
                photo.url &&
                photo.url.includes("supabase.co/storage/v1/object/sign/")
              ) {
                // Extract the path from the signed URL
                const urlParts = photo.url.split("/");
                const pathStartIndex = urlParts.indexOf("photo") + 1;
                if (pathStartIndex > 0 && pathStartIndex < urlParts.length) {
                  const filePath = urlParts
                    .slice(pathStartIndex)
                    .join("/")
                    .split("?")[0];
                  return {
                    ...photo,
                    url: decodeURIComponent(filePath), // Store the extracted path
                  };
                }
              }

              // Otherwise keep the photo as-is (might be a path already)
              return photo;
            })
        : undefined;

    // Build update object - only include fields that were actually sent
    const storyData: any = {};

    // Only update fields that are explicitly provided in the request body
    if (body.title !== undefined) storyData.title = body.title;
    if (body.transcription !== undefined || body.content !== undefined) {
      storyData.transcript = body.transcription || body.content;
    }
    if (body.year !== undefined || body.storyYear !== undefined) {
      storyData.year = body.year || body.storyYear;
    }
    if (body.audioUrl !== undefined) {
      storyData.audio_url =
        body.audioUrl && !body.audioUrl.startsWith("blob:")
          ? body.audioUrl
          : null;
    }
    if (
      body.wisdomClipText !== undefined ||
      body.wisdomTranscription !== undefined
    ) {
      // Allow empty string to clear the lesson learned
      storyData.wisdom_text =
        body.wisdomClipText !== undefined
          ? body.wisdomClipText
          : body.wisdomTranscription;
      logger.debug(
        "[PUT /api/stories/[id]] Updating wisdom_text to:",
        storyData.wisdom_text,
      );
    }
    if (body.wisdomClipUrl !== undefined)
      storyData.wisdom_clip_url = body.wisdomClipUrl;
    if (body.durationSeconds !== undefined) {
      storyData.duration_seconds = Math.max(
        1,
        Math.min(120, body.durationSeconds || 30),
      );
    }
    if (body.emotions !== undefined) storyData.emotions = body.emotions;
    if (body.photoUrl !== undefined) {
      storyData.photo_url =
        body.photoUrl && !body.photoUrl.startsWith("blob:")
          ? body.photoUrl
          : null;
    }

    // Always set is_saved to true for updates
    storyData.is_saved = true;

    // Build metadata object - merge with existing metadata
    const metadata = { ...existingStory.metadata };

    if (body.lifeAge !== undefined || body.age !== undefined) {
      metadata.life_age = body.lifeAge || body.age;
    }
    if (body.includeInTimeline !== undefined) {
      metadata.include_in_timeline = body.includeInTimeline;
    }
    if (body.includeInBook !== undefined) {
      metadata.include_in_book = body.includeInBook;
    }
    if (body.isFavorite !== undefined) {
      metadata.is_favorite = body.isFavorite;
    }
    if (processedPhotos !== undefined) {
      metadata.photos = processedPhotos;
    }
    if (body.pivotalCategory !== undefined) {
      metadata.pivotal_category = body.pivotalCategory;
    }
    if (body.storyDate !== undefined) {
      metadata.story_date = body.storyDate;
    }
    if (body.photoTransform !== undefined) {
      metadata.photo_transform = body.photoTransform;
    }

    // Only update metadata if we have changes
    if (Object.keys(metadata).length > 0) {
      storyData.metadata = metadata;
    }

    // Update the story in Supabase database
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from("stories")
      .update(storyData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedStory) {
      logger.error("Story update error:", updateError);
      return NextResponse.json(
        { error: "Story not found or unauthorized" },
        { status: 404 },
      );
    }

    // Helper function to generate signed URLs for photos (reuse from GET)
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs
      if (photoUrl.startsWith("blob:")) {
        return null;
      }

      // If already a full URL (starts with http/https), use as-is
      if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
        return photoUrl;
      }

      // Generate signed URL for storage path (valid for 1 week)
      const { data, error } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(
          photoUrl.startsWith("photo/") ? photoUrl : `photo/${photoUrl}`,
          604800,
        );

      if (error) {
        logger.error("Error creating signed URL for photo:", photoUrl, error);
        return null;
      }

      return data?.signedUrl || null;
    };

    // Process photos array from metadata
    let photos = [];
    if (updatedStory.metadata?.photos) {
      photos = await Promise.all(
        (updatedStory.metadata.photos || []).map(async (photo: any) => ({
          ...photo,
          url: await getPhotoUrl(photo.url || photo.filePath),
        })),
      );
    }

    // Process legacy photoUrl if exists
    const photoUrl = updatedStory.photo_url
      ? await getPhotoUrl(updatedStory.photo_url)
      : null;

    // Transform the response (from Supabase snake_case to camelCase)
    const transformedStory = {
      id: updatedStory.id,
      title: updatedStory.title || "Untitled Story",
      content: updatedStory.transcript,
      transcription: updatedStory.transcript,
      createdAt: updatedStory.created_at,
      updatedAt: updatedStory.updated_at,
      age: updatedStory.metadata?.life_age || updatedStory.metadata?.age,
      year: updatedStory.year,
      storyYear: updatedStory.year,
      lifeAge: updatedStory.metadata?.life_age,
      includeInTimeline: updatedStory.metadata?.include_in_timeline ?? true,
      includeInBook: updatedStory.metadata?.include_in_book ?? true,
      isFavorite: updatedStory.metadata?.is_favorite ?? false,
      photoUrl: photoUrl,
      photos: photos,
      audioUrl: updatedStory.audio_url,
      wisdomTranscription: updatedStory.wisdom_text,
      wisdomClipText: updatedStory.wisdom_text,
      wisdomClipUrl: updatedStory.wisdom_clip_url,
      durationSeconds: updatedStory.duration_seconds,
      emotions: updatedStory.emotions,
      pivotalCategory: updatedStory.metadata?.pivotal_category,
      storyDate: updatedStory.metadata?.story_date,
      photoTransform: updatedStory.metadata?.photo_transform,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    logger.error("Story update error:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 },
    );
  }
}

// DELETE story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
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
        { status: 401 },
      );
    }

    // Delete the story from Supabase database
    const { error: deleteError } = await supabaseAdmin
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("Story deletion error:", deleteError);
      return NextResponse.json(
        { error: "Story not found or already deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Story deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 },
    );
  }
}
