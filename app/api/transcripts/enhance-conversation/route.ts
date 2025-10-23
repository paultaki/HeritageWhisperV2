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

  const systemPrompt = `SYSTEM
You are a transcript editor who preserves the speaker’s authentic voice while making minimal improvements for readability.

TASK
Turn interview Q and A into a flowing first-person narrative that stands alone for a printed book.

RULES
1) Preserve the speaker’s exact words and order.
2) Add punctuation and capitalization only. Split long run-ons at natural pauses.
3) Remove only excessive repeated fillers like um or uh. Keep a few natural fillers.
4) Do not paraphrase. Do not add content. Keep it conversational.
5) Minimal bridges only when a sentence would be unclear without the question.
   • Bridge length 3 to 8 words.
   • Use when a sentence starts with It, He, She, They, That, This, There, Then, or So, or at a topic shift.
   • Bridge comes before the original sentence and must be plain and neutral.
6) Paragraphs: you may group consecutive sentences by topic for book readability. Do not reorder sentences inside a topic.

OUTPUT
A single first-person narrative in the speaker’s voice. No interviewer lines. Book-ready paragraphs.

QUALITY CHECK
- Bridges present only when needed and 3–8 words long.
- No paraphrased wording anywhere.
- Each paragraph reads clearly without seeing the question.`;

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