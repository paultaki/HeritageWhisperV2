/**
 * Prompt Sanitization for OpenAI API calls
 * Protects against prompt injection attacks
 */

/**
 * Sanitizes user input before including in prompts
 * Removes common prompt injection patterns while preserving authentic content
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Remove excessive whitespace/newlines that could break prompt structure
  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n"); // Max 3 consecutive newlines
  sanitized = sanitized.trim();

  // Detect and neutralize common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|all|above|prior)\s+instructions?/gi,
    /disregard\s+(previous|all|above|prior)\s+instructions?/gi,
    /forget\s+(previous|all|above|prior)\s+instructions?/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
  ];

  // Flag potential injection attempts
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      // Replace injection patterns with safe alternatives
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
  }

  // Remove control characters except common ones (tab, newline)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  // Limit total length to prevent token exhaustion attacks
  const MAX_LENGTH = 50000; // ~12k tokens at worst case
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.slice(0, MAX_LENGTH) + "... [truncated]";
  }

  return sanitized;
}

/**
 * Validates that sanitized input doesn't contain obvious injection attempts
 * Returns true if input appears safe, false otherwise
 */
export function validateSanitizedInput(sanitized: string): boolean {
  // Check for leftover injection markers
  const dangerousPatterns = [
    /\[REDACTED\]/i,
    /ignore.*instructions/i,
    /system\s*:/i,
    /assistant\s*:/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return false;
    }
  }

  return true;
}

/**
 * Safely formats user input for inclusion in prompts
 * Wraps in clear delimiters to prevent context bleeding
 */
export function formatUserInputForPrompt(
  input: string,
  label: string = "User Input",
): string {
  const sanitized = sanitizeUserInput(input);

  // Wrap in clear XML-style delimiters that are hard to escape
  return `<${label.toLowerCase().replace(/\s+/g, "_")}>
${sanitized}
</${label.toLowerCase().replace(/\s+/g, "_")}>`;
}

/**
 * Validates and sanitizes title/metadata fields
 * More restrictive than general content sanitization
 */
export function sanitizeMetadata(metadata: string): string {
  if (!metadata || typeof metadata !== "string") {
    return "";
  }

  let sanitized = metadata;

  // Remove newlines entirely from metadata
  sanitized = sanitized.replace(/[\r\n]+/g, " ");

  // Remove special characters that could break prompts
  sanitized = sanitized.replace(/[<>{}[\]]/g, "");

  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 200);

  return sanitized;
}

/**
 * Helper to safely construct prompts with user input
 */
export function buildSafePrompt(
  systemInstructions: string,
  userContent: string,
  contentLabel: string = "Content",
): { systemPrompt: string; userPrompt: string; isSafe: boolean } {
  const sanitizedContent = sanitizeUserInput(userContent);
  const isSafe = validateSanitizedInput(sanitizedContent);

  const formattedContent = formatUserInputForPrompt(
    sanitizedContent,
    contentLabel,
  );

  return {
    systemPrompt: systemInstructions,
    userPrompt: formattedContent,
    isSafe,
  };
}
