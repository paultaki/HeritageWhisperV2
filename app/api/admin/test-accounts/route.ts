/**
 * Test Accounts API
 * GET - List test accounts
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

export async function GET(request: NextRequest) {
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
