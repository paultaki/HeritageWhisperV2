# HeritageWhisperV2 - Historical Fixes & Migration Notes

This document contains detailed historical information about the V2 migration and past issues. For current working documentation, see `CLAUDE.md`.

---

## 🎉 Migration Timeline

### October 1, 2025 - Initial Migration

**Duration:** ~7 hours (9:30 AM - 4:30 PM PST)

**Completed:**

- Next.js 15 with App Router setup
- All authentication pages migrated
- Core components and pages
- API routes (auth, stories, transcription, profile)
- Supabase integration (auth, database, storage)
- Photo and audio management
- Book view with pagination
- Mobile responsive design

---

## 📝 Major Feature Additions

### January 3, 2025 - Database & Photo Persistence

- **Migration to Supabase Database**: Switched from Neon to Supabase's built-in PostgreSQL
- **Photo Persistence Fix**: Photos now stored as file paths, signed URLs generated on-demand
- **Audio Controls**: Added delete and re-record functionality
- **Memory Box Page**: Created story management view with filters and bulk actions
- **Onboarding Flow**: Birth year collection for new users
- **Auth Flow Pages**: Complete email verification, password reset, OAuth callback
- **Sharing System**: Permission-based sharing (view/edit) - 80% complete

### January 4, 2025 - Mobile UX Optimization

- **Book View Mobile**: Fixed navigation footer z-index, photo carousel redesign
- **Timeline Spacing**: Optimized left margin for wider cards on mobile
- **Audio Upload Formats**: Added support for MP3, WAV, OGG, M4A
- **Text Justification**: Fixed huge gaps on mobile by changing to left-align
- **Mobile Header**: Better spacing and tap targets (44x44px minimum)

### October 4, 2025 - Legal Compliance

- **Terms & Privacy Tracking**: Full GDPR/CCPA compliant system
- **Database Schema**: `users` and `user_agreements` tables with audit trail
- **API Endpoints**: Accept, status, and registration integration
- **Frontend Components**: AgreementGuard, AgreementModal, status hook
- **Resend Email Integration**: Verification and welcome emails

### October 5, 2025 - Critical Fixes

- **Login to Register Navigation**: Fixed inline form toggle, now properly navigates to `/auth/register`
- **Audio Upload MIME Types**: Updated Supabase bucket to allow all audio formats (was only allowing webm/ogg)
- **Timeline Decade Sorting**: Birth year section now correctly appears before same-decade stories
- **Legal Documents Update**: Removed wisdom clips and character traits references from Terms & Privacy pages
- **RLS Security**: Enabled RLS on `recording_sessions` and `usage_tracking` tables
- **RLS Performance**: Optimized all policies to use `(SELECT auth.uid())` pattern instead of `auth.uid()`
- **Function Security**: Fixed `increment_view_count` search path with `SET search_path = public, pg_temp`
- **Email Confirmation Flow**: Fixed redirect to go directly to `/timeline` after email verification
- **Duplicate Agreement Modal**: Fixed by using service role key in registration to properly set agreement versions
- **Resend SMTP**: Configured email sending via custom domain (no-reply@updates.heritagewhisper.com)

### October 8, 2025 - Book View & UI Enhancements

#### Book View Premium Layout (Tagged: `book-view-premium-v1`)

- **Intelligent Viewport Switching**: Automatic spread ↔ single-page mode based on available width and minimum font size (18px body text)
- **Fixed Header/Footer Alignment**: Corrected desktop nav width calculations (80px → 112px)
  - `.book-header` now properly aligns with left sidebar (w-28 = 112px)
  - `.book-container` centering calculation updated to account for correct sidebar width
  - Removed 48px gap between header and sidebar
  - Fixed ~38px overlap of container with sidebar
- **Premium Single-Page Mode**: Spine hint with proper depth, centered content with explicit width
- **Navigation Arrows**: Fixed z-index (45) and mobile visibility, positioned at 120px on desktop (past 80px sidebar)
- **Export PDF Button**: Added 60px right margin to avoid hamburger menu overlap
- **Class-Based Styling**: Switched from media queries to `.spread-mode` and `.single-mode` classes for better control
- **Mobile Optimization**: Maximized content width with slim brown border, proper touch targets (64px)
- **Removed Decade Navigation**: Simplified book view by removing decade nav pills
- All changes are screen-only (no print/PDF export modifications)

#### PDF Export Margins

