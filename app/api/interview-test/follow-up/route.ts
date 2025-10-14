import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

// Initialize OpenAI client with AI Gateway (if configured)
// Falls back to direct OpenAI API if AI_GATEWAY_API_KEY not set
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_GATEWAY_API_KEY
  ? 'https://ai-gateway.vercel.sh/v1'
  : undefined;

const openai = new OpenAI({
  apiKey,
  baseURL,
});

/**
 * GPT-5 Follow-up Question Generator
 *
 * Uses GPT-5 with LOW reasoning effort for cost-efficient follow-up generation.
 * Takes the FULL TEXT TRANSCRIPT as context (not audio).
 *
 * Cost: ~$0.01 per follow-up with GPT-5 low reasoning effort
 * vs. ~$0.009 per follow-up with GPT-4o (1.1x increase for better quality)
 *
 * Configuration:
 * - model: "gpt-5"
 * - reasoning_effort: "low" (basic reasoning, fast and cheap)
 * - temperature: 0.7 (balanced creativity/consistency)
 * - max_tokens: 50 (keep questions concise)
 */
export async function POST(request: NextRequest) {
  logger.debug("[FollowUp] POST request received");

  try {
    const body = await request.json();
    const { fullTranscript, followUpNumber } = body;

    // Validate inputs
    if (!fullTranscript || typeof fullTranscript !== "string") {
      return NextResponse.json(
        { error: "fullTranscript is required and must be a string" },
        { status: 400 }
      );
    }

    if (!followUpNumber || followUpNumber < 1 || followUpNumber > 3) {
      return NextResponse.json(
        { error: "followUpNumber must be between 1 and 3" },
        { status: 400 }
      );
    }

    logger.api("[FollowUp] Generating follow-up question", {
      transcriptLength: fullTranscript.length,
      followUpNumber,
    });

    // System prompt for follow-up generation
    const systemPrompt = `You are an empathetic interviewer helping someone record their life story.

Your job: Generate ONE natural follow-up question based on what they just shared.

Rules:
- Keep it conversational and warm
- Ask about feelings, details, or lessons learned
- 15-25 words max
- Never repeat what they said
- Make them want to share more

Example good questions:
- "How did that moment change the way you saw yourself?"
- "What would you tell someone facing a similar choice?"
- "Looking back, what surprised you most about that experience?"`;

    // User prompt with context
    const userPrompt = `Here's what they've shared so far:

"${fullTranscript.trim()}"

Generate follow-up question #${followUpNumber} (of 3 total).
${followUpNumber === 1 ? "Dig deeper into what they just said." : ""}
${followUpNumber === 2 ? "Explore the emotional impact or meaning." : ""}
${followUpNumber === 3 ? "Ask about lessons learned or future reflection." : ""}

Return ONLY the question, no explanation.`;

    // Call GPT-5 with low reasoning effort
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      // @ts-ignore - reasoning_effort is valid for GPT-5 but not in types yet
      reasoning_effort: "low",
      temperature: 0.7,
      max_tokens: 50,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const latencyMs = Date.now() - startTime;
    const followUp = response.choices[0]?.message?.content?.trim();

    if (!followUp) {
      throw new Error("No follow-up question generated");
    }

    // Log telemetry for cost tracking
    logger.api("[FollowUp] Generated successfully", {
      followUpNumber,
      latencyMs,
      tokensUsed: {
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        // @ts-ignore - reasoning tokens may not be in types yet
        reasoning: response.usage?.reasoning_tokens,
        total: response.usage?.total_tokens,
      },
      model: response.model,
    });

    return NextResponse.json({
      followUp,
      meta: {
        followUpNumber,
        latencyMs,
        tokensUsed: response.usage?.total_tokens,
      },
    });

  } catch (error) {
    logger.error("[FollowUp] ERROR:", error);

    // Check if it's a model availability error
    if (error instanceof Error && error.message.includes("gpt-5")) {
      logger.warn("[FollowUp] GPT-5 not available, check if model is enabled");
      return NextResponse.json(
        {
          error: "GPT-5 model not available. Please check your OpenAI API configuration.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate follow-up question",
      },
      { status: 500 }
    );
  }
}
