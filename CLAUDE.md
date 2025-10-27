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
- **AI:** AssemblyAI ("universal" batch transcription, 58% cheaper) + OpenAI API (Whisper fallback, Realtime API) + Vercel AI Gateway (GPT-4o routing)
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
NEXT_PUBLIC_OPENAI_API_KEY=sk-... # For browser WebRTC

# AssemblyAI (Primary transcription)
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Vercel AI Gateway (Optional)
AI_GATEWAY_API_KEY=vck_...

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# PDFShift (PDF Export)
PDFSHIFT_API_KEY=sk_...
NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Session
SESSION_SECRET=your_secret

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true  # Enable Pearl Realtime API
```

## 📁 Project Structure

```
HeritageWhisperV2/
├── app/                      # Next.js 15 App Router
│   ├── api/                 # API routes
│   ├── auth/               # Auth pages
│   ├── timeline/           # Timeline view
│   ├── book/               # Book view (dual-page layout)
│   ├── prompts/            # Prompts library
│   ├── interview-chat/     # Pearl AI interviewer
│   ├── profile/            # User settings
│   └── admin/              # Admin tools
├── components/              # React components
├── lib/                     # Utilities
├── hooks/                   # Custom React hooks
├── tests/                   # Test suite
├── migrations/             # Database migrations
├── shared/schema.ts        # Database schema (Drizzle ORM)
└── docs/                    # Technical documentation
    ├── DATA_MODEL.md       # Complete database schema reference
    └── entity-relationship-diagram.md
```

## 📊 Database & Data Model

**Complete documentation:** See [DATA_MODEL.md](DATA_MODEL.md)

### Database Overview

- **21 Tables** with full TypeScript type safety via Drizzle ORM
- **Row Level Security (RLS)** enabled on all tables
- **50+ Performance Indexes** for optimized queries
- **Multi-tenant Architecture** via `has_collaboration_access()` RPC

### Table Categories

- **Core User (3)**: users, profiles, webauthn_credentials
- **Content (3)**: stories, photos, active_prompts
- **AI Prompts (5)**: ai_prompts, user_prompts, family_prompts, prompt_feedback, prompt_entities
- **Family Sharing (5)**: family_members, family_invites, family_collaborations, family_sessions, family_access_tokens
- **Admin/Monitoring (3)**: admin_audit_log, ai_usage_log, stripe_customers
- **Supporting (2)**: migrations, expired_prompts

### Key Database Objects

**Type-Safe Schema (`shared/schema.ts`):**
- All 21 tables with Drizzle ORM definitions
- Zod validation schemas for API requests
- TypeScript types for type safety (100% coverage)

**RPC Functions:**
- `has_collaboration_access(user_uuid, storyteller_uuid)` - Multi-tenant access control
- `check_ai_budget(user_uuid, cost_usd)` - AI spending enforcement
- `log_ai_usage(user_uuid, model, tokens_in, tokens_out, cost_usd)` - Usage tracking
- `archive_expired_prompts()` - Cleanup expired prompts (7-day TTL)
- `cleanup_expired_family_access()` - Remove expired family tokens

### Quick Reference

```typescript
// Import types from schema
import { type Story, type InsertStory } from "@/shared/schema";

