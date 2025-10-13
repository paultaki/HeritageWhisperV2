/**
 * POST /api/admin/test-accounts/clone
 * Clones current user's account to create a test account
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

    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Clone the account using SQL function
    const { data, error: cloneError } = await supabaseAdmin.rpc("clone_user_account", {
      source_user_id: user.id,
      new_email: email,
      new_name: name || null,
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
