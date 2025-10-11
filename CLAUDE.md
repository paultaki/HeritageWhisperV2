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
- **AI:** OpenAI API (Whisper & GPT-4)
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
│   ├── DesktopNavigation.tsx # Left sidebar navigation (desktop)
│   ├── MobileNavigation.tsx # Bottom navigation bar (mobile)
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities
│   ├── auth.tsx            # Auth context & provider
│   ├── supabase.ts         # Supabase client & helpers
│   ├── ratelimit.ts        # Upstash Redis rate limiting
│   ├── imageProcessor.ts   # Image processing & EXIF stripping
│   ├── bookPagination.ts   # Book pagination logic
│   └── utils.ts            # Helper functions (normalizeYear, formatYear)
└── shared/
    └── schema.ts           # Database schema (Drizzle)
```

## 🔑 Key Features
- **Audio Recording**: Simplified one-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: OpenAI Whisper API with automatic processing
- **AI Prompt System**: Multi-tier reflection prompt generation (see AI Features section below)
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade with "Before I Was Born" section
- **Book View**: Dual-page layout with natural pagination, collapsed decade navigation
- **PDF Export**: 2-up (home print) and trim (POD) formats with server-side generation
- **Memory Box**: Grid/list view toggle with filtering (All, Favorites, Timeline, Book, No date, Private)
- **Mobile Responsive**: Senior-friendly UX with large touch targets
- **Desktop Navigation**: Left sidebar (192px wide) with labeled icons
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
- **Process**: Combined GPT-4o analysis of all user stories
  - Analyzes entire story collection for patterns, themes, character evolution
  - Generates high-quality reflection prompts (25-30 words each)
  - Extracts character insights: traits, invisible rules, contradictions, core lessons
  - Stores insights in `character_evolution` table (upsert on conflict)
- **Character Insights**: Confidence scores, supporting evidence, insight categories
- **Location**: `/lib/tier3Analysis.ts`, `/app/api/stories/route.ts:277-366`
- **Example Insights**:
  - Traits: "Loyalty (0.9 confidence): Stayed at camp despite fear"
  - Invisible Rules: "Never show weakness even when scared"
  - Contradictions: "Values independence but craves deep connection"
  - Core Lessons: "True courage is staying when you want to run"

#### Lesson Learned Extraction
- **Trigger**: During transcription (every story)
- **Process**: GPT-4o generates 3 lesson options (1-2 sentences, first-person)
- **User Experience**: Review page shows 3 options, user picks one or writes their own
- **Database**: Stored in `stories.wisdom_text` column
- **Location**: `/app/api/transcribe/route.ts:84-117`
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

#### Pending Implementation
- **GET `/api/prompts/next`**: Fetch next prompt to display to user
- **POST `/api/prompts/skip`**: Retire skipped prompts
- **Stripe webhook**: Unlock Story 3+ premium prompts on payment
- **UI components**: Display prompts in app interface
- **Do-not-ask**: User-controlled topic blocking

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

---
*Last updated: October 10, 2025*
*For historical fixes, feature archives, and migration notes, see CLAUDE_HISTORY.md*
