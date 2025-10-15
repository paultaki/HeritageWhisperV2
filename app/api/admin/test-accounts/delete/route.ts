/**
 * POST /api/admin/test-accounts/delete
 * Deletes a test account and all associated data
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";
import { validateUUID, validateEmail } from "@/lib/inputValidation";

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

    const { userId, confirmEmail } = await request.json();

    // SECURITY: Validate and sanitize inputs
    const userIdValidation = validateUUID(userId, 'userId');
    if (!userIdValidation.valid) {
      return NextResponse.json({ error: userIdValidation.error }, { status: 400 });
    }

    const emailValidation = validateEmail(confirmEmail, 'confirmEmail');
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const sanitizedUserId = userIdValidation.sanitized;
    const sanitizedEmail = emailValidation.sanitized;

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'delete_test_account',
      targetUserId: sanitizedUserId,
      details: { confirmEmail: sanitizedEmail },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Delete account using SQL function
    const { data, error: deleteError } = await supabaseAdmin.rpc("delete_test_account", {
      target_user_id: sanitizedUserId,
      confirm_email: sanitizedEmail,
    });

    if (deleteError) {
      logger.error("Error deleting account:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete account" },
        { status: 500 }
      );
    }

    const result = data?.[0];
    
    return NextResponse.json({
      success: true,
      stories_deleted: result?.stories_deleted || 0,
      photos_deleted: result?.photos_deleted || 0,
      prompts_deleted: result?.prompts_deleted || 0,
    });

  } catch (err) {
    logger.error("Error in POST /api/admin/test-accounts/delete:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
