import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { performTier3Analysis as performTier3AnalysisV1 } from "@/lib/tier3Analysis";
import { performTier3Analysis as performTier3AnalysisV2 } from "@/lib/tier3AnalysisV2";
import { extractEntities, generateTier1Templates } from "@/lib/promptGenerationV2";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";
type MaybePromise<T> = T | Promise<T>;

// Local widened Tier1 prompt shape
type AnyTier1Prompt = {
  prompt?: string;
  memory_type?: string;
  anchor_entity?: string;
  recording_likelihood?: string;
  reasoning?: string;
  [k: string]: unknown;
};

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

    const body = await request.json();
    const { storyIds, tier, milestone, dryRun = true } = body;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return NextResponse.json(
        { error: "storyIds array is required" },
        { status: 400 },
      );
    }

    if (!tier || !["tier1", "tier3v1", "tier3v2"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be tier1, tier3v1, or tier3v2" },
        { status: 400 },
      );
    }

    logger.debug(
      `[Dev Analysis] Analyzing ${storyIds.length} stories (tier: ${tier}, milestone: ${milestone || "auto"}, dryRun: ${dryRun})`,
    );

    // Fetch stories
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("id, title, transcript, lesson_learned, year, created_at")
      .eq("user_id", userId)
      .in("id", storyIds)
      .order("created_at", { ascending: true });

    if (storiesError || !stories) {
      logger.error("[Dev Analysis] Failed to fetch stories:", storiesError);
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

    const storyCount = milestone || stories.length;

    // Run analysis based on tier
    let result: any;

    if (tier === "tier1") {
      // Tier 1: Entity extraction + template prompts
      logger.debug("[Dev Analysis] Running Tier 1 entity extraction");

      const allPrompts: any[] = [];

      for (const story of stories) {
        const entities = extractEntities(story.transcript || "");
        const prompts = (generateTier1Templates as any)(
          entities,
          story.transcript || "",
          story.title || "Untitled",
        ) as unknown as AnyTier1Prompt[];

        allPrompts.push(...prompts.map(p => ({
          prompt: p.prompt,
          trigger: p.memory_type,
          anchorEntity: p.anchor_entity,
          recordingLikelihood: p.recording_likelihood,
          reasoning: p.reasoning,
        })));
      }

      result = {
        prompts: allPrompts,
      };
    } else if (tier === "tier3v1") {
      // Tier 3 V1: Original pattern analysis
      logger.debug("[Dev Analysis] Running Tier 3 V1 analysis");
      result = await performTier3AnalysisV1(stories, storyCount);
    } else {
      // Tier 3 V2: Intimacy Engine
      logger.debug("[Dev Analysis] Running Tier 3 V2 analysis");
      result = await performTier3AnalysisV2(stories, storyCount);
    }

    logger.debug(
      `[Dev Analysis] Analysis complete: ${result.prompts.length} prompts generated`,
    );

    // Return results without saving to database
    return NextResponse.json({
      success: true,
      dryRun,
      tier,
      analysis: {
        storyCount,
        storiesAnalyzed: stories.length,
        storyTitles: stories.map((s) => s.title),
        prompts: result.prompts.map((p: any) => ({
          prompt: p.prompt,
          trigger: p.trigger || p.intimacy_type || p.memory_type,
          anchorEntity: p.anchor_entity || p.anchorEntity,
          recordingLikelihood: p.recording_likelihood || p.recordingLikelihood,
          reasoning: p.reasoning,
        })),
      },
      message: dryRun
        ? "Analysis complete (not saved to database)"
        : "Analysis complete and saved",
    });
  } catch (error) {
    logger.error("[Dev Analysis] Error:", error);
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
