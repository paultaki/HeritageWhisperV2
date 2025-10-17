# HeritageWhisperV2 - Next.js 15 Documentation

> **📝 Note:** This file contains current, active documentation for Claude sessions. Historical fixes, migration notes, and archived information can be found in `CLAUDE_HISTORY.md`.

## 🚀 Project Overview

AI-powered storytelling platform for seniors to capture and share life memories. Next.js 15 migration completed October 2025.

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Auth:** Supabase Auth with JWT tokens
- **Database:** PostgreSQL via Supabase (project: tjycibrhoammxohemyhq)
- **Storage:** Supabase Storage (bucket: heritage-whisper-files)
- **State:** TanStack Query v5
- **AI:** AssemblyAI ("universal" batch transcription, 58% cheaper) + OpenAI API (Whisper fallback) + Vercel AI Gateway (GPT-4o/GPT-5 routing)
- **Deployment:** Vercel (https://dev.heritagewhisper.com)

## 🔧 Quick Start

### Development

```bash
cd /Users/paul/Documents/DevProjects/HeritageWhisperV2
npm run dev
# Running on http://localhost:3002
```

### Environment Variables (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tjycibrhoammxohemyhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Database
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# AssemblyAI (Primary transcription - 3-5x faster than Whisper)
ASSEMBLYAI_API_KEY=your_assemblyai_key  # Get from https://www.assemblyai.com/

# Vercel AI Gateway (Optional)
AI_GATEWAY_API_KEY=vck_...  # Get from https://vercel.com/dashboard/ai-gateway

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Session
SESSION_SECRET=your_secret
```

## 📁 Project Structure

```
HeritageWhisperV2/
├── app/                      # Next.js 15 App Router
│   ├── api/                 # API routes
│   │   ├── auth/           # Auth endpoints (login, register)
│   │   ├── stories/        # Story CRUD operations
│   │   ├── upload/         # File upload (audio, photos)
│   │   ├── export/         # PDF export (2up, trim)
│   │   └── user/           # User management (delete, export)
│   ├── auth/               # Auth pages (login, register, callback)
│   ├── timeline/           # Timeline view (main stories view)
│   ├── recording/          # Audio recording page
│   ├── review/             # Story editing (BookStyleReview)
│   ├── book/               # Book view (dual-page layout)
│   │   └── print/          # Print layouts (2up, trim)
│   ├── profile/            # User settings & account management
│   └── styles/             # Global styles
│       ├── tokens.css      # Design tokens (colors, spacing, typography)
│       └── components.css  # Heritage Whisper component library (hw-* classes)
├── components/              # React components
│   ├── AudioRecorder.tsx   # Web Audio API recording
│   ├── MultiPhotoUploader.tsx # Photo upload with cropping & hero selection
│   ├── BookStyleReview.tsx # Story review/edit interface
│   ├── DesktopNavigationBottom.tsx # Bottom horizontal navigation (desktop)
│   ├── MobileNavigation.tsx # Bottom navigation bar (mobile)
│   ├── BookProgressBar.tsx # Standalone progress bar for book view
│   ├── BookDecadesPill.tsx # Mobile decade navigation for book view
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities
│   ├── auth.tsx            # Auth context & provider
│   ├── supabase.ts         # Supabase client & helpers
│   ├── ratelimit.ts        # Upstash Redis rate limiting
│   ├── imageProcessor.ts   # Image processing & EXIF stripping
│   ├── bookPagination.ts   # Book pagination logic
│   └── utils.ts            # Helper functions (normalizeYear, formatYear)
├── tests/                   # Test suite
│   ├── mocks/              # Mock implementations
│   │   └── supabaseAdmin.mock.ts # In-memory Supabase client
│   ├── prompts.next.test.ts # GET /api/prompts/next tests
│   ├── prompts.skip.test.ts # POST /api/prompts/skip tests
│   ├── setup.ts            # Global test setup
│   └── utils.ts            # Test helper functions
└── shared/
    └── schema.ts           # Database schema (Drizzle)
```

## 🔑 Key Features

- **Audio Recording**: Simplified one-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: AssemblyAI "universal" batch (~3.7s, 58% cheaper, 93.4% accuracy) with OpenAI Whisper fallback
- **AI Prompt System**: Multi-tier reflection prompt generation (see AI Features section below)
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade with "Before I Was Born" section
- **Book View**: Dual-page layout with natural pagination, collapsed decade navigation
- **PDF Export**: 2-up (home print) and trim (POD) formats with server-side generation
- **Memory Box**: Grid/list view toggle with filtering (All, Favorites, Timeline, Book, No date, Private)
- **Mobile Responsive**: Senior-friendly UX with large touch targets
- **Desktop Navigation**: Bottom horizontal bar with icon buttons (Home, Timeline, Book, Profile)
- **Book Progress Bar**: Interactive progress bar with decade markers, year tooltips, click-to-navigate
- **Page Navigation**: Click page margins to turn pages (left margin = back, right margin = forward)
- **Rate Limiting**: Upshash Redis-based (auth: 5/10s, uploads: 10/min, API: 30/min)

## 🤖 AI Features

### AI Prompt Generation System v1.4 (PRODUCTION READY)

Intelligent reflection prompt system that helps users deepen their storytelling through AI-generated questions.

#### Database Schema

Three new tables added via migration `/migrations/0002_add_ai_prompt_system.sql`:

- **`active_prompts`**: Currently active prompts for users (7-day expiry, 1-3 prompts from Tier 1, unlimited from Tier 3)
- **`prompt_history`**: All generated prompts with retirement tracking (skipped/answered)
- **`character_evolution`**: AI insights about user's character, invisible rules, contradictions, core lessons

#### Tier 1: Template-Based Entity Prompts

- **Trigger**: After EVERY story save
- **Process**: Multi-entity extraction (1-3 entities per story) using GPT-4o
  - Extracts people, places, objects, concepts from story
  - Generates 1-3 prompts using template library (5 categories: Appreciation, Perspective Shifts, Unfinished Business, Invisible Rules, Future Self)
  - SHA1 deduplication prevents duplicate prompts
  - 7-day expiry (auto-cleanup via database trigger)
- **Prompt Format**: 25-30 words, conversational, no story titles, specific details
- **Location**: `/lib/promptGeneration.ts`, `/app/api/stories/route.ts:231-262`
- **Example Output**: "You felt 'housebroken by love' with Chewy. What freedom did you trade for that love, and do you miss it?"

#### Tier 3: Milestone Analysis Prompts

- **Trigger**: At story milestones [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100]
- **Process**: Combined GPT-5 analysis of all user stories (runs asynchronously in background)
  - Analyzes entire story collection for patterns, themes, character evolution
  - Generates high-quality reflection prompts (25-30 words each)
  - Extracts character insights: traits, invisible rules, contradictions, core lessons
  - Stores insights in `character_evolution` table (upsert on conflict)
- **User Experience**: Story saves return instantly (2-3s), analysis completes in background
- **Performance**: Optimized October 2025 - no longer blocks user experience at milestones
- **Character Insights**: Confidence scores, supporting evidence, insight categories
- **Location**: `/lib/tier3Analysis.ts`, `/app/api/stories/route.ts:533-583`
- **Example Insights**:
  - Traits: "Loyalty (0.9 confidence): Stayed at camp despite fear"
  - Invisible Rules: "Never show weakness even when scared"
  - Contradictions: "Values independence but craves deep connection"
  - Core Lessons: "True courage is staying when you want to run"

#### Lesson Learned Extraction

- **Trigger**: During transcription (every story)
- **Process**: GPT-4o-mini generates 3 lesson options (1-2 sentences, first-person)
- **Model**: Optimized to GPT-4o-mini (October 2025) for 90% cost reduction
- **User Experience**: Review page shows 3 options, user picks one or writes their own
- **Database**: Stored in `stories.wisdom_text` column
- **Location**: `/app/api/transcribe/route.ts:174-198`
- **Display**: Book view shows lessons with gold left border callout

#### Key Implementation Details

- **Deduplication**: SHA1 hashing prevents duplicate prompts across all user prompts
- **Expiry**: Tier 1 prompts expire after 7 days, Tier 3 prompts never expire
- **Retirement**: Prompts marked as skipped/answered prevent re-generation
- **Error Handling**: Graceful degradation if OpenAI API fails
- **Rate Limiting**: Uses existing Upstash Redis limits for API protection

#### Database Column Updates

Added to `users` table:

- `character_insights` (JSONB): Stores Tier 3 character analysis
- `milestone_reached` (INTEGER): Tracks highest milestone for Tier 3 triggers

Added to `stories` table:

- `lesson_learned` (TEXT): User-selected wisdom/lesson from story
- `entities_extracted` (JSONB): Extracted entities for Tier 1 prompt generation

#### Testing Infrastructure

**Unit Tests (Vitest):**
- Complete test suite with 20 comprehensive tests
  - 10 tests for GET `/api/prompts/next` (auth, validation, Tier-1 generation, fallbacks)
  - 10 tests for POST `/api/prompts/skip` (skip counting, retirement, archival)
  - In-memory Supabase mock with query builder
  - Zero network calls - fully isolated tests
  - Real validation logic (not mocked)
  - Location: `/tests/` directory, see `TESTING_GUIDE.md`
  - Run with: `npm test`

**AI Prompt Testing Suite (Interactive Dashboard):**
- Live testing interface for prompt generation without recording new stories
- **Access**: `http://localhost:3000/dev/prompts` (requires authentication)
- **Features**:
  - Story selector with checkboxes (Select All / Clear buttons)
  - Milestone simulator dropdown (Story 1, 3, 7, 10, 15, 20, 30, 50, 100)
  - Real-time GPT-4o analysis with dry-run mode (no database writes)
  - Results display: prompts, character insights, traits, invisible rules, contradictions
  - Split-screen layout: stories left, analysis results right
- **Use Cases**:
  - Test prompt quality on existing story collections
  - Iterate on system prompts in `/lib/tier3Analysis.ts`
  - Preview what prompts users would see at different milestones
  - Validate character insights extraction accuracy
- **Implementation**:
  - Frontend: `/app/dev/prompts/page.tsx`
  - Backend: `/app/api/dev/analyze-tier3/route.ts`
  - Uses existing `performTier3Analysis()` from `/lib/tier3Analysis.ts`
- **Note**: AI Gateway compatibility fix applied - JSON responses may be wrapped in markdown code fences, which are automatically stripped before parsing

#### Pending Implementation

- **GET `/api/prompts/next`**: Fetch next prompt to display to user (tested, needs UI integration)
- **POST `/api/prompts/skip`**: Retire skipped prompts (tested, needs UI integration)
- **Stripe webhook**: Unlock Story 3+ premium prompts on payment
- **UI components**: Display prompts in app interface
- **Do-not-ask**: User-controlled topic blocking

### Vercel AI Gateway Integration (PRODUCTION)

Hybrid AI infrastructure for observability, caching, and automatic failover.

#### Overview

**Deployed:** October 14, 2025
**Status:** Production-ready with hybrid architecture

All GPT models (chat completions) route through Vercel AI Gateway for observability and caching. Whisper transcriptions use direct OpenAI API (Gateway doesn't support audio endpoints).

#### Architecture

**Two OpenAI Clients:**
1. **Direct OpenAI** - Whisper transcriptions only (`openaiDirect`)
2. **AI Gateway** - All GPT models (`openaiGateway`)

**Files Updated (6 total):**
- `/app/api/transcribe/route.ts` - Hybrid (Whisper direct, GPT via Gateway)
- `/lib/tier3Analysis.ts` - AI Gateway enabled
- `/lib/tier3AnalysisV2.ts` - AI Gateway enabled
- `/lib/whisperGeneration.ts` - AI Gateway enabled
- `/lib/echoPrompts.ts` - AI Gateway enabled
- `/app/api/followups/route.ts` - AI Gateway enabled

#### What Routes Through Gateway

✅ **GPT-4o** - Tier 3 analysis, lesson generation, entity extraction
✅ **GPT-4o-mini** - Formatting, echo prompts, follow-ups
❌ **Whisper-1** - Direct OpenAI (audio not supported by Gateway)

#### Benefits

- **Cost Visibility**: Track spending per model/endpoint in real-time
- **Performance Metrics**: TTFT (Time to First Token) tracking per request
- **Automatic Caching**: 70-90% cost reduction on repeat operations
- **Failover**: Auto-retry with alternative providers if OpenAI is down
- **Unified Dashboard**: All AI usage at https://vercel.com/dashboard/ai-gateway

#### Cost Breakdown (Per Story)

**October 2025 - Optimized:**
- Whisper transcription: ~$0.006 (direct API)
- GPT-4o-mini formatting: ~$0.001 (Gateway)
- GPT-4o-mini lesson generation: ~$0.0007 (Gateway) ← **90% cost reduction**
- **Total per regular story**: ~$0.008

**Tier 3 Milestone** (Story 3, 7, 10, etc.):
- GPT-5 analysis (background): ~$0.02-0.15 (varies by milestone)
- **User experience**: No blocking delay - runs asynchronously

#### Configuration

**Environment Variable:**
```bash
AI_GATEWAY_API_KEY=vck_...  # Optional, falls back to OPENAI_API_KEY if not set
```

**Fallback Pattern:**
```typescript
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_GATEWAY_API_KEY
  ? 'https://ai-gateway.vercel.sh/v1'
  : undefined;
```

If `AI_GATEWAY_API_KEY` is not set, all requests use direct OpenAI API with zero code changes.

#### Observability Dashboard

**Location:** https://vercel.com/dashboard/ai-gateway

**Metrics Available:**
- Request volume by model (gpt-4o vs gpt-4o-mini)
- Cost per request and total spend over time
- TTFT (latency) graph showing request performance
- Token usage (input/output) per operation
- Activity log with timestamps and model details

#### Monitoring

Watch for:
- **Most expensive operations**: Tier 3 analysis > Lesson generation > Formatting
- **Slowest requests**: TTFT spikes indicate performance issues
- **Caching wins**: Repeat operations showing 97% cost reduction
- **Error rates**: Failed requests or Gateway downtime

### GPT-5 Tier-3 and Whisper Upgrades (PRODUCTION)

Advanced AI routing with GPT-5 reasoning for deeper synthesis in milestone analysis and whisper generation.

#### Overview

**Deployed:** October 14, 2025
**Status:** Production-ready with feature flags
**Branch:** `feature/gpt5-tier3-whispers`
**Commit:** eeb7493

Ships GPT-5 where deeper synthesis is needed (Tier-3 + Whispers) while preserving UX speed on Tier-1/Echo with fast models.

#### Model Routing Architecture

**Fast Operations (Always gpt-4o-mini):**
- ✅ **Tier-1 Templates**: Entity-based prompts after every story save
- ✅ **Echo Prompts**: Instant follow-up questions showing active listening
- No reasoning effort parameter (optimized for speed)

**Deep Synthesis Operations (GPT-5 when enabled):**
- ✅ **Tier-3 Milestones**: Story 1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100
  - Reasoning effort adjusts by milestone depth:
    - Stories 1-9: `low` effort (basic pattern recognition)
    - Stories 10-49: `medium` effort (pattern synthesis)
    - Stories 50+: `high` effort (deep character insights)
- ✅ **Whispers**: Context-aware prompts with `medium` effort
- Falls back to gpt-4o-mini when flags disabled

#### File Structure

**New Files:**
```
lib/ai/
├── modelConfig.ts        # Model selection & reasoning effort mapping
└── gatewayClient.ts      # Gateway client with comprehensive telemetry

tests/ai/
├── routing.spec.ts       # Model routing & effort mapping tests
└── gatewayClient.spec.ts # Gateway client configuration tests
```

**Updated Files:**
- `/lib/tier3AnalysisV2.ts` - Now uses GPT-5 with adjustable reasoning effort
- `/lib/whisperGeneration.ts` - Now uses GPT-5 at medium effort
- `/lib/echoPrompts.ts` - Updated to use Gateway (stays on fast model)
- `/app/api/stories/route.ts` - Added comprehensive telemetry logging

#### Environment Variables

Add to `.env.local`:

```bash
# Vercel AI Gateway (required)
VERCEL_AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1
VERCEL_AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

# Model Configuration
NEXT_PUBLIC_FAST_MODEL_ID=gpt-4o-mini          # Default for Tier-1/Echo
NEXT_PUBLIC_GPT5_MODEL_ID=gpt-5                # Default for Tier-3/Whispers

# Feature Flags (set to "true" to enable GPT-5)
NEXT_PUBLIC_GPT5_TIER3_ENABLED=true            # GPT-5 for Tier-3 with reasoning effort
NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=true         # GPT-5 for Whispers at medium effort
```

**Safe Defaults:** Flags default to `false`, using fast model (gpt-4o-mini) for all operations when not set.

#### Telemetry & Observability

All AI calls now log comprehensive telemetry:

```typescript
{
  op: "ai_call",
  stage: "tier3" | "whisper" | "echo",
  milestone?: number,
  model: "gpt-5" | "gpt-4o-mini",
  effort: "low" | "medium" | "high" | "n/a",
  ttftMs: 150,              // Time to first token (from Gateway headers)
  latencyMs: 2500,          // Total request latency
  costUsd: 0.0234,          // Cost in USD (from Gateway headers)
  tokensUsed: {
    input: 1500,
    output: 450,
    reasoning: 2800,        // GPT-5 reasoning tokens only
    total: 4750
  }
}
```

Monitor in:
- Gateway Dashboard: https://vercel.com/dashboard/ai-gateway
- Application logs: Server console shows per-call telemetry
- Cost tracking: Real-time spending by model/operation

#### Cost Implications

**Per Story Costs (GPT-5 enabled):**
- Tier-1 (gpt-4o-mini): ~$0.0001
- Echo (gpt-4o-mini): ~$0.0001
- Whisper (gpt-5 medium): ~$0.01
- Tier-3 (gpt-5 variable):
  - Story 3 (low effort): ~$0.02
  - Story 10 (medium effort): ~$0.05
  - Story 50 (high effort): ~$0.15

**Monthly Costs (1,000 active users, 10 stories/user):**
- Baseline (all gpt-4o-mini): ~$15/month
- With GPT-5 enabled: ~$52-132/month (3.5-9x increase)
- **ROI:** Significantly better prompt quality → higher Story 3 conversion

**Cost Controls:**
- Disable Whispers: `NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=false` saves ~$10/month
- Reduce Tier-3 frequency: Adjust milestone thresholds
- Lower effort: Modify `effortForMilestone()` mapping

#### Testing

**Run Tests:**
```bash
npm test tests/ai/routing.spec.ts        # Model routing & effort mapping
npm test tests/ai/gatewayClient.spec.ts  # Gateway client config
```

**Smoke Test Checklist:**
- [ ] Flags true → Tier-3 uses GPT-5 with milestone-based effort
- [ ] Flags false → All operations use fast model
- [ ] Gateway dashboard shows TTFT and cost for Tier-3/Whispers
- [ ] Quality gates still reject generic prompts (0% regression)
- [ ] Skip/retire logic unchanged
- [ ] Story 3 paywall: 1 unlocked + 3 locked prompts

#### Rollback Plan

If GPT-5 causes issues:

```bash
# Immediate rollback (set in Vercel dashboard)
NEXT_PUBLIC_GPT5_TIER3_ENABLED=false
NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=false
```

System automatically falls back to gpt-4o-mini for all operations. No code changes needed.

#### Monitoring & Alerts

Watch for:
- **Tier-3 latency**: Should be 2-5s (low), 5-10s (high effort)
- **Prompt quality scores**: Maintain ≥70 average
- **Story 3 conversion**: Target ≥45% (baseline: 35-40%)
- **Error rates**: GPT-5 should have <1% failure rate
- **Cost per user**: Track in Gateway dashboard by model

#### Documentation

Full implementation guide: `/GPT5_FEATURE_README.md`

**Includes:**
- Complete environment variable setup
- Architecture diagrams
- Cost breakdowns
- Troubleshooting guide
- Monitoring dashboard access
- Rollback procedures

### AI Speed Optimization (October 2025)

Performance and cost optimizations for the AI pipeline without sacrificing quality.

#### Overview

**Deployed:** October 16, 2025
**Status:** Phase 2 Complete (AssemblyAI Batch Integration)
**Full Plan:** `/AI_SPEED_OPTIMIZATION.md`

Achieved **14s → 6-8s** total latency (57% improvement) through model optimization and AssemblyAI batch transcription.

#### Phase 1 Implementations (Complete ✅)

**1. Async Tier 3 Analysis (Critical Bug Fix)**
- **Issue**: Tier 3 analysis was blocking story saves at milestones, causing 10-15 second delays
- **Fix**: Moved Tier 3 GPT-5 analysis to background using `setImmediate()`
- **Impact**: Story saves at milestones now return in **2-3 seconds** (83% faster!)
- **User Experience**: Transcription + lesson appear instantly, Tier 3 prompts generate in background
- **Location**: `/app/api/stories/route.ts:533-583`

**2. Lesson Extraction Model Downgrade**
- **Changed**: `gpt-4o` → `gpt-4o-mini` for lesson generation
- **Impact**: **90% cost reduction** ($0.007 → $0.0007 per story)
- **Quality**: Maintained (template-driven task, A/B testable)
- **Temperature**: Increased from 0.8 → 0.9 for creativity with smaller model
- **Savings**: ~$630/year per 100 stories/day
- **Location**: `/app/api/transcribe/route.ts:181`

**3. Parallel Audio Processing (Already Implemented)**
- **Verified**: Audio pipeline already uses `Promise.all()` for parallel execution
- **Flow**: Whisper transcription (3-4s) → Parallel formatting + lesson extraction (~1s each)
- **Total Latency**: 4-5 seconds (vs 8-10s if sequential)
- **Location**: `/app/api/transcribe/route.ts:405-414`

#### Performance Results

**Story Saves:**
- Regular stories: No change (~2-3 seconds)
- Milestone stories: **10-15s → 2-3s** (Stories #1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100)

**Cost Savings:**
- Lesson extraction: 90% reduction
- Total per-story cost: ~$0.016 → ~$0.005 (projected after Phase 2)
- Annual savings at 100 stories/day: ~$400/year

**Quality:**
- No degradation in lesson quality (template-driven task)
- Tier 3 still uses GPT-5 with reasoning effort
- All quality gates and deduplication preserved

#### Monitoring

Watch for in logs:
```
[Stories API] Queueing Tier 3 analysis for background processing...
[Tier 3 Background] Starting analysis for Story #10...
[Tier 3 Background] ✅ Analysis complete. Prompts now available.
```

**Telemetry includes:**
- `stage: "tier3_background"` for async operations
- Model used, reasoning effort, latency, cost per operation
- Comprehensive error handling with fallbacks

#### Phase 2 Implementations (Complete ✅)

**1. AssemblyAI Batch Transcription Integration**
- **Changed**: OpenAI Whisper → AssemblyAI "universal" model for transcription
- **Impact**: Marginal speed improvement but significant cost savings
- **Actual Performance**:
  - AssemblyAI batch transcription: ~3.7s (includes upload + polling overhead)
  - Whisper was: ~3-5s
  - Total flow: ~6-8s (vs 14s initial, 8s after Phase 1)
- **Cost Savings**: $0.006 → $0.0025 per minute (58% cheaper)
- **Quality**: Industry-leading accuracy (93.4% word accuracy, 6.6% WER)
- **Implementation**:
  - New endpoint: `/app/api/transcribe-assemblyai/route.ts`
  - Updated components: RecordModal.tsx, BookStyleReview.tsx
  - Uses `universal` speech model (balanced accuracy and speed)
  - Model options: "nano" (fastest/cheapest), "universal" (balanced), "best" (most accurate)
- **Total Pipeline**: ~6-8 seconds end-to-end (vs 14 seconds initial)
  - AssemblyAI transcription: ~3.7s (upload + queue + poll)
  - GPT-4o-mini formatting + lesson extraction: ~2-3s (parallel)

**2. Environment Setup**
- Required: `ASSEMBLYAI_API_KEY` in `.env.local` AND Vercel dashboard
- Get your key at: https://www.assemblyai.com/
- Fallback: Original Whisper endpoint still available at `/api/transcribe`

#### Performance Results (Phase 1 + Phase 2)

**Total Latency Reduction:**
- Initial state: 14 seconds (GPT-5 follow-ups + Whisper)
- After Phase 1: 8 seconds (switched to GPT-4o-mini)
- After Phase 2: **6-8 seconds** (switched to AssemblyAI batch)
- **Net improvement: 43-57% faster** ⚡

**Cost Impact:**
- Transcription: 58% cheaper ($0.006 → $0.0025 per min)
- Lesson extraction: 90% cheaper (Phase 1 optimization)
- Follow-up generation: 90% cheaper (Phase 1 optimization)
- Total per-story cost: ~$0.004-0.005 (vs $0.016 before)

**Why Not Faster?**
- AssemblyAI batch API requires: upload → queue → poll → return
- Polling overhead adds ~2-3s to actual processing time
- Real-time streaming could achieve sub-1s but requires more complex implementation

#### Future Optimizations (Phase 3)

**High-Impact:**
- **AssemblyAI Real-Time Streaming**: Could reduce transcription to <1s (vs current 3.7s batch)
  - More complex to implement (WebSocket connections, chunking)
  - Would require frontend changes to stream audio
  - Potential to hit original 3-4s total target

**Lower Priority:**
- Response caching for lesson deduplication
- Selective GPT-4o usage for Tier 3 (reserve GPT-5 for critical milestones)
- Parallel processing of follow-up questions during recording

#### Architecture Principles

1. **Quality First**: Never sacrifice prompt quality for speed/cost
2. **Background Processing**: Keep user-facing operations fast, defer deep analysis
3. **Incremental Improvements**: Small, measurable changes over rewrites
4. **Observability**: Comprehensive telemetry for all AI operations
5. **Graceful Degradation**: Fallbacks for every AI operation

## 🐛 Common Issues & Fixes

### Authentication & Email Verification

- Uses Supabase Auth as single source of truth
- **Email Confirmation Required**: Users must verify email before logging in
- Verification emails sent via Resend SMTP (from no-reply@updates.heritagewhisper.com)
- Email confirmation redirects to `/auth/callback` then `/timeline`
- JWT tokens with automatic refresh
- Session retries (5x 100ms) to handle race conditions
- Registration uses service role key to bypass RLS when creating user records

### Security & Privacy

- **Rate Limiting**: Upstash Redis with lazy initialization (graceful fallback if not configured)
- **EXIF Stripping**: All uploaded images processed with Sharp to remove metadata (GPS, camera info)
- **Image Processing**: Photos resized to max 2400x2400, converted to JPEG at 85% quality
- **Account Management**:
  - `/api/user/delete` - Complete account deletion (stories, files, auth)
  - `/api/user/export` - GDPR-compliant data export

### PDF Export

- **Print Pages**: `/book/print/2up` and `/book/print/trim`
- **API Routes**: `/api/export/2up`, `/api/export/trim`, `/api/book-data` (uses service role key)
- **Print Layout**: Bypasses root layout via `/app/book/print/layout.tsx` to avoid padding conflicts
- For detailed margin/centering fixes, see CLAUDE_HISTORY.md

### Navigation & UX Patterns

- **Cancel Button Behavior**:
  - Editing existing story → Returns to `/timeline`
  - Creating new story → Returns to origin page (timeline/book/memory box) via `returnPath` in NavCache
  - Location: `/app/review/book-style/page.tsx:649-667`, `/hooks/use-record-modal.tsx:89`
- **Recording Flow**:
  - Click "+" → Start Recording prompt → Countdown → Recording
  - On stop → "Processing" spinner (stays on recording screen) → Auto-navigate to review page
  - Location: `/components/RecordModal.tsx:182-308`, `/components/RecordModal.tsx:554-571`
- **Age Display Logic**:
  - Age > 0: "Age X"
  - Age = 0: "Birth"
  - Age < 0: "Before birth"
- **Memory Card Actions**: Dropdown menu (⋯) with Edit, Favorite/Unfavorite, Delete
- **Book Navigation**: Collapsed by default, expands to show TOC + decade markers

## 🚀 Deployment

### Vercel (Frontend)

- Auto-deploys from GitHub main branch
- Live: https://dev.heritagewhisper.com
- Set all environment variables in Vercel dashboard

### Database & Storage

- **Supabase Project:** tjycibrhoammxohemyhq
- **Bucket:** heritage-whisper-files (PUBLIC)
- **Schema:** Managed via SQL migrations
- **RLS Policies**: Enabled on all tables with optimized `(SELECT auth.uid())` pattern

## 🔍 Quick Troubleshooting

1. **401 errors**: Check Supabase session exists before API calls (session retry logic: 5x 100ms)
2. **Dev server exits**: Run `npm rebuild vite tsx`
3. **PDF export issues**: Check `/app/book/print/layout.tsx` bypasses root layout padding
4. **Images too large**: Sharp processor auto-resizes to 2400x2400 at 85% quality
5. **Mobile styling conflicts**: Check both `/app/globals.css` and `/app/book/book.css` media queries

For detailed historical fixes and solutions, see `CLAUDE_HISTORY.md`

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run check

# Database sync
npm run db:push

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🔌 MCP Servers

Configured in `/Users/paul/Documents/DevProjects/.mcp.json`:

- ✅ GitHub MCP - Repository management
- ✅ Supabase MCP - Database queries (read-only)
- ✅ Vercel MCP - Deployment management
- ✅ Stripe MCP - Payment APIs
- ✅ Resend MCP - Email sending

## 📊 Production Status

- ✅ All core features working
- ✅ Mobile responsive
- ✅ Production build successful
- ✅ Deployed and live
- ✅ PDF export working locally

## 🎯 Current Known Issues

- **PDF Export on Vercel**: Print page loads but React app not rendering (timeout waiting for `.book-spread`)
- **Book View Cursor Hints**: Directional cursor arrows (w-resize/e-resize) randomly flicker between directions on same page despite forced styles - clicking still works correctly

## ✅ Recent Updates (October 8, 2025)

### Recording UX Improvements

- **Processing Spinner**: After clicking stop, recording screen now shows "Processing your recording..." spinner while transcribing
  - Previously jumped back to initial "Start Recording" screen causing confusion
  - Now stays on recording screen → shows processing state → navigates to review page
  - Location: `/components/RecordModal.tsx:182-188`, `/components/RecordModal.tsx:554-571`
- **Cancel Navigation Fix**: Cancel button now returns user to origin page (timeline/book/memory box)
  - Previously always went to `/recording` page for new stories
  - Now uses `returnPath` stored in NavCache to return to where recording was initiated
  - Location: `/app/review/book-style/page.tsx:649-667`, `/hooks/use-record-modal.tsx:89`

### AI Transcription

- **OpenAI Whisper Integration**: Auto-transcription working with GPT-4 formatting
  - Model: `whisper-1` for transcription, `gpt-4-turbo-preview` for formatting and lesson generation
  - **Lesson Learned Generation**: Automatically suggests wisdom/lesson from each story (1-2 sentences, first-person)
  - Location: `/app/api/transcribe/route.ts:84-117` (wisdom generation), `:30-81` (formatting)
  - **Important**: Ensure `OPENAI_API_KEY` is uncommented in `.env.local`

### Mobile Book View Polish

- **Removed Debug Badge**: Removed viewport config debug overlay (`/app/book/page.tsx:769`)
- **Fixed Mobile Scrolling**: Restored `.book-wrap` vertical padding while removing horizontal padding
  - Mobile brown border now handled by `.book-container` margin (12px) + padding (8px) = 20px total
  - Pages scroll properly with equal brown border on all sides
  - Fixed conflict between `book.css` and `globals.css` media query overrides

### Timeline Year Badges

- **Increased Text Size**: Desktop 22px (was 14px), Mobile 17px (was 13px)
- **Improved Positioning**: Moved 5px left (desktop -65px, mobile -51px) for better alignment with vertical timeline
- **Explicit Font Properties**: Split shorthand `font:` into individual properties to prevent CSS override issues
- Location: `/app/styles/components.css:297-320`

## ✅ Recent Updates (October 9, 2025)

### Lesson Learned Display in Book View

- **Fixed Rendering**: Lessons learned (stored as `wisdomClipText` in database) now display properly in elegant callout boxes
  - Problem: Lesson text was appearing with CSS class names visible and broken formatting
  - Root cause: `lessonLearned` blocks were being included in `page.text`, causing duplicate/broken display
  - Solution: Filter out `lessonLearned` blocks from page text AND extract to `page.lessonLearned` field
  - Location: `/lib/bookPagination.ts:910-917,931`
- **Callout Styling**: Elegant curved quotation border with italic text
  - Background: `#FFFBF0` with `#E8B44F` left border
  - Curved bottom-left corner (`border-radius: 0 8px 8px 40px`) for quotation effect
  - Location: `/app/globals.css:3110-3139`
- **Rendering Logic**: Lessons appear on last page of story (`story-end` or `story-complete` page types)
  - Location: `/app/book/page.tsx:550-553`

### Mobile Book View Responsive Fixes

- **Dotted Decor Border**: Desktop 48px, Mobile 10px
  - Desktop: Full 48px border for premium print-like appearance
  - Mobile: Minimal 10px border for visual texture without wasting screen space
  - Location: `/app/globals.css:2819-2821`
- **Content Padding**: Desktop 48px, Mobile 20px
  - Desktop: Generous 48px breathing room between border and text
  - Mobile: Compact 20px padding to maximize content area
  - Location: `/app/globals.css:2824-2826`
- **Running Header & Edit Button**:
  - Desktop: Positioned at 18px from top with normal button sizing
  - Mobile: Positioned at -8px (above page edge), compact button with larger text
  - Edit button sizing: Desktop normal, Mobile narrower with 0.875rem text
  - Location: `/app/globals.css:2829-2854`
- **Navigation Arrows**:
  - Desktop: 64px touch targets
  - Mobile: 48px touch targets, positioned 8px from left, 12px from right
  - Location: `/app/globals.css:2857-2869`

### Book Layout Polish

- **Text Alignment**: Left-aligned (changed from justified) for better readability
  - Location: `/lib/bookPagination.ts:35`, `/app/globals.css:1693,2876`, `/app/book/book.css:291`
- **Page Margins**: Equal 48px margins on all sides with dotted decor border
  - Running headers positioned in dotted decor area (desktop: 18px left, 11px right for alignment)
  - Location: `/app/globals.css:2764-2814`
- **Photo Margins**: 0 top margin for clean 48px spacing from dotted border
  - Location: `/app/globals.css:1936`

## ✅ Recent Updates (October 10, 2025)

### PDF Export Improvements

- **Running Headers**: Now show story title, year, and age instead of generic "Heritage Whisper" / "Family Memories"
  - Format: "STORY TITLE • YEAR • AGE X" (uppercase)
  - Removed redundant year/age display from below the title
  - Location: `/app/book/print/2up/page.tsx`, `/app/book/print/trim/page.tsx`
- **Lesson Learned Styling**: Updated to match clean site design
  - Changed from yellow background box with icon to simple 4px straight gold left border (`#D4A574`)
  - Consistent styling across web view and PDF exports
  - Location: `/app/book/print/2up/page.tsx:452-481`, `/app/book/print/print-trim.css:116-138`

### Page Margins - Reduced for More Breathing Room

- **Book View**: Content margin reduced from 48px → 23px (25px reduction)
  - Fixed override in `globals.css` that was preventing CSS variable from working
  - Location: `/app/book/book.css:12` (CSS variable), `/app/globals.css:2820` (fixed override)
- **PDF Export**: Horizontal padding reduced from 0.5in → 0.25in per side
  - Gives text more breathing room on printed pages
  - Updated running header and page number positioning to match
  - Location: `/app/book/print/2up/page.tsx:386`, `/app/book/print/print-trim.css:31`

### Lesson Learned Bug Fixes

- **Added Remove Button**: Can now completely delete lessons in edit mode
  - New "Remove" button between Save and Cancel in lesson editor
  - Location: `/components/BookStyleReview.tsx:490-497`
- **Fixed Empty String Handling**: Deleting all text now properly saves empty string
  - Previous bug: Using `||` operator treated empty string as falsy, causing old value to reappear
  - Fix: Changed to explicit `!== undefined` check to allow empty strings
  - Location: `/app/api/stories/[id]/route.ts:247-251`

### Running Header Alignment Fix

- **Perfect Vertical Alignment**: All running headers now at consistent height across every page
  - Previous bug: Left/right pages had different `top` values (18px vs 11px), causing random misalignment
  - Fix: Both pages now use `top: 18px` with fixed height container and baseline alignment
  - Changed from `min-height: 28px` → `height: 28px` + `line-height: 28px` to prevent layout shifts
  - Changed `align-items: center` → `align-items: flex-start` for consistent baseline
  - Updated horizontal positioning from 48px → 23px to match new content margins
  - Location: `/app/globals.css:2771-2796`

## ✅ Recent Updates (January 2025)

### Navigation Redesign

- **Desktop Navigation Moved to Bottom**: Horizontal navigation bar replacing left sidebar
  - Home, Timeline, Book, Profile icons
  - Fixed to bottom of viewport (80px from bottom to avoid progress bar)
  - Location: `/components/DesktopNavigationBottom.tsx`
- **Book View Simplified**: Removed TOC sidebar and book navigation panel
  - Clean dual-page layout with only progress bar for navigation
  - Standalone progress bar component: `/components/BookProgressBar.tsx`
  - Decade markers clickable on progress bar
- **Mobile Book View Enhanced**: 
  - Restored bottom navigation bar (previously hidden)
  - Added decades pill navigation for quick chapter jumps
  - Location: `/components/BookDecadesPill.tsx`

### Book View Enhancements

- **Progress Bar Improvements**:
  - Tooltip now shows "Page 25 of 92 • 1995" (page number + year)
  - Year displayed in amber color matching progress bar
  - Expands on hover (2x height via scaleY transform)
  - Centered with symmetric expansion
  - Location: `/components/BookProgressBar.tsx`
- **Page Click Navigation**:
  - Click page margins to turn pages
  - Clickable via existing `onClick` handlers
  - Cursor hints attempted (w-resize/e-resize) but have reliability issues (see Known Issues)
  - Location: `/app/book/page.tsx`, `/app/book/book.css`

### Testing Infrastructure

- **Vitest Test Suite**: Complete test coverage for prompt API endpoints
  - 20 comprehensive tests (10 GET, 10 POST)
  - In-memory Supabase mock with full query builder
  - Zero network calls - isolated tests
  - Tests: authentication, validation, Tier-1 generation, skip flow, retirement
  - Guide: `TESTING_GUIDE.md`
  - Run: `npm test` or `npm run test:watch`

---

_Last updated: October 16, 2025_
_For historical fixes, feature archives, and migration notes, see CLAUDE_HISTORY.md_