- **Fixed Centering Issue**: Content no longer stuck to top-left corner or bleeding onto extra pages
  - Created `/app/book/print/layout.tsx` to bypass root layout wrapper
  - Added CSS overrides to reset parent div padding
  - Used `.book-spread` with `padding: 0.25in` and `box-sizing: border-box` (keeps total height at exactly 8.5in)
  - Set `.spread-content` to `width: 100%; height: 100%` to fill the padded area
  - Result: Equal 0.25in margins on all sides without overflow

#### Blank Pages on Initial Book Load

- **Problem**: BookView showed blank pages on first visit, required refresh to display content
- **Root Causes**:
  - Font loading blocked pagination (waiting for `document.fonts.ready`)
  - Pagination waited for `fontsReady` state before calculating
  - If fonts failed to load, pagination never occurred
- **Solution**: Optimistic rendering
  - Added font preloading in `/app/layout.tsx` (Playfair Display, Crimson Text)
  - Modified pagination to run immediately with fallback metrics
  - Font wait happens in parallel, triggers re-pagination when fonts load
  - Result: Instant page display with automatic refinement when fonts ready
- Location: `/app/book/page.tsx:430-462`, `/app/layout.tsx:25-36`

#### Audio Progress Bar Gradient (Mobile)

- **Problem**: Gradient fill not visible below 900px width (appeared as gray bar)
- **Debug Process**: Added console logging revealed element was 16px×16px instead of stretching
- **Root Cause**: CSS class `.audio-fill` inherited default 16px font-size, making element fixed size
- **Solution**: Removed `className="audio-fill"` entirely, used pure inline styles with `fontSize: "0"`
- Location: `/app/book/page.tsx:355-375`

#### Mobile Audio Player Height

- **Reduced Vertical Space**: Made ~20-25% shorter on mobile
  - Button sizes: 40px → 36px (desktop), 44px → 40px (mobile)
  - Icon sizes: 16px → 14px (mobile)
  - Reduced margins and padding throughout
- Location: `/app/book/page.tsx:330-340`

---

## 🐛 Historical Issues & Solutions

### Audio Upload Issues (October 5, 2025)

**Multiple Attempts:**

1. ❌ Tried removing explicit contentType → Defaulted to text/plain
2. ❌ Tried setting contentType to `audio/mpeg` → Rejected as unsupported
3. ❌ Tried wrapping File in new File() → Converted to string
4. ❌ Tried direct Blob upload → Still MIME type issues
5. ✅ **ROOT CAUSE**: Supabase bucket `allowed_mime_types` only had webm/ogg

**Final Solution:**

```sql
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/wave', 'audio/mp4', 'audio/m4a',
  'image/jpeg', 'image/png', 'image/webp'
]
WHERE name = 'heritage-whisper-files';
```

**Key Learning:** When Supabase says "mime type X is not supported", check the bucket configuration first, not the code.

### Timeline Sorting (Recurring Issue)

**Problem:** Stories from same decade as birth year appearing before birth year section

**Iterations:**

1. October 4, 2025: Fixed by using earliest story year for decade sorting
2. October 5, 2025: Re-fixed after issue recurred - now detects birth decade and uses earliest story year only for that decade

**Solution Location:** `/app/timeline/page.tsx:1194-1199`

### Photo Upload Issues (January 3, 2025)

**Problem:** Photos stored as blob URLs instead of Supabase paths

**Solution:**

- Store file paths in database (not URLs)
- Generate signed URLs with 1-week expiry on-demand
- Blob URL filtering in API endpoints
- Proper upload flow for both new and edited stories

### Authentication Race Conditions

**Problem:** 401 errors when timeline/book view loaded immediately after login

**Solution:**

- Session retry logic (5x 100ms delays)
- Query invalidation after login
- Check for both `user` AND `session` before fetching data

### Email Confirmation & Agreement Modal (October 5, 2025)

**Problem:** After email confirmation, users saw duplicate agreement modal even though they accepted at signup

**Root Causes:**

1. Email confirmation redirected to homepage instead of `/auth/callback`
2. `/auth/callback` had conditional logic checking birth year
3. Registration used anon key instead of service role key
4. RLS policies blocked setting `latest_terms_version`/`latest_privacy_version` columns
5. Agreement status check didn't properly query `user_agreements` table

**Solutions:**

