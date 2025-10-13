/**
 * Prompt Quality Gates
 * 
 * Validates prompts before storage to ensure they demonstrate deep listening
 * and avoid generic/robotic phrasing.
 * 
 * Core principle: Prompts should prove the AI was listening by using specific
 * details, not generic nouns or therapy-speak.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Generic words that indicate low-quality entity extraction
 * If a prompt centers on these, it's not demonstrating listening
 */
const GENERIC_WORDS = new Set([
  "girl",
  "boy",
  "man",
  "woman",
  "person",
  "people",
  "house",
  "home",
  "room",
  "chair",
  "table",
  "place",
  "thing",
  "stuff",
  "kid",
  "child",
  "guy",
  "lady",
  "someone",
  "something",
]);

/**
 * Banned phrases that indicate robotic or therapy-speak prompts
 */
const BANNED_PHRASES = [
  "tell me more",
  "what else",
  "how did that make you feel",
  "what's the clearest memory",
  "in your story about",
  "you mentioned in",
  "describe the",
  "can you tell me",
];

/**
 * Words that signal emotional depth and turning points
 * These are GOOD to have in prompts
 */
const EMOTIONAL_DEPTH_SIGNALS = [
  "felt",
  "realized",
  "learned",
  "taught",
  "changed",
  "chose",
  "decided",
  "traded",
  "lost",
  "gained",
  "never",
  "always",
  "first",
  "last",
];

// ============================================================================
// ENTITY QUALITY VALIDATION
// ============================================================================

/**
 * Determine if an entity is "worthy" - specific enough to generate meaningful prompts
 * 
 * @param entity - The extracted entity string
 * @returns true if entity is specific/meaningful, false if generic
 * 
 * @example
 * isWorthyEntity("Chewy") // true - proper name
 * isWorthyEntity("my father") // true - possessive + relationship
 * isWorthyEntity("girl") // false - generic
 * isWorthyEntity("the hospital room") // false - generic place
 */
export function isWorthyEntity(entity?: string | null): boolean {
  if (!entity) return false;
  
  const trimmed = entity.trim();
  if (!trimmed) return false;
  
  const lower = trimmed.toLowerCase();
  
  // Reject if it's a standalone generic word
  if (GENERIC_WORDS.has(lower)) return false;
  
  // Reject phrases that start with generic words
  // "the girl", "a man", "my house" -> generic
  const firstWord = lower.split(/\s+/)[0];
  const secondWord = lower.split(/\s+/)[1];
  if (secondWord && GENERIC_WORDS.has(secondWord)) {
    // Exception: "my father", "his mother" etc are okay (possessive + family)
    const familyRoles = ["father", "mother", "dad", "mom", "brother", "sister", "son", "daughter"];
    if (firstWord === "my" || firstWord === "his" || firstWord === "her") {
      if (familyRoles.includes(secondWord)) {
        return true; // "my father" is worthy
      }
    }
    return false; // "the girl", "a man" not worthy
  }
  
  // Signal 1: Possessive markers ("my X", "father's workshop")
  if (/(?:my|his|her|their|our)\s+/i.test(lower)) return true;
  if (/\w+'s\b/i.test(lower)) return true; // "father's", "Coach's"
  
  // Signal 2: Proper name capitalization
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(trimmed)) return true;
  
  // Signal 3: Specific compound nouns (at least 2 words usually means more specific)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount >= 2) {
    // But still reject if second word is generic
    const words = lower.split(/\s+/);
    if (words.some(w => GENERIC_WORDS.has(w))) return false;
    return true;
  }
  
  // Signal 4: Known specific objects/places
  const specificNouns = [
    "workshop",
    "chevy",
    "chevelle",
    "workbench",
    "brownstone",
    "ridge trail",
    "camaro",
    "harley",
  ];
  if (specificNouns.some(noun => lower.includes(noun))) return true;
  
  return false;
}

// ============================================================================
// PROMPT QUALITY VALIDATION
// ============================================================================

/**
 * Validate that a prompt meets quality standards before storage
 * 
 * Quality criteria:
 * - Max 30 words
 * - No generic nouns (girl, boy, man, woman, house, room, chair)
 * - No robotic phrases ("in your story about", "tell me more")
 * - No therapy-speak ("how did that make you feel")
 * - Not a yes/no question
 * - Conversational tone
 * 
 * @param promptText - The prompt text to validate
 * @returns true if prompt passes quality gates, false otherwise
 * 
 * @example
 * validatePromptQuality("What did Girl look like?") // false - generic noun
 * validatePromptQuality("You felt 'housebroken by love.' What freedom did you trade?") // true
 */
