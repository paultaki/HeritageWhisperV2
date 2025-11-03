import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getQualityReport } from "@/lib/promptQuality";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// POST /api/admin/prompts/feedback - Submit feedback on a prompt
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    logger.info("[Admin Prompts] User check:", {
      userId: user.id,
      userEmail: user.email,
      userData,
      userError: userError?.message,
    });

    if (userError || userData?.role !== "admin") {
      logger.warn("[Admin Prompts] Admin access denied:", {
        userId: user.id,
        role: userData?.role,
        error: userError?.message,
      });
      return NextResponse.json(
        { error: "Admin access required", details: { role: userData?.role, hasError: !!userError } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { promptId, rating, feedbackNotes, tags } = body;

    if (!promptId || !rating) {
      return NextResponse.json(
        { error: "promptId and rating are required" },
        { status: 400 }
      );
    }

    if (!["good", "bad", "excellent", "terrible"].includes(rating)) {
      return NextResponse.json(
        { error: "Invalid rating. Must be: good, bad, excellent, or terrible" },
        { status: 400 }
      );
    }

    // Fetch the prompt details
    const { data: prompt, error: promptError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("id", promptId)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    // Fetch story excerpt if available
    let storyExcerpt = null;
    if (prompt.user_id) {
      const { data: stories } = await supabaseAdmin
        .from("stories")
        .select("id, transcript")
        .eq("user_id", prompt.user_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (stories && stories.length > 0) {
        storyExcerpt = stories[0].transcript?.substring(0, 200) + "...";
      }
    }

    // Generate quality report
    const qualityReport = getQualityReport(prompt.prompt_text);

    // Count words
    const wordCount = prompt.prompt_text.split(/\s+/).filter(Boolean).length;

    // Insert feedback
    const { data: feedback, error: insertError } = await supabaseAdmin
      .from("prompt_feedback")
      .insert({
        prompt_id: promptId,
        prompt_text: prompt.prompt_text,
        story_id: null, // We'll enhance this later if needed
        story_excerpt: storyExcerpt,
        rating,
        feedback_notes: feedbackNotes || null,
        tags: tags || [],
        prompt_tier: prompt.tier,
        prompt_type: prompt.memory_type,
        anchor_entity: prompt.anchor_entity,
        word_count: wordCount,
        prompt_score: prompt.prompt_score,
        quality_report: qualityReport,
        reviewed_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("[Admin Prompts] Failed to insert feedback:", insertError);
      return NextResponse.json(
        { error: "Failed to save feedback", details: insertError.message },
        { status: 500 }
      );
    }

    logger.info("[Admin Prompts] Feedback submitted:", {
      promptId,
      rating,
      reviewedBy: user.id,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    logger.error("[Admin Prompts] Feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/admin/prompts/feedback - Get all feedback (with filters)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const rating = searchParams.get("rating");
    const tier = searchParams.get("tier");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabaseAdmin
      .from("prompt_feedback")
      .select("*")
      .order("reviewed_at", { ascending: false })
      .limit(limit);

    if (rating) {
      query = query.eq("rating", rating);
    }
    if (tier) {
      query = query.eq("prompt_tier", parseInt(tier));
    }
    if (type) {
      query = query.eq("prompt_type", type);
    }

    const { data: feedback, error: fetchError } = await query;

    if (fetchError) {
      logger.error("[Admin Prompts] Failed to fetch feedback:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    logger.error("[Admin Prompts] Feedback fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
