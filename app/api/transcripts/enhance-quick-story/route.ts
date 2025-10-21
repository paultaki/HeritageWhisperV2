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

1. SELF-CORRECTIONS & FALSE STARTS (Always clean):
   - "I went to the store grocery store" → "I went to the grocery store"
   - "This was in 1975, wait 1976" → "This was in 1976"
   - "My brother, I mean my cousin" → "My cousin"
   - "We had a dog named, his name was Rex" → "We had a dog named Rex"
   - "I was, I was really happy" → "I was really happy"
   - "The car, the car was red" → "The car was red"

2. UNINTENTIONAL DUPLICATES (Always fix):
   - "and and" → "and"
   - "the the" → "the"
   - "was was" → "was"
   - "that that" → "that"
   - "we we" → "we"
   - "it it" → "it"
   - But KEEP intentional emphasis: "very very happy" or "really really good" stays as is

3. FILLER WORDS (Aggressively clean, but preserve voice):
   - Remove ALL "um", "uh", "uhm", "ah"
   - Remove ALL "like" when used as filler (keep when it means "similar to")
   - Remove ALL "you know" when used as filler
   - Remove "I mean" when it's redundant
   - Remove "kind of" / "sort of" when they weaken statements unnecessarily
   - MAY keep 1-2 filler words IF they're clearly part of someone's signature speech style
   - Examples:
     * "So um, like, you know, we went to, um, the park and, uh, it was, like, really nice"
       → "We went to the park and it was really nice."
     * "I was, um, kind of scared, you know, but I, uh, kept going"
       → "I was scared, but I kept going."

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

Input: "So um, yesterday I went to the, the store, you know, the grocery store and, um, picked up milk and and rolls I mean bread"
Output: "Yesterday I went to the grocery store and picked up milk and bread."

Input: "This happened in, um, 1975, wait, no, 1976 when I was, like, just a kid and my, my brother was, uh, there too, you know"
Output: "This happened in 1976 when I was just a kid, and my brother was there too."

Input: "Oh my goodness we were so um so happy that day you know it was just uh amazing like really really amazing"
Output: "Oh my goodness, we were so happy that day! It was just amazing—really, really amazing."

Input: "I mean, he was, he was kind of a character, you know, always, um, making people laugh and, uh, telling stories, you know what I mean"
Output: "He was a character, always making people laugh and telling stories."

Input: "We decided to, we decided to go to the park and, um, the kids, the kids were so excited, like, so so excited"
Output: "We decided to go to the park, and the kids were so, so excited."

The goal is CLEAN, readable text that captures the speaker's authentic voice without the verbal stumbles and filler.`;

  const userPrompt = `Clean up this spoken transcript while preserving the speaker's exact voice and personality:

${transcript}

Remember to:
1. Aggressively remove ALL filler words (um, uh, like, you know)
2. Fix ALL self-corrections and false starts
3. Remove ALL unintentional word duplicates
4. Add proper punctuation (including ? and ! where appropriate)
5. Break into paragraphs for readability
6. Keep it sounding exactly like the original speaker

The user wants it CLEAN - remove obvious stumbles and filler, but don't change their vocabulary or tone.`;

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