import { logger } from "./logger";
import { chat } from "./ai/gatewayClient";
import { getModelConfig } from "./ai/modelConfig";
import { validatePromptQuality } from "./promptQuality";

/**
 * Generate instant "echo" prompt after every story
 * This shows immediate listening and engagement
 *
 * Always uses fast model (gpt-4o-mini) for low latency.
 */
export async function generateEchoPrompt(transcript: string): Promise<string | null> {
  try {
    // Minimum transcript length check - skip if too short
    const words = transcript.split(/\s+/).filter(Boolean);
    if (words.length < 50) {
      logger.debug("[Echo Prompt] Transcript too short (<50 words), skipping");
      return null;
    }

    // Use FULL transcript - no cap needed
    // GPT-4o-mini can handle 128K tokens (~96K words)
    // Even 15-minute guided interviews (~3K words) are only 3% of capacity
    // Cost: ~$0.0006 per 3K words - negligible
    const contextSection = transcript.trim();

    // Always use fast model for Echo (no reasoning needed)
    const modelConfig = getModelConfig("echo");

    const { text, meta } = await chat({
      model: modelConfig.model, // Always fast model (gpt-4o-mini)
      messages: [
        {
          role: "system",
          content: `You just heard someone share a memory. Generate ONE follow-up question (max 25 words) that asks about a DIFFERENT but RELATED moment.

CRITICAL RULE: Ask about a DIFFERENT time or event, not the same one they just described.

PATTERN: "You mentioned [specific thing]. [Question about DIFFERENT moment with that thing]?"

HOW TO DO THIS:
1. Identify something specific they mentioned (a person, place, object, activity)
2. Ask about a DIFFERENT time involving that same thing
3. Never ask them to reflect deeper on what they just told you

GOOD EXAMPLES (ask about DIFFERENT moments):
- Story about first car → "You mentioned your dad teaching you to drive. What was the scariest moment behind the wheel that first year?"
- Story about wedding → "You mentioned your grandmother was there. What's a memory of her from before the wedding?"
- Story about childhood pet → "You said Rusty was an escape artist. What's the craziest place you ever found him?"
- Story about dad's workshop → "That workbench sounds special. What's something your dad tried to teach you there that you never quite got?"
- Story about summer vacation → "That lake sounds magical. Was there ever a summer when something went wrong there?"

BAD EXAMPLES (introspection about SAME moment - never do these):
- "What did that experience teach you about responsibility?" ❌
- "How did that moment change you?" ❌
- "What did you feel when that happened?" ❌
- "Tell me more about that relationship" ❌
- "What was the deeper meaning?" ❌

RULES:
- Reference something SPECIFIC from their story (name, place, object)
- Ask about a DIFFERENT time or event with that entity
- Be curious and warm, like a grandchild asking grandpa for another story
- No generic nouns (girl, boy, man, woman, house, room)
- Never comment on input quality or format`,
        },
        {
          role: "user",
          content: `The user just recorded this story:
"${contextSection}"

Generate ONE question that references something specific and asks about a DIFFERENT related memory.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 50,
    });

    logger.debug("[Echo Prompt] AI call completed:", {
      model: meta.modelUsed,
      latencyMs: meta.latencyMs,
    });
    
    const promptText = text?.trim();
    
    if (!promptText || promptText.length > 150) {
      logger.warn("[Echo Prompt] Generated text too long or empty");
      return null;
    }

    // Quality validation
    if (!validatePromptQuality(promptText)) {
      logger.warn(`[Echo Prompt] Failed quality check: "${promptText}"`);
      return null;
    }

    logger.debug("[Echo Prompt] Generated:", promptText);
    return promptText;
  } catch (error) {
    logger.error("[Echo Prompt] Generation failed:", error);
    return null;
  }
}

/**
 * Generate a simple anchor hash for echo prompts
 */
export function generateEchoAnchorHash(transcript: string): string {
  const crypto = require('crypto');
  // Use last 100 chars to create unique hash
  const lastChars = transcript.slice(-100);
  return crypto.createHash('sha1').update(`echo|${lastChars}`).digest('hex');
}
