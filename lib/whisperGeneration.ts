/**
 * Whisper Prompt Generation
 * Creates context-aware prompts based on stories
 */

import OpenAI from "openai";

// Initialize OpenAI client with Vercel AI Gateway
// Falls back to direct OpenAI API if AI_GATEWAY_API_KEY is not set
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_GATEWAY_API_KEY
  ? 'https://ai-gateway.vercel.sh/v1'
  : undefined;

if (!apiKey) {
  throw new Error("AI_GATEWAY_API_KEY or OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey,
  baseURL,
});

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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

The question should be under 30 words and feel like it comes from love.`,
        },
        {
          role: "user",
          content: `Story from ${story.story_year}: ${story.transcript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 60,
    });

    return response.choices[0].message.content || "";
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
