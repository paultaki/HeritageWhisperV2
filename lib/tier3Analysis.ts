/**
 * Tier 3 Milestone-Based AI Analysis
 *
 * Combined analysis at story milestones using GPT-4o:
 * - Generates 2-5 high-quality personalized prompts
 * - Extracts character traits, invisible rules, contradictions
 * - Stores in active_prompts + character_evolution tables
 */

import OpenAI from "openai";
import { generateAnchorHash } from "./promptGenerationV2";
import { sanitizeForGPT, sanitizeEntity } from "./sanitization";

// Initialize OpenAI client with Vercel AI Gateway
// Falls back to direct OpenAI API if AI_GATEWAY_API_KEY is not set
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_GATEWAY_API_KEY
  ? 'https://ai-gateway.vercel.sh/v1'
  : undefined;

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

if (!isBuildPhase && !apiKey) {
  throw new Error("AI_GATEWAY_API_KEY or OPENAI_API_KEY environment variable is required");
}

// PRODUCTION OPTIMIZATION: Added timeout (60s) and retry logic (3 attempts) to prevent hangs
const openai = new OpenAI({
  apiKey: apiKey || 'sk-placeholder-for-build-phase',
  baseURL,
  timeout: 60000,  // 60 seconds - prevents indefinite hangs on slow/unresponsive API
  maxRetries: 3,   // Retry up to 3 times on 500/502/503/504 errors with exponential backoff
});

interface Story {
  id: string;
  title: string;
  transcription: string;
  lesson_learned?: string;
  created_at: string;
}

interface Tier3Prompt {
  prompt: string;
  trigger: string;
  anchor_entity: string;
  recording_likelihood: number;
  reasoning: string;
}

interface Tier3Result {
  prompts: Tier3Prompt[];
}

/**
 * Get life phase from age
 */
function getLifePhase(age: number | null | undefined): string {
  if (!age) return "unknown";
  if (age <= 12) return "childhood";
  if (age <= 19) return "teen";
  if (age <= 29) return "early_adult";
  if (age <= 49) return "mid_adult";
  if (age <= 64) return "late_adult";
  return "senior";
}

/**
 * Perform Tier 3 combined analysis at milestones
 */
