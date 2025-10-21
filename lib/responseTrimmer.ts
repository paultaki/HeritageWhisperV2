/**
 * Response Trimmer for PEARLS v1.1 Witness System
 *
 * Enforces one-question-per-turn rule by trimming responses:
 * - After first question mark (? ! or …?)
 * - After >2 sentences (. ! or …)
 *
 * Used in Realtime API to prevent Pearl from asking multiple questions.
 */

/**
 * Trim response to first question or max 2 sentences
 */
export function trimResponse(text: string): {
  trimmed: string;
  shouldCancel: boolean;
} {
  // Normalize text: remove extra whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');

  // Find first question mark (end of first question)
  const questionMatch = normalized.match(/^[^?]*?\?/);
  if (questionMatch) {
    return {
      trimmed: questionMatch[0].trim(),
      shouldCancel: normalized.length > questionMatch[0].length, // More text after question
    };
  }

  // Count sentences (split by . ! or …)
  const sentences = normalized.split(/[.!…]\s+/).filter(s => s.trim().length > 0);

  if (sentences.length <= 2) {
    // Under limit, no trimming needed
    return {
      trimmed: normalized,
      shouldCancel: false,
    };
  }

  // More than 2 sentences - trim to first 2
  const firstTwo = sentences.slice(0, 2).join('. ') + '.';
  return {
    trimmed: firstTwo,
    shouldCancel: true, // Cancel because we exceeded limit
  };
}

/**
 * Check if accumulated text exceeds trim threshold
 * Used during streaming to detect when to cancel response
 */
export function shouldCancelResponse(accumulatedText: string): boolean {
  const normalized = accumulatedText.trim();

  // Count question marks to detect multiple questions
  const questionCount = (normalized.match(/\?/g) || []).length;

  // If multiple question marks detected, check if they're "Or" questions (options)
  if (questionCount > 1) {
    // Check if questions are connected by "or" (compound question with options)
    const hasOrConnector = /\?\s+(Or|or)\s+/i.test(normalized);
    if (!hasOrConnector) {
      // Multiple separate questions without "or" = cancel
      return true;
    }
    // "Or" questions are allowed (e.g., "Would you like X? Or would you prefer Y?")
  }

  // Look for question mark followed by NEW SENTENCE (not starting with "Or")
  // This catches cases like "Question? And another sentence."
  const questionWithFollowup = /\?\s+(?!Or|or)[A-Z]/.test(normalized);
  if (questionWithFollowup) {
    // Extract text after the question mark
    const afterQuestion = normalized.split('?')[1];

    // If there's substantial text after (>20 chars), it's likely another question/sentence
    // Allow short follow-ups like "? What" (compound questions)
    if (afterQuestion && afterQuestion.trim().length > 20) {
      return true;
    }
  }

  // Count sentences (split by . ! or …)
  // Allow up to 3 sentences for natural conversation flow
  const sentences = normalized.split(/[.!…]\s+/).filter(s => s.trim().length > 0);
  return sentences.length > 3;
}
