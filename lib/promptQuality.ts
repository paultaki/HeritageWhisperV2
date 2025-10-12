/**
 * Prompt Quality Filter
 * 
 * Identifies and filters out poor quality prompts based on:
 * - Too generic
 * - Too long (>35 words)
 * - No specificity
 * - Psychology jargon
 */

interface QualityIssue {
  type: 'generic' | 'long' | 'vague' | 'therapy' | 'yes_no' | 'broken';
  reason: string;
}

/**
 * Check if prompt text is too generic
 */
function isTooGeneric(text: string): boolean {
  const genericPatterns = [
    /tell me more/i,
    /what else/i,
    /how did that make you feel/i,
    /can you elaborate/i,
    /would you like to share/i,
    /^what was it like/i, // Too broad
  ];
  
  return genericPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if prompt text is too long
 */
function isTooLong(text: string): boolean {
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount > 35;
}

/**
 * Check if prompt lacks specificity
 */
function lacksSpecificity(text: string): boolean {
  // Good prompts reference something specific
  const specificityMarkers = [
    'you mentioned',
    'you said',
    'you felt',
    'you described',
    'when you',
    'after',
    'before',
    'during',
  ];
  
  const hasSpecificMarker = specificityMarkers.some(marker => 
    text.toLowerCase().includes(marker)
  );
  
  // Also check for proper nouns or quoted text
  const hasProperNoun = /[A-Z][a-z]+/.test(text);
  const hasQuotes = /["']/.test(text);
  
  return !hasSpecificMarker && !hasProperNoun && !hasQuotes;
}

/**
 * Check if prompt uses therapy/psychology jargon
 */
function hasPsychobabble(text: string): boolean {
  const jargonPatterns = [
    /\bjourney\b/i,
    /\bgrowth\b/i,
    /\bresilience\b/i,
    /shaped you/i,
    /impacted/i,
    /\bhealing\b/i,
    /\bprocess\b/i,
    /\btransform/i,
    /inner/i,
    /deeper meaning/i,
  ];
  
  return jargonPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if prompt is a yes/no question
 */
function isYesNoQuestion(text: string): boolean {
  const yesNoPatterns = [
    /^did you/i,
    /^was it/i,
    /^were you/i,
    /^have you/i,
    /^can you/i,
    /^would you/i,
    /^do you/i,
  ];
  
  return yesNoPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if prompt has broken entity extraction (grammar errors)
 */
function hasBrokenEntity(text: string): boolean {
  const brokenPatterns = [
    // Articles/prepositions followed by past tense verbs
    /\s+(the|a|an)\s+(said|told|was|were|had|have)\b/i,
    // "something" followed by gibberish
    /something\s+[^a-zA-Z'"]/,
    // Multiple consecutive spaces
    /\s{2,}/,
    // Lone articles before verbs (e.g., "impress the said")
    /\b(impress|mention|talk|speak|discuss)\s+(the|a|an)\s+(said|told)/i,
    // Ending with article + noun that should be a verb
    /\b(the|a|an)\s+(tell|say|speak|talk)\s*\?/i,
  ];
  
  return brokenPatterns.some(pattern => pattern.test(text));
}

/**
 * Validate an extracted entity
 */
export function isValidEntity(entity: string): boolean {
  if (!entity || entity.length < 2) return false;
  
  const trimmed = entity.trim();
  
  // Reject articles/prepositions alone
  const invalidWords = /^(the|a|an|to|from|with|of|in|on|at|by|for)$/i;
  if (invalidWords.test(trimmed)) return false;
  
  // Reject if ends with article
  if (/\s+(the|a|an)$/i.test(trimmed)) return false;
  
  // Reject lone verbs
  const loneVerbs = /^(said|told|was|were|had|have|did|does|do|been|being)$/i;
  if (loneVerbs.test(trimmed)) return false;
  
  // Reject if starts with non-letter
  if (/^[^a-zA-Z]/.test(trimmed)) return false;
  
  // Reject if too short (1-2 chars)
  if (trimmed.length < 3) return false;
  
  // Reject obvious sentence fragments
  if (/\s+(and|or|but|so|yet)\s*$/i.test(trimmed)) return false;
  
  return true;
}

/**
 * Assess prompt quality
 * Returns array of issues (empty array = good quality)
 */
export function assessPromptQuality(promptText: string): QualityIssue[] {
  const issues: QualityIssue[] = [];
  
  // CRITICAL: Check for broken entity extraction first
  if (hasBrokenEntity(promptText)) {
    issues.push({
      type: 'broken',
      reason: 'Prompt has broken entity extraction (grammar errors)',
    });
  }
  
  if (isTooGeneric(promptText)) {
    issues.push({
      type: 'generic',
      reason: 'Prompt is too generic or vague',
    });
  }
  
  if (isTooLong(promptText)) {
    issues.push({
      type: 'long',
      reason: `Prompt is too long (${promptText.trim().split(/\s+/).length} words, max 35)`,
    });
  }
  
  if (lacksSpecificity(promptText)) {
    issues.push({
      type: 'vague',
      reason: 'Prompt lacks specific references to user\'s stories',
    });
  }
  
  if (hasPsychobabble(promptText)) {
    issues.push({
      type: 'therapy',
      reason: 'Prompt uses therapy/psychology jargon',
    });
  }
  
  if (isYesNoQuestion(promptText)) {
    issues.push({
      type: 'yes_no',
      reason: 'Prompt is a yes/no question',
    });
  }
  
  return issues;
}

/**
 * Check if prompt passes quality threshold
 * Allows 1 minor issue but not multiple
 */
export function isQualityPrompt(promptText: string): boolean {
  const issues = assessPromptQuality(promptText);
  
  // Broken entity = instant reject
  if (issues.some(i => i.type === 'broken')) return false;
  
  // No issues = good
  if (issues.length === 0) return true;
  
  // 1 minor issue (not generic, vague, or broken) = acceptable
  if (issues.length === 1 && 
      issues[0].type !== 'generic' && 
      issues[0].type !== 'vague' &&
      issues[0].type !== 'broken') {
    return true;
  }
  
  // Multiple issues or critical issues = bad
  return false;
}

/**
 * Filter array of prompts to only quality ones
 */
export function filterQualityPrompts<T extends { prompt_text?: string; promptText?: string }>(
  prompts: T[]
): T[] {
  return prompts.filter(prompt => {
    const text = prompt.prompt_text || prompt.promptText;
    return text ? isQualityPrompt(text) : false;
  });
}

/**
 * Get quality report for debugging
 */
export function getQualityReport(promptText: string): {
  isQuality: boolean;
  wordCount: number;
  issues: QualityIssue[];
  score: number;
} {
  const issues = assessPromptQuality(promptText);
  const wordCount = promptText.trim().split(/\s+/).length;
  const isQuality = isQualityPrompt(promptText);
  
  // Calculate quality score (0-100)
  let score = 100;
  issues.forEach(issue => {
    switch (issue.type) {
      case 'broken': score -= 100; break; // Instant zero
      case 'generic': score -= 40; break;
      case 'vague': score -= 30; break;
      case 'therapy': score -= 20; break;
      case 'long': score -= 15; break;
      case 'yes_no': score -= 10; break;
    }
  });
  
  return {
    isQuality,
    wordCount,
    issues,
    score: Math.max(0, score),
  };
}
