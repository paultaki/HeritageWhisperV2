import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { performTier3Analysis } from "@/lib/tier3Analysis";
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
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { storyIds, milestone, dryRun = true } = body;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return NextResponse.json(
        { error: "storyIds array is required" },
        { status: 400 },
      );
    }

    logger.debug(
      `[Dev Tier 3] Analyzing ${storyIds.length} stories (milestone: ${milestone || "auto"}, dryRun: ${dryRun})`,
    );

    // Fetch stories
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("id, title, transcript, lesson_learned, created_at")
      .eq("user_id", user.id)
      .in("id", storyIds)
      .order("created_at", { ascending: true });

    if (storiesError || !stories) {
      logger.error("[Dev Tier 3] Failed to fetch stories:", storiesError);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 },
      );
    }

    if (stories.length === 0) {
      return NextResponse.json(
        { error: "No stories found with provided IDs" },
        { status: 404 },
      );
    }

    // Perform Tier 3 analysis
    const storyCount = milestone || stories.length;
    const result = await performTier3Analysis(stories, storyCount);

    logger.debug(
      `[Dev Tier 3] Analysis complete: ${result.prompts.length} prompts, ${result.characterInsights.traits.length} traits`,
    );

    // Return results without saving to database
    return NextResponse.json({
      success: true,
      dryRun,
      analysis: {
        storyCount,
        storiesAnalyzed: stories.length,
        storyTitles: stories.map((s) => s.title),
        prompts: result.prompts.map((p) => ({
          prompt: p.prompt,
          trigger: p.trigger,
          anchorEntity: p.anchor_entity,
          recordingLikelihood: p.recording_likelihood,
          reasoning: p.reasoning,
        })),
      },
      message: dryRun
        ? "Analysis complete (not saved to database)"
        : "Analysis complete and saved",
    });
  } catch (error) {
    logger.error("[Dev Tier 3] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze stories",
      },
      { status: 500 },
    );
  }
}
