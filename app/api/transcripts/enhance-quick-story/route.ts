import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client with AI Gateway if available
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY!,
  baseURL: process.env.AI_GATEWAY_API_KEY
    ? "https://ai-gateway.vercel.sh/v1"
    : undefined,
});

/**
 * Enhanced transcript processing for quick story recordings
 * Handles self-corrections, duplicates, and formatting while preserving voice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, mode = "quick" } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Process the transcript with intelligent enhancement
    const enhanced = await enhanceQuickStoryTranscript(transcript);

    return NextResponse.json({
      original: transcript,
      enhanced: enhanced,
      preservedVoice: true,
      mode: mode,
    });
  } catch (error) {
    console.error("[Enhance Quick Story] Error:", error);
    return NextResponse.json(
      { error: "Failed to enhance transcript" },
      { status: 500 }
    );
  }
}

/**
 * Enhance quick story transcript with intelligent self-correction handling
 */
async function enhanceQuickStoryTranscript(transcript: string): Promise<string> {
  const systemPrompt = `You are an intelligent transcript editor that cleans up spoken language while PRESERVING the speaker's authentic voice and personality.

Your task is to transform raw speech transcription into clean, readable text that still sounds EXACTLY like the original speaker.

CRITICAL RULES FOR VOICE PRESERVATION:
1. NEVER change the speaker's tone, style, or personality
2. KEEP all colloquialisms, regional expressions, and personal speech patterns
3. MAINTAIN the informal/formal level of the original speech
4. PRESERVE emotion and emphasis where evident
5. DO NOT make it sound more literary or formal than the original

WHAT TO FIX:

1. SELF-CORRECTIONS & FALSE STARTS:
   - "I went to the store grocery store" → "I went to the grocery store"
   - "This was in 1975, wait 1976" → "This was in 1976"
   - "My brother, I mean my cousin" → "My cousin"
   - "We had a dog named, his name was Rex" → "We had a dog named Rex"

2. UNINTENTIONAL DUPLICATES:
   - "and and" → "and"
   - "the the" → "the"
   - But KEEP intentional emphasis: "very very happy" stays as is

3. FILLER WORDS (remove most, keep some for naturalness):
   - Remove excessive "um", "uh", "you know", "like"
   - But keep a few if they're part of the person's natural speech pattern
   - Example: "So um, like, you know, we went to, um, the park" → "So, we went to the park"

4. PUNCTUATION:
   - Add periods, commas, question marks, and exclamation points
   - Use exclamation points CONSERVATIVELY (only for clear excitement/surprise)
   - Add question marks for obvious questions
   - Use commas for natural pauses

5. CAPITALIZATION:
   - Capitalize sentence beginnings and proper nouns
   - Keep consistent with standard English rules

6. PARAGRAPH BREAKS:
   - Break into paragraphs at natural topic shifts
   - Typically every 3-5 sentences when the topic or time changes
   - Create visual breathing room for readability

WHAT TO PRESERVE:
- All actual content and facts
- The speaker's vocabulary choices
- Emotional expressions ("oh my goodness", "well I never", etc.)
- Personal expressions and catchphrases
- The overall conversational tone
- Intentional repetition for emphasis

EXAMPLES:

Input: "Yesterday I went to the store grocery store and picked up milk and and rolls I mean bread"
Output: "Yesterday, I went to the grocery store and picked up milk and bread."

Input: "This happened in 1975 wait 1976 when I was just a kid and my my brother was there too"
Output: "This happened in 1976 when I was just a kid, and my brother was there too."

Input: "Oh my goodness we were so so happy that day you know it was just amazing really amazing"
Output: "Oh my goodness, we were so happy that day! It was just amazing, really amazing."

The goal is a clean, readable transcript that sounds exactly like the person speaking, just without the stumbles.`;

  const userPrompt = `Clean up this spoken transcript while preserving the speaker's exact voice and personality:

${transcript}

Remember to:
1. Fix self-corrections and false starts
2. Remove unintentional word duplicates
3. Add proper punctuation (including ? and ! where appropriate)
4. Break into paragraphs for readability
5. Keep it sounding exactly like the original speaker`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // Using GPT-4o for better understanding of context
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3, // Low temperature for consistency
    max_tokens: 4000,
  });

  return completion.choices[0].message.content || transcript;
}