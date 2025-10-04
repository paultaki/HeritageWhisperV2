import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, stories } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET /api/stories/stats - Get story statistics for user
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
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    logger.api("Fetching story stats for user:", user.id);

    // Get all user stories
    const userStories = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, user.id));

    // Calculate total recording time
    const totalSeconds = userStories.reduce((acc, story) => {
      return acc + (story.durationSeconds || 0);
    }, 0);

    // Count shared stories (check metadata for visibility settings)
    const sharedCount = userStories.filter((story) => {
      const metadata = story.metadata as any;
      return metadata?.includeInTimeline || metadata?.includeInBook;
    }).length;

    return NextResponse.json({
      totalSeconds,
      sharedCount,
      familyMembers: 0, // Family members feature not yet implemented
    });

  } catch (error) {
    logger.error("Story stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch story stats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