1. Updated Supabase redirect URLs to include `https://dev.heritagewhisper.com/auth/callback`
2. Changed `/auth/callback` to always redirect to `/timeline` (birth year already collected at signup)
3. Changed registration to use service role key: `createClient(supabaseUrl, supabaseServiceKey)`
4. Fixed `/api/agreements/status` fallback to check both terms AND privacy in `user_agreements` table
5. Updated agreement status query to properly detect both agreement types

**Key Files Modified:**

- `/app/api/auth/register/route.ts` - Service role key
- `/app/auth/callback/page.tsx` - Direct timeline redirect
- `/app/api/agreements/status/route.ts` - Improved fallback logic

---

## 📁 Key File Locations

### Audio Management

- `/app/api/upload/audio/route.ts` - Audio file upload to Supabase
- `/components/AudioRecorder.tsx` - Web Audio API recording component
- `/components/BookStyleReview.tsx` - Audio playback and controls

### Photo Management

- `/app/api/upload/photo/route.ts` - Photo upload to Supabase
- `/app/api/stories/[id]/photos/route.ts` - Add photos to stories
- `/components/MultiPhotoUploader.tsx` - Photo upload with cropping

### Timeline & Book View

- `/app/timeline/page.tsx` - Timeline with decade organization
- `/app/book/page.tsx` - Book view with pagination
- `/lib/bookPagination.ts` - Text measurement and page splitting

### Authentication

- `/app/api/auth/login/route.ts` - Email/password login
- `/app/api/auth/register/route.ts` - User registration with agreements
- `/lib/auth.tsx` - Auth context and provider
- `/app/auth/callback/page.tsx` - OAuth callback handler

---

## 🔧 Database Schema Changes

