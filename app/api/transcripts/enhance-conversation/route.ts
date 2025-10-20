import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { QAPair } from "@/types/recording";

// Initialize OpenAI client with AI Gateway if available
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY!,
  baseURL: process.env.AI_GATEWAY_API_KEY
    ? "https://ai-gateway.vercel.sh/v1"
    : undefined,
});

/**
 * Enhance conversation transcript to create a cohesive story
 * while preserving the user's authentic voice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qaPairs, rawTranscript } = body;

    if (!qaPairs && !rawTranscript) {
      return NextResponse.json(
        { error: "Either qaPairs or rawTranscript is required" },
        { status: 400 }
      );
    }

    // If we have Q&A pairs, use them for better context
    let enhancedTranscript = "";

    if (qaPairs && qaPairs.length > 0) {
      enhancedTranscript = await enhanceWithQAPairs(qaPairs);
    } else if (rawTranscript) {
      enhancedTranscript = await enhanceRawTranscript(rawTranscript);
    }

    return NextResponse.json({
      original: rawTranscript,
      enhanced: enhancedTranscript,
      preservedVoice: true,
    });
  } catch (error) {
    console.error("[Enhance Conversation] Error:", error);
    return NextResponse.json(
      { error: "Failed to enhance transcript" },
      { status: 500 }
    );
  }
}

/**
 * Enhance transcript using Q&A pairs for better context
 */
async function enhanceWithQAPairs(qaPairs: QAPair[]): Promise<string> {
  // Build context string with questions for the AI
  const contextString = qaPairs
    .map((qa, index) =>
      `Question ${index + 1}: ${qa.question}\nAnswer ${index + 1}: ${qa.answer}`
    )
    .join("\n\n");

  const systemPrompt = `You are a transcript editor who PRESERVES the speaker's authentic voice while making minimal improvements for readability.

Your task is to transform interview Q&A pairs into a flowing narrative that sounds like the person is naturally telling their story.

CRITICAL RULES:
1. NEVER rewrite or rephrase the speaker's actual words - preserve their exact vocabulary and expressions
2. ONLY add minimal bridging words between segments when absolutely necessary (like "and", "then", "also")
3. ADD proper punctuation (periods, commas, question marks) to make it readable
4. PRESERVE all personal expressions, colloquialisms, and unique speech patterns
5. MAINTAIN the chronological order of the answers
6. DO NOT add any content that wasn't in the original answers
7. DO NOT make it sound more formal or literary - keep it conversational
8. REMOVE filler words only if they're excessive (um, uh) but keep some for naturalness
9. If answers reference the questions naturally, preserve those references

The goal is to make it read like a natural story while changing as little as possible.`;

  const userPrompt = `Transform these interview Q&A pairs into a flowing story, preserving the speaker's exact words and voice:

${contextString}

Create a version that reads naturally but uses the speaker's original words and expressions. Add only minimal connecting words and proper punctuation.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3, // Low temperature to minimize creativity
    max_tokens: 3000,
  });

  return completion.choices[0].message.content || "";
}

/**
 * Enhance raw transcript without Q&A context
 */
async function enhanceRawTranscript(rawTranscript: string): Promise<string> {
  const systemPrompt = `You are a transcript editor who adds ONLY punctuation and capitalization to make text readable.

RULES:
1. Add periods, commas, question marks, and other punctuation
2. Capitalize the first letter of sentences and proper nouns
3. DO NOT change any words
4. DO NOT rephrase anything
5. DO NOT remove filler words
6. DO NOT add any new content
7. Keep everything in the exact same order

Your only job is to make it readable by adding punctuation.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Add punctuation to this transcript:\n\n${rawTranscript}` }
    ],
    temperature: 0.1, // Very low temperature for minimal changes
    max_tokens: 3000,
  });

  return completion.choices[0].message.content || rawTranscript;
}