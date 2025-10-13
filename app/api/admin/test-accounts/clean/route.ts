/**
 * POST /api/admin/test-accounts/clean
 * Cleans all prompts and character evolution for a test account
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

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
