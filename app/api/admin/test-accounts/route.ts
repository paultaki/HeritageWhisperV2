/**
 * Test Accounts API
 * GET - List test accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'list_test_accounts',
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Get all test accounts (emails ending with @heritagewhisper.com or containing "(Test)")
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .or('email.like.%@heritagewhisper.com,name.ilike.%(Test)%')
      .order("created_at", { ascending: false });

    if (usersError) {
      logger.error("Error fetching test accounts:", usersError);
      return NextResponse.json({ error: "Failed to fetch test accounts" }, { status: 500 });
    }

    // Get info for each test account
    const accounts = [];
    for (const testUser of users || []) {
      const { data: info, error: infoError } = await supabaseAdmin
        .rpc("get_test_account_info", { target_user_id: testUser.id });

      if (!infoError && info && info.length > 0) {
        accounts.push({
          id: testUser.id,
          ...info[0],
        });
      }
    }

    return NextResponse.json({ success: true, accounts });

  } catch (err) {
    logger.error("Error in GET /api/admin/test-accounts:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
