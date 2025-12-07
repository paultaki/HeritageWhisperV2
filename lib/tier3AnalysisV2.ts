/**
 * Tier 3 Milestone-Based AI Analysis V2 - Memory Archaeologist
 *
 * Uses cognitive psychology principles for memory retrieval:
 * 1. "Person Expansion" - Other moments with the same people
 * 2. "Place Memory" - Different events at familiar locations
 * 3. "Timeline Gap" - Missing life phases that should have stories
 * 4. "Event Adjacent" - What happened before/after known events
 * 5. "Object Story" - Memories tied to specific objects mentioned
 * 6. "Relationship Moment" - Specific interactions with key people
 *
 * KEY INSIGHT: Ask about DIFFERENT moments, not deeper reflection on the same moment.
 * Cue-dependent recall works by using KNOWN entities to unlock UNKNOWN memories.
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
  memory_type: "person_expansion" | "place_memory" | "timeline_gap" | "event_adjacent" | "object_story" | "relationship_moment";
  anchor_entity: string;
  context_note: string;
  recording_likelihood: number;
}

// Legacy alias for backwards compatibility with existing prompts
type IntimacyType = Tier3Prompt["memory_type"];

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

  const systemPrompt = buildMemoryArchaeologistPrompt(storyCount, promptCount);
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
 * Build Memory Archaeologist system prompt
 *
 * Key insight from cognitive psychology: Memory retrieval works through cue-dependent recall.
 * Effective prompts use KNOWN entities (people, places, objects) to unlock UNKNOWN memories.
 * We ask about DIFFERENT moments, not deeper reflection on the SAME moment.
 */
function buildMemoryArchaeologistPrompt(storyCount: number, promptCount: number): string {
  let analysisPhase = "early"; // Stories 1-2
  if (storyCount === 3) analysisPhase = "paywall"; // Story 3
  else if (storyCount >= 4 && storyCount <= 10) analysisPhase = "patterns";
  else if (storyCount > 10) analysisPhase = "deep_patterns";

  return `You are a Memory Archaeologist helping someone preserve their family history. Your job is to identify UNTOLD stories by analyzing what they've already shared.

CRITICAL DISTINCTION:
- DO NOT ask reflective questions about the stories they've already told
- DO NOT ask "what did you feel", "what did you learn", or "what was the cost" questions
- DO ask about DIFFERENT MOMENTS that involve the same people, places, or objects

YOUR TASK:
1. Extract all entities from their stories: people (with relationships), places, time periods, objects, pets, jobs, hobbies
2. Identify patterns: Who appears most? What decades are covered? What's missing?
3. Generate ${promptCount} questions that use KNOWN entities to unlock UNKNOWN memories

QUESTION FORMULA:
"You mentioned [ENTITY]. [SPECIFIC ADJACENT MOMENT QUESTION]?"

THE 6 MEMORY TYPES (use a mix):

1. PERSON_EXPANSION (25%) - Other moments with people they mentioned
   - "You mentioned your father's workshop. What's something he tried to teach you there that you never quite mastered?"
   - "Coach Wilson sounds important. What's a game where everything went wrong?"
   - "Your grandmother appears in several stories. What did she make for special occasions?"

2. PLACE_MEMORY (20%) - Different events at familiar locations
   - "You talked about summers at the lake house. Was there ever a time the weather ruined your plans there?"
   - "That diner sounds like a regular spot. Who did you run into there unexpectedly?"
   - "Your childhood bedroom - what did you hide in there that your parents never found?"

3. TIMELINE_GAP (15%) - Missing life phases that should have stories
   - If no childhood stories: "What was your neighborhood like growing up?"
   - If no early career stories: "What was your first day at work like?"
   - If no stories from 20s: "Where were you living when you turned 25?"

4. EVENT_ADJACENT (20%) - What happened before/after known events
   - "You described your wedding day. What about the night before - were you nervous?"
   - "That first car sounds special. What happened the first time it broke down?"
   - "You mentioned moving to Chicago. What did you leave behind?"

5. OBJECT_STORY (10%) - Memories tied to specific objects mentioned
   - "You mentioned your father's pocket watch. When did he first show it to you?"
   - "That blue dress from the photo - where did you wear it next?"
   - "Your mother's recipe box - what's a dish that didn't make it into the box?"

6. RELATIONSHIP_MOMENT (10%) - Specific interactions with key people
   - "You and your brother sound close. What's a time you really fought?"
   - "Your mother taught you to cook. What's a kitchen disaster you remember?"
   - "You mentioned your best friend from high school. When did you last see them?"

BAD EXAMPLES (NEVER generate these introspective questions):
- "What deeper meaning did you find in that moment?" ❌
- "How did this experience change you?" ❌
- "What did you sacrifice for this?" ❌
- "What did you learn from that?" ❌
- "How did that shape who you are?" ❌
- "What did you feel when...?" ❌

CRITICAL RULES:
- MAX 30 WORDS per prompt (hard limit)
- Every prompt MUST reference a specific entity from their stories
- Every prompt MUST ask about a DIFFERENT moment, not the same one
- NO generic nouns (girl, boy, man, woman, house, room)
- NO yes/no questions
- Sound like a curious grandchild, not a therapist

STRATEGY FOR ${analysisPhase.toUpperCase()} PHASE:
${getMemoryStrategy(analysisPhase, storyCount, promptCount)}

Return JSON:
{
  "prompts": [
    {
      "prompt": "The question (max 30 words, must reference specific entity)",
      "memory_type": "person_expansion|place_memory|timeline_gap|event_adjacent|object_story|relationship_moment",
      "anchor_entity": "The specific person/place/object being referenced",
      "context_note": "Brief note like 'Based on your story about Dad's workshop'",
      "recording_likelihood": 75
    }
  ]
}`;
}

