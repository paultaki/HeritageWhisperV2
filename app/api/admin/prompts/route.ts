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

    // Fetch all active prompts
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500); // Limit to prevent massive queries

    if (promptsError) {
      logger.error("Error fetching prompts:", promptsError);
      return NextResponse.json(
        { error: "Failed to fetch prompts" },
        { status: 500 },
      );
    }

    // Calculate stats
    const stats = {
      total: prompts?.length || 0,
      tier1: prompts?.filter((p) => p.tier === 1).length || 0,
      tier3: prompts?.filter((p) => p.tier === 3).length || 0,
      avgScore: prompts?.length
        ? Math.round(
            prompts.reduce((sum, p) => sum + (p.prompt_score || 0), 0) /
              prompts.length
          )
        : 0,
      locked: prompts?.filter((p) => p.is_locked).length || 0,
    };

    // Add word count to each prompt
    const enrichedPrompts = (prompts || []).map((p) => ({
      ...p,
      word_count: p.prompt_text.trim().split(/\s+/).filter(Boolean).length,
    }));

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
