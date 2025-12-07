# HeritageWhisper Prompt System Audit
**Date:** December 7, 2025
**Purpose:** Map the AI prompt generation system before rebuild
**Status:** Complete audit of existing state

---

## Executive Summary

The prompt system has **4 different library versions** in various states of use/disuse. Production flow uses V2 for generation but V1 for some retrieval. The `character_evolution` table was **dropped** (migration 0017) but documentation still references it. The `/api/prompts/next` route uses old V1 code while story creation uses V2 - creating an **inconsistency**. Echo prompts work for instant follow-ups, but Tier 3 milestone analysis **never stores character insights** despite documentation claims. **Rebuild scope: moderate** - core generation works, but needs cleanup and unification.

---

## File Map

### Core Library Files

| File | Purpose | Status | Line Count | Imported By |
|------|---------|--------|------------|-------------|
| `lib/promptGeneration.ts` | Original Tier 1 template generation | **PARTIALLY DEAD** - only `generateTier1Prompts` used | ~200 | `/api/prompts/next/route.ts` only |
| `lib/promptGenerationV2.ts` | V2 Tier 1 with relationship-first templates | **ACTIVE** - production | ~350 | `/api/stories/route.ts`, admin routes |
| `lib/tier3Analysis.ts` | Original Tier 3 milestone analysis | **PARTIALLY ACTIVE** - admin/dev only | ~400 | Admin routes, dev tools |
| `lib/tier3AnalysisV2.ts` | V2 "Intimacy Engine" milestone analysis | **ACTIVE** - production | ~450 | `/api/stories/route.ts` |
| `lib/tier3AnalysisFixed.ts` | Simplified Tier 3 prompts | **DEAD CODE** - never imported | ~75 | NONE |
| `lib/echoPrompts.ts` | Instant follow-up after every story | **ACTIVE** | ~105 | `/api/stories/route.ts` |
| `lib/promptQuality.ts` | Quality validation gates | **ACTIVE** | ~450 | Multiple files |
| `lib/promptRotation.ts` | Client-side rotation/dismissal | **ACTIVE** | ~190 | Components |
| `lib/sanitization.ts` | Prompt injection protection | **ACTIVE** | ~190 | Tier analysis files |

### API Routes (`/app/api/prompts/`)

| Route | Purpose | Status | Notes |
|-------|---------|--------|-------|
| `active/route.ts` | Get active AI prompts | **ACTIVE** | 95 lines, uses `active_prompts` table |
| `queued/route.ts` | Get user's saved prompts | **ACTIVE** | ~120 lines |
| `next/route.ts` | Get next prompt (legacy) | **INCONSISTENT** | Uses V1 `promptGeneration.ts`! |
| `queue/route.ts` | Add prompt to queue | **ACTIVE** | ~80 lines |
| `dismiss/route.ts` | Dismiss a prompt | **ACTIVE** | ~70 lines |
| `family-submitted/route.ts` | Family question management | **ACTIVE** | GET/DELETE handlers |
| `family-submit/route.ts` | Submit family question | **ACTIVE** | ~100 lines |
| `family-mark-seen/route.ts` | Mark family prompts seen | **ACTIVE** | ~60 lines |
| `family-unread-count/route.ts` | Count unread family questions | **ACTIVE** | ~50 lines |
| `archived/route.ts` | View dismissed prompts | **ACTIVE** | ~80 lines |
| `answer/route.ts` | Mark prompt answered | **NEEDS VERIFICATION** | May be dead |
| `skip/route.ts` | Skip a prompt | **NEEDS VERIFICATION** | May be dead |
| `restore/route.ts` | Restore archived prompt | **ACTIVE** | ~70 lines |

### UI Components

| Component | Purpose | Status | Location |
|-----------|---------|--------|----------|
| `app/prompts/page.tsx` | Main prompts page | **ACTIVE** | 984 lines, has hardcoded `CATEGORY_PROMPTS` |
| `components/PromptCard.tsx` | Generic prompt card | **ACTIVE** | 192 lines |
| `components/TimelinePromptCard.tsx` | Timeline prompt display | **ACTIVE** | Used in timeline views |
| `components/InFlowPromptCard.tsx` | Recording flow prompt | **ACTIVE** | Modal during recording |
| `components/PaywallPromptCard.tsx` | Locked prompt display | **ACTIVE** | Premium gating |
| `components/GhostPromptCard.tsx` | Ghost/placeholder prompt | **ACTIVE** | Loading states |

