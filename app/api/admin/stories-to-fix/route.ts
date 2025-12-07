import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // Validate session
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

    // Fetch ALL stories with 1-second duration that have audio
    // Using service role key bypasses RLS - admin only endpoint
    const { data: stories, error } = await supabaseAdmin
      .from("stories")
      .select("id, title, audio_url, duration_seconds, user_id, created_at")
      .eq("duration_seconds", 1)
      .not("audio_url", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching stories to fix:", error);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 }
      );
    }

    logger.info(`Found ${stories?.length || 0} stories with 1-second duration`);

    // Transform to camelCase
    const transformed = (stories || []).map((story) => ({
      id: story.id,
      title: story.title,
      audioUrl: story.audio_url,
      durationSeconds: story.duration_seconds,
    }));

    return NextResponse.json({ stories: transformed });
  } catch (error) {
    logger.error("Error in GET /api/admin/stories-to-fix:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
