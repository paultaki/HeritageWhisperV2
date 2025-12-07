import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Admin endpoint to fix audio duration for any story
// Uses service role key to bypass RLS
export async function POST(request: NextRequest) {
  try {
    // Validate session (any logged-in user for now - you can add admin check later)
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { storyId, durationSeconds } = body;

    if (!storyId || typeof durationSeconds !== "number") {
      return NextResponse.json(
        { error: "storyId and durationSeconds are required" },
        { status: 400 }
      );
    }

    if (durationSeconds < 1 || durationSeconds > 3600) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 3600 seconds" },
        { status: 400 }
      );
    }

    // Update the story using service role key (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("stories")
      .update({ duration_seconds: durationSeconds })
      .eq("id", storyId)
      .select("id, title, duration_seconds")
      .single();

    if (error) {
      logger.error("Error updating story duration:", error);
      return NextResponse.json(
        { error: "Failed to update story" },
        { status: 500 }
      );
    }

    logger.info(`Admin fixed duration for story ${storyId}: ${durationSeconds}s`);

    return NextResponse.json({
      success: true,
      story: {
        id: data.id,
        title: data.title,
        durationSeconds: data.duration_seconds,
      },
    });
  } catch (error) {
    logger.error("Error in POST /api/admin/fix-duration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