/**
 * Get memory archaeology strategy based on story phase
 */
function getMemoryStrategy(phase: string, count: number, promptCount: number): string {
  if (phase === "early") {
    return `EARLY STORIES (1-2): Expand the cast of characters
- Focus on PERSON_EXPANSION: Ask about other moments with people they mentioned
- Focus on EVENT_ADJACENT: What happened before/after the story they told?
- Identify 2-3 key entities (people, places) and ask about DIFFERENT moments with them
- Generate ${promptCount} prompts that unlock new memories using familiar anchors
- Keep questions specific: "What about the time..." not "Tell me more about..."`;
  }

  if (phase === "paywall") {
    return `STORY 3 - DEMONSTRATE YOUR LISTENING:
- Use PERSON_EXPANSION on whoever appears most prominently
- Add one TIMELINE_GAP question if you notice missing decades
- Add one OBJECT_STORY or PLACE_MEMORY to show you caught small details
- These ${promptCount} prompts should feel impossible to ignore because they reference SPECIFIC things
- Make them think "Wow, it remembered my dad's workshop" not "Wow, it understands me deeply"`;
  }

  if (phase === "patterns") {
    return `PATTERN RECOGNITION (4-10 stories): Map the family universe
- You now have enough data to see recurring people and places
- Use RELATIONSHIP_MOMENT: Ask about specific interactions with key people
- Use TIMELINE_GAP: Which decades have no stories?
- Use PLACE_MEMORY: What other things happened at familiar locations?
- Generate ${promptCount} prompts that explore DIFFERENT moments with RECURRING entities`;
  }

  // deep_patterns (10+ stories)
  return `DEEP MEMORY MAPPING (10+ stories):
- You have a rich entity database now - use it
- Prioritize PERSON_EXPANSION on people who appear 3+ times
- Look for TIMELINE_GAPS: Are there missing decades?
- Use EVENT_ADJACENT: What happened around major life events?
- Generate ${promptCount} prompts that unlock stories the user may have forgotten
- Reference specific entities by name to prove you were listening`;
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
  const anchor = nameMatch ? nameMatch[1] : "that memory";

  // Ask about an adjacent moment, not reflection on the same moment
  const prompt = storyCount === 1
    ? `What happened right before you met ${anchor}? Where were you?`
    : `${anchor} appears in your stories. What's a time things didn't go as planned with them?`;

  return {
    prompt,
    memory_type: "event_adjacent",
    anchor_entity: anchor,
    context_note: "Fallback prompt based on detected entity",
    recording_likelihood: 60,
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
    context_note: prompt.context_note || `Based on ${storyCount === 1 ? "your first story" : `patterns across ${storyCount} stories`}`,
    anchor_entity: prompt.anchor_entity,
    anchor_year: null,
    anchor_hash: generateAnchorHash(prompt.memory_type, prompt.anchor_entity, null),
    tier: 3,
    memory_type: prompt.memory_type,
    prompt_score: prompt.recording_likelihood,
    score_reason: `Memory archaeology: ${prompt.memory_type}`,
    model_version: result._meta?.modelUsed || "gpt-4o-memory-archaeologist",
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
