import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// If your schema already has skip_count, we use it. Otherwise we fall back to shown_count.
async function loadPromptForUser(userId: string, promptId?: string, promptText?: string) {
  if (promptId) {
    const { data, error } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("id", promptId)
      .eq("user_id", userId)
      .single();
    if (error) return { error };
    return { data };
  }
  if (promptText) {
    const { data, error } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", userId)
      .eq("prompt_text", promptText)
      .limit(1)
      .maybeSingle();
    if (error) return { error };
    return { data };
  }
  return { error: new Error("Missing prompt selector") };
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });

    const userId = user.id;

    // Body
    const body = await request.json().catch(() => ({}));
    const promptId: string | undefined = body?.promptId;
    const promptText: string | undefined = body?.promptText;

    if (!promptId && !promptText) {
      return NextResponse.json({ error: "promptId or promptText is required" }, { status: 400 });
    }

    // Load prompt (verify ownership)
    const { data: prompt, error: promptError } = await loadPromptForUser(userId, promptId, promptText);
    if (promptError || !prompt) {
      logger.error("Prompt not found or unauthorized:", promptError);
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Calculate counters
    const nowIso = new Date().toISOString();
    const hasSkipCount = Object.prototype.hasOwnProperty.call(prompt, "skip_count");
    const nextSkipCount = hasSkipCount ? (prompt.skip_count || 0) + 1 : undefined;
    const nextShownCount = hasSkipCount ? (prompt.shown_count || 0) : (prompt.shown_count || 0) + 1; // fallback path

    // Retirement rule: retire on 3rd skip when skip_count exists
    const shouldRetire = hasSkipCount ? (nextSkipCount! >= 3) : false;

    if (shouldRetire) {
      // Archive to prompt_history and remove from active_prompts
      const { error: historyError } = await supabaseAdmin
        .from("prompt_history")
        .insert({
          user_id: userId,
          prompt_id: prompt.id,
          prompt_text: prompt.prompt_text,
          tier: prompt.tier,
          prompt_score: prompt.prompt_score,
          outcome: "skipped",
          skip_count: nextSkipCount,
          created_at: prompt.created_at || nowIso,
        });

      if (historyError) {
        logger.error("Failed to archive skipped prompt:", historyError);
        // Don't abort; still try to delete active prompt
      }

      const { error: deleteError } = await supabaseAdmin
        .from("active_prompts")
        .delete()
        .eq("id", prompt.id)
        .eq("user_id", userId);

      if (deleteError) {
        logger.error("Failed to delete retired prompt:", deleteError);
        return NextResponse.json({ error: "Failed to retire prompt" }, { status: 500 });
      }

      // Fetch next prompt
      const base = new URL(request.url).origin;
      const res = await fetch(`${base}/api/prompts/next`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));

      return NextResponse.json(
        {
          success: true,
          retired: true,
          nextPrompt: json?.prompt ?? null,
        },
        { status: 200 },
      );
    }

    // Not retiring: increment appropriate counter and set last_shown_at
    const updatePayload: Record<string, any> = {
      last_shown_at: nowIso,
    };
    if (hasSkipCount) {
      updatePayload.skip_count = nextSkipCount;
    } else {
      updatePayload.shown_count = nextShownCount;
    }

    const { error: updateError } = await supabaseAdmin
      .from("active_prompts")
      .update(updatePayload)
      .eq("id", prompt.id)
      .eq("user_id", userId);

    if (updateError) {
      logger.error("Error updating prompt skip/shown counters:", updateError);
      return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
    }

    // Fetch next prompt by calling existing GET /api/prompts/next
    const url = new URL(request.url);
    const base = url.origin;

    const res = await fetch(`${base}/api/prompts/next`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(
      {
        success: true,
        retired: false,
        nextPrompt: json?.prompt ?? null,
      },
      { status: res.status || 200 }
    );
  } catch (err) {
    logger.error("Error in POST /api/prompts/skip:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
