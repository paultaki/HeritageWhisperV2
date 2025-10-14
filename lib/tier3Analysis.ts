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

if (!apiKey) {
  throw new Error("AI_GATEWAY_API_KEY or OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey,
  baseURL,
});

interface Story {
  id: string;
  title: string;
  transcript: string;
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

interface CharacterInsights {
  traits: Array<{
    trait: string;
    confidence: number;
    evidence: string[];
  }>;
  invisibleRules: string[];
  contradictions: Array<{
    stated: string;
    lived: string;
    tension: string;
  }>;
  coreLessons: string[];
}

interface Tier3Result {
  prompts: Tier3Prompt[];
  characterInsights: CharacterInsights;
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
      `[Tier 3] Analysis complete: ${result.prompts?.length || 0} prompts, ${result.characterInsights?.traits?.length || 0} traits`,
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

  return `You are analyzing ${storyCount} stories to perform two tasks:
1. Generate ${promptCount} memory prompts for future recordings
2. Extract character insights and patterns

LIFE PHASE CONTEXT:
- Age range: ${ageRange}
- Dominant life phase: ${dominantPhase}
- Adjust prompts to match how people in this phase remember and process memories

PROMPT GENERATION - READ THIS CAREFULLY:
The prompts you generate MUST prove you actually read their specific stories.
They should make the user think: "Holy shit, this thing actually LISTENED to me."

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

CHARACTER ANALYSIS:
Extract from ALL ${storyCount} stories:
1. CHARACTER TRAITS (3-5 core traits)
   - Each trait needs evidence from specific stories
   - Confidence score (0-1) based on repetition
   - Direct quotes that demonstrate the trait

2. INVISIBLE RULES (2-3 principles they live by)
   - Patterns in their decision-making
   - Unspoken values that guide them
   - Rules they follow but may not articulate

3. CONTRADICTIONS (if any exist)
   - Values they state vs behaviors they show
   - Tensions in their character
   - Unresolved conflicts in their worldview

4. CORE LESSONS (distilled wisdom)
   - What would they tell their younger self?
   - What did life teach them?
   - What wisdom emerges from their stories?

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
  ],
  "characterInsights": {
    "traits": [
      {
        "trait": "resilience",
        "confidence": 0.85,
        "evidence": ["Quote 1", "Quote 2"]
      }
    ],
    "invisibleRules": ["Rule 1", "Rule 2"],
    "contradictions": [
      {
        "stated": "What they say",
        "lived": "What they do",
        "tension": "The conflict"
      }
    ],
    "coreLessons": ["Lesson 1", "Lesson 2"]
  }
}`;
}

/**
 * Get prompt generation strategy based on story count
 */
function getPromptStrategy(type: string, count: number): string {
  if (type === "expansion") {
    return `EXPANSION STRATEGY (Stories 1-2):
- Find what was IMPLIED but not fully told
- THE MOMENT BEFORE: What led up to this?
- THE MOMENT AFTER: What happened next?
- OTHER PEOPLE IMPLIED: Who else was there?
- SENSORY GAPS: What did it feel/look/smell like?
- IMPLIED BACKSTORY: References without explanation

Generate ${count === 1 ? "5" : "4"} prompts that expand on what's already shared.`;
  } else if (type === "killer") {
    return `KILLER PROMPT STRATEGY (Story 3 - Pre-Paywall):
This is the MOST COMPELLING prompt to convince user to pay $149/year.

PRIORITY ORDER:
1. STRONG PATTERN - Same person/emotion/theme in 2+ stories
2. COMPELLING GAP - 30+ year gap, all positive/all work, missing perspectives
3. DEEP EXPANSION - Most emotionally resonant moment

Generate 4 exceptional prompts. Make them think: "WOW! This thing GETS me!"`;
  } else {
    return `PATTERN ANALYSIS STRATEGY (Story ${count}):

CRITICAL: Generate SHORT, CONVERSATIONAL prompts! Each prompt MAX 30 WORDS.

BAD PROMPTS:
❌ "In 'The Marathon' you pushed through pain, in 'Recovering from the Accident' you did it again. When did you FIRST learn to push through? What happened before these?" (31 words, story titles, too formal)
❌ "Describe a moment when you felt a profound sense of responsibility" (11 words but generic - could be anyone)

GOOD PROMPTS (concise, specific, conversational):
✅ "You pushed through a marathon, then a car accident. When did you FIRST learn to push through pain?" (18 words)
✅ "You mention 'the girl' in three stories but never her name. Who was she?" (14 words)
✅ "Travel made you grateful, not fancy. Being steady is your legacy. Is there tension between exploring and staying grounded?" (20 words)
✅ "Chewy taught you responsibility. A newborn tested it. What did the dog prepare you for that the baby books didn't?" (20 words)

REQUIREMENTS:
1. MAX 30 WORDS - Be ruthless. Cut story titles, cut formal language
2. NO STORY TITLES - Users remember their own life. Just reference the content
3. USE ACTUAL NAMES - "Coach", "Chewy", "the girl" - not "someone" or "a person"
4. CONVERSATIONAL TONE - Like a friend asking, not an interviewer
5. CONNECT PATTERNS - "You did X, then Y. When did you first learn Z?"
6. USE DIRECT QUOTES - If they said "housebroken by love", USE IT
7. SHORT SENTENCES - Punchy. Direct. Readable in 3 seconds.

FIND PATTERNS & ASK CONCISELY:
- Same person 2+ times → "You mention [name] repeatedly but never told their story. Who were they?"
- Same trait multiple times → "You used humor to reset tension twice. Where'd you first learn that?"
- Time gaps → "Nothing between high school and marriage. What happened in your twenties?"
- Unexplored people → "Who was Coach? What did they teach you?"

Generate ${count <= 20 ? "3" : count <= 50 ? "2" : "1"} prompts. Each one: 25-30 words, conversational, impossible to confuse with anyone else.`;
  }
}

/**
 * Build user prompt with all stories
 */
function buildUserPrompt(stories: Story[]): string {
  const storyTexts = stories
    .map((s, i) => {
      // Sanitize transcript and lesson to prevent injection attacks
      const sanitizedTranscript = sanitizeForGPT(s.transcript || "");
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

  // Store character insights (upsert - update if exists)
  const { error: characterError } = await supabase
    .from("character_evolution")
    .upsert(
      {
        user_id: userId,
        story_count: storyCount,
        traits: result.characterInsights.traits,
        invisible_rules: result.characterInsights.invisibleRules,
        contradictions: result.characterInsights.contradictions,
        analyzed_at: new Date().toISOString(),
        model_version: "gpt-4o",
      },
      {
        onConflict: "user_id,story_count",
      },
    );

  if (characterError) {
    console.error(
      "[Tier 3] Failed to store character insights:",
      characterError,
    );
    throw characterError;
  }

  console.log(
    `[Tier 3] Stored character insights: ${result.characterInsights.traits.length} traits, ${result.characterInsights.invisibleRules?.length || 0} rules`,
  );
}
