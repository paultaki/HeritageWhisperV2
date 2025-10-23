# October 2025 Updates Archive

This document contains detailed updates from October 2025 that have been archived from CLAUDE.md for historical reference.

---

## ✅ October 8, 2025 - Recording UX Improvements

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

## ✅ October 9, 2025 - Lesson Learned Display

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

## ✅ October 10, 2025 - PDF Export Improvements

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

## ✅ October 17, 2025 - Security Hardening

### Security Hardening

- **Comprehensive Security Headers** (`next.config.ts`):
  - **Content Security Policy (CSP)**: Prevents XSS attacks by restricting script/style sources
    - Allows: self, Supabase, OpenAI, AI Gateway, AssemblyAI
    - Blocks: inline scripts (except unsafe-eval for Next.js), object embeds
  - **HSTS**: Forces HTTPS for 1 year (`max-age=31536000; includeSubDomains`)
  - **X-Frame-Options**: `DENY` to prevent clickjacking
  - **X-Content-Type-Options**: `nosniff` to prevent MIME sniffing
  - **X-XSS-Protection**: `1; mode=block` for legacy browsers
  - **Referrer-Policy**: `strict-origin-when-cross-origin`
  - **Permissions-Policy**: Restricts camera/geolocation/tracking
  - Location: `/next.config.ts:30-105`

- **CORS Configuration**: API routes restricted to app domain only
  - Origin: `NEXT_PUBLIC_APP_URL` (fallback: dev.heritagewhisper.com)
  - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
  - Max-Age: 24 hours for preflight caching
  - Location: `/next.config.ts:83-103`

- **PII Removal from Logs**: Authentication logs no longer log email addresses
  - Changed from `logger.info(\`Login attempt for email: ${email}\`)` to `logger.info('Login attempt received')`
  - Location: `/app/api/auth/login/route.ts:39-43`

- **Security Contact Information** (`public/.well-known/security.txt`):
  - Responsible disclosure contact: security@heritagewhisper.com
  - 48-hour response commitment
  - Expires: December 31, 2026
  - Location: `/public/.well-known/security.txt`

- **Security Logging Infrastructure** (`lib/securityLogger.ts`):
  - Structured logging for auth failures, suspicious activity, rate limits
  - Automatic PII hashing (emails, IPs) before logging
  - Audit trail for sensitive data access
  - Location: `/lib/securityLogger.ts`

- **Trust Signals on Auth Pages**:
  - Login/Register pages now show "Protected Session" badge and trust signals
  - Footer displays "256-bit SSL" and "Bank-Level Security"
  - Shield icons for visual security reassurance
  - Hydration mismatch fixes for localStorage "Remember Me" feature
  - Location: `/app/auth/login/page.tsx`, `/app/auth/register/page.tsx`

- **Privacy Section on Homepage**:
  - New "Your Privacy Matters" section with key privacy commitments
  - Header trust bar: "🔒 Bank-Level Security | Only your family sees your stories"
  - Footer trust signals: Secure, Private, Your Control
  - Location: `/app/page.tsx` (homepage)

- **Documentation**:
  - Comprehensive `SECURITY.md` with implementation details
  - Environment variable template `env.example` with security notes
  - Privacy policy updated with "Your Security & Control" section

### Family-Submitted Prompts Feature

- **New API Endpoint** (`/api/prompts/family-submitted`):
  - Fetches pending prompts submitted by family contributors
  - Joins with `family_members` table to include submitter details
  - Returns: prompt text, context, submitter name/relationship
  - Location: `/app/api/prompts/family-submitted/route.ts`

- **Prompts Page Integration** (`/prompts`):
  - Family prompts display FIRST in "For {Name}" personalized section
  - Distinct visual styling:
    - **Blue/indigo gradient background** (vs. gray for AI prompts)
    - **2px blue border** (vs. 1px gray)
    - **"💝 From Your Family" badge** with count
    - **"💙 Question from {Name} • {Relationship}"** badge on each card
  - Special **blue gradient "Answer" button** (vs. gray "Record")
  - Location: `/app/prompts/page.tsx:53-66, 360-391`

