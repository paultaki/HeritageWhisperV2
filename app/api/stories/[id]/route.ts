import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { UpdateStorySchema, safeValidateRequestBody } from "@/lib/validationSchemas";
import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET single story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  try {
    let userId: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
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
      userId = user.id;
    }

    // Fetch the story from Supabase database
    const { data: story, error: fetchError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
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

    // Process photos array from top-level photos column
    let photos = [];
    if (story.photos) {
      logger.debug(
        "[GET /api/stories/[id]] Raw photos from DB:",
        story.photos,
      );
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

          logger.debug(
            "[GET /api/stories/[id]] Photo paths:",
            { display: photo.displayPath, master: photo.masterPath, legacy: photo.url || photo.filePath },
            "-> Signed URLs:",
            { displayUrl, masterUrl, legacyUrl },
          );

          return {
            ...photo,
            displayUrl,
            masterUrl,
            url: displayUrl || legacyUrl, // Primary display uses 550px WebP
            filePath: photo.displayPath || photo.url || photo.filePath,
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
      content: story.transcription,
      transcription: story.transcription,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      year: story.story_year,
      storyYear: story.story_year,
      includeInTimeline: story.include_in_timeline ?? true,
      includeInBook: story.include_in_book ?? true,
      isFavorite: story.is_favorite ?? false,
      photoUrl: photoUrl,
      photos: photos,
      audioUrl: story.audio_url,
      wisdomTranscription: story.wisdom_clip_text,
      wisdomClipText: story.wisdom_clip_text,
      wisdomClipUrl: story.wisdom_clip_url,
      durationSeconds: story.duration_seconds,
      emotions: story.emotions,
      storyDate: story.story_date,
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
    let userId: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
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
      userId = user.id;
    }

    // Parse and validate request body
    const rawBody = await request.json();

    // Add the story ID to the body for validation
    const bodyWithId = { ...rawBody, id };

    // Validate input with Zod schema
    const validationResult = safeValidateRequestBody(UpdateStorySchema, bodyWithId);

    if (!validationResult.success) {
      // Format validation errors for user-friendly response
      const errorMessages = validationResult.error?.issues?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ field: 'unknown', message: 'Validation failed' }];

      logger.warn('[PUT /api/stories/[id]] Validation failed:', errorMessages);

      return NextResponse.json(
        {
          error: 'Invalid story data',
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    // Use validated data
    const body = validationResult.data;

    // First, fetch the existing story to get current values
    logger.debug(`[PUT /api/stories/${id}] Fetching story for user:`, userId);
    const { data: existingStory, error: fetchError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingStory) {
      logger.error("Story fetch error:", {
        storyId: id,
        userId: userId,
        error: fetchError,
        message: fetchError?.message,
        code: fetchError?.code
      });
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
      storyData.transcription = body.transcription || body.content;
    }
    if (body.year !== undefined || body.storyYear !== undefined) {
      storyData.story_year = body.year || body.storyYear;
    }
    if (body.storyDate !== undefined) {
      storyData.story_date = body.storyDate || null; // Store full date with month/day
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
      storyData.wisdom_clip_text =
        body.wisdomClipText !== undefined
          ? body.wisdomClipText
          : body.wisdomTranscription;
      logger.debug(
        "[PUT /api/stories/[id]] Updating wisdom_clip_text to:",
        storyData.wisdom_clip_text,
      );
    }
    if (body.wisdomClipUrl !== undefined)
      storyData.wisdom_clip_url = body.wisdomClipUrl;
    if (body.durationSeconds !== undefined) {
      // Duration validated by UpdateStorySchema (1-600 seconds)
      storyData.duration_seconds = body.durationSeconds;
    }
    if (body.emotions !== undefined) storyData.emotions = body.emotions;
    if (body.photoUrl !== undefined) {
      storyData.photo_url =
        body.photoUrl && !body.photoUrl.startsWith("blob:")
          ? body.photoUrl
          : null;
    }

    // Update individual columns (no metadata JSONB column exists)
    if (body.includeInTimeline !== undefined) {
      storyData.include_in_timeline = body.includeInTimeline;
    }
    if (body.includeInBook !== undefined) {
      storyData.include_in_book = body.includeInBook;
    }
    if (body.isFavorite !== undefined) {
      storyData.is_favorite = body.isFavorite;
    }
    if (processedPhotos !== undefined) {
      storyData.photos = processedPhotos;
    }
    if (body.storyDate !== undefined) {
      storyData.story_date = body.storyDate;
    }

    // Update the story in Supabase database
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from("stories")
      .update(storyData)
      .eq("id", id)
      .eq("user_id", userId)
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

    // Process photos array from top-level photos column
    let photos = [];
    if (updatedStory.photos) {
      photos = await Promise.all(
        (updatedStory.photos || []).map(async (photo: any) => ({
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
      content: updatedStory.transcription,
      transcription: updatedStory.transcription,
      createdAt: updatedStory.created_at,
      updatedAt: updatedStory.updated_at,
      year: updatedStory.story_year,
      storyYear: updatedStory.story_year,
      includeInTimeline: updatedStory.include_in_timeline ?? true,
      includeInBook: updatedStory.include_in_book ?? true,
      isFavorite: updatedStory.is_favorite ?? false,
      photoUrl: photoUrl,
      photos: photos,
      audioUrl: updatedStory.audio_url,
      wisdomTranscription: updatedStory.wisdom_clip_text,
      wisdomClipText: updatedStory.wisdom_clip_text,
      wisdomClipUrl: updatedStory.wisdom_clip_url,
      durationSeconds: updatedStory.duration_seconds,
      emotions: updatedStory.emotions,
      storyDate: updatedStory.story_date,
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
    let userId: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
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
      userId = user.id;
    }

    // Delete the story from Supabase database
    const { error: deleteError } = await supabaseAdmin
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

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