### October 4, 2025 - Legal Compliance

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  birth_year INTEGER,
  latest_terms_version TEXT,
  latest_privacy_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  agreement_type TEXT NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  method TEXT
);
```

### January 3, 2025 - Sharing System

```sql
CREATE TABLE public.shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id),
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES users(id),
  permission_level TEXT DEFAULT 'view',
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ
);
```

---

## 📊 Performance Improvements

### Image Optimization

- Next.js Image component with automatic optimization
- 40-60% faster page loads
- Lazy loading for off-screen images

### Code Splitting

- Dynamic imports for heavy components
- Route-based splitting with App Router
- Reduced initial bundle size

### Query Caching

- TanStack Query with 30-minute stale time
- Optimistic updates for better UX
- Automatic background refetching

---

## 🚧 Incomplete Features (from V1)

### Not Yet Migrated

- Subscribe page (Stripe payment integration)
- Go Deeper UI components (GoDeeperAccordion, GoDeeperLite)
- Demo mode (complete guest experience)
- Historical context generation
- Guest Timeline/Book Views for sharing (20% remaining)

### Partially Complete

- **Sharing System (80%)**: Core functionality done, needs guest views
- **Email Notifications**: Resend integrated, needs share notification emails

---

## 🔐 Security Improvements

### January 30, 2025

- Removed 200+ console.log statements exposing tokens
- Fixed hardcoded secrets (SESSION_SECRET, OPENAI_API_KEY)
- Cleaned auth-middleware.ts
- Sanitized queryClient.ts
- Created security checker script

### September 30, 2025

- Admin scripts renamed with .dev extension
- Production guards added to all admin scripts
- Enhanced .gitignore patterns
- Token-based admin access control

---

## 💡 Lessons Learned

1. **Always check bucket configuration first** when Supabase rejects MIME types
2. **File/Blob objects lose MIME type** when wrapped with `new File([blob])`
3. **Timeline sorting requires special handling** for birth year vs decades
4. **Session race conditions** need retry logic after login
5. **Signed URLs with expiry** better than storing URLs in database
6. **Mobile text justification** causes huge gaps, use left-align
7. **Z-index stacking** requires careful planning for overlapping elements

---

## 📋 Feature Updates Archive

### October 7, 2025 - Memory Box & Book View Enhancements

**Memory Box Enhancements:**

- **Filter System**: 3x2 grid layout with 6 filter buttons (All, Favorites, Timeline, Book, No date, Private)
- **List View**: Compact horizontal rows with Timeline/Book/menu buttons in single row
- **Card Improvements**:
  - Added dropdown menu (⋯ button) with Edit, Favorite, Delete actions
  - Star icon (⭐) displays on favorited memories
  - Removed separate edit pencil icon in favor of dropdown menu
- **Toolbar Polish**: Search box and filter grid have matching widths on mobile for symmetry

**Book View Updates:**

- **Navigation**: Collapsed decade navigation by default (desktop & mobile)
  - Shows current chapter/TOC as pill button
  - Expands to show all navigation options when clicked
  - Click outside or select chapter to collapse
- **Mobile Book Styling**:
  - Slim brown border (0.75rem padding) with dark leather background
  - Wider content (10px side margins)
  - Photos at 98% width for maximum impact
  - Compact audio player with reduced spacing

### October 8, 2025 - PDF Export Feature

**PDF Export Implementation:**

- Export button with dropdown menu in book view header
- Two export formats:
  - **2-up (Home Print)**: Two 5.5×8.5" pages side-by-side on 11×8.5" landscape
  - **Trim (POD)**: Individual 5.5×8.5" pages for professional printing
- Server-side PDF generation using Puppeteer + @sparticuz/chromium
- Print-specific pages at `/book/print/2up` and `/book/print/trim`
- API routes: `/api/export/2up`, `/api/export/trim`, `/api/book-data`
- Uses service role key to bypass auth for print pages
- Created `/app/book/print/layout.tsx` to bypass root layout wrapper

**PDF Export Margin Fix (October 8, 2025):**

- Issue: Content stuck to top-left corner and bleeding onto extra pages
- Root cause: Root layout adding `md:pl-20 pb-20 md:pb-0` padding to all pages
- Solution:
  - Created minimal print layout to bypass wrapper padding
  - Added CSS overrides: `body > * { padding: 0 !important }`
  - Used `.book-spread` with `padding: 0.25in` and `box-sizing: border-box`
  - Set `.spread-content` to `width: 100%; height: 100%` to fill padded area
  - Result: Equal 0.25in margins on all sides without overflow

### October 2025 - Project Cleanup

- 37 obsolete files removed (test scripts, old page versions, one-time fix docs)
- Migrations and schema files preserved in `/migrations` and `/scripts`

---

## 🎨 Design System Details (October 2025)

Timeline uses Heritage Whisper design system with semantic `hw-*` classes:

**Component Classes:**

- `.hw-spine` - Timeline container with vertical spine and gutter spacing
- `.hw-decade` - Decade section wrapper
- `.hw-decade-band` - Sticky decade headers (87px offset for perfect alignment with app header)
- `.hw-grid` - Responsive grid (1 col mobile, 2 cols desktop)
- `.hw-card` - Story card with horizontal connectors to timeline spine
- `.hw-card-media` - 16:10 aspect ratio images
- `.hw-card-body` - Card content wrapper
- `.hw-card-title` - Story title
- `.hw-meta` - Metadata row with hairline dividers
- `.hw-card-provenance` - Hover details (creation/edit dates)
- `.hw-year` - Year badge (appears on hover/focus)
- `.hw-play` - Play button with heritage palette

**Design Tokens:**

- Primary accent: `#D36A3D` (clay/terracotta)
- Secondary accent: `#B89B5E` (soft gold)
- Focus ring: `#B89B5E`
- Card shadow: `0 6px 20px rgba(0,0,0,0.10)`
- Semantic spacing scale in `tokens.css`

**Implementation Details:**

- Horizontal connectors aligned to title baseline via `--title-offset` CSS custom property
- 180px offset for cards with images (16:10 aspect ratio), 22px for text-only
- Play button: stroke outline at rest, fills on hover
- Sticky decade bands with soft tinted background (88% page, 12% accent)
- Year badges show on card hover for temporal context
- Provenance details on hover (creation/edit dates)
- Mobile-optimized: 40px gutter, 14px spine position, 18px×2px connectors
- Desktop: 56px gutter, 20px spine position, 18px connectors (14px default, expands to 24px on hover)

---

## Recent Updates Archive (2025)

### January 25, 2025 - RecordModal Architecture Refactoring

Refactored RecordModal.tsx from 1,705-line monolithic component into 8 focused files (82% reduction).
- Created 3 reusable hooks (use-transcription, use-follow-up-questions, use-recording-state)
- Created 4 screen components (AudioReviewScreen, RecordingScreen, TranscriptionReview, GoDeeperOverlay)
- All files under 200-line best practice limit
- 100% TypeScript with proper interfaces

### October 24, 2025 - Pearl Hallucination Fix

