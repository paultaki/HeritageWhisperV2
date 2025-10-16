# HeritageWhisper AI Speed Optimization Plan

## Executive Summary

Current bottlenecks: Sequential AI calls, overuse of GPT-4o, synchronous Tier 3 analysis. Target: Reduce Tier 1 latency from 2s → 500ms, story processing from 8s → 3s.

## Phase 1: Quick Wins (Implement Today)

### 1.1 Parallelize Audio Processing Pipeline

**File: `/app/api/transcribe/route.ts`**

Current flow (8-10s total):

- Whisper transcription: 3-4s
- Then formatting (GPT-4o-mini): 1-2s  
- Then lesson extraction (GPT-4o): 2-3s

Optimized flow (3-4s total):

- Whisper transcription: 3-4s
- Parallel: formatting + lesson extraction

**Change (Line 405-414)**:

```typescript
// CURRENT: Sequential
const formattedText = await formatTranscription(transcription.text);
const lessonOptions = await generateLessonOptions(transcription.text);

// OPTIMIZED: Already parallel but could optimize lesson model
// Keep existing parallel code but switch lesson extraction to GPT-4o-mini
```

### 1.2 Switch Lesson Extraction to GPT-4o-mini

**File: `/app/api/transcribe/route.ts` Line 181**

```typescript
// CURRENT
model: "gpt-4o",  // ~$0.007 per call

// OPTIMIZED  
model: "gpt-4o-mini",  // ~$0.0007 per call, 10x cheaper
temperature: 0.9,  // Slightly higher for creativity
```

**Rationale**: Lesson extraction is template-driven, doesn't need GPT-4o's reasoning.

### 1.3 Make Tier 3 Analysis Asynchronous

**File: `/app/api/stories/route.ts` Lines 478-580**

```typescript
// CURRENT: Blocking the response
const tier3Result = await performTier3Analysis(...);
await storeTier3Results(...);

// OPTIMIZED: Fire and forget
if (MILESTONES.includes(storyCount)) {
  // Queue for background processing
  setImmediate(async () => {
    try {
      const tier3Result = await performTier3Analysis(...);
      await storeTier3Results(...);
    } catch (error) {
      logger.error("[Tier 3 Background]", error);
    }
  });
}
```

**Impact**: Story save returns immediately, Tier 3 runs in background.

## Phase 2: Architecture Improvements (1-2 Days)

### 2.1 Implement Response Caching for Lessons

**New file: `/lib/lessonCache.ts`**

```typescript
const lessonCache = new Map<string, LessonOptions>();

export async function getCachedLessons(
  transcriptHash: string,
  generator: () => Promise<LessonOptions>
): Promise<LessonOptions> {
  if (lessonCache.has(transcriptHash)) {
    return lessonCache.get(transcriptHash)!;
  }
  
  const lessons = await generator();
  lessonCache.set(transcriptHash, lessons);
  
  // LRU eviction after 1000 entries
  if (lessonCache.size > 1000) {
    const firstKey = lessonCache.keys().next().value;
    lessonCache.delete(firstKey);
  }
  
  return lessons;
}
```

### 2.2 Optimize Tier 3 for Selective GPT-4o Usage

**File: `/lib/tier3AnalysisV2.ts` Line 116**

```typescript
// Use GPT-4o only for critical milestones
const model = [3, 10, 30, 50].includes(storyCount) 
  ? "gpt-4o" 
  : "gpt-4o-mini";

const completion = await openai.chat.completions.create({
  model,
  temperature: model === "gpt-4o" ? 0.7 : 0.8,
  // ...
});
```

### 2.3 Stream Echo Prompts Generation

**File: `/lib/echoPrompts.ts`**

Instead of waiting for full response, stream it:

```typescript
export async function generateEchoPrompt(
  transcript: string,
  onPartial?: (text: string) => void
): Promise<string | null> {
  const stream = await chat({
    model: "gpt-4o-mini",
    messages: [...],
    stream: true,
  });
  
  let result = "";
  for await (const chunk of stream) {
    result += chunk.choices[0]?.delta?.content || "";
    onPartial?.(result);
  }
  
  return validatePromptQuality(result) ? result : null;
}
```

## Phase 3: Advanced Optimizations (Future)

### 3.1 Batch API for Non-Critical Operations

Use OpenAI Batch API (50% cheaper) for:

- Tier 3 analysis at non-critical milestones
- Bulk lesson regeneration
- Historical prompt analysis

### 3.2 Edge Caching with Cloudflare Workers

Cache common prompts at edge:

- Template expansions
- Common entity extractions
- Repeated lesson patterns

### 3.3 Progressive Prompt Enhancement

Start with fast template, enhance asynchronously:

1. Immediate: Template-based prompt (0ms)
2. Background: GPT-4o-mini enhancement (+500ms)
3. Delayed: GPT-4o deep analysis (+2s)

## Monitoring & Quality Gates

### Quality Metrics to Track

- Prompt engagement rate (target: ≥70% of current)
- Recording completion rate
- User satisfaction scores
- Lesson relevance scoring

### Rollback Triggers

- Prompt quality score drops below 65
- User complaints increase >20%
- Recording rate decreases >15%

### A/B Testing Plan

1. 20% rollout of GPT-4o-mini lessons
2. Compare engagement metrics over 7 days
3. Full rollout if quality maintained

## Cost Impact

- Current: ~$0.016/story
- Optimized: ~$0.004/story (75% reduction)
- Annual savings at 10K stories/day: ~$43,800

## Implementation Priority

1. **Today**: Async Tier 3 (biggest UX win)
2. **Tomorrow**: Lesson model downgrade
3. **This week**: Response caching
4. **Next sprint**: Selective GPT-4o usage

