// Keyword-Prompt Mapping for In-Flow Follow-ups
// Each entry contains keywords/patterns and the corresponding follow-up question

export interface KeywordPrompt {
  keywords: string[];
  prompt: string;
  category: 'choice' | 'emotion' | 'wisdom' | 'sensory' | 'relationship';
}

export const KEYWORD_PROMPTS: KeywordPrompt[] = [
  {
    keywords: ['decided', 'choice', 'chose', 'decision'],
    prompt: 'What was happening inside you when you made that choice?',
    category: 'choice'
  },
  {
    keywords: ['scared', 'afraid', 'fear', 'frightened'],
    prompt: 'How did you find the courage to face that fear?',
    category: 'emotion'
  },
  {
    keywords: ['learned', 'lesson', 'realized', 'understood'],
    prompt: 'What would you tell someone facing the same situation?',
    category: 'wisdom'
  },
  {
    keywords: ['smell', 'taste', 'sound', 'felt like', 'looked like'],
    prompt: 'Can you paint that scene for me - what details stay with you?',
    category: 'sensory'
  },
  {
    keywords: ['mother', 'father', 'mom', 'dad', 'parent'],
    prompt: 'What did they teach you without using words?',
    category: 'relationship'
  },
  {
    keywords: ['changed', 'different', 'transformed', 'never the same'],
    prompt: 'What ended and what began in that moment?',
    category: 'choice'
  },
  {
    keywords: ['proud', 'accomplished', 'achieved', 'succeeded'],
    prompt: 'What price did you pay for that achievement?',
    category: 'wisdom'
  },
  {
    keywords: ['lost', 'gone', 'died', 'passed'],
    prompt: 'What do you carry forward from them?',
    category: 'emotion'
  },
  {
    keywords: ['friend', 'friendship', 'best friend', 'companion'],
    prompt: 'How did that friendship shape who you became?',
    category: 'relationship'
  },
  {
    keywords: ['mistake', 'wrong', 'regret', 'failed'],
    prompt: 'What gift came disguised in that failure?',
    category: 'wisdom'
  },
  {
    keywords: ['love', 'loved', 'fell in love', 'heart'],
    prompt: 'What did love teach you about yourself?',
    category: 'emotion'
  },
  {
    keywords: ['home', 'house', 'neighborhood', 'place'],
    prompt: 'What made that place feel like home to you?',
    category: 'sensory'
  },
  {
    keywords: ['child', 'children', 'kids', 'baby'],
    prompt: 'What surprised you most about becoming a parent?',
    category: 'relationship'
  },
  {
    keywords: ['work', 'job', 'career', 'boss'],
    prompt: 'What did that work reveal about your character?',
    category: 'wisdom'
  },
  {
    keywords: ['moment', 'suddenly', 'instant', 'that day'],
    prompt: 'What was different about you after that moment?',
    category: 'choice'
  }
];

/**
 * Extract the last N words from a transcript
 */
export function getLastWords(transcript: string, wordCount: number = 50): string {
  const words = transcript.trim().split(/\s+/);
  return words.slice(-wordCount).join(' ').toLowerCase();
}

/**
 * Check if text contains any of the keywords
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Find matching keyword prompt based on recent transcript
 * Returns null if no match found
 */
export function findMatchingPrompt(
  transcript: string, 
  usedPrompts: string[] = []
): KeywordPrompt | null {
  const recentText = getLastWords(transcript, 50);
  
  // Find all matching prompts
  const matches = KEYWORD_PROMPTS.filter(kp => {
    // Skip if already used
    if (usedPrompts.includes(kp.prompt)) return false;
    
    // Check if keywords match
    return containsKeywords(recentText, kp.keywords);
  });
  
  // Return the first match (could randomize if multiple matches)
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Get a fallback prompt when no keywords match
 * Avoids repeating already used prompts
 */
export function getFallbackPrompt(usedPrompts: string[] = []): string {
  const fallbacks = [
    'Tell me more about that feeling.',
    'What details do you remember most vividly?',
    'How did that experience change you?',
    'What would you want others to know about this?',
    'Can you describe what that moment felt like?'
  ];
  
  const available = fallbacks.filter(p => !usedPrompts.includes(p));
  return available.length > 0 ? available[0] : fallbacks[0];
}