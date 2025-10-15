/**
 * POST /api/admin/test-accounts/generate-prompts
 * Generates Tier-1 and Tier-3 prompts for a test account based on current milestone
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTier1Templates as generateTier1TemplatesV2 } from "@/lib/promptGenerationV2";
import { performTier3Analysis, storeTier3Results } from "@/lib/tier3AnalysisV2";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { getClientIp } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MILESTONES = [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100];

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'generate_test_prompts',
      targetUserId: userId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Get all visible stories for this test account
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("id, title, transcript, year, created_at")
      .eq("user_id", userId)
      .eq("is_private", false)
      .order("created_at", { ascending: true });

    if (storiesError) {
      logger.error("Error fetching stories:", storiesError);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 }
      );
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json(
        { error: "No visible stories found" },
        { status: 400 }
      );
    }

    let tier1Count = 0;
    let tier3Count = 0;

    // ============================================================================
    // TIER 1: Generate for each story
    // ============================================================================
    for (const story of stories) {
      try {
        const tier1Prompts = generateTier1TemplatesV2(
          story.transcript || "",
          story.year,
        );

        if (tier1Prompts.length > 0) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const promptsToInsert = tier1Prompts.map((prompt) => ({
            user_id: userId,
            prompt_text: prompt.text,
            context_note: prompt.context,
            anchor_entity: prompt.entity,
            anchor_year: story.year,
            anchor_hash: prompt.anchorHash,
            tier: 1,
            memory_type: prompt.memoryType,
            prompt_score: prompt.promptScore,
            score_reason: "Relationship-first prompt from V2 engine",
            model_version: "tier1-v2-intimacy",
            expires_at: expiresAt.toISOString(),
            is_locked: false,
            shown_count: 0,
          }));

          const { error: promptError } = await supabaseAdmin
            .from("active_prompts")
            .insert(promptsToInsert);

          if (!promptError || promptError.code === "23505") {
            tier1Count += tier1Prompts.length;
          } else {
            logger.error("Error storing Tier-1 prompts:", promptError);
          }
        }
      } catch (err) {
        logger.error("Error generating Tier-1 for story:", story.id, err);
      }
    }

    // ============================================================================
    // TIER 3: Generate if at milestone
    // ============================================================================
    const storyCount = stories.length;
    
    if (MILESTONES.includes(storyCount)) {
      logger.debug(`[Test Account] Milestone ${storyCount} detected, running Tier-3 analysis`);

      try {
        // Perform GPT-4o combined analysis
        const tier3Result = await performTier3Analysis(stories, storyCount);

        // Store prompts and character insights
        await storeTier3Results(
          supabaseAdmin,
          userId,
          storyCount,
          tier3Result,
        );

        tier3Count = tier3Result.prompts?.length || 0;

        logger.debug(`[Test Account] Tier-3 analysis complete: ${tier3Count} prompts`);
      } catch (tier3Error) {
        logger.error("[Test Account] Tier-3 analysis failed:", tier3Error);
        // Don't fail the request - Tier-3 is bonus
      }
    }

    return NextResponse.json({
      success: true,
      tier1_count: tier1Count,
      tier3_count: tier3Count,
      total_prompts: tier1Count + tier3Count,
      story_count: storyCount,
      is_milestone: MILESTONES.includes(storyCount),
    });

  } catch (err) {
    logger.error("Error in POST /api/admin/test-accounts/generate-prompts:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