Fixed critical issue where Pearl fabricated non-existent stories during interviews.
- **Root Cause**: Instructions told Pearl to reference "previous stories" but no story data was passed
- **Fix**: Commented out all personalization sections in use-realtime-interview.tsx
- **Result**: Pearl now only asks questions based on current conversation

### October 24, 2025 - Pearl Audio/Text Sync & Performance

Fixed critical audio/text mismatch and improved conversation stability.
- **Audio/Text Mismatch**: Disabled post-processing to ensure audio and text match 100%
- **False Interruptions**: Increased VAD threshold (0.5 → 0.7), added 400ms barge-in delay
- **Token Limit**: Increased 800 → 1200 tokens to prevent mid-sentence cutoffs
- **User-Only Audio**: Created userOnlyRecorder.ts to save audio without AI voice
- **Auto-Lesson Extraction**: Pearl interviews now generate lessons automatically

### October 23, 2025 - Quick Story Recording UX Improvements

Enhanced Quick Story recording flow with mobile responsiveness and photo transform fixes.
- Fixed recording UI button overflow on mobile
- Fixed photo crop/zoom display across all views (Timeline, Book, Memory Box, Overlay)
- Solution: Use `<img>` tag when transform exists, Next.js `Image` when no transform
- Fixed Edit Photo modal causing horizontal scroll on mobile
- Increased text sizes to minimum 14px for better readability

### January 23, 2025 - Single Story Sharing Removed

Removed all single story sharing functionality while preserving family sharing features.

**What Was Removed:**
- Share button from HamburgerMenu
- Share button from LeftSidebar navigation
- Share button from MemoryOverlay (story detail view)
- `/app/share` page and route
- `/app/api/share` API endpoints
- `Share2` icon imports from Timeline components

**What Was Kept:**
- Family sharing functionality (`/app/api/shared/*` endpoints)
- Family member invites and permissions
- Family timeline and book views
- All `/app/family/*` routes

**Reason:** Single story sharing was not being used and added unnecessary complexity. Family sharing provides the collaborative features needed for families to share entire collections.

### January 22, 2025 - Family Sharing V3 Critical Bug Fixes

Fixed three critical bugs preventing account switching from working properly:

**1. Database Field Name Mismatch (Primary Bug)**
- **Problem**: Account switcher showed family members but clicking them didn't switch accounts
- **Root Cause**: PostgreSQL returns snake_case field names but frontend expects camelCase
- **Fix**: Added field mapping layer in `/api/accounts/available` endpoint

**2. React Key Warning on Fragment**
- **Problem**: Console warning about missing key prop
- **Fix**: Changed to named Fragment with key

**3. Server Build Cache Corruption**
- **Problem**: Multiple dev server instances running simultaneously
- **Fix**: Killed processes, cleared `.next` cache, restarted cleanly

### January 22, 2025 - Prompts Library Header Layout Fixes

**Problems:**
1. Header was constrained by sidebar flex container
2. Header too tall on desktop (excessive padding)
3. AccountSwitcher positioning inconsistent

**Fixes:**
- Restructured page layout with header outside flex container
- Reduced padding: `py-4 md:py-6` → `py-3 md:py-3`
- Reduced title size: `text-4xl` → `text-2xl` on desktop
- Matches Timeline header height (55px)

### January 21, 2025 - Critical Security Fix - Row Level Security

Fixed critical RLS vulnerabilities flagged by Supabase security linter on 4 tables.

**Problem:**
- RLS disabled on: `users`, `recording_sessions`, `stories`, `usage_tracking`
- Tables exposed to potential unauthorized access

**Solution:**
- Created migration `/migrations/0011_fix_missing_rls.sql`
- Implements defensive checks (only enables if disabled)
- Creates comprehensive policies for each table

### October 21, 2025 - Pearl Scope Enforcement

Implemented comprehensive scope enforcement for Pearl (OpenAI Realtime API guided interviews) to prevent off-topic responses.

**Solution: Defense in Depth**
1. Updated system instructions with hard refusal templates
2. Server-side scope enforcer (`/lib/scopeEnforcer.ts`) with regex detection
3. Response token limit (150 tokens max)
4. Integration in response pipeline

**Expected Impact:**
- 95%+ reduction in off-topic responses
- Consistent refusal patterns
- Automatic redirection back to story capture

### October 21, 2025 - Interview Chat V1 Improvements

