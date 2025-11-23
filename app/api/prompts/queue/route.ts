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

    // Get next queue position using the helper function
    const { data: positionData, error: positionError } = await supabaseAdmin
      .rpc('get_next_queue_position', { p_user_id: userId });

    if (positionError) {
      logger.error("Error getting next queue position:", positionError);
      return NextResponse.json(
        { error: "Failed to get queue position" },
        { status: 500 },
      );
    }

    const queuePosition = positionData || 1;

    if (source === 'ai') {
      // Update existing AI prompt in active_prompts
      const { error: updateError } = await supabaseAdmin
        .from("active_prompts")
        .update({
          user_status: 'queued',
          queue_position: queuePosition,
          queued_at: new Date().toISOString(),
        })
        .eq("id", promptId)
        .eq("user_id", userId);

      if (updateError) {
        logger.error("Error queueing AI prompt:", updateError);
        return NextResponse.json(
          { error: "Failed to queue prompt" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Prompt added to queue",
        queuePosition,
      });

    } else {
      // Insert or update catalog prompt in user_prompts
      // Check if it already exists
      const { data: existing } = await supabaseAdmin
        .from("user_prompts")
        .select("id, status")
        .eq("user_id", userId)
        .eq("text", text)
        .in("status", ["queued", "dismissed"])
        .single();

      if (existing) {
        // If exists and is dismissed, update to queued
        if (existing.status === 'dismissed') {
          const { error: updateError } = await supabaseAdmin
            .from("user_prompts")
            .update({
              status: 'queued',
              queue_position: queuePosition,
              queued_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) {
            logger.error("Error updating catalog prompt to queued:", updateError);
            return NextResponse.json(
              { error: "Failed to queue prompt" },
              { status: 500 },
            );
          }

          return NextResponse.json({
            success: true,
            message: "Prompt moved from archive to queue",
            queuePosition,
          });
        } else {
          // Already queued
          return NextResponse.json({
            success: true,
            message: "Prompt already in queue",
            alreadyQueued: true,
          });
        }
      }

      // Insert new catalog prompt
      const { error: insertError } = await supabaseAdmin
        .from("user_prompts")
        .insert({
          user_id: userId,
          text,
          category,
          source: 'catalog',
          status: 'queued',
          queue_position: queuePosition,
          queued_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error("Error inserting catalog prompt:", insertError);
        return NextResponse.json(
          { error: "Failed to queue prompt", details: insertError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Prompt added to queue",
        queuePosition,
      });
    }

  } catch (err) {
    logger.error("Error in POST /api/prompts/queue:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
