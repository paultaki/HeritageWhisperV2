/**
 * AI Model Configuration
 * 
 * Centralized model selection and reasoning effort configuration.
 * Supports GPT-5 with adjustable reasoning_effort for Tier-3 and Whispers.
 */

export const flags = {
  GPT5_TIER3_ENABLED: process.env.NEXT_PUBLIC_GPT5_TIER3_ENABLED === "true",
  GPT5_WHISPERS_ENABLED: process.env.NEXT_PUBLIC_GPT5_WHISPERS_ENABLED === "true",
};

export const models = {
  fastChat: process.env.NEXT_PUBLIC_FAST_MODEL_ID ?? "gpt-4o-mini", // Tier-1, Echo
  gpt5Chat: process.env.NEXT_PUBLIC_GPT5_MODEL_ID ?? "gpt-5",       // Tier-3, Whispers
};

export type ReasoningEffort = "low" | "medium" | "high";

/**
 * Determine reasoning effort based on milestone depth
 * 
 * @param milestone - Story count milestone (1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100)
 * @returns Reasoning effort level
 */
export function effortForMilestone(milestone: number): ReasoningEffort {
  if (milestone >= 50) return "high";   // Stories 50+: Deep synthesis
  if (milestone >= 10) return "medium"; // Stories 10-49: Pattern recognition
  return "low";                         // Stories 1-9: Basic analysis
}

/**
 * Get model configuration for operation type
 */
export function getModelConfig(operation: "tier1" | "echo" | "tier3" | "whisper", milestone?: number) {
  switch (operation) {
    case "tier1":
    case "echo":
      return {
        model: models.fastChat,
        reasoning_effort: undefined, // No reasoning for fast operations
      };
    
    case "tier3":
      return {
        model: flags.GPT5_TIER3_ENABLED ? models.gpt5Chat : models.fastChat,
        reasoning_effort: flags.GPT5_TIER3_ENABLED && milestone 
          ? effortForMilestone(milestone) 
          : undefined,
      };
    
    case "whisper":
      return {
        model: flags.GPT5_WHISPERS_ENABLED ? models.gpt5Chat : models.fastChat,
        reasoning_effort: flags.GPT5_WHISPERS_ENABLED ? "medium" : undefined,
      };
    
    default:
      return {
        model: models.fastChat,
        reasoning_effort: undefined,
      };
  }
}

