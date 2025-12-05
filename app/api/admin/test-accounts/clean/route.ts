/**
 * POST /api/admin/test-accounts/clean
 * Cleans all prompts and character evolution for a test account
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";
import { validateUUID } from "@/lib/inputValidation";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    const { userId } = await request.json();

    // SECURITY: Validate and sanitize inputs
    const userIdValidation = validateUUID(userId, 'userId');
    if (!userIdValidation.valid) {
      return NextResponse.json({ error: userIdValidation.error }, { status: 400 });
    }

    const sanitizedUserId = userIdValidation.sanitized;

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'clean_test_prompts',
      targetUserId: sanitizedUserId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Clean prompts using SQL function
    const { data, error: cleanError } = await supabaseAdmin.rpc("clean_test_prompts", {
      target_user_id: sanitizedUserId,
    });

    if (cleanError) {
      logger.error("Error cleaning prompts:", cleanError);
      return NextResponse.json(
        { error: cleanError.message || "Failed to clean prompts" },
        { status: 500 }
      );
    }

    const result = data?.[0];
    
    return NextResponse.json({
      success: true,
      active_deleted: result?.active_prompts_deleted || 0,
      history_deleted: result?.prompt_history_deleted || 0,
      evolution_deleted: result?.character_evolution_deleted || 0,
    });

  } catch (err) {
    logger.error("Error in POST /api/admin/test-accounts/clean:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