export async function performTier3Analysis(
  stories: Story[],
  storyCount: number,
): Promise<Tier3Result> {
  console.log(`[Tier 3] Starting combined analysis for ${storyCount} stories`);

  // Determine number of prompts to generate based on milestone
  let promptCount = 3;
  if (storyCount === 1 || storyCount === 2) promptCount = 5;
  else if (storyCount === 3)
    promptCount = 4; // Special: 1 unlocked + 3 locked
  else if (storyCount >= 4 && storyCount <= 20) promptCount = 3;
  else if (storyCount >= 30 && storyCount <= 50) promptCount = 2;
  else promptCount = 1;

  // Story analysis context
  const ageRange = "unknown"; // Would need birth year + story years from metadata
  const dominantPhase = "unknown"; // Will be enhanced later with age calculation

  // Build the prompt
  const systemPrompt = buildSystemPrompt(
    storyCount,
    promptCount,
    ageRange,
    dominantPhase,
  );
  const userPrompt = buildUserPrompt(stories);

  console.log(
    `[Tier 3] Calling GPT-4o to analyze ${stories.length} stories and generate ${promptCount} prompts`,
  );

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      // Note: response_format not supported by AI Gateway
      // Prompt engineering ensures JSON response instead
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from GPT-4o");
    }

    // Strip markdown code fences if present (GPT-4o sometimes wraps JSON in ```json)
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      // Remove opening fence (```json or ```)
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "");
      // Remove closing fence (```)
      cleanedContent = cleanedContent.replace(/\n?```$/, "");
    }

    const result = JSON.parse(cleanedContent);
    console.log(
      `[Tier 3] Analysis complete: ${result.prompts?.length || 0} prompts generated`,
    );

    return result;
  } catch (error) {
    console.error("[Tier 3] GPT-4o analysis failed:", error);
    throw error;
  }
}

/**
 * Build system prompt based on story count
 */
function buildSystemPrompt(
  storyCount: number,
  promptCount: number,
  ageRange: string,
  dominantPhase: string,
): string {
  let analysisType = "expansion"; // Story 1-2
  if (storyCount === 3)
    analysisType = "killer"; // Story 3 (pre-paywall)
  else if (storyCount >= 4) analysisType = "patterns"; // Story 4+

  return `You are creating ${promptCount} personalized prompts for someone who has shared ${storyCount} life stories.

YOUR MISSION:
Create simple, personalized prompts that encourage them to continue sharing. Not creative or clever - just personal touches that show you know their story.

HOW TO PERSONALIZE (SIMPLE IS BETTER):
1. Extract concrete details from their stories:
   - Workplaces: "PG&E", "the hospital", "the factory"
   - People: "Coach Johnson", "my sister Mary", "Dr. Smith"
   - Places: "Brooklyn", "the farm in Iowa", "Fort Bragg"
   - Time periods: "the 1960s", "during Vietnam", "after retirement"

2. Transform generic prompts into personalized ones:
   GENERIC: "Tell me about a challenge you overcame"
   PERSONALIZED: "What was a challenge you faced during your time at PG&E?"

   GENERIC: "Share a story from your youth"
   PERSONALIZED: "You've mentioned Brooklyn - what was it like growing up there?"

   GENERIC: "Describe someone who influenced you"
   PERSONALIZED: "Besides Coach, who else shaped who you became?"

3. Fill obvious gaps in their timeline:
   - Missing decades: "You've shared your 20s and 40s - what about your 30s?"
   - Missing topics: "You've talked about work - what about your family life?"
   - Missing people: "You mention 'the kids' - tell me about them"

ADD LIGHT ENCOURAGEMENT (when appropriate):
- Story 5+: "You're building quite a collection of memories..."
- Story 10+: "Your family will treasure these stories..."
- Story 25+: "You've really opened up your life here..."

CRITICAL FORMATTING RULES:
- MAX 30 WORDS (target 25-30)
- NO STORY TITLES in the prompt (users remember their own life!)
- Conversational tone like a friend asking, not a research paper
- Formula: Reference (5-10 words) + Connection (5-10 words) + Question (10-15 words)
- Test: Can you read the whole prompt in 3 seconds?

DO THIS:
✅ "You learned responsibility from Chewy the dog, then felt 'housebroken by love.' How did Chewy prepare you for the chaos of your newborn?"
✅ "Chewy taught you responsibility. A newborn tested it. What did the dog prepare you for that the baby books didn't?"
✅ "You said your father was brave and dependable. When did you first question if you lived up to that?"
✅ "You mentioned 'the girl' in three stories but never her name. Who was she?"

DON'T DO THIS:
❌ "In 'Taste of Responsibility', you vividly describe learning responsibility through Chewy, a small dog who trusted you..." (TOO LONG, TOO FORMAL)
❌ "In 'My Hero', you talk about your admiration for your father..." (REMOVE STORY TITLES)
❌ "Describe a moment when you felt responsibility" (TOO GENERIC)
❌ Long academic sentences with multiple clauses (SOUNDS LIKE A RESEARCH PAPER)

KEEP THE MAGIC:
- Use specific names/details: "Chewy", "Coach", "the girl", "housebroken by love"
- Reference direct quotes they used
- Connect patterns across stories (but don't cite story titles)
- Sound like a curious friend, not an interviewer

PROMPT GENERATION STRATEGY (${analysisType}):
${getPromptStrategy(analysisType, storyCount)}

Return JSON with this structure:
{
  "prompts": [
    {
      "prompt": "The specific, personalized prompt text that references actual stories",
      "trigger": "person_expansion|connection|gap|pattern|contradiction",
      "anchor_entity": "ACTUAL name/person/place from their stories (e.g., 'Coach', 'the girl', 'marathon')",
      "recording_likelihood": 85,
      "reasoning": "Why THIS specific prompt will make THEM want to record (reference specific stories)"
    }
  ]
}`;
}

/**
 * Get prompt generation strategy based on story count - SIMPLIFIED
 */
function getPromptStrategy(type: string, count: number): string {
  if (type === "expansion") {
    return `EARLY STORIES STRATEGY (Stories 1-2):
Since they're just getting started, focus on:
- People they mentioned but didn't fully describe: "Tell me more about [person]"
- Places they referenced: "What was [place] like?"
- Time periods missing: "What happened before/after this?"
- Emotions unexplored: "How did [event] make you feel?"

Generate ${count === 1 ? "5" : "4"} warm, inviting prompts that make sharing easy.`;
  } else if (type === "killer") {
    return `MILESTONE 3 STRATEGY (Getting them hooked):
They've shared 3 stories - show them you've been listening:
- Reference specific details from all 3 stories
- Fill obvious gaps in their timeline
- Ask about people mentioned multiple times
- Explore themes that keep appearing

Generate 4 prompts that feel impossibly personal - like a friend who really knows them.`;
  } else {
    return `ONGOING STORIES STRATEGY (Story ${count}):

They've built trust with you. Now personalize based on their actual details:

GOOD PROMPTS (simple personalization):
✅ "What's a challenge you overcame during your time at [their workplace]?"
✅ "You've mentioned [person] several times - what role did they play in your life?"
✅ "You've shared stories from your 20s and 40s - what about your 30s?"
✅ "Besides work at [company], what did you do for fun during those years?"
✅ "You mentioned [place] - what was it like living there?"

SIMPLE RULES:
1. Keep it conversational - like a friend asking
2. Use their actual names and places
3. 20-35 words (natural length)
4. Focus on emotions and meaning, not facts

Generate ${count <= 20 ? "3" : count <= 50 ? "2" : "1"} personalized prompts that encourage more sharing.`;
  }
}

/**
 * Build user prompt with all stories
 */
function buildUserPrompt(stories: Story[]): string {
  const storyTexts = stories
    .map((s, i) => {
      // Sanitize transcript and lesson to prevent injection attacks
      const sanitizedTranscript = sanitizeForGPT(s.transcription || "");
      const sanitizedLesson = s.lesson_learned 
        ? `\nLesson: ${sanitizeForGPT(s.lesson_learned)}` 
        : "";
      const sanitizedTitle = sanitizeEntity(s.title || "Untitled");
      
      return `Story "${sanitizedTitle}":
${sanitizedTranscript}${sanitizedLesson}`;
    })
    .join("\n\n---\n\n");

  return `Analyze these stories and generate prompts + character insights:\n\n${storyTexts}`;
}

/**
 * Store Tier 3 results in database
 */
export async function storeTier3Results(
  supabase: any,
  userId: string,
  storyCount: number,
  result: Tier3Result,
): Promise<void> {
  console.log("[Tier 3] Storing results in database...");

  // Determine expiry and lock status
  const isStory3 = storyCount === 3;
  const expiresAt = new Date();

  if (isStory3) {
    // Story 3: 1 unlocked (30 days) + 3 locked (60 days when unlocked)
    expiresAt.setDate(expiresAt.getDate() + 30);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 30); // Standard 30-day expiry
  }

  // Store prompts
  const promptsToInsert = result.prompts.map((prompt, index) => ({
    user_id: userId,
    prompt_text: prompt.prompt,
    context_note: `Based on analysis of your ${storyCount} ${storyCount === 1 ? "story" : "stories"}`,
    anchor_entity: prompt.anchor_entity,
    anchor_year: null,
    anchor_hash: generateAnchorHash(prompt.trigger, prompt.anchor_entity, null),
    tier: 3,
    memory_type: prompt.trigger,
    prompt_score: prompt.recording_likelihood,
    score_reason: prompt.reasoning,
    model_version: "gpt-4o",
    expires_at: expiresAt.toISOString(),
    is_locked: isStory3 && index > 0, // Story 3: lock prompts 2-4
    shown_count: 0,
  }));

  // Insert prompts individually to handle duplicates gracefully
  let successCount = 0;
  let skipCount = 0;

  for (const prompt of promptsToInsert) {
    const { error: promptError } = await supabase
      .from("active_prompts")
      .insert([prompt]);

    if (promptError) {
      if (promptError.code === "23505") {
        // Duplicate key - skip this prompt
        console.log(
          `[Tier 3] Skipping duplicate prompt: ${prompt.prompt_text.substring(0, 50)}...`,
        );
        skipCount++;
      } else {
        console.error("[Tier 3] Failed to store prompt:", promptError);
        throw promptError;
      }
    } else {
      successCount++;
    }
  }

  if (successCount === 0 && skipCount > 0) {
    console.log("[Tier 3] All prompts were duplicates - no new prompts stored");
  } else if (successCount > 0) {
    console.log(
      `[Tier 3] Stored ${successCount} new prompts, skipped ${skipCount} duplicates (${isStory3 ? "1 unlocked, 3 locked" : "all unlocked"})`,
    );
  }
}