- **PromptCard Component Enhancement** (`components/PromptCard.tsx`):
  - Added support for `source: 'family'` and `variant: 'family'`
  - New `submittedBy` prop with name, email, relationship
  - Conditional styling based on prompt source
  - Location: `/components/PromptCard.tsx:17, 23-28, 60-87, 112-121`

- **User Flow**:
  1. Family contributor (with contributor permissions) submits question via "Submit a Question" dialog
  2. Question saved to `family_prompts` table with `status='pending'`
  3. Member sees it on `/prompts` page in personalized section (appears first)
  4. Member clicks "Answer" to record response
  5. Works like any other prompt

- **Privacy Note**: Personalized prompts are NOT visible to family members - they only see published stories on timeline/book pages

## ✅ October 20, 2025 - Conversation Mode & Quick Story Wizard

### Conversation Mode & Quick Story Wizard Integration

Fixed critical bugs preventing the new recording flows from saving stories successfully.

#### 1. NavCache Data Race Condition

- **Problem**: Wizard mode showed "No data found in NavCache" error after conversation interviews
- **Root Cause**: Regular review code was consuming (reading + deleting) NavCache data before wizard mode could access it
- **Fix**: Added `!isWizardMode` condition to skip regular NavCache consumption when in wizard mode
- **Location**: `/app/review/book-style/page.tsx:105`
- **Flow**:
  1. Conversation completes → saves to NavCache with unique ID
  2. Redirects to `/review/book-style?nav={id}&mode=wizard`
  3. Wizard mode now gets first access to NavCache data
  4. Regular review code skipped when `mode=wizard` parameter present

#### 2. Authentication Headers Missing

- **Problem**: API requests from wizard returned 401 Unauthorized errors
- **Root Cause**: Fetch requests missing `Authorization: Bearer {token}` headers
- **Fix**: Added session token to all upload and save endpoints
- **Locations**:
  - Audio upload: `/hooks/use-recording-wizard.tsx:92`
  - Photo upload: `/hooks/use-recording-wizard.tsx:121`
  - Story creation: `/hooks/use-recording-wizard.tsx:160`

#### 3. API Field Name Mismatch

- **Problem**: Story creation returned 400 validation error
- **Root Cause**: Sending `transcript` but API schema expects `transcription`
- **Fix**: Changed field name in payload to match API schema
- **Location**: `/hooks/use-recording-wizard.tsx:140`

### PDFShift Migration - Build Performance Optimization

Replaced Puppeteer/Chromium with PDFShift API for PDF exports.

#### Problem
- npm install taking 7+ minutes on Vercel builds
- `@sparticuz/chromium` package: 141MB
- Total `node_modules`: 831MB
- Builds timing out

#### Solution
- Migrated to PDFShift cloud service
- Removed heavy browser dependencies
- Simple REST API integration

#### Performance Improvements
- npm install: **15 seconds** (28x faster!)
- node_modules: 720MB (111MB saved)
- Total build: **59 seconds** (5x faster!)

## ✅ October 21, 2025 - Pearl Scope Enforcement

### Pearl Scope Enforcement - Production Hardening

Implemented comprehensive scope enforcement for Pearl (OpenAI Realtime API) to prevent off-topic responses.

#### Problem
Pearl occasionally went off-topic with jokes, tech support, general knowledge requests.

#### Solution: Defense in Depth

1. **Updated System Instructions**: Explicit refusals for off-topic requests
2. **Server-Side Scope Enforcer**: Regex-based detection and substitution
3. **Response Token Limit**: 150 tokens max (2-3 sentences)
4. **Multi-Layer Pipeline**: Model → Token limit → Trimmer → Scope enforcer → Sanitizer

#### Files Modified
- `/hooks/use-realtime-interview.tsx` - Updated instructions
- `/lib/realtimeClient.ts` - Token limits
- `/lib/scopeEnforcer.ts` - NEW server-side guard
- `/tests/red-team-pearl.md` - Test script

### Interview Chat V2 - Pearl Speaks First

Pearl now initiates conversations automatically.

#### Implementation
- `triggerPearlResponse()` function sends `response.create` event
- URL parameter support: `?prompt=<question>` for specific prompts
- Generic path: Pearl greets with opening
- Prompt path: Pearl opens with specific question

---

_Archived from CLAUDE.md on January 22, 2025_