// Type-safe database queries with Drizzle
const userStories = await db.query.stories.findMany({
  where: eq(stories.userId, userId),
  orderBy: desc(stories.createdAt),
});
```

**Documentation Files:**
- [DATA_MODEL.md](DATA_MODEL.md) - Complete ER diagrams, table definitions, constraints
- [docs/SCHEMA_UPDATE_SUMMARY.md](docs/SCHEMA_UPDATE_SUMMARY.md) - Recent schema changes
- [docs/entity-relationship-diagram.md](docs/entity-relationship-diagram.md) - Quick reference diagrams

## 🔑 Key Features

- **Audio Recording**: Simplified one-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: AssemblyAI "universal" batch (~3.7s, 58% cheaper, 93.4% accuracy)
- **Pearl AI Interviewer**: Conversational AI via OpenAI Realtime API with WebRTC
- **AI Prompt System**: Multi-tier reflection prompt generation (Tier 1: entity-based, Tier 3: milestone analysis)
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade
- **Book View**: Dual-page layout with natural pagination
- **PDF Export**: 2-up (home print) and trim (POD) formats via PDFShift
- **Family Sharing**: Multi-tenant account system with role-based permissions (viewer/contributor)
- **Rate Limiting**: Upstash Redis-based (auth: 5/10s, uploads: 10/min, API: 30/min)

## 🤖 AI Features

### Pearl - The Documentary Interviewer

Pearl is HeritageWhisper's conversational AI interviewer via OpenAI Realtime API.

**Key Features:**
- Expert interviewing techniques drawing out sensory details and emotions
- Voice-first design with real-time audio streaming (WebRTC)
- User-only audio recording (Pearl's voice excluded from final story)
- Auto-lesson extraction from conversation transcripts
- 30-minute sessions with automatic completion

**Technical Config:**
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Token limit: 1200 tokens (~15-18 sentences)
- VAD threshold: 0.7 (less sensitive to ambient noise)
- Barge-in delay: 400ms (prevents false interrupts)
- Post-processing: DISABLED (ensures audio/text match)
- Personalization: TEMPORARILY DISABLED (see Known Issues)

**Implementation:**
- `/hooks/use-realtime-interview.tsx` - Pearl's main hook
- `/lib/realtimeClient.ts` - WebRTC connection & VAD
- `/lib/userOnlyRecorder.ts` - User-only audio capture
- `/app/interview-chat/` - Conversation UI
- `/app/api/extract-lesson/` - Lesson extraction endpoint

For detailed prompt engineering, see `AI_PROMPTING.md`

### AI Prompt Generation System

Intelligent reflection prompt system helping users deepen their storytelling.

**Tier 1: Template-Based Entity Prompts**
- Trigger: After EVERY story save
- Process: Regex-based entity extraction (people, places, objects, emotions)
- Zero cost, 7-day expiry
- Example: "{person} mattered. What did they teach you that truly stuck?"

**Tier 3: Milestone Analysis Prompts**
- Trigger: At story milestones [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100]
- Process: GPT-4o analysis of all user stories (async background)
- Generates 2-5 high-quality personalized prompts
- Example: "You've mentioned Coach several times - who were they to you?"

**Lesson Learned Extraction**
- Trigger: During transcription (every story)
- Process: GPT-4o-mini generates 3 lesson options (1-2 sentences, first-person)
- User picks one or writes their own
- Displayed in book view with gold left border callout

### Vercel AI Gateway Integration

All GPT models route through Vercel AI Gateway for observability and caching.

**Benefits:**
- Cost visibility and tracking per model/endpoint
- Performance metrics (TTFT tracking)
- Automatic caching (70-90% cost reduction on repeat operations)
- Failover with automatic retry

**Cost per Story (October 2025):**
- AssemblyAI transcription: ~$0.0025/min
- GPT-4o-mini lesson generation: ~$0.0007
- Tier 1 prompts: $0 (regex-based)
- **Total per regular story**: ~$0.004-0.005

## 🐛 Common Issues & Fixes

### Authentication & Email Verification

- Email confirmation required before login
- Verification emails sent via Resend SMTP (no-reply@updates.heritagewhisper.com)
- Session retries (5x 100ms) to handle race conditions
- JWT tokens with automatic refresh

### Passkey Authentication (WebAuthn)

**Status:** ✅ Production Ready (October 2025)

Passwordless authentication using platform authenticators (Touch ID, Face ID, Windows Hello, Dashlane).

**Features:**
- Discoverable credentials (username-less login)
- Iron-session encrypted httpOnly cookies
- Dual session support (Supabase + passkey sessions in `/api/auth/me`)
- Automatic detection (passkey button only shows if user has passkeys)
- Platform authenticators preferred (biometric security)

**Configuration:**
- RP_ID: `heritagewhisper.com` (apex domain for all environments)
- Library: SimpleWebAuthn v13 (`@simplewebauthn/server` + `@simplewebauthn/browser`)
- Database: `passkeys` table with credential storage
- Session cookie: `hw_passkey_session` (httpOnly, secure)

**Environment Variables:**
```bash
RP_ID=heritagewhisper.com
RP_NAME=HeritageWhisper
ORIGIN=https://dev.heritagewhisper.com  # Production URL
IRON_SESSION_PASSWORD=<random-32-byte-key>
COOKIE_NAME=hw_passkey_session
SUPABASE_JWT_SECRET=<supabase-jwt-secret>
```

**API Endpoints:**
- `POST /api/passkey/register-options` - Generate registration options
- `POST /api/passkey/register-verify` - Verify and store new passkey
- `POST /api/passkey/auth-options` - Generate authentication options
- `POST /api/passkey/auth-verify` - Verify passkey and create session
- `GET /api/passkey/manage` - List user's passkeys
- `POST /api/passkey/check` - Check if user has passkeys (for conditional UI)

### Security & Privacy

**Implementation Status:** 60-70% Complete

**✅ Fully Implemented:**
- Admin RBAC with audit logging
- Rate limiting (6 limiters configured)
- Row Level Security on all 20 database tables
- Security headers (CSP, HSTS, X-Frame-Options, CORS)
- EXIF stripping from all uploaded images
- PII protection (no email addresses in logs)
- Account management (delete, GDPR-compliant export)

**Documentation:**
- Full assessment: `SECURITY_IMPLEMENTATION_STATUS.md`
- Remediation plan: `SECURITY_REMEDIATION_PLAN.md`
- Security overview: `SECURITY.md`

### Family Sharing V3 - Multi-Tenant Account System

**Status:** ✅ Production Ready (January 2025)

**Core Features:**
- Full user accounts for each family member (Supabase auth)
- Seamless account switching between own stories and family member stories
- Role-based permissions: Viewer (read-only) and Contributor (can submit questions, record stories)
- Multi-tenant data access: All API routes support `storyteller_id` parameter

**Key Components:**
- `useAccountContext()` hook - Current storyteller context
- `AccountSwitcher` component - Dropdown for switching accounts
- Database: `family_members` table, `get_user_collaborations()` RPC, `has_collaboration_access()` RPC

**API Endpoints:**
- `GET /api/accounts/available` - Lists accessible storytellers
- `GET /api/stories?storyteller_id=<id>` - Fetch stories for specific account
- `POST /api/prompts/family-submit` - Submit custom question (contributors only)

**Important:** Database uses snake_case but frontend expects camelCase. API endpoints map fields automatically.

### PDF Export (PDFShift Integration)

**Status:** ✅ Production Ready (January 2025)

Replaced Puppeteer/Chromium with PDFShift cloud service.

**Benefits:**
- ~150MB build size reduction
- 5x faster builds (59s vs 5min+)
- More reliable than self-hosted browser automation

**Configuration:**
```bash
PDFSHIFT_API_KEY=sk_...
NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com
```

**Formats:**
- 2-up (home printing): 11"x8.5" landscape
- Trim (POD): 5.5"x8.5" portrait

**Documentation:** See `PDFSHIFT_INTEGRATION.md` for complete guide

### Navigation & UX Patterns

- **Cancel Button**: Editing existing story → `/timeline`, Creating new story → origin page via `returnPath`
- **Recording Flow**: "+" → Start Recording → Countdown → Recording → Processing → Review page
- **Age Display**: Age > 0: "Age X", Age = 0: "Birth", Age < 0: "Before birth"
- **Memory Card Actions**: Dropdown menu (⋯) with Edit, Favorite/Unfavorite, Delete
- **Book Navigation**: Collapsed by default, click progress bar for navigation

## 🚀 Deployment

### Vercel (Frontend)

- Auto-deploys from GitHub main branch
- Live: https://dev.heritagewhisper.com
- Set all environment variables in Vercel dashboard

### Database & Storage

- **Supabase Project:** tjycibrhoammxohemyhq
- **Bucket:** heritage-whisper-files (PUBLIC)
- **Schema:** Managed via SQL migrations in `/migrations`
- **RLS Policies**: Enabled on all tables with optimized `(SELECT auth.uid())` pattern

## 🔍 Quick Troubleshooting

1. **401 errors**: Check Supabase session exists before API calls (session retry logic: 5x 100ms)
2. **Dev server exits**: Run `npm rebuild vite tsx`
3. **PDF export issues**: Check PDFShift API key in Vercel dashboard
4. **Images too large**: Sharp processor auto-resizes to 2400x2400 at 85% quality
5. **ChunkLoadError**: Clear `.next` cache, kill port conflicts, restart on port 3002

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
- ✅ Deployed and live at https://dev.heritagewhisper.com
- ✅ PDF export working locally
- ⚠️ PDF formatting 95% complete (minor polish needed)

## 🎯 Current Known Issues

- **Book View Cursor Hints**: Directional cursor arrows (w-resize/e-resize) randomly flicker between directions despite forced styles (clicking still works correctly)

- **Pearl Personalization Disabled**: Pearl's ability to reference previous stories is temporarily disabled
  - **Long-term Solution**: Fetch user's actual stories and inject into session instructions before re-enabling personalization

## ✅ Latest Changes

### January 25, 2025 - RecordModal Architecture Refactoring

**Status:** ✅ Complete (Merged to main)

Refactored RecordModal.tsx from monolithic 1,705-line component into 8 focused, reusable files following React best practices.

**Architecture Changes:**
- **RecordModal.tsx**: 1,705 → 310 lines (82% reduction)
- Extracted 3 reusable custom hooks (~580 lines total)
- Created 4 screen components (~660 lines total)
- All files under 200-line best practice limit

**New Hooks (hooks/):**

1. **use-transcription.tsx** (~210 lines)
   - Reusable audio transcription via AssemblyAI
   - Supports foreground (blocking) and background (non-blocking) transcription
   - Session management with retry logic
   - Can be used by RecordModal, QuickStoryRecorder, or future features

2. **use-follow-up-questions.tsx** (~180 lines)
   - Generates contextual follow-up questions during recording
   - Partial audio capture without stopping recording
   - AI-generated questions (3 at a time) via GPT-4o-mini
   - Chunk tracking to avoid re-transcribing same audio

3. **use-recording-state.tsx** (~190 lines)
   - Main state orchestrator composing transcription + follow-up hooks
   - Recording state machine (start/pause/resume/stop)
   - Audio review flow, Go Deeper questions, typing mode
   - All actions memoized with useCallback

**New Components (components/recording/):**

1. **AudioReviewScreen.tsx** (~150 lines)
   - Audio review interface after recording stops
   - Continue to add details or re-record options
   - Background transcription trigger

2. **RecordingScreen.tsx** (~180 lines)
   - Main recording interface with VoiceRecordingButton
   - Follow-up question display with navigation
   - Pause/resume controls, AI disabled state
   - Recording tips and contextual help

3. **TranscriptionReview.tsx** (~180 lines)
   - Transcription editing and review screen
   - Audio playback controls
   - Go Deeper button integration
   - Support for typing mode

4. **GoDeeperOverlay.tsx** (~150 lines)
   - Modal overlay for AI-generated follow-up questions
   - Question carousel with dot indicators
   - Previous/next navigation, skip or continue options

**Type Safety:**
- Added interfaces to `types/recording.ts` for all hooks and components
- 100% TypeScript with no 'any' types
- Full type safety across refactored code

**Benefits:**
- ✅ **Maintainability**: Each file has single, clear responsibility
- ✅ **Reusability**: Hooks can be used across app (QuickStoryRecorder, Pearl interviewer, etc.)
- ✅ **Readability**: All files under 200 lines vs single 1,705-line file
- ✅ **Type Safety**: Full TypeScript coverage with proper interfaces
- ✅ **Zero Breaking Changes**: All functionality preserved, 0 build errors

**Research-Informed:**
- React.dev: Custom hooks & state management patterns
- Industry: 200-line component guideline
- Codebase: Matches existing useQuickRecorder pattern

**Files Modified:**
- `components/RecordModal.tsx` - Simplified orchestrator
- `types/recording.ts` - Added hook/component interfaces
- `hooks/use-transcription.tsx` - New
- `hooks/use-follow-up-questions.tsx` - New
- `hooks/use-recording-state.tsx` - New
- `components/recording/AudioReviewScreen.tsx` - New
- `components/recording/RecordingScreen.tsx` - New
- `components/recording/TranscriptionReview.tsx` - New
- `components/recording/GoDeeperOverlay.tsx` - New

---

_Last updated: January 25, 2025_

_For historical fixes, feature archives, and migration notes, see CLAUDE_HISTORY.md_

_For AI prompting documentation, see AI_PROMPTING.md_
