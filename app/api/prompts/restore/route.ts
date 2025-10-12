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

    // Fetch the prompt from history
    const { data: historyPrompt, error: fetchError } = await supabaseAdmin
      .from("prompt_history")
      .select("*")
      .eq("id", promptId)
      .eq("user_id", user.id)
      .eq("outcome", "skipped")
      .single();

    if (fetchError || !historyPrompt) {
      logger.error("Prompt not found or unauthorized:", fetchError);
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 },
      );
    }

    // Calculate new expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Restore to active_prompts
    const { error: insertError } = await supabaseAdmin
      .from("active_prompts")
      .insert({
        user_id: user.id,
        prompt_text: historyPrompt.prompt_text,
        context_note: `Restored from saved prompts`,
        anchor_entity: historyPrompt.anchor_entity,
        anchor_year: historyPrompt.anchor_year,
        anchor_hash: historyPrompt.anchor_hash,
        tier: historyPrompt.tier,
        memory_type: historyPrompt.memory_type,
        prompt_score: historyPrompt.prompt_score,
        model_version: historyPrompt.model_version || 'restored',
        expires_at: expiresAt.toISOString(),
        is_locked: false,
        shown_count: 0,
      });

    if (insertError) {
      // Check if it's a duplicate key error (prompt already exists)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This prompt is already active" },
          { status: 400 },
        );
      }
      
      logger.error("Error restoring prompt:", insertError);
      return NextResponse.json(
        { error: "Failed to restore prompt" },
        { status: 500 },
      );
    }

    // Delete from history
    const { error: deleteError } = await supabaseAdmin
      .from("prompt_history")
      .delete()
      .eq("id", promptId);

    if (deleteError) {
      logger.error("Error deleting from history:", deleteError);
      // Don't fail the request, prompt is already restored
    }

    return NextResponse.json({
      success: true,
      message: "Prompt restored successfully",
    });

  } catch (err) {
    logger.error("Error in POST /api/prompts/restore:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
