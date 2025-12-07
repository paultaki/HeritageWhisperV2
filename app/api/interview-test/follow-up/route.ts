import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { logger } from "@/lib/logger";

/**
 * Follow-up Question Generator
 *
 * Uses GPT-4o-mini for FAST, cost-efficient follow-up generation.
 * Takes the FULL TEXT TRANSCRIPT as context (not audio).
 *
 * Optimized for speed: ~1-2 seconds (vs 9-11s with GPT-5)
 *
 * Cost: ~$0.001 per follow-up (90% cheaper than GPT-5)
 *
 * Configuration:
 * - model: "gpt-4o-mini"
 * - temperature: 0.9 (higher for creativity with smaller model)
 * - max_tokens: 150
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

    if (!followUpNumber || followUpNumber < 1) {
      return NextResponse.json(
        { error: "followUpNumber must be a positive integer" },
        { status: 400 }
      );
    }

    logger.api("[FollowUp] Generating follow-up question", {
      transcriptLength: fullTranscript.length,
      followUpNumber,
    });

    // System prompt for follow-up generation with story awareness
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
5. Lessons: "What did you learn that you still carry with you today?"
6. Connections (if follow-up 3+): "This reminds me of your story about [previous detail] - how do they connect?"

ENCOURAGEMENT (add occasionally):
- After emotional shares: "Thank you for sharing that..."
- After vivid details: "I can really picture that..."
- When they're opening up: "Your stories are really coming to life..."`;

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

    // Use GPT-4o-mini for fast, cost-efficient follow-up generation
    // Optimized: 10x faster than GPT-5 (1-2s vs 9-11s), 90% cheaper
    const startTime = Date.now();
    let response;
    const modelUsed = "gpt-4o-mini";
    const openai = getOpenAIClient();

    response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9, // Slightly higher for creativity with smaller model
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

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content?.trim();

    logger.debug("[FollowUp] Final response", {
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
