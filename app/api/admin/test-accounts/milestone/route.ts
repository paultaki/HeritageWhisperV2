/**
 * POST /api/admin/test-accounts/milestone
 * Sets a test account to a specific milestone (story count)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";
import { validateUUID, validateInteger } from "@/lib/inputValidation";

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

    // SECURITY: Validate and sanitize inputs
    const userIdValidation = validateUUID(userId, 'userId');
    if (!userIdValidation.valid) {
      return NextResponse.json({ error: userIdValidation.error }, { status: 400 });
    }

    const storyCountValidation = validateInteger(storyCount, 'storyCount', 1, 1000);
    if (!storyCountValidation.valid) {
      return NextResponse.json({ error: storyCountValidation.error }, { status: 400 });
    }

    const sanitizedUserId = userIdValidation.sanitized;
    const sanitizedStoryCount = storyCountValidation.sanitized;

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'set_user_milestone',
      targetUserId: sanitizedUserId,
      details: { storyCount: sanitizedStoryCount },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Set milestone using SQL function
    const { data, error: milestoneError } = await supabaseAdmin.rpc("set_user_story_milestone", {
      target_user_id: sanitizedUserId,
      target_story_count: sanitizedStoryCount,
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
