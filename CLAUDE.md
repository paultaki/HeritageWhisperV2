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
- **Audio Recording**: Web Audio API with silence detection
- **AI Transcription**: OpenAI Whisper API
- **Photo Management**: Multi-upload with cropping & hero images
- **Timeline View**: Chronological story organization by decade
- **Book View**: Dual-page layout with natural pagination
- **Mobile Responsive**: Senior-friendly UX with large touch targets

## 🐛 Common Issues & Fixes

### Audio Upload Issues
**Problem:** "mime type text/plain;charset=UTF-8 is not supported" or "mime type audio/mpeg is not supported"

**Solution:** Supabase Storage bucket has an `allowed_mime_types` whitelist. Update it:
```sql
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/wave', 'audio/mp4', 'audio/m4a',
  'image/jpeg', 'image/png', 'image/webp'
]
WHERE name = 'heritage-whisper-files';
```

**Location:** `/app/api/upload/audio/route.ts` - uses `audioFile.type` as contentType

### Timeline Sorting (Birth Year Before Same-Decade Stories)
**Problem:** Stories from same decade as birth year appear before birth year section (e.g., 1958-1959 stories before 1955 birth)

**Solution:** When a decade contains the birth year, use earliest story year (not decade start) for sorting
**Location:** `/app/timeline/page.tsx:1194-1199`

### Photo Upload
**Location:** `/app/api/upload/photo/route.ts`
- Uses signed URLs with 1-week expiry
- Stores file paths in database, generates URLs on-demand

### Authentication & Email Verification
- Uses Supabase Auth as single source of truth
- **Email Confirmation Required**: Users must verify email before logging in
- Verification emails sent via Resend (branded) + Supabase
- JWT tokens with automatic refresh
- Session retries (5x 100ms) to handle race conditions
- Error messages for unconfirmed email and invalid credentials
- Agreement acceptance tracked in `user_agreements` table (version 1.0)

## 🚀 Deployment

### Vercel (Frontend)
- Auto-deploys from GitHub main branch
- Live: https://dev.heritagewhisper.com
- Set all environment variables in Vercel dashboard

### Database & Storage
- **Supabase Project:** tjycibrhoammxohemyhq
- **Bucket:** heritage-whisper-files (PUBLIC)
- **Schema:** Managed via SQL migrations

## 🔍 Quick Troubleshooting

1. **Audio won't upload**: Check Supabase bucket `allowed_mime_types`
2. **Photos not loading**: Verify signed URL generation (not blob URLs)
3. **Timeline wrong order**: Birth year should use actual year, decades use earliest story if contains birth year
4. **401 errors**: Check Supabase session exists before API calls
5. **Dev server exits**: Run `npm rebuild vite tsx`

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

---
*Last updated: October 5, 2025*
*For historical fixes and detailed migration notes, see CLAUDE_HISTORY.md*
