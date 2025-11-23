import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";
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
    const { promptId, source, text, category } = await request.json();

    // Validate inputs
    if (!source || (source !== 'ai' && source !== 'catalog')) {
      return NextResponse.json(
        { error: "Invalid source. Must be 'ai' or 'catalog'" },
        { status: 400 },
      );
    }

    if (source === 'ai' && !promptId) {
      return NextResponse.json(
        { error: "promptId required for AI prompts" },
        { status: 400 },
      );
    }

    if (source === 'catalog' && (!text || !category)) {
      return NextResponse.json(
        { error: "text and category required for catalog prompts" },
        { status: 400 },
      );
    }

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

    if (source === 'ai') {
      // Update AI prompt to dismissed status
      const { error: updateError } = await supabaseAdmin
        .from("active_prompts")
        .update({
          user_status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", promptId)
        .eq("user_id", userId);

      if (updateError) {
        logger.error("Error dismissing AI prompt:", updateError);
        return NextResponse.json(
          { error: "Failed to dismiss prompt" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Prompt moved to archive",
      });

    } else {
      // Handle catalog prompt dismissal
      // Check if it already exists
      const { data: existing } = await supabaseAdmin
        .from("user_prompts")
        .select("id, status")
        .eq("user_id", userId)
        .eq("text", text)
        .in("status", ["queued", "dismissed"])
        .single();

      if (existing) {
        // If exists and is queued, update to dismissed
        if (existing.status === 'queued') {
          const { error: updateError } = await supabaseAdmin
            .from("user_prompts")
            .update({
              status: 'dismissed',
              dismissed_at: new Date().toISOString(),
              queue_position: null, // Clear queue position
            })
            .eq("id", existing.id);

          if (updateError) {
            logger.error("Error updating catalog prompt to dismissed:", updateError);
            return NextResponse.json(
              { error: "Failed to dismiss prompt" },
              { status: 500 },
            );
          }

          return NextResponse.json({
            success: true,
            message: "Prompt moved from queue to archive",
          });
        } else {
          // Already dismissed
          return NextResponse.json({
            success: true,
            message: "Prompt already in archive",
            alreadyDismissed: true,
          });
        }
      }

      // Insert new catalog prompt directly as dismissed
      const { error: insertError } = await supabaseAdmin
        .from("user_prompts")
        .insert({
          user_id: userId,
          text,
          category,
          source: 'catalog',
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error("Error inserting dismissed catalog prompt:", insertError);
        return NextResponse.json(
          { error: "Failed to dismiss prompt", details: insertError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Prompt added to archive",
      });
    }

  } catch (err) {
    logger.error("Error in POST /api/prompts/dismiss:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
