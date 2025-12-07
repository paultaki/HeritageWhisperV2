# Current GPT Prompt Text - Before Rewrite

**Purpose:** Document exactly what's being sent to GPT before the Memory Archaeologist rewrite.
**Date:** December 7, 2025

---

## File 1: lib/tier3AnalysisV2.ts

### System Message (buildIntimacySystemPrompt)

```
You are HeritageWhisper's Intimacy Engine. Your job: prove you were REALLY listening.

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
}
```

### User Message (buildUserPrompt)

```
Analyze these stories with intimacy and insight:

Story 1:${year}
${sanitizedTranscript}${sanitizedLesson}

---

Story 2:${year}
${sanitizedTranscript}${sanitizedLesson}

[... continues for all stories]
```

### Variables Injected
- `storyCount` - Number of stories (1-100+)
- `promptCount` - Number of prompts to generate (1-4)
- `analysisPhase` - "early" | "paywall" | "patterns" | "deep_patterns"
- `stories[]` - Array of story objects with transcription, lesson_learned, story_year

### JSON Schema (Expected Output)
```typescript
interface Tier3Prompt {
  prompt: string;
  intimacy_type: "caught_that" | "see_pattern" | "notice_absence" | "understand_cost";
  anchor_entity: string;
  recording_likelihood: number;
  reasoning: string;
}
```

---

## File 2: lib/echoPrompts.ts

### System Message

```
You are a caring grandchild listening to your grandparent's story. Generate ONE follow-up question (max 25 words).

CRITICAL: This is a COMPLETE story, not a placeholder or incomplete text. Never comment on the input quality or format.

Rules:
- Reference a SPECIFIC detail they just mentioned
- Ask about sensory details (sight, sound, smell, touch, taste)
- Use their exact words when possible
- Be genuinely curious, not analytical
- Feel natural, like continuing a conversation
- Never be generic or therapeutic
- No generic nouns (girl, boy, man, woman, house, room)
- NEVER respond with meta-commentary like "seems like a placeholder" or "message got cut off"

Good examples:
"You said the sawdust smelled like home. What did Sunday mornings smell like there?"
"You mentioned a blue dress. Where did you wear it next?"
"That workshop sounds special. What was your favorite tool?"
"You said the diner had the best coffee. Who taught you to drink it black?"

Bad examples:
"Tell me more about your relationship with your father"
"How did that make you feel?"
"What was the most important lesson?"
"Can you describe the experience?"
```

### User Message

```
Generate one follow-up question for: "${transcript}"
```

### Variables Injected
- `transcript` - Full story transcript (no word limit)

### JSON Schema
- None (returns plain text string)

---

## Problem Analysis

### What's Wrong with Tier 3 (Intimacy Engine)

**Example outputs from current system:**
- "You felt 'housebroken by love.' What freedom did you trade for that feeling?" ❌
- "You sacrifice for family in every story. Where did you learn that's what love looks like?" ❌
- "What did that silence cost you?" ❌

**Why these are BAD:**
1. They ask for REFLECTION on the same moment, not recall of a DIFFERENT moment
2. They're introspective (what did you feel, what did you learn, what was the cost)
3. They don't unlock NEW memories - they ask for deeper analysis of existing ones
4. This is therapy, not memory archaeology

**What we NEED:**
- "You mentioned Dad's workshop. What's something he tried to teach you there that you never quite mastered?"
- "You talked about Coach Wilson. What's a game where everything went wrong?"
- "Your grandmother appears in several stories. What did she make for special occasions?"

### What's Wrong with Echo Prompts

**Actually mostly good!** The current examples are:
- "What did Sunday mornings smell like there?" ✅ (sensory, different moment)
- "Where did you wear it next?" ✅ (different moment with same entity)
- "What was your favorite tool?" ✅ (specific entity question)
- "Who taught you to drink it black?" ✅ (new entity connection)

**Minor issues:**
- Some prompts still focus on the same moment rather than adjacent moments
- Could be more explicitly about DIFFERENT memories with SHARED entities

---

## Quality Gates (lib/promptQuality.ts)

### Currently Rejected
- Generic words: girl, boy, man, woman, house, room, chair, etc.
- Banned phrases: "tell me more", "how did that make you feel", "describe the"
- Yes/no questions
- >30 words

### NOT Currently Rejected (Should Be)
- Introspective questions about meaning/learning/cost
- Questions about the SAME moment rather than DIFFERENT moments
- Therapy-style reflection prompts

---

## Model Configuration (lib/ai/modelConfig.ts)

- **Echo prompts:** gpt-4o-mini (fast, no reasoning)
- **Tier 3 analysis:** gpt-4o (or gpt-5 if enabled via env flag)
- **Temperature:** 0.7 for Tier 3, 0.4 for Echo

**Decision:** Keep GPT-4o for Tier 3. Research shows it excels at emotional intelligence and creative brainstorming - exactly what memory prompts need. GPT-5 is praised for reasoning but criticized as "passive" for creative tasks.

---

*End of current prompt documentation*
