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

    // System prompt for follow-up generation (multiple questions)
    const systemPrompt = `You are an empathetic interviewer helping someone record their life story.

Your job: Generate 2-3 natural follow-up questions based on what they just shared.

Rules for EACH question:
- Keep it conversational and warm
- Ask about feelings, details, or lessons learned
- 15-25 words max
- Never repeat what they said
- Make them want to share more
- Each question should explore a DIFFERENT angle

Question types to vary between:
1. Emotional depth: "How did that moment change the way you saw yourself?"
2. Practical wisdom: "What would you tell someone facing a similar choice?"
3. Reflection: "Looking back, what surprises you most about that experience?"
4. Relationships: "How did that affect your relationships with others?"
5. Lessons: "What did you learn that you still carry with you today?"`;

    // User prompt with context
    const userPrompt = `Here's what they've shared so far:

"${fullTranscript.trim()}"

Generate 2-3 follow-up questions for exchange #${followUpNumber}.

${followUpNumber === 1 ? "Focus on: Dig deeper into what they just said. Explore feelings and immediate reactions." : ""}
${followUpNumber === 2 ? "Focus on: Explore the emotional impact, meaning, and how it changed them." : ""}
${followUpNumber === 3 ? "Focus on: Ask about lessons learned, wisdom gained, and future reflection." : ""}

Return ONLY the questions in this exact format:
1. [First question]
2. [Second question]
3. [Third question (optional)]

No explanations, no extra text.`;

    // Try GPT-5 first, fallback to GPT-4o-mini if not available
    const startTime = Date.now();
    let response;
    let modelUsed = "gpt-5";

    try {
      response = await openai.chat.completions.create({
        model: "gpt-5",
        // @ts-ignore - reasoning_effort is valid for GPT-5 but not in types yet
        reasoning_effort: "low",
        temperature: 0.8,
        max_tokens: 150,
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
    } catch (gpt5Error: any) {
      logger.warn("[FollowUp] GPT-5 not available, falling back to GPT-4o-mini", {
        error: gpt5Error?.message,
      });

      // Fallback to GPT-4o-mini (no reasoning_effort parameter)
      modelUsed = "gpt-4o-mini";
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 150,
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
    }

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content?.trim();

    logger.debug("[FollowUp] Raw API response", {
      modelUsed,
      contentLength: content?.length,
      content: content?.substring(0, 200),
    });

    if (!content) {
      throw new Error("No follow-up questions generated");
    }

    // Parse the numbered list
    const questions: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Match "1. Question text" or "1) Question text" patterns
      const match = line.match(/^\d+[\.)]\s*(.+)$/);
      if (match && match[1]) {
        questions.push(match[1].trim());
      }
    }

    // Ensure we have at least 2 questions
    if (questions.length < 2) {
      throw new Error("Failed to parse questions from response");
    }

    // Log telemetry for cost tracking
    logger.api("[FollowUp] Generated successfully", {
      followUpNumber,
      questionsGenerated: questions.length,
      latencyMs,
      modelUsed,
      tokensUsed: {
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        // @ts-ignore - reasoning tokens may not be in types yet
        reasoning: response.usage?.reasoning_tokens,
        total: response.usage?.total_tokens,
      },
    });

    return NextResponse.json({
      questions: questions.slice(0, 3), // Return max 3 questions
      followUp: questions[0], // Keep backward compatibility
      meta: {
        followUpNumber,
        questionsGenerated: questions.length,
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
