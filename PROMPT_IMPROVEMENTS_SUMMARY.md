# Heritage Whisper Prompt System Improvements - October 2025

## Executive Summary

Fixed critical issues with prompt quality across all three systems:
1. **Tier 3 (Milestones)**: Was generating bizarre questions due to over-engineered pattern matching
2. **Pearl (V2)**: Too restricted with excessive refusals
3. **Follow-up (V1)**: Already working well, enhanced with story awareness

## Changes Made

### 1. Pearl (Interview-Chat V2) - The Expert Interviewer

**File**: `/hooks/use-realtime-interview.tsx`

**Key Changes**:
- Transformed from rigid "witness" to expert documentary interviewer
- Replaced hard refusals with soft redirects
- Added personalization using previous story details
- Included light encouragement at milestones
- Increased token limit from 150 → 250 for more natural responses

**New Approach**:
- Draw out sensory details and emotions
- Reference their actual workplaces, people, places
- Connect to previous stories every 3-4 questions
- Redirect off-topic requests warmly back to storytelling

### 2. Tier 3 Milestone Prompts - Simple Personalization

**File**: `/lib/tier3Analysis.ts`

**Key Changes**:
- Removed complex pattern matching and entity extraction
- Focus on simple fill-in-the-blank personalization
- Use concrete details (workplace names, people, places)
- Add encouragement at story milestones
- Simplified from "clever connections" to "personal touches"

**Before**:
- "Who else touched my chest before it came to you?" (nonsensical)
- "When did our legs honest start meaning more?" (word salad)

**After**:
- "What's a challenge you overcame at PG&E?"
- "You've mentioned Coach several times - who were they to you?"
- "You've shared your 20s and 40s - what about your 30s?"

### 3. Follow-up Questions (V1) - Enhanced

**File**: `/app/api/interview-test/follow-up/route.ts`

**Key Changes**:
- Added story connection questions for follow-up 3+
- Included light encouragement options
- Maintained successful emotional depth focus
- No major changes - this was already working well

## Core Principles Established

### What Works
1. **Focus on emotions and meaning**, not facts and patterns
2. **Simple personalization** using actual names/places
3. **Safety through redirection**, not refusal
4. **Light encouragement** at appropriate moments
5. **Natural story connections** every few questions

### What Fails
1. ❌ Entity extraction without context understanding
2. ❌ Forced pattern matching creating nonsense
3. ❌ Over-constrained responses (too many rules)
4. ❌ Trying to be clever instead of personal

## Expected Outcomes

### For Users
- "Wow, it actually knows my story!" feeling
- More natural, flowing conversations
- Personalized prompts that feel written just for them
- Less frustrating refusals, more helpful redirects

### For Business
- Higher engagement (personalization drives recording)
- Better Story 3 conversion (compelling personalized prompts)
- Reduced complaints about weird questions
- More stories per user due to encouragement

## Testing Recommendations

1. **Test with real user stories** to ensure prompts make sense
2. **Monitor for weird questions** - should drop to near zero
3. **Track Story 3 conversion** - should improve with better prompts
4. **User feedback** - "Does Pearl feel more helpful?"

## Rollback Plan

All original files backed up:
- `/lib/tier3Analysis.backup.ts`
- `/hooks/use-realtime-interview.backup.tsx`
- `/app/api/interview-test/follow-up/route.backup.ts`

To rollback:
```bash
mv lib/tier3Analysis.backup.ts lib/tier3Analysis.ts
mv hooks/use-realtime-interview.backup.tsx hooks/use-realtime-interview.tsx
mv app/api/interview-test/follow-up/route.backup.ts app/api/interview-test/follow-up/route.ts
```

## Next Steps

1. **Deploy to staging** for testing with real stories
2. **Monitor prompt quality** - log generated prompts for review
3. **A/B test** if possible - old vs new prompts
4. **Fine-tune temperature** settings if needed
5. **Add previous story context** to Pearl's session (pass user's story titles/summaries)

## Key Insight

The breakthrough was realizing that seniors don't need AI to be clever - they need it to show it's been listening. Simple personalization ("your time at PG&E") beats complex pattern matching every time.

---

*Changes implemented October 21, 2025*
*Backups created for safe rollback*
*Ready for staging deployment*