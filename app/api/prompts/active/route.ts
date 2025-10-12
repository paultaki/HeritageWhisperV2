import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Initialize Supabase Admin client
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
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Fetch all active prompts for this user
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_locked", false)
      .gt("expires_at", new Date().toISOString())
      .order("tier", { ascending: false })
      .order("prompt_score", { ascending: false });

    if (promptsError) {
      logger.error("Error fetching active prompts:", promptsError);
      return NextResponse.json(
        { error: "Failed to fetch prompts" },
        { status: 500 },
      );
    }

    return NextResponse.json({ prompts: prompts || [] });

  } catch (err) {
    logger.error("Error in GET /api/prompts/active:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