export function validatePromptQuality(promptText?: string | null): boolean {
  if (!promptText) return false;
  
  const trimmed = promptText.trim();
  if (!trimmed) return false;
  
  // Rule 1: Hard cap at 30 words
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0 || wordCount > 30) {
    console.log(`[Quality Gate] REJECT: ${wordCount} words (max 30)`);
    return false;
  }
  
  const lower = trimmed.toLowerCase();
  
  // Rule 2: No generic nouns
  for (const generic of GENERIC_WORDS) {
    // Match as whole word, case-insensitive
    const pattern = new RegExp(`\\b${generic}\\b`, 'i');
    if (pattern.test(lower)) {
      console.log(`[Quality Gate] REJECT: Contains generic word "${generic}"`);
      return false;
    }
  }
  
  // Rule 3: No banned phrases (robotic/therapy-speak)
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      console.log(`[Quality Gate] REJECT: Contains banned phrase "${phrase}"`);
      return false;
    }
  }
  
  // Rule 4: No yes/no questions (these don't invite storytelling)
  // Check if starts with yes/no question words
  if (/^(did|was|were|is|are|do|does|have|has|can|could|would|will)\b/i.test(trimmed)) {
    console.log(`[Quality Gate] REJECT: Yes/no question format`);
    return false;
  }
  
  // Rule 5: Should have at least one emotional depth signal
  // (Not a hard rule, but prompts with these tend to be better)
  const hasDepthSignal = EMOTIONAL_DEPTH_SIGNALS.some(signal => 
    lower.includes(signal)
  );
  
  if (!hasDepthSignal) {
    // Log warning but don't reject (some good prompts might not have these)
    console.log(`[Quality Gate] WARNING: No emotional depth signals in prompt`);
  }
  
  return true;
}

// ============================================================================
// PROMPT SCORING
// ============================================================================

/**
 * Score a prompt's quality for prioritization
 * 
 * Scoring algorithm:
 * Base: 50 points
 * + 20 if uses exact unique phrase (in quotes)
 * + 15 if references multiple stories
 * + 15 if asks about absence/gap
 * + 10 if acknowledges contradiction
 * + 10 if has emotional depth signals
 * - 30 if contains generic noun (should be caught by validator first)
 * - 20 if uses formal language
 * 
 * @param promptText - The prompt to score
 * @param metadata - Additional context about the prompt
 * @returns Score from 0-100
 */
export function scorePromptQuality(
  promptText: string,
  metadata?: {
    usesExactPhrase?: boolean;
    referencesMultipleStories?: boolean;
    asksAboutAbsence?: boolean;
    acknowledgesContradiction?: boolean;
  }
): number {
  let score = 50; // Base score
  
  const lower = promptText.toLowerCase();
  
  // Bonus: Uses exact phrase (indicated by quotes)
  if (metadata?.usesExactPhrase || /['"]/.test(promptText)) {
    score += 20;
  }
  
  // Bonus: References multiple stories
  if (metadata?.referencesMultipleStories) {
    score += 15;
  }
  
  // Bonus: Asks about absence/gap
  if (metadata?.asksAboutAbsence || /never mention|absent|missing|avoid/.test(lower)) {
    score += 15;
  }
  
  // Bonus: Acknowledges contradiction
  if (metadata?.acknowledgesContradiction || /but|however|though|yet/.test(lower)) {
    score += 10;
  }
  
  // Bonus: Has emotional depth signals
  const depthSignalCount = EMOTIONAL_DEPTH_SIGNALS.filter(signal => 
    lower.includes(signal)
  ).length;
  score += depthSignalCount * 5; // Up to +10 for 2+ signals
  
  // Penalty: Generic nouns (shouldn't happen if validator was used)
  for (const generic of GENERIC_WORDS) {
    if (new RegExp(`\\b${generic}\\b`, 'i').test(lower)) {
      score -= 30;
    }
  }
  
  // Penalty: Formal language
  if (/\b(furthermore|moreover|additionally|consequently)\b/i.test(lower)) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const qualityGates = {
  isWorthyEntity,
  validatePromptQuality,
  scorePromptQuality,
  GENERIC_WORDS,
  BANNED_PHRASES,
  EMOTIONAL_DEPTH_SIGNALS,
};