**Reverted to Traditional Whisper Transcription:**
- Disabled Realtime API for V1 via `NEXT_PUBLIC_ENABLE_REALTIME=false`
- Uses traditional MediaRecorder + AssemblyAI batch transcription
- Faster, simpler, cheaper flow

**Fixed Audio Chunking Bug:**
- Problem: Second audio response failed with "Invalid file format" 400 error
- Root Cause: Code was slicing WebM blobs into chunks, creating invalid audio files
- Fix: Send complete audio blob to transcription API instead of sliced chunks

**Added Session Timer & Auto-Complete:**
- 30-minute hard limit with auto-complete
- 25-minute warning badge
- Final minute countdown with red pulsing animation

### October 20, 2025 - Conversation Mode & Quick Story Wizard Integration

Fixed critical bugs preventing new recording flows from saving stories.

**1. NavCache Data Race Condition:**
- Problem: Wizard mode showed "No data found in NavCache" error
- Fix: Added `!isWizardMode` condition to skip regular NavCache consumption

**2. Authentication Headers Missing:**
- Problem: API requests returned 401 Unauthorized errors
- Fix: Added session token to all upload and save endpoints

**3. API Field Name Mismatch:**
- Problem: Story creation returned 400 validation error
- Fix: Changed `transcript` to `transcription` to match API schema

### October 20, 2025 - PDFShift Migration

Replaced Puppeteer/Chromium with PDFShift API for PDF exports.

**Problem:**
- npm install taking 7+ minutes on Vercel builds
- `@sparticuz/chromium` package: 141MB
- Total `node_modules`: 831MB
- Builds timing out

**Solution:**
- Migrated to PDFShift cloud PDF generation service
- No heavy browser dependencies
- Simple REST API integration
- Credit-based pricing (~$0.01 per PDF)

**Performance Improvements:**
- npm install: 7 minutes → **15 seconds** (28x faster!)
- node_modules: 831MB → 720MB (111MB saved)
- Total build: 5+ minutes → **59 seconds** (5x faster!)

### October 17, 2025 - Family-Submitted Prompts Feature

**New API Endpoint** (`/api/prompts/family-submitted`):
- Fetches pending prompts submitted by family contributors
- Joins with `family_members` table to include submitter details
- Returns: prompt text, context, submitter name/relationship

**Prompts Page Integration:**
- Family prompts display FIRST in personalized section
- Distinct visual styling with blue/indigo gradient background
- "💝 From Your Family" badge with count
- Special blue gradient "Answer" button

### October 10, 2025 - PDF Export Improvements

**Running Headers:**
- Now show story title, year, and age instead of generic text
- Format: "STORY TITLE • YEAR • AGE X" (uppercase)

**Lesson Learned Styling:**
- Updated to match clean site design
- Changed from yellow background box to simple 4px straight gold left border

**Page Margins Reduced:**
- Book View: Content margin reduced from 48px → 23px
- PDF Export: Horizontal padding reduced from 0.5in → 0.25in per side

**Bug Fixes:**
- Added Remove button for lessons in edit mode
- Fixed empty string handling when deleting lessons
- Fixed running header alignment (both pages now use top: 18px)

### October 9, 2025 - Lesson Learned Display & Book Layout Polish

**Fixed Rendering:**
- Lessons learned (stored as `wisdomClipText`) now display properly
- Root cause: `lessonLearned` blocks were being included in `page.text`
- Solution: Filter out blocks from page text AND extract to `page.lessonLearned` field

**Mobile Book View Responsive Fixes:**
- Dotted Decor Border: Desktop 48px, Mobile 10px
- Content Padding: Desktop 48px, Mobile 20px
- Running Header & Edit Button optimized for mobile
- Navigation Arrows: Desktop 64px, Mobile 48px touch targets

**Book Layout Polish:**
- Text Alignment: Left-aligned (changed from justified)
- Page Margins: Equal 48px margins with dotted decor border
- Photo Margins: 0 top margin for clean spacing

### October 8, 2025 - Recording UX & AI Transcription

**Recording UX Improvements:**
- Processing Spinner: Recording screen shows spinner while transcribing (not initial screen)
- Cancel Navigation Fix: Returns to origin page via `returnPath` in NavCache

**AI Transcription:**
- OpenAI Whisper Integration working with GPT-4 formatting
- Lesson Learned Generation: Automatically suggests wisdom from each story

