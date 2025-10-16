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

interface QueuedPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'ai' | 'catalog';
  category?: string;
  tier?: number;
  queue_position: number;
  queued_at: string;
  anchor_entity?: string;
  anchor_year?: number;
}

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

    // Fetch queued AI-generated prompts from active_prompts
    const { data: aiPrompts, error: aiError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("user_status", "queued")
      .order("queue_position", { ascending: true })
      .order("queued_at", { ascending: true });

    if (aiError) {
      logger.error("Error fetching queued AI prompts:", aiError);
    }

    // Fetch queued catalog prompts from user_prompts
    const { data: catalogPrompts, error: catalogError } = await supabaseAdmin
      .from("user_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "queued")
      .order("queue_position", { ascending: true })
      .order("queued_at", { ascending: true });

    if (catalogError) {
      logger.error("Error fetching queued catalog prompts:", catalogError);
    }

    // Transform AI prompts to unified format
    const transformedAiPrompts: QueuedPrompt[] = (aiPrompts || []).map(p => ({
      id: p.id,
      prompt_text: p.prompt_text,
      context_note: p.context_note,
      source: 'ai' as const,
      tier: p.tier,
      queue_position: p.queue_position || 999,
      queued_at: p.queued_at || p.created_at,
      anchor_entity: p.anchor_entity,
      anchor_year: p.anchor_year,
    }));

    // Transform catalog prompts to unified format
    const transformedCatalogPrompts: QueuedPrompt[] = (catalogPrompts || []).map(p => ({
      id: p.id,
      prompt_text: p.text,
      context_note: null,
      source: 'catalog' as const,
      category: p.category,
      queue_position: p.queue_position || 999,
      queued_at: p.queued_at || p.created_at,
    }));

    // Combine and sort by queue_position, then queued_at
    const allPrompts = [...transformedAiPrompts, ...transformedCatalogPrompts].sort((a, b) => {
      if (a.queue_position !== b.queue_position) {
        return a.queue_position - b.queue_position;
      }
      return new Date(a.queued_at).getTime() - new Date(b.queued_at).getTime();
    });

    return NextResponse.json({ prompts: allPrompts });

  } catch (err) {
    logger.error("Error in GET /api/prompts/queued:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
