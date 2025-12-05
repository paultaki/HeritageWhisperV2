import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/stories/stats - Get story statistics for user
export async function GET(request: NextRequest) {
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
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }
      userId = user.id;
    }

    logger.api("Fetching story stats for user:", userId);

    // Get all user stories using Supabase client
    const { data: userStories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("id, duration_seconds, include_in_timeline, include_in_book, year")
      .eq("user_id", userId);

    if (storiesError) {
      logger.error("Error fetching stories from database:", {
        error: storiesError,
        message: storiesError.message,
        details: storiesError.details,
        hint: storiesError.hint,
        code: storiesError.code,
      });
      return NextResponse.json(
        {
          error: "Failed to fetch stories from database",
          details: storiesError.message,
          code: storiesError.code,
        },
        { status: 500 },
      );
    }

    // Calculate total recording time
    const totalSeconds = (userStories || []).reduce((acc, story) => {
      return acc + (story.duration_seconds || 0);
    }, 0);

    // Count shared stories (check visibility settings)
    const sharedCount = (userStories || []).filter((story) => {
      return story.include_in_timeline || story.include_in_book;
    }).length;

    // Map stories to minimal format for Memory Map
    const storiesForMap = (userStories || []).map((story) => ({
      id: story.id,
      story_year: story.year, // Database column is 'year', API returns as 'story_year'
    }));

    return NextResponse.json({
      totalSeconds,
      sharedCount,
      familyMembers: 0, // Family members feature not yet implemented
      stories: storiesForMap, // Include stories for Memory Map
    });
  } catch (error) {
    logger.error("Story stats fetch error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch story stats",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    );
  }
}
