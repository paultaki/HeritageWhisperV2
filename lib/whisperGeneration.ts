/**
 * Whisper Prompt Generation
 * Creates context-aware prompts based on stories
 * 
 * Uses GPT-5 at medium effort when enabled for deeper synthesis.
 */
import { toSeverity } from "@/lib/typesafe";

import { chat } from "./ai/gatewayClient";
import { getModelConfig } from "./ai/modelConfig";
import { validatePromptQuality } from "./promptQuality";

export interface Story {
  id: string;
  title: string;
  transcript: string;
  story_year: number;
}

/**
 * Generate a whisper prompt based on a story
 * Looks for what wasn't explicitly said but is emotionally present
 */
export async function generateWhisperForStory(story: Story): Promise<string> {
  try {
    // Get model configuration (GPT-5 at medium effort if enabled)
    const modelConfig = getModelConfig("whisper");
    
    console.log(
      `[Whisper] Generating for story ${story.id} using ${modelConfig.model} (effort: ${modelConfig.reasoning_effort ?? "n/a"})`
    );

    const { text, meta } = await chat({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: `Generate ONE question showing you heard what they DIDN'T say.

Look for:
- The emotion shown but not named
- The person mentioned briefly who clearly mattered
- The small detail that carries weight
- The word they repeated without realizing
- The contradiction that reveals truth

NEVER:
- Ask about facts or dates
- Use psychology language
- Reference multiple stories
- Ask yes/no questions
- Use generic nouns (girl, boy, man, woman, house, room)

The question should be under 30 words and feel like it comes from love.`,
        },
        {
          role: "user",
          content: `Story from ${story.story_year}: ${story.transcript}`,
        },
      ],
      reasoning_effort: toSeverity(modelConfig.reasoning_effort),
      temperature: 0.7,
      max_tokens: 60,
    });

    // Log telemetry
    console.log("[Whisper] AI call completed:", {
      model: meta.modelUsed,
      effort: meta.reasoningEffort,
      ttftMs: meta.ttftMs,
      latencyMs: meta.latencyMs,
      costUsd: meta.costUsd.toFixed(4),
    });

    // Quality validation (ensure under 30 words, no generic entities)
    if (text && !validatePromptQuality(text)) {
      console.warn(`[Whisper] Generated prompt failed quality check: "${text}"`);
      return ""; // Reject low-quality whispers
    }

    return text || "";
  } catch (error) {
    console.error("[WhisperGeneration] Error generating prompt:", error);
    return "";
  }
}

/**
 * Generate multiple whisper prompts for a batch of stories
 * Returns prompts in the same order as stories
 */
export async function generateWhispersForStories(
  stories: Story[]
): Promise<Array<{ id: string; promptText: string }>> {
  const prompts: Array<{ id: string; promptText: string }> = [];

  for (const story of stories) {
    const promptText = await generateWhisperForStory(story);
    if (promptText) {
      prompts.push({
        id: `whisper-${story.id}-${Date.now()}`,
        promptText,
      });
    }
  }

  return prompts;
}
