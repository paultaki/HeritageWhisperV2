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

    // Mark prompt as dismissed (saves to archive)
    const { error: updateError } = await supabaseAdmin
      .from("active_prompts")
      .update({
        user_status: "dismissed",
        dismissed_at: new Date().toISOString(),
      })
      .eq("id", prompt.id)
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Error dismissing prompt:", updateError);
      return NextResponse.json({ error: "Failed to dismiss prompt" }, { status: 500 });
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
