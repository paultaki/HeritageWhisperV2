/**
 * Tier 3 Milestone-Based AI Analysis V2 - Intimacy Engine
 *
 * Uses 4 intimacy types to prove deep listening:
 * 1. "I Caught That" - References exact phrases/quotes
 * 2. "I See Your Pattern" - Calls out behaviors across stories
 * 3. "I Notice the Absence" - Asks about what's missing
 * 4. "I Understand the Cost" - Acknowledges tradeoffs
 *
 * All prompts validated through quality gates before storage.
 */
import { toSeverity } from "@/lib/typesafe";

import { generateAnchorHash } from "./promptGenerationV2";
import { sanitizeForGPT, sanitizeEntity } from "./sanitization";
import { validatePromptQuality, scorePromptQuality } from "./promptQuality";
import { chat } from "./ai/gatewayClient";
import { getModelConfig } from "./ai/modelConfig";

interface Story {
  id: string;
  title: string;
  transcription: string;
  lesson_learned?: string;
  story_year?: number | null;
  created_at: string;
}

interface Tier3Prompt {
  prompt: string;
  intimacy_type: "caught_that" | "see_pattern" | "notice_absence" | "understand_cost";
  anchor_entity: string;
  recording_likelihood: number;
  reasoning: string;
}

interface Tier3Result {
  prompts: Tier3Prompt[];
  _meta?: any; // Telemetry metadata from AI call
}

/**
 * Perform Tier 3 combined analysis at milestones
 */
