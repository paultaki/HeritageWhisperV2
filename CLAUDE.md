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
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade with "Before I Was Born" section
- **Book View**: Dual-page layout with natural pagination, collapsed decade navigation
- **PDF Export**: 2-up (home print) and trim (POD) formats with server-side generation
- **Memory Box**: Grid/list view toggle with filtering (All, Favorites, Timeline, Book, No date, Private)
- **Mobile Responsive**: Senior-friendly UX with large touch targets
- **Desktop Navigation**: Left sidebar (192px wide) with labeled icons
- **Rate Limiting**: Upshash Redis-based (auth: 5/10s, uploads: 10/min, API: 30/min)

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
  - Creating new story → Returns to `/recording`
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

---
*Last updated: October 8, 2025*
*For historical fixes, feature archives, and migration notes, see CLAUDE_HISTORY.md*
