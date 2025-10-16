# HeritageWhisper AI Speed Optimization Plan

## Executive Summary

Current bottlenecks: Sequential AI calls, overuse of GPT-4o, synchronous Tier 3 analysis. Target: Reduce Tier 1 latency from 2s → 500ms, story processing from 8s → 3s.

## Phase 1: Quick Wins (Implement Today)

### 1.1 Respect Reduced Motion Preferences ✅ IMPLEMENTED

**Files: `/app/page.tsx`, `/app/globals.css`**

**Problem**: Homepage runs animations, timers, and Intersection Observers for every visitor, even when their OS requests reduced motion.

**Solution Implemented**:

1. **JavaScript Motion Detection**:
   ```typescript
   // Detects user's motion preference on mount
   const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
   setPrefersReducedMotion(mediaQuery.matches);
   
   // Listens for preference changes in real-time
   mediaQuery.addEventListener("change", handleChange);
   ```

2. **Skip Animations Conditionally**:
   ```typescript
   // If reduced motion preferred, immediately show all elements
   if (prefersReducedMotion) {
     document.querySelectorAll("[data-animate]").forEach((el) => {
       el.classList.remove("opacity-0", "translate-y-8");
       el.classList.add("opacity-100", "translate-y-0");
     });
     return; // Skip Intersection Observer setup
   }
   ```

3. **Global CSS Override**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```

**Impact**:
- ✅ Zero animation timers for users with reduced motion
- ✅ No Intersection Observer overhead when not needed
- ✅ Instant page rendering without animation delays
- ✅ Better accessibility (WCAG 2.1 Level AA compliance)
- ✅ Reduced CPU usage for motion-sensitive users

**Applied to**:
- ✅ `/app/page.tsx` - Landing page (all scroll animations)
- ✅ `/app/timeline-v2/page.tsx` - Timeline cards (Intersection Observer)
- ✅ `/app/globals.css` - Global CSS animations disabled

### 1.2 Remove PII from Authentication Logs ✅ IMPLEMENTED

**Files: `/app/api/auth/**/*.ts`**

**Problem**: Authentication routes logged emails, user IDs, and full error objects containing credentials to console, which would end up in production logs.

**Solution Implemented**:

1. **Email Logging Gated to Development**:
   ```typescript
   // BEFORE: Always logs email in production
   logger.info(`Login attempt for email: ${email}`);
   
   // AFTER: Only logs in development
   if (process.env.NODE_ENV === 'development') {
     logger.info(`Login attempt for email: ${email}`);
   }
   ```

2. **Error Objects Sanitized**:
   ```typescript
   // BEFORE: Logs full error object (may contain passwords, tokens)
   logger.error("Login error:", error);
   
   // AFTER: Only logs error message
   logger.error("Login error:", error instanceof Error ? error.message : 'Unknown error');
   ```

3. **Supabase Errors Cleaned**:
   ```typescript
   // BEFORE: Full error object
   logger.error("Supabase login error:", error);
   
   // AFTER: Message only
   logger.error("Supabase login error:", error.message);
   ```

**Files Updated**:
- ✅ `/app/api/auth/login/route.ts` - Removed email logging, sanitized errors
- ✅ `/app/api/auth/register/route.ts` - Sanitized all error logging
- ✅ `/app/api/auth/change-password/route.ts` - Gated user ID logging, sanitized errors
- ✅ `/app/api/auth/me/route.ts` - Sanitized error logging
- ✅ `/app/api/auth/logout/route.ts` - Sanitized error logging
- ✅ `/app/api/auth/send-welcome/route.ts` - Sanitized error logging

**Impact**:
- ✅ No PII (emails, user IDs) in production logs
- ✅ No credentials in error logs
- ✅ GDPR/privacy compliance improved
- ✅ Reduced log storage costs (shorter messages)
- ✅ Development debugging still works (gated to dev mode)

### 1.3 Parallelize Audio Processing Pipeline

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

### 1.4 Switch Lesson Extraction to GPT-4o-mini

**File: `/app/api/transcribe/route.ts` Line 181**

```typescript
// CURRENT
model: "gpt-4o",  // ~$0.007 per call

// OPTIMIZED  
model: "gpt-4o-mini",  // ~$0.0007 per call, 10x cheaper
temperature: 0.9,  // Slightly higher for creativity
```

**Rationale**: Lesson extraction is template-driven, doesn't need GPT-4o's reasoning.

### 1.5 Make Tier 3 Analysis Asynchronous

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

