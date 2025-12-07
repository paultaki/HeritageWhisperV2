import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

// Lazy-initialized OpenAI client to avoid build-time errors
let _openaiClient: OpenAI | null = null;

function getOpenAIClientWithGateway(): OpenAI {
  if (!_openaiClient) {
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_GATEWAY_API_KEY
      ? 'https://ai-gateway.vercel.sh/v1'
      : undefined;

    _openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return _openaiClient;
}

/**
 * Story Topic Analysis API
 *
 * Analyzes the interview transcript to determine if multiple distinct stories
 * have emerged that should be split into separate entries.
 *
 * Uses GPT-5 with medium reasoning effort for nuanced topic detection.
 */
export async function POST(request: NextRequest) {
  logger.debug("[AnalyzeTopics] POST request received");

  try {
    const body = await request.json();
    const { fullTranscript, messages } = body;

    if (!fullTranscript || typeof fullTranscript !== "string") {
      return NextResponse.json(
        { error: "fullTranscript is required" },
        { status: 400 }
      );
    }

    logger.api("[AnalyzeTopics] Analyzing conversation", {
      transcriptLength: fullTranscript.length,
      messageCount: messages?.length || 0,
    });

    const systemPrompt = `You are an expert at analyzing life story narratives and identifying distinct thematic topics.

Your task: Analyze this interview transcript and determine if multiple distinct stories should be separated.

Criteria for suggesting a split:
- The conversation has covered 2+ clearly different time periods (e.g., childhood AND career)
- The topics are thematically unrelated (e.g., moving to a new city AND learning to cook)
- Each topic has sufficient depth to stand alone as a story (3+ minutes of content)

DO NOT suggest splitting if:
- Topics are closely related (e.g., meeting spouse AND getting married)
- One topic is a sub-theme of another
- The narrative flows naturally as one continuous story

For each identified story, provide:
- title: Compelling 4-8 word title
- topic: 1-sentence description of the story's focus`;

    const userPrompt = `Analyze this interview transcript:

"${fullTranscript.trim()}"

Should this be split into multiple stories? Respond in JSON format:

{
  "shouldSplit": true/false,
  "stories": [
    {
      "title": "Story Title Here",
      "topic": "Brief description of what this story covers"
    }
  ]
}

If shouldSplit is false, return just one story in the array.`;

    const startTime = Date.now();
    const openai = getOpenAIClientWithGateway();
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      // @ts-ignore
      reasoning_effort: "medium",
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
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

    if (!content) {
      throw new Error("No response from GPT");
    }

    const analysis = JSON.parse(content);

    // Add message IDs (simplified - in real impl would map to actual message IDs)
    if (analysis.stories && Array.isArray(analysis.stories)) {
      analysis.stories = analysis.stories.map((story: any, index: number) => ({
        ...story,
        messageIds: [], // Would be populated based on message content matching
      }));
    }

    logger.api("[AnalyzeTopics] Analysis complete", {
      shouldSplit: analysis.shouldSplit,
      storyCount: analysis.stories?.length || 0,
      latencyMs,
      tokensUsed: response.usage?.total_tokens,
    });

    return NextResponse.json(analysis);

  } catch (error) {
    logger.error("[AnalyzeTopics] ERROR:", error);

    // Fallback: don't split on error
    return NextResponse.json({
      shouldSplit: false,
      stories: [],
    });
  }
}
