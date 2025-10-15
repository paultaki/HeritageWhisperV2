import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

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

    // Body
    const body = await request.json().catch(() => ({}));
    const promptId: string | undefined = body?.promptId;
    const promptText: string | undefined = body?.promptText;

    if (!promptId && !promptText) {
      return NextResponse.json({ error: "promptId or promptText is required" }, { status: 400 });
    }

    // Load prompt (verify ownership)
    const { data: prompt, error: promptError } = await loadPromptForUser(user.id, promptId, promptText);
    if (promptError || !prompt) {
      logger.error("Prompt not found or unauthorized:", promptError);
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Immediately move to prompt_history (save for later)
    const hasSkipCount = Object.prototype.hasOwnProperty.call(prompt, "skip_count");
    
    // Archive to prompt_history
    const { error: historyError } = await supabaseAdmin.from("prompt_history").insert({
      user_id: user.id,
      prompt_text: prompt.prompt_text,
      anchor_hash: prompt.anchor_hash ?? null,
      anchor_entity: prompt.anchor_entity ?? null,
      anchor_year: prompt.anchor_year ?? null,
      tier: prompt.tier ?? 1,
      memory_type: prompt.memory_type ?? null,
      prompt_score: prompt.prompt_score ?? null,
      shown_count: prompt.shown_count ?? 0,
      outcome: "skipped",
      created_at: prompt.created_at ?? new Date().toISOString(),
    });
    
    if (historyError) {
      logger.error("Error archiving prompt to history:", historyError);
      return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
    }

    // Delete from active_prompts
    const { error: deleteError } = await supabaseAdmin
      .from("active_prompts")
      .delete()
      .eq("id", prompt.id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("Error deleting saved prompt:", deleteError);
      return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
    }

    // Fetch next prompt by calling your existing GET /api/prompts/next
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
        saved: true,
        nextPrompt: json?.prompt ?? null,
      },
      { status: res.status || 200 }
    );
  } catch (err) {
    logger.error("Error in POST /api/prompts/skip:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
