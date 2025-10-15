/**
 * POST /api/admin/test-accounts/milestone
 * Sets a test account to a specific milestone (story count)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";

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
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    const { userId, storyCount } = await request.json();

    if (!userId || !storyCount) {
      return NextResponse.json({ error: "userId and storyCount are required" }, { status: 400 });
    }

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'set_user_milestone',
      targetUserId: userId,
      details: { storyCount },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

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
