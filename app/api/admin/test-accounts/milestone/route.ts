/**
 * POST /api/admin/test-accounts/milestone
 * Sets a test account to a specific milestone (story count)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const { userId, storyCount } = await request.json();

    if (!userId || !storyCount) {
      return NextResponse.json({ error: "userId and storyCount are required" }, { status: 400 });
    }

    // Set milestone using SQL function
    const { data, error: milestoneError } = await supabaseAdmin.rpc("set_user_story_milestone", {
      target_user_id: userId,
      target_story_count: storyCount,
    });

    if (milestoneError) {
      logger.error("Error setting milestone:", milestoneError);
      return NextResponse.json(
        { error: milestoneError.message || "Failed to set milestone" },
        { status: 500 }
      );
    }

    const result = data?.[0];
    
    return NextResponse.json({
      success: true,
      visible_stories: result?.visible_stories,
      hidden_stories: result?.hidden_stories,
    });

  } catch (err) {
    logger.error("Error in POST /api/admin/test-accounts/milestone:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
