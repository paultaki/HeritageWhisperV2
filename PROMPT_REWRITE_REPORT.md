# Memory Prompt System Rewrite Report

**Date:** December 7, 2025
**Scope:** Tier 3 Analysis + Echo Prompts + Quality Gates
**Goal:** Transform introspective prompts into memory-triggering questions

---

## Executive Summary

The prompt system has been rewritten from an "Intimacy Engine" (therapy-style introspection) to a "Memory Archaeologist" (lateral memory retrieval). The key insight from cognitive psychology: memory retrieval works through **cue-dependent recall**. Effective prompts use KNOWN entities (people, places, objects) to unlock UNKNOWN memories.

**Before:** "What did you sacrifice for this?"
**After:** "What's a time things didn't go as planned with your father?"

---

## Changes Made

### 1. lib/tier3AnalysisV2.ts

**Old approach (Intimacy Engine):**
- 4 intimacy types: caught_that, see_pattern, notice_absence, understand_cost
- Asked users to reflect deeper on the same moment
- Generated therapy-style questions about meaning and feelings

**New approach (Memory Archaeologist):**
- 6 memory types based on cognitive psychology:
  1. `person_expansion` - Other moments with the same people
  2. `place_memory` - Different events at familiar locations
  3. `timeline_gap` - Missing life phases that should have stories
  4. `event_adjacent` - What happened before/after known events
  5. `object_story` - Memories tied to specific objects mentioned
  6. `relationship_moment` - Specific interactions with key people

**Key changes to system prompt:**
```
CRITICAL DISTINCTION:
- DO NOT ask reflective questions about the stories they've already told
- DO NOT ask "what did you feel", "what did you learn", or "what was the cost" questions
- DO ask about DIFFERENT MOMENTS that involve the same people, places, or objects

QUESTION FORMULA:
"You mentioned [ENTITY]. [SPECIFIC ADJACENT MOMENT QUESTION]?"
```

**Updated interface:**
```typescript
interface Tier3Prompt {
  prompt: string;
  memory_type: "person_expansion" | "place_memory" | "timeline_gap" | "event_adjacent" | "object_story" | "relationship_moment";
  anchor_entity: string;
  context_note: string;
  recording_likelihood: number;
}
```

### 2. lib/echoPrompts.ts

**Old approach:**
- Asked about sensory details of the same moment
- Some examples still focused on introspection

**New approach:**
- Explicitly asks about DIFFERENT but RELATED moments
- Pattern: "You mentioned [specific thing]. [Question about DIFFERENT moment with that thing]?"

**Key changes to system prompt:**
```
CRITICAL RULE: Ask about a DIFFERENT time or event, not the same one they just described.

HOW TO DO THIS:
1. Identify something specific they mentioned (a person, place, object, activity)
2. Ask about a DIFFERENT time involving that same thing
3. Never ask them to reflect deeper on what they just told you
```

### 3. lib/timelineAnalysis.ts (NEW)

Created new utility for timeline gap detection:

```typescript
interface TimelineGap {
  phase: string;           // "Early Childhood", "Teenage Years", etc.
  ageRange: [number, number];
  estimatedYears: string;  // "1955-1961"
  suggestedPrompt: string;
  priority: number;        // 1-5, higher = more likely to have stories
}

// Main functions:
detectTimelineGaps(stories, birthYear?) → TimelineCoverage
generateGapPrompt(gap, existingEntities?) → string
formatGapsForContext(coverage) → string
```

**Life phases detected:**
- Early Childhood (0-6)
- Childhood (7-12)
- Teenage Years (13-19)
- Early 20s (20-25)
- Late 20s (26-30)
- 30s, 40s, 50s, 60s, 70s+

### 4. lib/promptQuality.ts

**Added introspection rejection patterns:**

```typescript
const INTROSPECTION_PATTERNS = [
  /what did (?:you|that) (?:feel|mean|teach|show)/i,
  /what did you (?:learn|discover|realize|gain|sacrifice|give up|trade)/i,
  /how did (?:this|that|it) (?:change|affect|impact|shape|influence)/i,
  /how has (?:this|that|it) (?:shaped|influenced|changed)/i,
  /what (?:deeper|greater|real|true) (?:meaning|connection|insight|lesson)/i,
  /what (?:was|did) (?:the|that) (?:cost|price|sacrifice)/i,
  /what did (?:that|it) cost you/i,
  /how did that make you/i,
  /what lesson did/i,
  /what wisdom did/i,
  /how did you grow/i,
  /what did that moment/i,
];

export function isIntrospectivePrompt(promptText: string): boolean {
  return INTROSPECTION_PATTERNS.some((pattern) => pattern.test(promptText));
}
```

