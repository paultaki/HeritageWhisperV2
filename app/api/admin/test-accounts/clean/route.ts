/**
 * POST /api/admin/test-accounts/clean
 * Cleans all prompts and character evolution for a test account
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'clean_test_prompts',
      targetUserId: userId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Clean prompts using SQL function
    const { data, error: cleanError } = await supabaseAdmin.rpc("clean_test_prompts", {
      target_user_id: userId,
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
