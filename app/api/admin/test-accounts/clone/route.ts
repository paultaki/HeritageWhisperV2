/**
 * POST /api/admin/test-accounts/clone
 * Clones current user's account to create a test account
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";
import { validateEmail, validateOptional, validateString } from "@/lib/inputValidation";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    const { email, name } = await request.json();

    // SECURITY: Validate and sanitize inputs
    const emailValidation = validateEmail(email, 'email');
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const nameValidation = validateOptional(name, (val) =>
      validateString(val, 'name', 1, 255)
    );
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    const sanitizedEmail = emailValidation.sanitized;
    const sanitizedName = nameValidation.sanitized;

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'clone_user_account',
      details: { newEmail: sanitizedEmail, newName: sanitizedName },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Clone the account using SQL function
    const { data, error: cloneError } = await supabaseAdmin.rpc("clone_user_account", {
      source_user_id: user.id,
      new_email: sanitizedEmail,
      new_name: sanitizedName,
    });

    if (cloneError) {
      logger.error("Error cloning account:", cloneError);
      return NextResponse.json(
        { error: cloneError.message || "Failed to clone account" },
        { status: 500 }
      );
    }

    const result = data?.[0];
    
    return NextResponse.json({
      success: true,
      new_user_id: result?.new_user_id,
      stories_cloned: result?.stories_cloned,
      photos_cloned: result?.photos_cloned,
    });

  } catch (err) {
    logger.error("Error in POST /api/admin/test-accounts/clone:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