**Updated validation:**
- Rule 3.5 added: Reject introspective prompts
- Quality report now flags introspective issues

---

## Before/After Examples

| Story Input | Old Prompt (Introspective) | New Prompt (Memory Trigger) |
|-------------|---------------------------|----------------------------|
| Dad's workshop story | "What freedom did you trade for that feeling of 'home'?" | "What's something your dad tried to teach you there that you never quite mastered?" |
| Wedding day story | "What did you sacrifice for this moment?" | "Your grandmother was there. What's a memory of her from before the wedding?" |
| First car story | "How did this experience shape who you are?" | "That first car sounds special. What happened the first time it broke down?" |
| Mother's cooking story | "What deeper meaning did you find in those moments?" | "What's a kitchen disaster you remember with your mother?" |
| Childhood pet story | "What did you learn about responsibility?" | "You said Rusty was an escape artist. What's the craziest place you ever found him?" |

---

## Model Configuration (UNCHANGED)

Per the research findings, GPT-4o is the correct model:

```typescript
// Tier 3 Milestone Analysis
const TIER3_MODEL = 'gpt-4o'; // Keep - excels at emotional intelligence
const TIER3_TEMPERATURE = 0.7; // Current setting is good

// Echo Prompts
const ECHO_MODEL = 'gpt-4o-mini'; // Keep for cost efficiency
const ECHO_TEMPERATURE = 0.4; // Current setting is good
```

**Rationale:** December 2025 community research shows GPT-4o excels at emotional intelligence and creative brainstorming. GPT-5 is praised for reasoning/coding but criticized as "passive" and lacking emotional depth for creative tasks.

---

## Files Modified

| File | Lines Changed | Change Type |
|------|--------------|-------------|
| `lib/tier3AnalysisV2.ts` | ~150 | Major rewrite |
| `lib/echoPrompts.ts` | ~40 | System prompt rewrite |
| `lib/promptQuality.ts` | ~50 | Added introspection rejection |
| `lib/timelineAnalysis.ts` | ~250 | New file |
| `CURRENT_PROMPTS.md` | ~180 | New file (documentation) |

---

## Testing Checklist

Run these tests to verify the changes work:

### Automated Tests
- [ ] `npm run check` passes (TypeScript)
- [ ] `npm run lint` passes (ESLint)
- [ ] `npm run build` passes (Production build)

### Manual Testing
- [ ] Record 2-3 test stories with a test account
- [ ] Verify prompts reference specific entities from stories
- [ ] Verify NO prompts ask "what did you feel/learn/discover"
- [ ] Verify timeline gaps are detected (if stories have years)
- [ ] Check quality gate rejects introspective prompts

### Database Verification
```sql
-- Check recent prompts for introspection patterns
SELECT prompt_text, memory_type, anchor_entity
FROM active_prompts
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- Verify memory_type distribution
SELECT memory_type, COUNT(*)
FROM active_prompts
WHERE memory_type IS NOT NULL
GROUP BY memory_type;
```

---

## Rollback Plan

If issues arise, revert to the previous commit:

```bash
git checkout HEAD~1 -- lib/tier3AnalysisV2.ts lib/echoPrompts.ts lib/promptQuality.ts
rm lib/timelineAnalysis.ts
```

---

## Future Improvements

1. **Entity Database Enhancement** (Phase 6 from spec)
   - Store extracted entities in `users.entity_database` JSONB column
   - Track people, places, objects across ALL stories
   - Feed entity database into GPT prompt context

2. **OpenAI Structured Outputs** (Phase 7 from spec)
   - Use `response_format: { type: "json_schema" }` for guaranteed valid JSON
   - Define strict schema for memory prompts

3. **A/B Testing**
   - Compare prompt engagement rates between old and new approaches
   - Track story recording rates after each prompt type

---

## Summary

The memory prompt system has been transformed from therapy-style introspection to cognitive psychology-based memory archaeology. The core principle is now:

> **Use KNOWN entities to unlock UNKNOWN memories. Ask about DIFFERENT moments, not deeper reflection on the SAME moment.**

This aligns with how autobiographical memory actually works: cue-dependent recall using specific people, places, and objects as retrieval anchors.

---

*Report generated by Claude Code - December 7, 2025*