**Mobile Book View Polish:**
- Removed Debug Badge
- Fixed Mobile Scrolling with proper brown border spacing

**Timeline Year Badges:**
- Increased Text Size: Desktop 22px, Mobile 17px
- Improved Positioning: Moved 5px left for better alignment

### January 2025 - Navigation Redesign

**Desktop Navigation Moved to Bottom:**
- Horizontal navigation bar replacing left sidebar
- Home, Timeline, Book, Profile icons
- Fixed to bottom of viewport (80px from bottom)

**Book View Simplified:**
- Removed TOC sidebar and book navigation panel
- Clean dual-page layout with only progress bar
- Standalone progress bar component

**Mobile Book View Enhanced:**
- Restored bottom navigation bar
- Added decades pill navigation for quick chapter jumps

**Book View Enhancements:**
- Progress Bar: Shows "Page X of Y • YEAR" tooltip
- Page Click Navigation: Click page margins to turn pages
- Cursor hints attempted (w-resize/e-resize) but have reliability issues

### January 2025 - OpenAI Realtime API Integration

Replaced broken Whisper blob-slicing transcription with OpenAI Realtime API for guided interviews.

**Problem Solved:**
- Old approach: Record WebM → Slice → Send to Whisper → FAILED (invalid fragments)
- New approach: Stream mic via WebRTC → OpenAI Realtime → Live transcripts → WORKS

**Architecture:**
- Transport: WebRTC (48kHz Opus)
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Transcription: Server-side Whisper-1
- VAD: Server-side with 300ms silence threshold
- Barge-in: Server VAD + client-side audio pause

**UX Improvements:**
- Live Transcription in real-time
- Voice Toggle for AI audio responses
- Mixed Audio: Full conversation saved for playback
- Auto-reconnect on ICE connection failures

**Cost:**
- Realtime API: ~$1.13 per 15-min interview
- vs Whisper: ~$0.09 per 15 min (but broken!)
- Trade-off: 12.5x cost increase for working solution

---

_This is a historical reference document. For current documentation, see CLAUDE.md_
_Last updated: January 23, 2025_

---

## 📋 Detailed Implementation Notes

### GDPR Data Export with IP Protection (October 28, 2025)

**Complete Implementation**

User data export system that balances GDPR compliance with intellectual property protection.

**IP Protection Strategy:**

1. **Catalog Prompts** (`user_prompts` table):
   - Mask text: `"[Catalog prompt - removed for IP protection]"`
   - Remove `source` and `category` fields
   - Keep user interaction: `id`, `status`, `queue_position`, `created_at`

