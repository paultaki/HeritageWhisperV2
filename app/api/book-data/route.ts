import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Supabase URL needed for building storage URLs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export async function GET(request: NextRequest) {
  try {
    logger.debug("[Book Data API] Request received");

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      logger.debug("[Book Data API] No userId provided");
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    logger.debug("[Book Data API] Fetching stories for userId:", userId);

    // Fetch stories using admin client (bypasses RLS)
    // Note: Database column is 'year' not 'story_year'
    const { data: stories, error } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .order("year", { ascending: true });

    if (error) {
      logger.error("[Book Data API] Supabase error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch stories",
          details: error.message,
        },
        { status: 500 },
      );
    }

    logger.debug("[Book Data API] Found", stories?.length || 0, "stories");

    // Log first story for debugging
    if (stories && stories.length > 0) {
      logger.debug(
        "[Book Data API] Sample story columns:",
        Object.keys(stories[0]),
      );
      logger.debug("[Book Data API] Sample lesson data:", {
        lesson_learned: stories[0].lesson_learned,
        wisdom_clip_text: stories[0].wisdom_clip_text,
      });
      logger.debug("[Book Data API] Sample photo data:", {
        photo_url: stories[0].photo_url,
        top_level_photos: stories[0].photos,
      });
    }

    // Helper to convert relative photo paths to absolute Supabase URLs
    const getAbsolutePhotoUrl = (
      url: string | undefined | null,
    ): string | undefined => {
      if (!url) return undefined;

      // If already absolute URL, return as-is
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }

      // Convert relative path to absolute Supabase storage URL
      return `${supabaseUrl}/storage/v1/object/public/heritage-whisper-files/${url}`;
    };

    // Transform database column names to match expected format
    const transformedStories = (stories || []).map((story) => ({
      id: story.id,
      userId: story.user_id,
      title: story.title,
      audioUrl: story.audio_url,
      transcription: story.transcription,
      storyYear: story.story_year,
      storyDate: story.story_date,
      photoUrl: getAbsolutePhotoUrl(story.photo_url),
      // Photos are stored in top-level photos column
      photos:
        story.photos?.map((photo: any) => ({
          ...photo,
          url:
            getAbsolutePhotoUrl(photo.url || photo.filePath) ||
            photo.url ||
            photo.filePath,
        })) || [],
      // Map lesson (prefer new lesson_learned, fallback to wisdom_clip_text)
      lessonLearned: story.lesson_learned || story.wisdom_clip_text,
      includeInBook: story.include_in_book !== false, // Respect database setting
    }));

    return NextResponse.json({ stories: transformedStories });
  } catch (error) {
    logger.error("Book data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch book data" },
      { status: 500 },
    );
  }
}
