/**
 * AI Prompt Sanitization Utilities
 * 
 * Protects against prompt injection attacks by sanitizing user input
 * before sending to OpenAI API.
 */

/**
 * Sanitize user text before sending to GPT
 * Removes potential injection patterns and system-level instructions
 */
export function sanitizeForGPT(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Remove system role attempts
  sanitized = sanitized.replace(/\bsystem\s*:/gi, '');
  sanitized = sanitized.replace(/\bassistant\s*:/gi, '');
  sanitized = sanitized.replace(/\buser\s*:/gi, '');

  // Remove override/ignore attempts
  sanitized = sanitized.replace(/\bignore\s+previous\b/gi, '');
  sanitized = sanitized.replace(/\bignore\s+all\s+previous\b/gi, '');
  sanitized = sanitized.replace(/\bdisregard\s+previous\b/gi, '');
  sanitized = sanitized.replace(/\bforget\s+previous\b/gi, '');
  sanitized = sanitized.replace(/\boverride\s+previous\b/gi, '');

  // Remove instruction injection attempts
  sanitized = sanitized.replace(/\bnew\s+instructions\b/gi, '');
  sanitized = sanitized.replace(/\bactual\s+instructions\b/gi, '');
  sanitized = sanitized.replace(/\breal\s+instructions\b/gi, '');

  // Remove template injection attempts
  sanitized = sanitized.replace(/\{\{.*?\}\}/g, '');
  sanitized = sanitized.replace(/\$\{.*?\}/g, '');

  // Remove prompt injection markers
  sanitized = sanitized.replace(/\[SYSTEM\]/gi, '');
  sanitized = sanitized.replace(/\[INST\]/gi, '');
  sanitized = sanitized.replace(/\[\/INST\]/gi, '');

  // Remove excessive newlines (potential for prompt confusion)
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  // Cap length to prevent context stuffing
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.slice(0, MAX_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Sanitize entity names for safe processing
 * Removes special characters that could be used for injection
 */
export function sanitizeEntity(entity: string): string {
  if (!entity || typeof entity !== 'string') {
    return '';
  }

  let sanitized = entity;

  // Remove system-level keywords
  sanitized = sanitized.replace(/\bsystem\b/gi, '');
  sanitized = sanitized.replace(/\broot\b/gi, '');
  sanitized = sanitized.replace(/\badmin\b/gi, '');

  // Remove template syntax
  sanitized = sanitized.replace(/[{}$]/g, '');

  // Cap length
  const MAX_ENTITY_LENGTH = 100;
  if (sanitized.length > MAX_ENTITY_LENGTH) {
    sanitized = sanitized.slice(0, MAX_ENTITY_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Normalize entity for fuzzy matching
 * Handles common spelling variations
 */
export function normalizeEntity(entity: string): string {
  if (!entity || typeof entity !== 'string') {
    return '';
  }

  return entity
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/ie$/g, 'y')        // Handle common endings (Katie -> Katy)
    .replace(/ey$/g, 'y')        // Chewy -> Chewy (but Chewey -> Chewy)
    .replace(/i$/g, 'y')         // Kati -> Katy
    .replace(/^the\s+/g, '');    // Remove "the" prefix
}

/**
 * Check if two entities are similar (fuzzy match)
 * Returns true if they're likely the same entity with different spelling
 */
export function entitiesMatch(entity1: string, entity2: string): boolean {
  if (!entity1 || !entity2) return false;

  const norm1 = normalizeEntity(entity1);
  const norm2 = normalizeEntity(entity2);

  // Exact match after normalization
  if (norm1 === norm2) return true;

  // Check Levenshtein distance for close matches
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  
  // Allow 1 character difference for every 5 characters
  const threshold = Math.ceil(maxLength / 5);
  
  return distance <= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validate that sanitized text is safe to send to GPT
 * Returns true if text passes all safety checks
 */
export function isSafeForGPT(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for remaining injection patterns (should be removed by sanitization)
  const dangerousPatterns = [
    /system\s*:/i,
    /ignore\s+previous/i,
    /\{\{.*?\}\}/,
    /\[SYSTEM\]/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // Check length
  if (text.length > 10000) {
    return false;
  }

  return true;
}
