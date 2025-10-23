/**
 * GET /api/admin/prompts
 *
 * Returns all prompts with quality scores and validation details
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    // Log admin action for audit trail
    await logAdminAction({
      adminUserId: user!.id,
      action: 'list_all_prompts',
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Fetch prompts from BOTH active_prompts and prompt_history for the current user
    // This gives us a complete view of all generated prompts
    const { data: activePrompts } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    const { data: historyPrompts } = await supabaseAdmin
      .from("prompt_history")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(100); // Last 100 historical prompts

    // Merge and deduplicate by SHA1 hash
    const seenHashes = new Set();
    const allPrompts = [...(activePrompts || []), ...(historyPrompts || [])]
      .filter(p => {
        if (seenHashes.has(p.prompt_sha1)) return false;
        seenHashes.add(p.prompt_sha1);
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!allPrompts || allPrompts.length === 0) {
      return NextResponse.json({
        success: true,
        prompts: [],
        stats: {
          total: 0,
          tier1: 0,
          tier3: 0,
          avgScore: 0,
          locked: 0,
          reviewed: 0,
          needsReview: 0,
          good: 0,
          bad: 0,
        },
      });
    }

    // Calculate stats
    const stats = {
      total: allPrompts.length,
      tier1: allPrompts.filter((p) => p.tier === 1).length,
      tier3: allPrompts.filter((p) => p.tier === 3).length,
      avgScore: allPrompts.length
        ? Math.round(
            allPrompts.reduce((sum, p) => sum + (p.prompt_score || 0), 0) /
              allPrompts.length
          )
        : 0,
      locked: allPrompts.filter((p) => p.is_locked).length,
    };

    // Check which prompts have feedback
    const promptIds = allPrompts.map((p) => p.id);
    const { data: existingFeedback } = await supabaseAdmin
      .from("prompt_feedback")
      .select("prompt_id, rating, feedback_notes, tags")
      .in("prompt_id", promptIds);

    // Create a map of prompt_id -> feedback
    const feedbackMap = new Map(
      existingFeedback?.map((f) => [f.prompt_id, f]) || []
    );

    // Get trigger info based on tier
    const getTriggerInfo = (prompt: any) => {
      if (prompt.tier === 1) {
        return `Generated after story save • Entity: ${prompt.anchor_entity || 'N/A'}`;
      } else if (prompt.tier === 3) {
        return `Milestone ${prompt.milestone_reached || 'N/A'} • Deep reflection analysis`;
      }
      return 'Unknown trigger';
    };

    // Add word count, feedback, and trigger info to each prompt
    const enrichedPrompts = allPrompts.map((p) => ({
      ...p,
      word_count: p.prompt_text.trim().split(/\s+/).filter(Boolean).length,
      feedback: feedbackMap.get(p.id) || null,
      hasBeenReviewed: feedbackMap.has(p.id),
      triggerInfo: getTriggerInfo(p),
      status: p.retired_at ? 'Retired' : (p.answered_at ? 'Answered' : 'Active'),
    }));

    // Update stats to include feedback counts
    stats.reviewed = enrichedPrompts.filter(p => p.hasBeenReviewed).length;
    stats.needsReview = enrichedPrompts.filter(p => !p.hasBeenReviewed).length;
    stats.good = existingFeedback?.filter(f => f.rating === 'good' || f.rating === 'excellent').length || 0;
    stats.bad = existingFeedback?.filter(f => f.rating === 'bad' || f.rating === 'terrible').length || 0;

    return NextResponse.json({
      success: true,
      prompts: enrichedPrompts,
      stats,
    });

  } catch (err) {
    logger.error("Error in GET /api/admin/prompts:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
