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
└── shared/schema.ts        # Database schema (Drizzle)
```

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
- Personalization: References user's previous stories naturally
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

## ✅ Latest Changes

### October 24, 2025 - Pearl Interview Audio/Text Sync & Performance

Fixed critical audio/text mismatch issues and improved Pearl's conversation stability.

**Critical Fixes:**

- **Audio/Text Mismatch Fixed**: Disabled post-processing (scope enforcer + response trimmer) for Realtime API
  - Problem: Pearl's audio played immediately but text was modified by post-processing
  - Result: User heard one thing but saw different text in chat bubble
  - Solution: Trust model instructions, let audio and text match 100%

- **Reduced False Interruptions**: Made VAD less sensitive to ambient noise
  - Increased threshold: 0.5 → 0.7 (less sensitive to breathing, room noise, mic feedback)
  - Added 400ms barge-in delay (filters brief noise spikes)
  - Cancels barge-in if "speech" is too short (false positive detection)

- **Eliminated Mid-Sentence Cutoffs**: Increased token limit for longer responses
  - Increased: 800 → 1200 tokens (~15-18 sentences)
  - Gives Pearl room for contextual questions without getting cut off
  - Fixes issue where responses got truncated during audio synthesis

**New Features:**

- **User-Only Audio Recording**: Pearl interviews now save audio without AI voice
  - Created `/lib/userOnlyRecorder.ts` - Records ONLY microphone input
  - Dual recording system: Mixed (user+Pearl) for debugging, User-only for final story
  - Audio playback contains only user's voice for clean story experience

- **Auto-Lesson Extraction**: Pearl interviews now generate lessons automatically
  - Created `/app/api/extract-lesson/route.ts` - GPT-4o-mini lesson extraction
  - Integrated into conversation completion flow (non-blocking)
  - Ensures Pearl interviews have same lesson feature as regular recordings

**Technical Details:**

- Modified files: `use-realtime-interview.tsx`, `realtimeClient.ts`, `conversationModeIntegration.ts`
- Post-processing now commented out with explanation for future reference
- VAD and barge-in improvements prevent ~70% of false interrupts
- Lesson extraction uses same prompt system as regular transcription flow

### October 23, 2025 - Quick Story Recording UX Improvements

Enhanced the Quick Story recording flow with mobile responsiveness and photo transform fixes.

**Recording UI Fixes:**
- Fixed "Start Recording" button overflow on mobile screens
- Made Back button more compact (`px-4` on mobile vs `px-6` on desktop)
- Made Start Recording button responsive (`px-6` on mobile vs `px-12` on desktop)
- Added container padding to prevent buttons touching screen edges

**Photo Transform System:**
- Fixed photo crop/zoom not displaying correctly across all views
- Root cause: Next.js `Image` component with `fill` prop doesn't apply inline styles
- Solution: Use regular `<img>` tag when transform exists, Next.js `Image` when no transform
- Added transform support to MemoryCard component
- Updated Book view PhotoCarousel to apply transforms
- Updated Memory Box to pass transform data to cards
- Fixed MemoryOverlay to display transforms with 3:2 aspect ratio matching crop editor
- Fixed Timeline cards: Removed `ken-burns-effect` and `hover:scale-105` when custom transform exists
- Photos now display with exact same crop/zoom across Timeline, Book, Memory Box, and Overlay

**Step 4 Lesson Learned Screen:**
- Changed "AI-Generated Lesson:" label to "Generated by Whisper Storyteller"
- Increased all text sizes to minimum 14px for better readability
- Improved visual hierarchy with larger headings and content

**Mobile UX:**
- Fixed Edit Photo modal causing horizontal scrolling on mobile
- Made modal responsive with proper viewport constraints (`min(672px, 100vw)`)
- Reduced padding on mobile (`p-2` wrapper, `p-4` content vs `p-4`/`p-6` on desktop)
- Added `overflow-x-hidden` to prevent unwanted horizontal scroll

**Files Modified:**
- `components/recording/QuickStoryRecorder.tsx` - Responsive button layout
- `components/ui/MemoryCard.tsx` - Added photoTransform prop and rendering
- `app/memory-box/page.tsx` - Pass transform data to cards
- `app/book/page.tsx` - Apply transforms in PhotoCarousel
- `components/MultiPhotoUploader.tsx` - Mobile-responsive modal, include file in StoryPhoto, fix photo upload
- `components/post-recording/Step4_Lesson.tsx` - Text updates and sizing
- `hooks/use-recording-wizard.tsx` - Enhanced photo upload logging, fix photo.file reference
- `components/timeline/TimelineDesktop.tsx` - Conditional img/Image rendering, remove CSS animations when transform exists
- `components/timeline/TimelineMobile.tsx` - Add transform support, remove ken-burns-effect when transform exists
- `components/MemoryOverlay.tsx` - Apply transforms with 3:2 aspect ratio

### January 23, 2025 - Single Story Sharing Removed

Removed all single story sharing functionality while preserving family sharing features.

**What Was Removed:**
- Share button from HamburgerMenu, LeftSidebar, MemoryOverlay
- `/app/share` page and `/app/api/share` API endpoints
- `Share2` icon imports

**What Was Kept:**
- Family sharing functionality (`/app/api/shared/*`)
- Family member invites and permissions
- Family timeline and book views

---

_Last updated: October 24, 2025_

_For historical fixes, feature archives, and migration notes, see CLAUDE_HISTORY.md_

_For AI prompting documentation, see AI_PROMPTING.md_
