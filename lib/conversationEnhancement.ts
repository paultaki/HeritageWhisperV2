import { QAPair } from "@/types/recording";

/**
 * Enhance conversation transcript while preserving voice
 *
 * This function takes Q&A pairs from a guided interview and creates
 * a flowing narrative that preserves the user's authentic voice
 */
export async function enhanceConversationTranscript(
  qaPairs: QAPair[] | undefined,
  rawTranscript: string
): Promise<{
  original: string;
  enhanced: string;
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch("/api/transcripts/enhance-conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qaPairs,
        rawTranscript,
      }),
    });

    if (!response.ok) {
      throw new Error(`Enhancement failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      original: data.original || rawTranscript,
      enhanced: data.enhanced || rawTranscript,
      success: true,
    };
  } catch (error) {
    console.error("[Conversation Enhancement] Error:", error);

    // Fallback: at minimum, add basic punctuation locally
    const fallbackEnhanced = addBasicPunctuation(rawTranscript);

    return {
      original: rawTranscript,
      enhanced: fallbackEnhanced,
      success: false,
      error: error instanceof Error ? error.message : "Enhancement failed",
    };
  }
}

/**
 * Simple fallback function to add basic punctuation
 * Used when AI enhancement fails
 */
function addBasicPunctuation(text: string): string {
  if (!text) return "";

  // Split into rough sentences (very basic)
  let enhanced = text;

  // Add periods at natural pauses (crude but better than nothing)
  enhanced = enhanced.replace(/(\w)\s+([A-Z])/g, "$1. $2");

  // Capitalize first letter
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

  // Add final period if missing
  if (!enhanced.match(/[.!?]$/)) {
    enhanced += ".";
  }

  return enhanced;
}

/**
 * Process conversation mode data for the wizard
 * Automatically enhances the transcript if Q&A pairs are available
 */
export async function processConversationData(
  qaPairs: QAPair[] | undefined,
  rawTranscript: string
): Promise<{
  originalTranscript: string;
  enhancedTranscript: string;
  hasQAPairs: boolean;
}> {
  // If no Q&A pairs, just return the raw transcript for both
  if (!qaPairs || qaPairs.length === 0) {
    return {
      originalTranscript: rawTranscript,
      enhancedTranscript: rawTranscript,
      hasQAPairs: false,
    };
  }

  // Enhance the transcript using Q&A context
  const enhancement = await enhanceConversationTranscript(qaPairs, rawTranscript);

  return {
    originalTranscript: rawTranscript,
    enhancedTranscript: enhancement.enhanced,
    hasQAPairs: true,
  };
}