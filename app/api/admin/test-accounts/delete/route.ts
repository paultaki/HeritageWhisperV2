/**
 * POST /api/admin/test-accounts/delete
 * Deletes a test account and all associated data
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

    const { userId, confirmEmail } = await request.json();

    if (!userId || !confirmEmail) {
      return NextResponse.json(
        { error: "userId and confirmEmail are required" },
        { status: 400 }
      );
    }

    // Delete account using SQL function
    const { data, error: deleteError } = await supabaseAdmin.rpc("delete_test_account", {
      target_user_id: userId,
      confirm_email: confirmEmail,
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
