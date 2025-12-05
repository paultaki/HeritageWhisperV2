import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activePrompts } from "@/shared/schema";
import { eq, or, like, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/prompts/emergency-cleanup
 * Delete prompts with broken entity extraction (grammar errors)
 * 
 * This is more severe than quality cleanup - these are BROKEN prompts
 * with obvious bugs like "impress the said", "the told", etc.
 */
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

    logger.api(`[Emergency Cleanup] Starting for user ${userId}`);

    // Fetch all active prompts for this user
    const allPrompts = await db
      .select()
      .from(activePrompts)
      .where(eq(activePrompts.userId, userId));

    logger.api(`[Emergency Cleanup] Checking ${allPrompts.length} prompts`);

    // Identify broken prompts using multiple patterns
    const brokenPrompts = allPrompts.filter((prompt) => {
      const text = prompt.promptText;
      
      // Check for broken entity patterns
      const brokenPatterns = [
        // Articles followed by past tense verbs
        /\s+(the|a|an)\s+(said|told|was|were|had)\b/i,
        // Specific known broken extractions
        /impress\s+(the|a)\s+(said|told)/i,
        /mention\s+(the|a)\s+(said|told)/i,
        /\bthe\s+said\b/i,
        /\bthe\s+told\b/i,
        /\ba\s+was\b/i,
        /\ban\s+were\b/i,
        // Multiple spaces (artifact of bad processing)
        /\s{2,}/,
      ];

      // Check regex patterns
      const hasPatternMatch = brokenPatterns.some(pattern => pattern.test(text));

      // Check additional conditions
      const missingQuestionMark = !/\?$/.test(text);
      const tooShort = text.split(' ').length < 5;

      return hasPatternMatch || missingQuestionMark || tooShort;
    });

    logger.api(`[Emergency Cleanup] Found ${brokenPrompts.length} broken prompts`);

    if (brokenPrompts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No broken prompts found",
        removed: 0,
      });
    }

    // Delete broken prompts (don't even save to history - they're garbage)
    const deletedIds: string[] = [];
    for (const prompt of brokenPrompts) {
      await db
        .delete(activePrompts)
        .where(eq(activePrompts.id, prompt.id));
      
      deletedIds.push(prompt.id);
      
      logger.api(`[Emergency Cleanup] Deleted broken prompt: "${prompt.promptText}"`);
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${brokenPrompts.length} broken prompts`,
      removed: brokenPrompts.length,
      examples: brokenPrompts.slice(0, 5).map(p => ({
        text: p.promptText,
        id: p.id,
      })),
    });
  } catch (error) {
    logger.error("[Emergency Cleanup] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to run emergency cleanup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