### Data Files

| File | Purpose | Status |
|------|---------|--------|
| `data/prompt_catalog.ts` | Static prompt catalog with gates | **ACTIVE** - 259 entries in 26 categories |
| `data/user_gates.ts` | Gate logic (children, college, etc.) | **ACTIVE** |
| `app/prompts/page.tsx:76-157` | **DUPLICATE** hardcoded `CATEGORY_PROMPTS` | **REDUNDANT** - 64 prompts |

---

## Data Flow (Current Reality)

```
STORY SAVE FLOW (Working):
┌──────────────────────────────────────────────────────────────────────┐
│  User saves story via /api/stories/route.ts                         │
│                                                                      │
│  1. Story saved to `stories` table                                  │
│  2. Call generateTier1TemplatesV2() from promptGenerationV2.ts      │
│     - Extract entities via regex (people, places, objects)          │
│     - Generate template-based prompts                               │
│     - SHA1 deduplication via anchorHash                             │
│  3. If milestone (1,2,3,4,7,10,15,20,30,50,100):                    │
│     - Call performTier3Analysis() from tier3AnalysisV2.ts           │
│     - Uses GPT-4o for deep analysis                                 │
│     - Generates "intimacy" prompts                                  │
│  4. Generate Echo prompt (instant follow-up) via echoPrompts.ts     │
│     - Uses GPT-4o-mini                                              │
│     - Validates via promptQuality.ts                                │
│  5. Store all prompts to `active_prompts` table                     │
│     - tier: 0=fallback, 1=template, 2=on-demand, 3=milestone        │
│     - expires_at: 7 days from creation                              │
└──────────────────────────────────────────────────────────────────────┘

PROMPT RETRIEVAL FLOW (Working but inconsistent):
┌──────────────────────────────────────────────────────────────────────┐
│  /app/prompts/page.tsx                                              │
│                                                                      │
│  Fetches from 3 APIs in parallel:                                   │
│  1. GET /api/prompts/active                                         │
│     - Query `active_prompts` WHERE user_status IS NULL              │
│     - Order by tier DESC, prompt_score DESC                         │
│  2. GET /api/prompts/queued                                         │
│     - Query `active_prompts` WHERE user_status = 'queued'           │
│  3. GET /api/prompts/family-submitted                               │
│     - Query `family_prompts` table for family questions             │
│                                                                      │
│  Display:                                                            │
│  - Featured prompt = activePrompts[0] || queuedPrompts[0] || default│
│  - Quick start = next 3 active prompts                              │
│  - Family questions = separate section with hearts                  │
│  - Categories = HARDCODED in page, not from catalog                 │
└──────────────────────────────────────────────────────────────────────┘

LEGACY FLOW (/api/prompts/next):
┌──────────────────────────────────────────────────────────────────────┐
│  Uses OLD promptGeneration.ts (V1)                                  │
│  - Falls back to decade-based prompts                               │
│  - Different logic than main prompts page                           │
│  - MAY BE DEAD CODE - needs verification                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Actual vs Documented)

### Tables That EXIST

**`active_prompts`** - Working as documented
```sql
-- From shared/schema.ts lines 479-517
id              UUID PRIMARY KEY
user_id         UUID NOT NULL (FK users)
prompt_text     TEXT NOT NULL
context_note    TEXT                    -- "Based on your 1955 story"
anchor_entity   TEXT                    -- "father's workshop"
anchor_year     INTEGER                 -- 1955 (nullable)
anchor_hash     TEXT NOT NULL           -- SHA1 for deduplication
tier            INTEGER NOT NULL        -- 0,1,2,3
memory_type     TEXT                    -- person_expansion, etc.
prompt_score    INTEGER                 -- 0-100
score_reason    TEXT
model_version   TEXT DEFAULT 'gpt-4o'
created_at      TIMESTAMP
expires_at      TIMESTAMP NOT NULL      -- 7 day expiry
is_locked       BOOLEAN DEFAULT false   -- Premium gating
shown_count     INTEGER DEFAULT 0
last_shown_at   TIMESTAMP
user_status     TEXT                    -- 'available','queued','dismissed'
queue_position  INTEGER
dismissed_at    TIMESTAMP
queued_at       TIMESTAMP
```

**`prompt_history`** - Exists but usage unclear
```sql
-- From shared/schema.ts lines 520-545
id              UUID PRIMARY KEY
user_id         UUID NOT NULL
prompt_text     TEXT NOT NULL
anchor_hash     TEXT
anchor_entity   TEXT
anchor_year     INTEGER
tier            INTEGER
memory_type     TEXT
prompt_score    INTEGER
shown_count     INTEGER
outcome         TEXT NOT NULL           -- 'used','skipped','expired'
story_id        UUID (FK stories)
created_at      TIMESTAMP
resolved_at     TIMESTAMP
```

**`family_prompts`** - For family-submitted questions
- Referenced in API but NOT in schema.ts (may use different mechanism)

### Tables That DON'T EXIST (but documented)

| Table | Documentation Says | Reality |
|-------|-------------------|---------|
| `character_evolution` | AI_PROMPTING.md lines 285-295 | **DROPPED in migration 0017** |
| `stories.character_insights` | tier3Analysis code | **Column dropped in migration 0017** |

### Schema vs Code Discrepancies

1. **AI_PROMPTING.md claims** Tier 3 stores to `character_evolution` - **FALSE**
2. **tier3AnalysisV2.ts line 14** has `storeTier3Results()` but it only stores to `active_prompts`, not character insights
3. **shared/schema.ts** has no `family_prompts` table definition but API uses it

---

## Dead Code / Unused Features

### Confirmed Dead Code

| File/Function | Evidence | Action |
|--------------|----------|--------|
| `lib/tier3AnalysisFixed.ts` | No imports found in codebase | **DELETE** |
| `promptGeneration.ts:generateTier1Prompts` | Only called by `/api/prompts/next` which may be dead | **INVESTIGATE** |
| `character_evolution` table | Dropped in migration 0017 | **Already removed from DB** |
| `stories.character_insights` column | Dropped in migration 0017 | **Already removed from DB** |

### Partially Dead Code

| File | Situation |
|------|-----------|
| `lib/promptGeneration.ts` | V1 file - only `generateTier1Prompts` still referenced |
| `lib/tier3Analysis.ts` | V1 file - only used by admin/dev routes, not production |
| `/api/prompts/next/route.ts` | Uses V1 logic - may be legacy endpoint |
| `/api/prompts/answer/route.ts` | Unclear if still used |
| `/api/prompts/skip/route.ts` | Unclear if still used |

### Duplicate/Redundant Code

| Location 1 | Location 2 | Issue |
|-----------|-----------|-------|
| `data/prompt_catalog.ts` (259 items) | `app/prompts/page.tsx:CATEGORY_PROMPTS` (64 items) | **DUPLICATE catalog** |
| `promptGeneration.ts` | `promptGenerationV2.ts` | Two versions of same functionality |
| `tier3Analysis.ts` | `tier3AnalysisV2.ts` | Two versions of same functionality |

### TODO/FIXME Comments

```
# Found via: grep -r "TODO\|FIXME" lib/prompt*.ts
- None found in core prompt files
```

---

## What's Actually Working

### Verified Working

1. **Story Save Triggers Prompt Generation** - YES
   - `promptGenerationV2.ts` runs after every story
   - Echo prompt generated for immediate follow-up
   - Milestone analysis runs at story counts 1,2,3,4,7,10,15,20,30,50,100

2. **Prompts Stored to Database** - YES
   - `active_prompts` table populated correctly
   - 7-day expiration enforced
   - Deduplication via anchor_hash working

3. **Prompts Display in UI** - YES
   - `/app/prompts/page.tsx` fetches and displays
   - Family prompts with special styling
   - Queue/dismiss functionality working

4. **Quality Gates** - YES
   - `promptQuality.ts` validates all prompts
   - Generic word rejection working
   - Banned phrase detection working

### Partially Working / Needs Verification

1. **Tier 3 Milestone Analysis** - PARTIAL
   - GPT-4o calls happen at milestones
   - Prompts generated and stored
   - **Character insights NOT stored** (table dropped)

2. **Prompt Rotation** - PARTIAL
   - `promptRotation.ts` exists and is imported
   - Client-side localStorage management
   - **May not be consistently used**

3. **Echo Prompts** - NEEDS TESTING
   - Code looks correct
   - Runs after every story
   - **Need to verify prompts actually appear**

### Not Working / Not Implemented

1. **Character Evolution Tracking** - NOT WORKING
   - Table was dropped
   - Code still references it in some places
   - Documentation is outdated

2. **`/api/prompts/next` Consistency** - INCONSISTENT
   - Uses V1 `promptGeneration.ts`
   - Different logic than main prompts page
   - Likely legacy code

---

## Key Issues Found

### Critical Issues

1. **V1/V2 Inconsistency**
   - Production story save: `promptGenerationV2.ts` + `tier3AnalysisV2.ts`
   - `/api/prompts/next`: `promptGeneration.ts` (V1)
   - Risk: Different prompt generation logic in different flows

2. **Documentation Lies**
   - `character_evolution` table documented as storing insights
   - Table was dropped in migration 0017
   - Code still contains dead references

3. **Duplicate Catalogs**
   - `data/prompt_catalog.ts`: 259 items, 26 categories with gates
   - `app/prompts/page.tsx`: 64 hardcoded items, 8 categories
   - User sees limited subset of available prompts

### Medium Issues

1. **Dead V1 Code**
   - `promptGeneration.ts` mostly dead except one function
   - `tier3Analysis.ts` only used in admin/dev
   - Creates confusion about which code is canonical

2. **Orphaned Files**
   - `tier3AnalysisFixed.ts` - never imported
   - Various archived prompt documentation

3. **Missing Schema Definitions**
   - `family_prompts` table used in API but not in `shared/schema.ts`

---

## Rebuild Recommendations

### DELETE (Safe to Remove)

```
lib/tier3AnalysisFixed.ts           # Never imported
lib/promptGeneration.ts             # Replace with V2 everywhere
lib/tier3Analysis.ts                # Replace with V2 everywhere
app/api/prompts/next/route.ts       # Legacy endpoint, migrate consumers
```

### KEEP (Working Code)

```
lib/promptGenerationV2.ts           # Production Tier 1
lib/tier3AnalysisV2.ts              # Production Tier 3
lib/echoPrompts.ts                  # Echo prompt generation
lib/promptQuality.ts                # Quality validation
lib/promptRotation.ts               # Client-side rotation
lib/sanitization.ts                 # Security
data/prompt_catalog.ts              # Full catalog
```

### UNIFY

1. Remove `CATEGORY_PROMPTS` from `app/prompts/page.tsx`
2. Use `data/prompt_catalog.ts` as single source of truth
3. Rename V2 files to remove version suffix after cleanup

### UPDATE

1. `AI_PROMPTING.md` - Remove references to `character_evolution`
2. `shared/schema.ts` - Add `family_prompts` if it exists
3. Documentation to reflect actual architecture

### BUILD FRESH

1. Single unified prompt generation module
2. Consistent API endpoint naming
3. Clear tier definitions with actual storage
4. Character insights system (if still wanted) - needs new table

---

## File Reference Quick Links

| Area | File | Key Lines |
|------|------|-----------|
| Story save prompt generation | `app/api/stories/route.ts` | 3-4 (imports) |
| Tier 1 V2 templates | `lib/promptGenerationV2.ts` | Full file |
| Tier 3 V2 analysis | `lib/tier3AnalysisV2.ts` | Full file |
| Echo prompts | `lib/echoPrompts.ts` | 12-94 |
| Quality gates | `lib/promptQuality.ts` | 173-240 (validation) |
| DB schema | `shared/schema.ts` | 475-545 |
| Migration that dropped character_evolution | `migrations/0017_remove_character_traits.sql` | 11 |
| UI prompts page | `app/prompts/page.tsx` | Full file |
| Catalog data | `data/prompt_catalog.ts` | 39-258 |

---

**End of Audit**

*Generated by Claude Code - December 7, 2025*
