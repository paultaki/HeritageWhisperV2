/**
 * Audio Testing Utilities
 * 
 * Utility functions for comparing audio transcription services:
 * - Timing calculations
 * - Cost estimations
 * - Text difference analysis
 */

export interface TimingBreakdown {
  transcriptionMs: number;
  formattingMs: number;
  lessonExtractionMs?: number;
  totalMs: number;
}

export interface CostBreakdown {
  transcription: number;
  formatting: number;
  lessonExtraction?: number;
  total: number;
}

export interface PathResult {
  pathName: string;
  status: 'success' | 'timeout' | 'error';
  timing: TimingBreakdown;
  cost: CostBreakdown;
  quality: {
    transcription: string;
    formatted: string;
    lessons: {
      practical: string;
      emotional: string;
      character: string;
    };
    wordCount: number;
    confidence?: number;
  };
  error?: string;
}

/**
 * Calculate cost for AssemblyAI transcription
 * @param durationMinutes - Audio duration in minutes
 * @returns Cost in USD
 */
export function calculateAssemblyAICost(durationMinutes: number): number {
  return durationMinutes * 0.0025; // $0.0025 per minute
}

/**
 * Calculate cost for OpenAI Whisper transcription
 * @param durationMinutes - Audio duration in minutes
 * @returns Cost in USD
 */
export function calculateWhisperCost(durationMinutes: number): number {
  return durationMinutes * 0.006; // $0.006 per minute
}

/**
 * Calculate cost for GPT-4o-mini (formatting + lesson extraction)
 * Estimates based on typical token usage
 * @param textLength - Length of text to process
 * @returns Cost in USD
 */
export function calculateGPT4oMiniCost(textLength: number): number {
  // Rough estimate: ~1.5 tokens per character
  // Input: transcription + prompt (~1000 tokens overhead)
  // Output: formatted text + lessons (~1.2x input length)
  const inputTokens = Math.ceil(textLength * 1.5) + 1000;
  const outputTokens = Math.ceil(textLength * 1.8);
  
  // GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
  const inputCost = (inputTokens / 1_000_000) * 0.15;
  const outputCost = (outputTokens / 1_000_000) * 0.60;
  
  return inputCost + outputCost;
}

/**
 * Estimate audio duration from file size
 * Rough heuristic: 1MB ≈ 1 minute for typical speech audio
 * @param fileSizeBytes - Audio file size in bytes
 * @returns Estimated duration in minutes
 */
export function estimateAudioDuration(fileSizeBytes: number): number {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return Math.max(1, Math.round(fileSizeMB)); // At least 1 minute
}

/**
 * Count words in text
 * @param text - Text to count
 * @returns Word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate text difference percentage
 * Simple Levenshtein-based similarity
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Difference percentage (0-100, where 0 = identical)
 */
export function calculateTextDifference(text1: string, text2: string): number {
  const distance = levenshteinDistance(text1, text2);
  const maxLength = Math.max(text1.length, text2.length);
  
  if (maxLength === 0) return 0;
  
  return Math.round((distance / maxLength) * 100);
}

/**
 * Find different words between two texts
 * Returns words that appear in one but not the other
 */
export function findDifferentWords(text1: string, text2: string): {
  onlyInFirst: string[];
  onlyInSecond: string[];
} {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  const onlyInFirst = Array.from(words1).filter(w => !words2.has(w));
  const onlyInSecond = Array.from(words2).filter(w => !words1.has(w));
  
  return { onlyInFirst, onlyInSecond };
}

/**
 * Format milliseconds to human-readable time
 * @param ms - Milliseconds
 * @returns Formatted string (e.g., "7.2s", "1m 23s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = ms / 1000;
  
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format cost to USD string
 * @param cost - Cost in dollars
 * @returns Formatted string (e.g., "$0.0128")
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Create a timeout promise that rejects after specified duration
 * @param ms - Timeout duration in milliseconds
 * @param label - Label for error message
 * @returns Promise that rejects with timeout error
 */
export function createTimeout(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${label} timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Wrap a promise with timeout
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param label - Label for error message
 * @returns Promise that resolves/rejects with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeout(timeoutMs, label)
  ]);
}

/**
 * Levenshtein distance algorithm
 * Calculates minimum number of single-character edits between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Highlight differences between two texts
 * Returns HTML with <mark> tags around differences
 */
export function highlightDifferences(
  text1: string,
  text2: string
): { text1Html: string; text2Html: string } {
  const words1 = text1.split(/(\s+)/);
  const words2 = text2.split(/(\s+)/);
  
  // Simple word-by-word comparison
  const maxLength = Math.max(words1.length, words2.length);
  const highlighted1: string[] = [];
  const highlighted2: string[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    const word1 = words1[i] || '';
    const word2 = words2[i] || '';
    
    if (word1 !== word2) {
      if (word1) highlighted1.push(`<mark class="bg-red-200">${word1}</mark>`);
      if (word2) highlighted2.push(`<mark class="bg-green-200">${word2}</mark>`);
    } else {
      highlighted1.push(word1);
      highlighted2.push(word2);
    }
  }
  
  return {
    text1Html: highlighted1.join(''),
    text2Html: highlighted2.join('')
  };
}
