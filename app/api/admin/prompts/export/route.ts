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

/**
 * GET /api/admin/prompts/export
 *
 * Export prompt feedback data for model training
 * Supports multiple formats: json, csv, jsonl (for GPT fine-tuning)
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    await logAdminAction({
      adminUserId: user!.id,
      action: 'export_prompt_feedback',
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json"; // json, csv, jsonl
    const rating = searchParams.get("rating"); // Filter by rating

    // Fetch feedback with optional rating filter
    let query = supabaseAdmin
      .from("prompt_feedback")
      .select("*")
      .order("reviewed_at", { ascending: false });

    if (rating) {
      query = query.eq("rating", rating);
    }

    const { data: feedback, error: fetchError } = await query;

    if (fetchError) {
      logger.error("[Admin Export] Failed to fetch feedback:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    if (!feedback || feedback.length === 0) {
      return NextResponse.json(
        { error: "No feedback data found" },
        { status: 404 }
      );
    }

    // Format based on requested type
    if (format === "csv") {
      const csv = convertToCSV(feedback);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="prompt-feedback-${Date.now()}.csv"`,
        },
      });
    } else if (format === "jsonl") {
      // JSONL format for GPT fine-tuning
      const jsonl = convertToJSONL(feedback);
      return new NextResponse(jsonl, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Content-Disposition": `attachment; filename="prompt-training-${Date.now()}.jsonl"`,
        },
      });
    } else {
      // Default JSON format
      return NextResponse.json({
        success: true,
        count: feedback.length,
        exportedAt: new Date().toISOString(),
        data: feedback,
      });
    }
  } catch (error) {
    logger.error("[Admin Export] Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Convert feedback to CSV format
 */
function convertToCSV(feedback: any[]): string {
  const headers = [
    "prompt_text",
    "rating",
    "feedback_notes",
    "tags",
    "prompt_tier",
    "prompt_type",
    "anchor_entity",
    "word_count",
    "prompt_score",
    "story_excerpt",
    "reviewed_at",
  ];

  const rows = feedback.map((f) => [
    `"${(f.prompt_text || "").replace(/"/g, '""')}"`,
    f.rating,
    `"${(f.feedback_notes || "").replace(/"/g, '""')}"`,
    `"${(f.tags || []).join(", ")}"`,
    f.prompt_tier,
    f.prompt_type,
    `"${(f.anchor_entity || "").replace(/"/g, '""')}"`,
    f.word_count,
    f.prompt_score,
    `"${(f.story_excerpt || "").replace(/"/g, '""')}"`,
    f.reviewed_at,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Convert feedback to JSONL format for GPT fine-tuning
 * Format: {"messages": [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", ...}]}
 */
function convertToJSONL(feedback: any[]): string {
  // Only include good/excellent examples for training
  const goodExamples = feedback.filter(
    (f) => f.rating === "good" || f.rating === "excellent"
  );

  const jsonlLines = goodExamples.map((f) => {
    const example = {
      messages: [
        {
          role: "system",
          content: `You are generating follow-up questions for a storytelling app.
Generate ONE question (max 25 words) that:
- References a SPECIFIC detail from the story
- Uses exact words when possible
- Feels natural and conversational
- Never uses generic nouns (girl, boy, man, woman, house, room)`,
        },
        {
          role: "user",
          content: `Story excerpt: "${f.story_excerpt || ""}"\n\nGenerate a follow-up question about this story.`,
        },
        {
          role: "assistant",
          content: f.prompt_text,
        },
      ],
      metadata: {
        rating: f.rating,
        prompt_type: f.prompt_type,
        tier: f.prompt_tier,
        tags: f.tags || [],
      },
    };

    return JSON.stringify(example);
  });

  return jsonlLines.join("\n");
}
