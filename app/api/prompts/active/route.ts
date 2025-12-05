import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    let userId: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
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
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }
      userId = user.id;
    }

    // V3: Support storyteller_id query parameter for family sharing
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get('storyteller_id') || userId;

    // If requesting another storyteller's prompts, verify access permission
    if (storytellerId !== userId) {
      const { data: hasAccess, error: accessError } = await supabaseAdmin.rpc(
        'has_collaboration_access',
        {
          p_user_id: userId,
          p_storyteller_id: storytellerId,
        }
      );

      if (accessError || !hasAccess) {
        return NextResponse.json(
          { error: "You don't have permission to view these prompts" },
          { status: 403 },
        );
      }
    }

    // Fetch all active prompts for this user (exclude queued and dismissed)
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", storytellerId)
      .eq("is_locked", false)
      .gt("expires_at", new Date().toISOString())
      .is("user_status", null) // Only show prompts that haven't been queued or dismissed
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
