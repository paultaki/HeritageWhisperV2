# HeritageWhisperV2 - Next.js 15 Documentation

> **📝 Note:** This file contains current, active documentation for Claude sessions. Historical fixes, migration notes, and archived information can be moved to `CLAUDE_HISTORY.md` for reference without loading into context every session.

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
│   │   └── user/           # User management (delete, export)
│   ├── auth/               # Auth pages (login, register, callback)
│   ├── timeline/           # Timeline view (main stories view)
│   ├── design-demo/        # Design system demo/reference
│   ├── recording/          # Audio recording page
│   ├── review/             # Story editing
│   │   └── book-style/     # BookStyleReview component page
│   ├── book/               # Book view (dual-page layout)
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
│   ├── HamburgerMenu.tsx   # Top-right menu (settings, logout, share)
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities
│   ├── auth.tsx            # Auth context & provider
│   ├── supabase.ts         # Supabase client & helpers
│   ├── ratelimit.ts        # Upstash Redis rate limiting
│   ├── imageProcessor.ts   # Image processing & EXIF stripping
│   ├── queryClient.ts      # TanStack Query setup
│   └── utils.ts            # Helper functions (normalizeYear, formatYear)
└── shared/
    └── schema.ts           # Database schema (Drizzle)
```

## 🔑 Key Features
- **Audio Recording**: Simplified one-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: OpenAI Whisper API with automatic processing
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade with "Before I Was Born" section for pre-birth family stories
- **Book View**: Dual-page layout with natural pagination, collapsed decade navigation
- **Memory Box**: Grid/list view toggle with filtering (All, Favorites, Timeline, Book, No date, Private)
- **Mobile Responsive**: Senior-friendly UX with large touch targets and bouncing bar visualizations
- **Desktop Navigation**: Left sidebar (192px wide) with labeled icons for Timeline, Record, Book View, and Memory Box
- **Rate Limiting**: Upstash Redis-based rate limiting (auth: 5/10s, uploads: 10/min, API: 30/min)

### Recording Flow (Updated October 2025)
- Click "Start Recording" → Auto-countdown (3-2-1) → Records for up to 5 minutes
- No pause/review interruptions during recording
- Auto-transcription on stop → Direct navigation to BookStyleReview page
- Review page options: "Re-record" or "Remove Audio"

### Timeline Organization (October 2025)
- **"Before I Was Born"**: Pre-birth family stories (separate section at top)
- **"The Year I was Born"**: Birth year stories (always shown)
- **Decade Sections**: Post-birth stories grouped by decade
- **Age Display Logic**:
  - Age > 0: "Age X"
  - Age = 0: "Birth"
  - Age < 0: "Before birth"
- **Decade Markers**: Jump navigation on right side (desktop) / floating action button (mobile)
  - "TOP" marker jumps to pre-birth section
  - Birth year marker
  - Decade markers (1960s, 1970s, etc.)

### Design System (October 2025)
Production timeline now uses the Heritage Whisper design system with semantic `hw-*` classes:

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

**Key Features:**
- Horizontal connectors aligned to title baseline via `--title-offset` CSS custom property
- 180px offset for cards with images (16:10 aspect ratio), 22px for text-only
- Play button: stroke outline at rest, fills on hover
- Sticky decade bands with soft tinted background (88% page, 12% accent)
- Year badges show on card hover for temporal context
- Provenance details on hover (creation/edit dates)
- Mobile-optimized: 40px gutter, 14px spine position, 18px×2px connectors
- Desktop: 56px gutter, 20px spine position, 18px connectors (14px default, expands to 24px on hover)

## 🐛 Common Issues & Fixes

### Authentication & Email Verification
- Uses Supabase Auth as single source of truth
- **Email Confirmation Required**: Users must verify email before logging in
- Verification emails sent via Resend SMTP (from no-reply@updates.heritagewhisper.com)
- Email confirmation redirects to `/auth/callback` then `/timeline`
- JWT tokens with automatic refresh
- Session retries (5x 100ms) to handle race conditions
- Error messages for unconfirmed email and invalid credentials
- Agreement acceptance tracked at signup - no duplicate modal after email confirmation
- Registration uses service role key to bypass RLS when creating user records
- Agreement versions stored in both `users` table and `user_agreements` table

### Security & Privacy
- **Rate Limiting**: Upstash Redis with lazy initialization (graceful fallback if not configured)
  - Auth endpoints: 5 requests per 10 seconds
  - Upload endpoints: 10 requests per 60 seconds
  - API endpoints: 30 requests per 60 seconds
- **EXIF Stripping**: All uploaded images processed with Sharp to remove metadata (GPS, camera info)
- **Image Processing**: Photos resized to max 2400x2400, converted to JPEG at 85% quality
- **Account Management**:
  - `/api/user/delete` - Complete account deletion (stories, files, auth)
  - `/api/user/export` - GDPR-compliant data export

### Navigation & UX
- **Cancel Button Behavior**:
  - Editing existing story → Returns to `/timeline`
  - Creating new story → Returns to `/recording`
- **Photo Menu**: Three-dot menu positioned at `-top-1 -right-1` (upper right corner)
- **Age Display**: Consistent across Timeline, Book View, and Review screens
- **Desktop Nav**: 192px wide sidebar with labeled icons (Timeline, Record, Book View, Memory Box)
- **Memory Card Actions**: Dropdown menu (⋯) with Edit, Favorite/Unfavorite, and Delete options
- **Book Navigation**: Collapsed by default on both desktop and mobile, expands to show TOC + decade markers
- **Memory Box Views**:
  - Grid view: Standard card layout with photos, metadata, and action buttons
  - List view: Compact horizontal rows (~80px height) with 64x64px thumbnails

## 🚀 Deployment

### Vercel (Frontend)
- Auto-deploys from GitHub main branch
- Live: https://dev.heritagewhisper.com
- Set all environment variables in Vercel dashboard

### Database & Storage
- **Supabase Project:** tjycibrhoammxohemyhq
- **Bucket:** heritage-whisper-files (PUBLIC)
- **Schema:** Managed via SQL migrations
- **RLS Policies**: Enabled on all tables with optimized `(SELECT auth.uid())` pattern for performance

## 🔍 Quick Troubleshooting

1. **401 errors**: Check Supabase session exists before API calls
2. **Dev server exits**: Run `npm rebuild vite tsx`

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

## 🧹 Project Cleanup
- 37 obsolete files removed (October 2025)
- Old page versions, test scripts, one-time fix docs cleaned up
- Migrations and schema files preserved in `/migrations` and `/scripts`

## 📋 Recent Updates (October 7, 2025)

### Memory Box Enhancements
- **Filter System**: 3x2 grid layout with 6 filter buttons (All, Favorites, Timeline, Book, No date, Private)
- **List View**: Compact horizontal rows with Timeline/Book/menu buttons in single row
- **Card Improvements**:
  - Added dropdown menu (⋯ button) with Edit, Favorite, Delete actions
  - Star icon (⭐) displays on favorited memories
  - Removed separate edit pencil icon in favor of dropdown menu
- **Toolbar Polish**: Search box and filter grid have matching widths on mobile for symmetry

### Book View Updates
- **Navigation**: Collapsed decade navigation by default (desktop & mobile)
  - Shows current chapter/TOC as pill button
  - Expands to show all navigation options when clicked
  - Click outside or select chapter to collapse
- **Mobile Book Styling**:
  - Slim brown border (0.75rem padding) with dark leather background
  - Wider content (10px side margins)
  - Photos at 98% width for maximum impact
  - Compact audio player with reduced spacing
- **PDF Export Feature** (Added October 8, 2025):
  - Export button with dropdown menu in book view header
  - Two export formats:
    - **2-up (Home Print)**: Two 5.5×8.5" pages side-by-side on 11×8.5" landscape
    - **Trim (POD)**: Individual 5.5×8.5" pages for professional printing
  - Server-side PDF generation using Puppeteer + @sparticuz/chromium
  - Print-specific pages at `/book/print/2up` and `/book/print/trim`
  - API routes: `/api/export/2up`, `/api/export/trim`, `/api/book-data`
  - Uses service role key to bypass auth for print pages
  - **Status**: Working locally, debugging on production (Vercel)

### Known Issues
- **PDF Export on Vercel**: Print page loads but React app not rendering (timeout waiting for `.book-spread`)
  - Chromium launches successfully
  - Page navigation works
  - React hydration appears to fail silently
  - Currently debugging with network request logging
- **PDF Export Margins (Local)**: Content not centering properly, sticks to top-left corner
- **UI Elements in PDF (Local)**: Hamburger menu showing in exported PDFs
- **Book View Mobile**: Decade navigation pill button visibility needs improvement (low contrast against brown background)
  - Current styling: white background, 2px dark border, strong shadow
  - Positioned at `bottom: 110px` (25px above footer)

---
*Last updated: October 8, 2025*
*For historical fixes and detailed migration notes, see CLAUDE_HISTORY.md*
