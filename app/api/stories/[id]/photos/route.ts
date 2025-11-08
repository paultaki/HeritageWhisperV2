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

// GET all photos for a story
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

    // Get the story from Supabase database to verify ownership
    const { data: story, error: fetchError } = await supabaseAdmin
      .from("stories")
      .select("metadata, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !story) {
      return NextResponse.json(
        { error: "Story not found or unauthorized" },
        { status: 404 },
      );
    }

    // Get signed URLs for all photos from metadata
    const photos = story.metadata?.photos || [];
    const photosWithSignedUrls = await Promise.all(
      photos.map(async (photo: any) => {
        let masterUrl = photo.masterUrl;
        let displayUrl = photo.displayUrl;

        // Generate signed URLs for new dual-path photos
        if (photo.masterPath && !photo.masterPath.startsWith("http")) {
          const { data: masterSignedData } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(photo.masterPath, 3600); // 1 hour expiry
          masterUrl = masterSignedData?.signedUrl || photo.masterPath;
        }

        if (photo.displayPath && !photo.displayPath.startsWith("http")) {
          const { data: displaySignedData } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(photo.displayPath, 3600);
          displayUrl = displaySignedData?.signedUrl || photo.displayPath;
        }

        // Fallback to old single-path for backward compatibility
        if (!displayUrl && photo.url && !photo.url.startsWith("http")) {
          const photoPath = photo.url.startsWith("photo/")
            ? photo.url
            : `photo/${photo.url}`;
          const { data: signedUrlData } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(photoPath, 3600);
          displayUrl = signedUrlData?.signedUrl || photo.url;
        }

        return {
          ...photo,
          masterUrl,
          displayUrl,
          // DEPRECATED (backward compatibility):
          url: displayUrl || photo.url,
        };
      }),
    );

    return NextResponse.json({ photos: photosWithSignedUrls });
  } catch (error) {
    logger.error("Photos fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 },
    );
  }
}

// POST add a new photo to a story
export async function POST(
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
    const { masterPath, displayPath, filePath, isHero, transform } = body;

    // REMOVED: Sensitive data logging - console.log('[POST /api/stories/[id]/photos] Request body:', body);

    // Require at least display path (or filePath for backward compatibility)
    if (!displayPath && !filePath) {
      return NextResponse.json(
        { error: "Display path or file path is required" },
        { status: 400 },
      );
    }

    // Get the story from Supabase database to verify ownership and get current photos
    const { data: story, error: fetchError } = await supabaseAdmin
      .from("stories")
      .select("metadata, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !story) {
      logger.error(
        "[POST /api/stories/[id]/photos] Story fetch error:",
        fetchError,
      );
      return NextResponse.json(
        { error: "Story not found or unauthorized" },
        { status: 404 },
      );
    }

    logger.debug(
      "[POST /api/stories/[id]/photos] Current story metadata:",
      story.metadata,
    );

    // Create new photo object - store the PATHS, not signed URLs
    const newPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      masterPath: masterPath || undefined,
      displayPath: displayPath || undefined,
      // DEPRECATED (backward compatibility):
      url: displayPath || filePath,
      filePath: displayPath || filePath,
      transform: transform || { zoom: 1, position: { x: 0, y: 0 } },
      isHero: isHero || false,
      caption: "",
    };

    logger.debug("[POST /api/stories/[id]/photos] New photo object:", newPhoto);

    // Get current photos from metadata
    const currentPhotos = story.metadata?.photos || [];
    logger.debug(
      "[POST /api/stories/[id]/photos] Current photos count:",
      currentPhotos.length,
    );

    // If this is marked as hero, unmark other photos
    const updatedPhotos = isHero
      ? [...currentPhotos.map((p: any) => ({ ...p, isHero: false })), newPhoto]
      : [...currentPhotos, newPhoto];

    logger.debug(
      "[POST /api/stories/[id]/photos] Updated photos count:",
      updatedPhotos.length,
    );
    logger.debug(
      "[POST /api/stories/[id]/photos] Updated photos array:",
      updatedPhotos,
    );

    // Update story metadata with new photos array in Supabase database
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from("stories")
      .update({
        metadata: {
          ...story.metadata,
          photos: updatedPhotos,
        },
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedStory) {
      logger.error(
        "[POST /api/stories/[id]/photos] Update error:",
        updateError,
      );
      return NextResponse.json(
        { error: "Failed to add photo to story" },
        { status: 500 },
      );
    }

    logger.debug(
      "[POST /api/stories/[id]/photos] Story updated successfully. New metadata:",
      updatedStory.metadata,
    );

    // Generate signed URLs for both master and display versions
    let masterUrl, displayUrl;

    if (masterPath) {
      const { data: masterSignedData } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(masterPath, 604800); // 1 week expiry
      masterUrl = masterSignedData?.signedUrl || masterPath;
    }

    if (displayPath) {
      const { data: displaySignedData } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(displayPath, 604800);
      displayUrl = displaySignedData?.signedUrl || displayPath;
    }

    // Fallback for backward compatibility
    if (!displayUrl && filePath) {
      const photoPath = filePath.startsWith("photo/")
        ? filePath
        : `photo/${filePath}`;
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(photoPath, 604800);
      displayUrl = signedUrlData?.signedUrl || filePath;
    }

    const photoWithSignedUrl = {
      ...newPhoto,
      masterUrl,
      displayUrl,
      // DEPRECATED (backward compatibility):
      url: displayUrl,
      filePath: displayPath || filePath,
    };

    return NextResponse.json({ photo: photoWithSignedUrl });
  } catch (error) {
    logger.error("Photo add error:", error);
    return NextResponse.json({ error: "Failed to add photo" }, { status: 500 });
  }
}