export async function performTier3Analysis(
  stories: Story[],
  storyCount: number,
): Promise<Tier3Result> {
  console.log(`[Tier 3 V2] Starting intimacy analysis for ${storyCount} stories`);

  // Determine number of prompts based on milestone
  let promptCount = 3;
  if (storyCount === 1 || storyCount === 2) promptCount = 4;
  else if (storyCount === 3) promptCount = 4; // 1 unlocked + 3 locked for paywall
  else if (storyCount >= 4 && storyCount <= 20) promptCount = 3;
  else if (storyCount >= 30 && storyCount <= 50) promptCount = 2;
  else promptCount = 1;

  const systemPrompt = buildIntimacySystemPrompt(storyCount, promptCount);
  const userPrompt = buildUserPrompt(stories);

  // Get model configuration (GPT-5 with reasoning effort if enabled)
  const modelConfig = getModelConfig("tier3", storyCount);
  
  console.log(
    `[Tier 3 V2] Calling ${modelConfig.model} (effort: ${modelConfig.reasoning_effort ?? "n/a"}) to analyze ${stories.length} stories (generate ${promptCount} intimacy prompts)`,
  );

  try {
    const { text: content, meta } = await chat({
      model: modelConfig.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      reasoning_effort: toSeverity(modelConfig.reasoning_effort),
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Log telemetry for monitoring
    console.log("[Tier 3 V2] AI call completed:", {
      model: meta.modelUsed,
      effort: meta.reasoningEffort,
      ttftMs: meta.ttftMs,
      latencyMs: meta.latencyMs,
      costUsd: meta.costUsd.toFixed(4),
      tokensUsed: meta.tokensUsed,
    });

    if (!content) {
      throw new Error(`No response from ${modelConfig.model}`);
    }

    // Strip markdown code fences if present (GPT-4o sometimes wraps JSON in ```json)
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      // Remove opening fence (```json or ```)
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "");
      // Remove closing fence (```)
      cleanedContent = cleanedContent.replace(/\n?```$/, "");
    }

    const rawResult = JSON.parse(cleanedContent);
    
    // Quality filter: only keep prompts that pass validation
    const validatedPrompts = (rawResult.prompts || []).filter((p: Tier3Prompt) => {
      const isValid = validatePromptQuality(p.prompt);
      if (!isValid) {
        console.log(`[Tier 3 V2] REJECTED prompt: "${p.prompt}"`);
      }
      return isValid;
    });

    // If we lost prompts to quality filtering, log warning
    if (validatedPrompts.length < (rawResult.prompts || []).length) {
      console.warn(
        `[Tier 3 V2] Quality filter rejected ${(rawResult.prompts || []).length - validatedPrompts.length} prompts`
      );
    }

    // Ensure we have at least 1 prompt (generate fallback if needed)
    if (validatedPrompts.length === 0) {
      console.warn("[Tier 3 V2] All prompts rejected by quality filter, using fallback");
      validatedPrompts.push(generateFallbackPrompt(stories, storyCount));
    }

    const result: Tier3Result = {
      prompts: validatedPrompts,
    };

    console.log(
      `[Tier 3 V2] Analysis complete: ${result.prompts.length} prompts (validated)`,
    );

    // Return result with metadata for telemetry
    return { ...result, _meta: meta };
  } catch (error) {
    console.error("[Tier 3 V2] Analysis failed:", error);
    throw error;
  }
}

/**
 * Build intimacy-focused system prompt
 */
function buildIntimacySystemPrompt(storyCount: number, promptCount: number): string {
  let analysisPhase = "early"; // Stories 1-2
  if (storyCount === 3) analysisPhase = "paywall"; // Story 3
  else if (storyCount >= 4 && storyCount <= 10) analysisPhase = "patterns";
  else if (storyCount > 10) analysisPhase = "deep_patterns";

  return `You are HeritageWhisper's Intimacy Engine. Your job: prove you were REALLY listening.

GOAL: Generate ${promptCount} prompts that make the user think "Holy shit, you actually heard me."

THE 4 INTIMACY TYPES (use a mix of these):

1. "I CAUGHT THAT" (30% of prompts)
   - Reference exact phrases they used (in quotes)
   - Ask about the deeper meaning behind their words
   - Formula: "You said '[exact phrase].' [Question about what it really means]"
   - Example: "You felt 'housebroken by love.' What freedom did you trade for that feeling?"
   - Example: "You said your father was 'brave and dependable.' When did you first question if you lived up to that?"

2. "I SEE YOUR PATTERN" (30% of prompts)
   - Call out behavior/choice repeated across multiple stories
   - Name the pattern explicitly
   - Formula: "[Pattern observation]. [Question about origin]"
   - Example: "You sacrifice for family in every story. Where did you learn that's what love looks like?"
   - Example: "You keep choosing duty over desire. When did that start?"

3. "I NOTICE THE ABSENCE" (20% of prompts)
   - Ask about who/what is conspicuously missing
   - Gentle but direct
   - Formula: "[What's present] but [what's absent]. [Curious question]"
   - Example: "You mention Mom's strength five times but never mention Dad. What's his story?"
   - Example: "Nothing about your twenties appears. What happened then?"

4. "I UNDERSTAND THE COST" (20% of prompts)
   - Acknowledge tradeoffs and difficult choices
   - Validate the weight of their decisions
   - Formula: "You got [gain] but [loss]. [Question about worth/impact]"
   - Example: "You got the promotion but missed your daughter's childhood. When did you realize the price?"
   - Example: "You kept the peace but swallowed your voice. What did that silence cost you?"

CRITICAL RULES (NON-NEGOTIABLE):
- MAX 30 WORDS per prompt (hard limit, will be rejected if longer)
- NO story titles ("In 'My Hero' you..." ❌) - users remember their own life
- NO generic nouns (girl, boy, man, woman, house, room, chair)
- NO therapy-speak ("How did that make you feel?" ❌)
- NO yes/no questions ("Did you love your father?" ❌)
- USE exact names/phrases from their stories ("Coach", "Chewy", "housebroken by love")
- Sound like a caring friend, not an interviewer

STRATEGY FOR ${analysisPhase.toUpperCase()}:
${getIntimacyStrategy(analysisPhase, storyCount, promptCount)}

Return JSON:
{
  "prompts": [
    {
      "prompt": "The exact prompt text (max 30 words)",
      "intimacy_type": "caught_that|see_pattern|notice_absence|understand_cost",
      "anchor_entity": "Specific name/phrase from stories (e.g., 'Coach', 'housebroken by love')",
      "recording_likelihood": 75,
      "reasoning": "Why this prompt will make THEM want to record"
    }
  ]
}`;
}

/**
 * Get intimacy strategy based on story phase
 */
function getIntimacyStrategy(phase: string, count: number, promptCount: number): string {
  if (phase === "early") {
    return `EARLY STORIES (1-2): Expand what they've shared
- Focus on "I Caught That" (use their exact phrases)
- "I Notice the Absence" (who else was there?)
- Keep it gentle - they're just starting to trust you
- Generate ${promptCount} prompts that invite them deeper without overwhelming`;
  }
  
  if (phase === "paywall") {
    return `STORY 3 - PAYWALL SEED: Make them NEED the next prompt
- Mix all 4 intimacy types to show your range
- Lead with your STRONGEST pattern if you found one
- Make them think "WOW, this thing really gets me"
- These ${promptCount} prompts (1 unlocked, 3 locked) should feel impossible to ignore
- Reference specific details that prove you read EVERYTHING`;
  }
  
  if (phase === "patterns") {
    return `PATTERN RECOGNITION (4-10 stories): Connect the dots
- Heavy on "I See Your Pattern" (they've shared enough to spot trends)
- "I Understand the Cost" (you can now see tradeoffs)
- Reference 2+ stories in one prompt when possible
- Generate ${promptCount} prompts that reveal connections they haven't noticed`;
  }
  
  // deep_patterns
  return `DEEP PATTERNS (10+ stories): Show mastery
- All 4 intimacy types, expertly mixed
- Multi-story connections ("You did X at 20, Y at 40, Z at 60...")
- Surface invisible rules and contradictions
- Generate ${promptCount} prompts that feel like wisdom emerging
- They should feel SEEN, not analyzed`;
}

/**
 * Build user prompt with all stories
 */
function buildUserPrompt(stories: Story[]): string {
  const storyTexts = stories
    .map((s, i) => {
      const sanitizedTranscript = sanitizeForGPT(s.transcription || "");
      const sanitizedLesson = s.lesson_learned 
        ? `\nLesson Learned: ${sanitizeForGPT(s.lesson_learned)}` 
        : "";
      const year = s.story_year ? `\nYear: ${s.story_year}` : "";
      
      return `Story ${i + 1}:${year}
${sanitizedTranscript}${sanitizedLesson}`;
    })
    .join("\n\n---\n\n");

  return `Analyze these stories with intimacy and insight:\n\n${storyTexts}`;
}

/**
 * Generate fallback prompt if all GPT prompts rejected
 */
function generateFallbackPrompt(stories: Story[], storyCount: number): Tier3Prompt {
  // Extract a person or theme from first story as anchor
  const firstStory = stories[0];
  const transcript = firstStory.transcription || "";
  
  // Try to find a person name
  const nameMatch = transcript.match(/\b([A-Z][a-z]{2,})\b/);
  const anchor = nameMatch ? nameMatch[1] : "that time";
  
  const prompt = storyCount === 1
    ? `What happened right after ${anchor}? Who was with you?`
    : `You keep returning to ${anchor} in your stories. What makes that memory stick?`;

  return {
    prompt,
    intimacy_type: "caught_that",
    anchor_entity: anchor,
    recording_likelihood: 60,
    reasoning: "Fallback prompt referencing story anchor",
  };
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
  console.log(`[Tier 3 V2] Storing ${result.prompts.length} prompts and character insights`);

  // Determine expiry (30 days for Tier 3)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Story 3 special handling: lock prompts 2-4 for paywall
  const isStory3 = storyCount === 3;

  const promptsToInsert = result.prompts.map((prompt, index) => ({
    user_id: userId,
    prompt_text: prompt.prompt,
    context_note: `Based on ${storyCount === 1 ? "your first story" : `patterns across ${storyCount} stories`}`,
    anchor_entity: prompt.anchor_entity,
    anchor_year: null,
    anchor_hash: generateAnchorHash(prompt.intimacy_type, prompt.anchor_entity, null),
    tier: 3,
    memory_type: prompt.intimacy_type,
    prompt_score: prompt.recording_likelihood,
    score_reason: prompt.reasoning,
    model_version: result._meta?.modelUsed || "gpt-4o-intimacy-v2",
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
          `[Tier 3 V2] Skipping duplicate prompt: ${prompt.prompt_text.substring(0, 50)}...`,
        );
        skipCount++;
      } else {
        console.error("[Tier 3 V2] Failed to store prompt:", promptError);
        throw promptError;
      }
    } else {
      successCount++;
    }
  }

  if (successCount === 0 && skipCount > 0) {
    console.log("[Tier 3 V2] All prompts were duplicates - no new prompts stored");
  } else if (successCount > 0) {
    console.log(
      `[Tier 3 V2] Stored ${successCount} new prompts, skipped ${skipCount} duplicates ${isStory3 ? "(1 unlocked, 3 locked)" : "(all unlocked)"}`,
    );
  }
}
