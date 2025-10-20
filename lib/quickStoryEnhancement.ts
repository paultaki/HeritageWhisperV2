/**
 * Quick Story Enhancement Utilities
 *
 * Intelligent transcript processing that handles self-corrections,
 * duplicates, and formatting while preserving the speaker's voice
 */

export interface EnhancementResult {
  original: string;
  enhanced: string;
  success: boolean;
  error?: string;
}

/**
 * Enhance a quick story transcript with intelligent processing
 *
 * Features:
 * - Self-correction detection (e.g., "1975, wait 1976" → "1976")
 * - Duplicate removal (e.g., "and and" → "and")
 * - Smart filler word reduction
 * - Proper punctuation including ?, !
 * - Paragraph formatting
 * - Voice preservation
 */
export async function enhanceQuickStoryTranscript(
  transcript: string
): Promise<EnhancementResult> {
  try {
    const response = await fetch("/api/transcripts/enhance-quick-story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        mode: "quick",
      }),
    });

    if (!response.ok) {
      throw new Error(`Enhancement failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      original: data.original || transcript,
      enhanced: data.enhanced || transcript,
      success: true,
    };
  } catch (error) {
    console.error("[Quick Story Enhancement] Error:", error);

    // Fallback: basic local processing
    const fallbackEnhanced = performBasicEnhancement(transcript);

    return {
      original: transcript,
      enhanced: fallbackEnhanced,
      success: false,
      error: error instanceof Error ? error.message : "Enhancement failed",
    };
  }
}

/**
 * Basic enhancement fallback when AI is unavailable
 * Handles simple cases locally
 */
function performBasicEnhancement(text: string): string {
  if (!text) return "";

  let enhanced = text;

  // Fix common duplicate words
  enhanced = enhanced.replace(/\b(\w+)\s+\1\b/gi, "$1");

  // Fix common self-corrections patterns
  enhanced = enhanced.replace(/\b(\w+)\s+(I mean|wait|no)\s+(\w+)\b/gi, "$3");

  // Add basic sentence ending punctuation
  enhanced = enhanced.replace(/([a-z])(\s+[A-Z])/g, "$1.$2");

  // Capitalize first letter
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

  // Add final period if missing
  if (!enhanced.match(/[.!?]$/)) {
    enhanced += ".";
  }

  // Basic paragraph breaks (every 4 sentences)
  const sentences = enhanced.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 4) {
    const paragraphs = [];
    for (let i = 0; i < sentences.length; i += 4) {
      paragraphs.push(sentences.slice(i, i + 4).join(" ").trim());
    }
    enhanced = paragraphs.join("\n\n");
  }

  return enhanced;
}

/**
 * Examples of self-corrections that should be handled:
 *
 * 1. Word replacements:
 *    "my brother, I mean my cousin" → "my cousin"
 *    "the red, no blue car" → "the blue car"
 *
 * 2. Date/number corrections:
 *    "in 1975, wait 1976" → "in 1976"
 *    "there were five, actually six people" → "there were six people"
 *
 * 3. False starts:
 *    "We had a, we had a wonderful time" → "We had a wonderful time"
 *    "The thing is, what I mean is" → "What I mean is"
 *
 * 4. Word duplicates:
 *    "and and" → "and"
 *    "the the dog" → "the dog"
 *
 * 5. Filler reduction:
 *    "So, um, like, you know, we went" → "So, we went"
 *    "It was, uh, really, um, amazing" → "It was really amazing"
 */

/**
 * Check if a transcript likely contains self-corrections
 * Used to determine if enhancement would be beneficial
 */
export function needsEnhancement(transcript: string): boolean {
  // Check for common patterns that indicate enhancement would help
  const patterns = [
    /\b(\w+)\s+\1\b/i, // Duplicate words
    /\b(I mean|wait|no|actually|sorry)\b/i, // Correction markers
    /\b(um|uh|like|you know)\b/gi, // Filler words
    /[a-z]\s+[A-Z]/g, // Missing sentence punctuation
  ];

  return patterns.some(pattern => pattern.test(transcript));
}