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
    // Take last 300 words for context (recent part of story)
    const words = transcript.split(/\s+/);
    const lastSection = words.slice(-300).join(' ');

    // Always use fast model for Echo (no reasoning needed)
    const modelConfig = getModelConfig("echo");

    const { text, meta } = await chat({
      model: modelConfig.model, // Always fast model (gpt-4o-mini)
      messages: [
        {
          role: "system",
          content: `You are a caring grandchild listening to your grandparent's story. Generate ONE follow-up question (max 25 words).

Rules:
- Reference a SPECIFIC detail they just mentioned
- Ask about sensory details (sight, sound, smell, touch, taste)
- Use their exact words when possible
- Be genuinely curious, not analytical
- Feel natural, like continuing a conversation
- Never be generic or therapeutic
- No generic nouns (girl, boy, man, woman, house, room)

Good examples:
"You said the sawdust smelled like home. What did Sunday mornings smell like there?"
"You mentioned a blue dress. Where did you wear it next?"
"That workshop sounds special. What was your favorite tool?"
"You said the diner had the best coffee. Who taught you to drink it black?"

Bad examples:
"Tell me more about your relationship with your father"
"How did that make you feel?"
"What was the most important lesson?"
"Can you describe the experience?"`,
        },
        {
          role: "user",
          content: `Generate one follow-up question for: "${lastSection}"`,
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
