/**
 * Extract Lesson Learned API
 *
 * Extracts a lesson learned from a story transcript using GPT-4o-mini.
 * Used for conversation mode (Pearl interviews) where transcription
 * bypasses the normal transcribe-assemblyai route.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy-initialized OpenAI client to avoid build-time errors
let _openaiClient: OpenAI | null = null;

function getOpenAIClientWithGateway(): OpenAI {
  if (!_openaiClient) {
    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
    const gatewayBaseURL = process.env.AI_GATEWAY_API_KEY
      ? 'https://ai-gateway.vercel.sh/v1'
      : undefined;

    _openaiClient = new OpenAI({
      apiKey: gatewayApiKey,
      baseURL: gatewayBaseURL,
      timeout: 30000, // 30 seconds
      maxRetries: 2,
    });
  }
  return _openaiClient;
}

const LESSON_EXTRACTION_SYSTEM_PROMPT = `You are extracting life lessons from personal stories.

Your goal is to find the wisdom that can be passed to future generations.
The lesson should be 15-20 words, clear, and meaningful.

Avoid:
- Generic platitudes ("Be yourself", "Follow your heart")
- Overly specific details that won't apply to others
- Negative framing ("Don't trust people")
- Abstract philosophy

Focus on:
- Universal truths discovered through personal experience
- Practical wisdom that guides decisions
- Character insights that shape who we become
- The cost and value of choices made`;

const LESSON_EXTRACTION_PROMPT = `From this story, extract ONE lesson learned.

Choose the most powerful insight - either:
1. PRACTICAL LESSON (what to DO in similar situations)
2. EMOTIONAL TRUTH (what to FEEL or how to process emotions)
3. CHARACTER INSIGHT (who to BE or what kind of person to become)

Return exactly ONE lesson, 15-20 words, in first person (I/me).
Example: "I learned that taking risks, even when afraid, often leads to the most meaningful experiences."`;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Invalid transcript' },
        { status: 400 }
      );
    }

    console.log('[ExtractLesson] Extracting lesson from transcript:', transcript.substring(0, 100) + '...');

    // Extract lesson using GPT-4o-mini
    const openai = getOpenAIClientWithGateway();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: LESSON_EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${LESSON_EXTRACTION_PROMPT}\n\nStory:\n${transcript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100, // ~15-20 words
    });

    const lesson = completion.choices[0]?.message?.content?.trim() || '';

    console.log('[ExtractLesson] Lesson extracted:', lesson);

    return NextResponse.json({ lesson });

  } catch (error) {
    console.error('[ExtractLesson] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract lesson',
        lesson: '' // Return empty lesson on error
      },
      { status: 500 }
    );
  }
}
