import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, familyActivity, familyMembers, stories } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET /api/family/activity - Get family activity feed
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

    logger.api("Fetching family activity for user:", user.id);

    // Get activity with joins (simplified version - in production use proper joins)
    const activities = await db
      .select()
      .from(familyActivity)
      .where(eq(familyActivity.userId, user.id))
      .orderBy(desc(familyActivity.createdAt))
      .limit(50);

    // Enrich with family member and story data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const [member] = await db
          .select()
          .from(familyMembers)
          .where(eq(familyMembers.id, activity.familyMemberId))
          .limit(1);

        let storyTitle = "Unknown Story";
        if (activity.storyId) {
          const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, activity.storyId))
            .limit(1);

          if (story) {
            storyTitle = story.title;
          }
        }

        return {
          id: activity.id,
          familyMember: member,
          storyTitle,
          activityType: activity.activityType,
          details: activity.details,
          createdAt: activity.createdAt?.toISOString() || new Date().toISOString(),
        };
      })
    );

    return NextResponse.json(enrichedActivities);

  } catch (error) {
    logger.error("Family activity fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch family activity", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
