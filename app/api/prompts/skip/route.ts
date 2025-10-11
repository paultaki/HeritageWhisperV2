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

export async function POST(request: NextRequest) {
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

    // Parse request body
    const { promptId } = await request.json();

    if (!promptId) {
      return NextResponse.json(
        { error: "promptId is required" },
        { status: 400 },
      );
    }

    // Fetch the prompt to verify ownership and get current state
    const { data: prompt, error: promptError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("id", promptId)
      .eq("user_id", user.id)
      .single();

    if (promptError || !prompt) {
      logger.error("Prompt not found or unauthorized:", promptError);
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 },
      );
    }

    // Increment shown_count
    const newShownCount = (prompt.shown_count || 0) + 1;

    // If shown 3+ times, retire to prompt_history
    if (newShownCount >= 3) {
      // Archive to prompt_history
      const { error: historyError } = await supabaseAdmin
        .from("prompt_history")
        .insert({
          user_id: user.id,
          prompt_text: prompt.prompt_text,
          anchor_hash: prompt.anchor_hash,
          anchor_entity: prompt.anchor_entity,
          anchor_year: prompt.anchor_year,
          tier: prompt.tier,
          memory_type: prompt.memory_type,
          prompt_score: prompt.prompt_score,
          shown_count: newShownCount,
          outcome: "skipped",
          created_at: prompt.created_at,
        });

      if (historyError) {
        logger.error("Error archiving prompt to history:", historyError);
      }

      // Delete from active_prompts
      const { error: deleteError } = await supabaseAdmin
        .from("active_prompts")
        .delete()
        .eq("id", promptId);

      if (deleteError) {
        logger.error("Error deleting prompt:", deleteError);
        return NextResponse.json(
          { error: "Failed to retire prompt" },
          { status: 500 },
        );
      }
    } else {
      // Just increment shown_count
      const { error: updateError } = await supabaseAdmin
        .from("active_prompts")
        .update({
          shown_count: newShownCount,
          last_shown_at: new Date().toISOString(),
        })
        .eq("id", promptId);

      if (updateError) {
        logger.error("Error updating prompt shown_count:", updateError);
        return NextResponse.json(
          { error: "Failed to update prompt" },
          { status: 500 },
        );
      }
    }

    // Fetch next prompt to return
    const { data: nextPrompts, error: nextError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_locked", false)
      .gt("expires_at", new Date().toISOString())
      .order("tier", { ascending: false })
      .order("prompt_score", { ascending: false })
      .limit(1);

    if (nextError) {
      logger.error("Error fetching next prompt:", nextError);
    }

    const nextPrompt = nextPrompts && nextPrompts.length > 0 ? nextPrompts[0] : null;

    return NextResponse.json({
      success: true,
      retired: newShownCount >= 3,
      nextPrompt,
    });

  } catch (err) {
    logger.error("Error in POST /api/prompts/skip:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
