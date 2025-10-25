import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { activePrompts, promptHistory } from "@/shared/schema";
import { getQualityReport } from "@/lib/promptQuality";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/prompts/cleanup
 * Clean up poor quality prompts
 * 
 * Query params:
 *   ?dryRun=true - Preview without making changes
 *   ?verbose=true - Show detailed output
 */
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get("dryRun") === "true";
    const verbose = searchParams.get("verbose") === "true";

    logger.api(`[Cleanup] Starting cleanup for user ${user.id} (dryRun: ${dryRun})`);

    // Fetch all active prompts for this user
    const prompts = await db
      .select()
      .from(activePrompts)
      .where(eq(activePrompts.userId, user.id));

    logger.api(`[Cleanup] Found ${prompts.length} active prompts`);

    let removedCount = 0;
    const issues: Array<{
      id: string;
      text: string;
      score: number;
      issues: string[];
    }> = [];

    const goodPrompts: Array<{
      id: string;
      text: string;
      score: number;
    }> = [];

    for (const prompt of prompts) {
      const report = getQualityReport(prompt.promptText);

      if (!report.isQuality) {
        removedCount++;

        const issueTypes = report.issues.map((i) => i.type);
        issues.push({
          id: prompt.id,
          text: prompt.promptText,
          score: report.score,
          issues: issueTypes,
        });

        if (!dryRun) {
          // Move to history as 'retired'
          await db.insert(promptHistory).values({
            userId: prompt.userId,
            promptText: prompt.promptText,
            tier: prompt.tier ?? undefined,
            outcome: "skipped",
            resolvedAt: new Date(),
          });

          // Remove from active prompts
          await db
            .delete(activePrompts)
            .where(eq(activePrompts.id, prompt.id));
        }
      } else if (verbose) {
        goodPrompts.push({
          id: prompt.id,
          text: prompt.promptText,
          score: report.score,
        });
      }
    }

    // Count issue types
    const issueTypeCounts: Record<string, number> = {};
    issues.forEach((issue) => {
      issue.issues.forEach((type) => {
        issueTypeCounts[type] = (issueTypeCounts[type] || 0) + 1;
      });
    });

    // Build response
    const summary = {
      totalScanned: prompts.length,
      highQuality: prompts.length - removedCount,
      lowQuality: removedCount,
      dryRun,
      issues: verbose ? issues : issues.slice(0, 5), // Limit to 5 unless verbose
      goodPrompts: verbose ? goodPrompts : [],
      issueTypeCounts,
    };

    logger.api(
      `[Cleanup] Complete: ${removedCount} low quality prompts ${dryRun ? "identified" : "removed"}`,
    );

    return NextResponse.json({
      success: true,
      summary,
      message: dryRun
        ? `Preview: Would remove ${removedCount} low quality prompts`
        : `Removed ${removedCount} low quality prompts`,
    });
  } catch (error) {
    logger.error("[Cleanup] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup prompts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
