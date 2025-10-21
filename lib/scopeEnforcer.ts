/**
 * Scope Enforcer for Pearl's Realtime API Responses
 *
 * Server-side guard that catches off-topic or out-of-scope responses
 * before they reach text-to-speech. Works as defense-in-depth alongside
 * model instructions and response trimmer.
 *
 * Features:
 * - Regex-based detection of compliance bait and off-topic requests
 * - Automatic substitution with on-topic fallback questions
 * - Structural enforcement (one question, max 2 sentences)
 * - Rotating fallback questions to avoid repetition
 */

// Patterns that indicate off-topic/compliance bait
const OFF_TOPIC = /\b(knock[\s-]?knock|joke|google|search|browser|driver s?|update(s)?|support|device settings?)\b/i;
const OUT_OF_SCOPE = /audio (issue|driver|speaker|mic)|troubleshoot|diagnos(e|is)|weather|news|president|calculate|timer|music|advice about|therapy|counsel(ing)?|recommend(ation)?/i;

// Pool of fallback questions (rotated to avoid sounding repetitive)
const FALLBACK_QUESTIONS = [
  "How old were you then?",
  "Where did this take place?",
  "What happened next?",
  "Who was with you?",
  "What did the air feel like that day?",
  "What sounds do you remember from that moment?",
];

let fallbackIndex = 0;

/**
 * Get next fallback question (rotates through pool)
 */
function getNextFallback(): string {
  const question = FALLBACK_QUESTIONS[fallbackIndex];
  fallbackIndex = (fallbackIndex + 1) % FALLBACK_QUESTIONS.length;
  return question;
}

/**
 * Enforce scope and structural rules on Pearl's response
 *
 * @param text - Raw response from GPT model
 * @returns Sanitized response with scope violations replaced
 */
export function enforceScope(text: string): string {
  // Check for off-topic or out-of-scope content
  if (OFF_TOPIC.test(text) || OUT_OF_SCOPE.test(text)) {
    console.log('[ScopeEnforcer] ⚠️ Off-topic response detected, replacing with refusal');
    const fallback = getNextFallback();
    return `I can't do that. I'm here to listen and ask one question to help you tell your story. ${fallback}`;
  }

  // Enforce one question rule: extract text up to and including first question mark
  const questionMatch = text.match(/^(.*?\?)/s);
  if (!questionMatch) {
    // No question mark found - this shouldn't happen, but return as-is
    console.warn('[ScopeEnforcer] ⚠️ No question mark found in response');
    return text;
  }

  const firstQuestion = questionMatch[1].trim();

  // Enforce max 2 sentences before question
  // Split by sentence delimiters (. ! ...) but preserve the question
  const sentences = firstQuestion.split(/(?<=[.!…])\s+/).filter(s => s.trim().length > 0);

  if (sentences.length > 3) {
    // More than 2 sentences + question = too long
    // Keep last 2 sentences + question
    console.log('[ScopeEnforcer] ⚠️ Response too long, trimming to 2 sentences + question');
    const trimmed = sentences.slice(-2).join(' ');
    return trimmed;
  }

  return firstQuestion;
}

/**
 * Check if response contains multiple questions (violates one-question rule)
 *
 * This is a simpler check than the full trimmer - just counts question marks
 * and looks for "Or" connectors (which are allowed).
 *
 * @param text - Response text to check
 * @returns true if response has multiple separate questions
 */
export function hasMultipleQuestions(text: string): boolean {
  const questionCount = (text.match(/\?/g) || []).length;

  if (questionCount <= 1) {
    return false;
  }

  // Multiple question marks - check if they're "Or" questions (allowed)
  const hasOrConnector = /\?\s+(Or|or)\s+/i.test(text);

  return !hasOrConnector; // Violation if no "Or" connector
}
