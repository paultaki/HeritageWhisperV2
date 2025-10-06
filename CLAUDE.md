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
│   ├── api/                 # API routes (auth, stories, upload, etc.)
│   ├── auth/               # Auth pages (login, register, etc.)
│   ├── timeline/           # Timeline view
│   ├── recording/          # Audio recording
│   ├── review/             # Story editing (create, [id], book-style)
│   ├── book/               # Book view
│   └── profile/            # User settings
├── components/              # React components
│   ├── AudioRecorder.tsx   # Web Audio API recording
│   ├── MultiPhotoUploader.tsx # Photo upload with cropping
│   ├── BookDecadePages.tsx # Decade organization
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities
│   ├── auth.tsx            # Auth context & provider
│   ├── supabase.ts         # Supabase client
│   ├── queryClient.ts      # TanStack Query setup
│   └── utils.ts            # Helper functions
└── shared/
    └── schema.ts           # Database schema (Drizzle)
```

## 🔑 Key Features
- **Audio Recording**: Simplified one-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: OpenAI Whisper API with automatic processing
- **Photo Management**: Multi-upload with cropping & hero images
- **Timeline View**: Chronological story organization by decade
- **Book View**: Dual-page layout with natural pagination
- **Mobile Responsive**: Senior-friendly UX with large touch targets and bouncing bar visualizations

### Recording Flow (Updated October 2025)
- Click "Start Recording" → Auto-countdown (3-2-1) → Records for up to 5 minutes
- No pause/review interruptions during recording
- Auto-transcription on stop → Direct navigation to BookStyleReview page
- Review page options: "Re-record" or "Remove Audio"

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

---
*Last updated: October 5, 2025*
*For historical fixes and detailed migration notes, see CLAUDE_HISTORY.md*