2. **AI-Generated Prompts** (`active_prompts` & `prompt_history`):
   - Keep full personalized text (references user's stories)
   - Remove metadata: `tier`, `memory_type`, `prompt_score`, `score_reason`, `anchor_entity`, `anchor_year`, `context_note`
   - Keep user data: `id`, `prompt_text`, `user_status`, `shown_count`, `outcome`, `story_id`, timestamps

3. **Other Protected Data:**
   - AI costs: `cost_usd → null`
   - AI models: `model → "AI model"`
   - IP addresses: Partial masking (`xxx.xxx.xxx.123`)
   - Third-party emails: `j***@gmail.com`

**Rate Limiting:**
- 1 export per 24 hours tracked via `users.last_data_export_at`
- Custom 429 error handling in `lib/queryClient.ts` (doesn't throw, returns response)
- User-friendly message in `app/profile/page.tsx`
- Dev bypass: `?bypass_rate_limit=true`

**Legal Basis:** GDPR Recital 63 - trade secrets protection

**Files Modified:**
- `/app/api/user/export/route.ts` - IP filtering logic
- `/lib/queryClient.ts` - Allow 429 through
- `/app/profile/page.tsx` - Custom error handling

---

### RecordModal Architecture Refactoring (January 25, 2025)

**Status:** ✅ Complete (Merged to main)

Refactored RecordModal.tsx from monolithic 1,705-line component into 8 focused, reusable files.

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

2. **use-follow-up-questions.tsx** (~180 lines)
   - Generates contextual follow-up questions during recording
   - Partial audio capture without stopping recording
   - AI-generated questions (3 at a time) via GPT-4o-mini
   - Chunk tracking to avoid re-transcribing

3. **use-recording-state.tsx** (~190 lines)
   - Main state orchestrator composing transcription + follow-up hooks
   - Recording state machine (start/pause/resume/stop)
   - Audio review flow, Go Deeper questions, typing mode

**New Components (components/recording/):**

1. **AudioReviewScreen.tsx** (~150 lines) - Audio review interface
2. **RecordingScreen.tsx** (~180 lines) - Main recording interface
3. **TranscriptionReview.tsx** (~180 lines) - Transcription editing
4. **GoDeeperOverlay.tsx** (~150 lines) - AI follow-up questions modal

**Type Safety:**
- Added interfaces to `types/recording.ts`
- 100% TypeScript with no 'any' types
- Full type safety across refactored code

---

### Pearl - The Documentary Interviewer (Implementation Details)

**Technical Configuration:**
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Token limit: 1200 tokens (~15-18 sentences)
- VAD threshold: 0.7 (less sensitive to ambient noise)
- Barge-in delay: 400ms (prevents false interrupts)
- Post-processing: DISABLED (ensures audio/text match)
- Personalization: TEMPORARILY DISABLED

**Implementation Files:**
- `/hooks/use-realtime-interview.tsx` - Pearl's main hook
- `/lib/realtimeClient.ts` - WebRTC connection & VAD
- `/lib/userOnlyRecorder.ts` - User-only audio capture
- `/app/interview-chat/` - Conversation UI
- `/app/api/extract-lesson/` - Lesson extraction endpoint

For prompt engineering details, see `AI_PROMPTING.md`

---

### AI Prompt Generation System (Detailed)

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

**Cost per Story (October 2025):**
- AssemblyAI transcription: ~$0.0025/min
- GPT-4o-mini lesson generation: ~$0.0007
- Tier 1 prompts: $0 (regex-based)
- **Total per regular story**: ~$0.004-0.005

---

### Passkey Authentication (WebAuthn) - Detailed Implementation

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
- Library: SimpleWebAuthn v13
- Database: `passkeys` table with credential storage
- Session cookie: `hw_passkey_session` (httpOnly, secure)

**API Endpoints:**
- `POST /api/passkey/register-options` - Generate registration options
- `POST /api/passkey/register-verify` - Verify and store new passkey
- `POST /api/passkey/auth-options` - Generate authentication options
- `POST /api/passkey/auth-verify` - Verify passkey and create session
- `GET /api/passkey/manage` - List user's passkeys
- `POST /api/passkey/check` - Check if user has passkeys

---

### Family Sharing V3 - Multi-Tenant System (Detailed)

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

---

### PDF Export via PDFShift (Detailed)

**Status:** ✅ Production Ready (January 2025)

Replaced Puppeteer/Chromium with PDFShift cloud service.

**Benefits:**
- ~150MB build size reduction
- 5x faster builds (59s vs 5min+)
- More reliable than self-hosted browser automation

**Formats:**
- 2-up (home printing): 11"x8.5" landscape
- Trim (POD): 5.5"x8.5" portrait

**Documentation:** See `PDFSHIFT_INTEGRATION.md` for complete guide

---

### Security & Privacy Implementation

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

---

### Navigation & UX Patterns

- **Cancel Button**: Editing existing story → `/timeline`, Creating new story → origin page via `returnPath`
- **Recording Flow**: "+" → Start Recording → Countdown → Recording → Processing → Review page
- **Age Display**: Age > 0: "Age X", Age = 0: "Birth", Age < 0: "Before birth"
- **Memory Card Actions**: Dropdown menu (⋯) with Edit, Favorite/Unfavorite, Delete
- **Book Navigation**: Collapsed by default, click progress bar for navigation

---

### Deployment Details

**Vercel (Frontend):**
- Auto-deploys from GitHub main branch
- Live: https://dev.heritagewhisper.com
- Set all environment variables in Vercel dashboard

**Database & Storage:**
- **Supabase Project:** tjycibrhoammxohemyhq
- **Bucket:** heritage-whisper-files (PUBLIC)
- **Schema:** Managed via SQL migrations in `/migrations`
- **RLS Policies**: Enabled on all tables with optimized `(SELECT auth.uid())` pattern

---

### Vercel AI Gateway Integration

All GPT models route through Vercel AI Gateway for observability and caching.

**Benefits:**
- Cost visibility and tracking per model/endpoint
- Performance metrics (TTFT tracking)
- Automatic caching (70-90% cost reduction on repeat operations)
- Failover with automatic retry

