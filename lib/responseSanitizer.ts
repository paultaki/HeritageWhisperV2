/**
 * Response Sanitizer for PEARLS v1.1 Witness System
 *
 * Prevents object-voice violations and qualifies ambiguous nouns:
 * - No role-playing as objects or body parts
 * - Qualify ambiguous nouns (e.g., "wooden chest" not "chest")
 *
 * Used in response path to validate Pearl's output.
 */

// Ambiguous nouns that need qualification
const AMBIGUOUS_NOUNS = new Set([
  'chest', // Could be body part or storage
  'trunk', // Could be body part, car part, or storage
  'plant', // Could be factory or vegetation
  'bat', // Could be animal or sports equipment
  'bank', // Could be financial or riverbank
  'bark', // Could be tree or dog sound
  'bear', // Could be animal or to carry
  'bow', // Could be weapon, ribbon, or forward part of ship
  'count', // Could be nobility or to enumerate
  'fair', // Could be event or appearance
  'foot', // Could be body part or measurement
  'hand', // Could be body part or card game
  'head', // Could be body part or leader
  'left', // Could be direction or past tense of leave
  'minute', // Could be time or small
  'second', // Could be time or position
]);

// Object-voice patterns (things speaking in first person)
const OBJECT_VOICE_PATTERNS = [
  /\bI(?:'m| am) (?:a |an |the )?(?:tree|rock|house|car|door|window|table|chair|cup|phone|book)/i,
  /\bAs (?:a |an |the )?(?:tree|rock|house|car|door|window|table|chair|cup|phone|book)/i,
  /(?:tree|rock|house|car|door|window|table|chair|cup|phone|book) speaking/i,
];

export type SanitizationResult = {
  isValid: boolean;
  sanitized: string;
  violations: string[];
};

/**
 * Sanitize Pearl's response for PEARLS v1.1 compliance
 */
export function sanitizeResponse(response: string): SanitizationResult {
  const violations: string[] = [];
  let sanitized = response;

  // Check for object-voice violations
  for (const pattern of OBJECT_VOICE_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(`Object-voice violation: "${response.match(pattern)?.[0]}"`);
    }
  }

  // Check for unqualified ambiguous nouns (simple heuristic)
  for (const noun of AMBIGUOUS_NOUNS) {
    // Look for the noun not preceded by a qualifier
    const unqualifiedPattern = new RegExp(`\\b(?<!wooden |metal |plastic |storage |car |human |your |my )${noun}\\b`, 'i');
    if (unqualifiedPattern.test(response)) {
      violations.push(`Ambiguous noun needs qualification: "${noun}"`);

      // Attempt automatic qualification (context-based)
      if (noun === 'chest' && /storage|furniture|attic|bedroom/i.test(response)) {
        sanitized = sanitized.replace(new RegExp(`\\b${noun}\\b`, 'gi'), 'storage chest');
      } else if (noun === 'trunk' && /car|vehicle|back/i.test(response)) {
        sanitized = sanitized.replace(new RegExp(`\\b${noun}\\b`, 'gi'), 'car trunk');
      } else if (noun === 'trunk' && /tree|wood|elephant/i.test(response)) {
        sanitized = sanitized.replace(new RegExp(`\\b${noun}\\b`, 'gi'), 'tree trunk');
      }
    }
  }

  return {
    isValid: violations.length === 0,
    sanitized,
    violations,
  };
}

/**
 * Validate response without modification
 */
export function validateResponse(response: string): boolean {
  return sanitizeResponse(response).isValid;
}
