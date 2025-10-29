# HeritageWhisperV2 - Next.js 15 Documentation

> **📝 Note:** This file contains current, active documentation for Claude sessions. Historical fixes, migration notes, and archived information can be found in `CLAUDE_HISTORY.md`.

## 🚀 Project Overview

AI-powered storytelling platform for seniors to capture and share life memories. Next.js 15 migration completed October 2025.

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Auth:** Supabase Auth with JWT tokens + WebAuthn passkeys
- **Database:** PostgreSQL via Supabase (project: tjycibrhoammxohemyhq)
- **Storage:** Supabase Storage (bucket: heritage-whisper-files)
- **State:** TanStack Query v5
- **AI:** AssemblyAI (transcription) + OpenAI (Whisper, Realtime API, GPT-4o) + Vercel AI Gateway
- **Deployment:** Vercel (https://dev.heritagewhisper.com)

## 🔧 Quick Start

### Development

```bash
cd /Users/paul/Development/HeritageWhisperV2
npm run dev
# Running on http://localhost:3000
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

# Vercel AI Gateway
AI_GATEWAY_API_KEY=vck_...

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# PDFShift (PDF Export)
PDFSHIFT_API_KEY=sk_...
NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com

# Passkey/WebAuthn
RP_ID=heritagewhisper.com
RP_NAME=HeritageWhisper
ORIGIN=https://dev.heritagewhisper.com
IRON_SESSION_PASSWORD=<random-32-byte-key>
COOKIE_NAME=hw_passkey_session
SUPABASE_JWT_SECRET=<supabase-jwt-secret>

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
│   │   ├── user/export/     # GDPR data export (IP protected)
│   │   ├── user/delete/     # Account deletion
│   │   └── passkey/         # WebAuthn endpoints
│   ├── auth/               # Auth pages
│   ├── timeline/           # Timeline view
│   ├── book/               # Book view (dual-page layout)
│   ├── prompts/            # Prompts library
│   ├── interview-chat/     # Pearl AI interviewer
│   ├── profile/            # User settings & data export
│   └── admin/              # Admin tools
├── components/              # React components
│   └── recording/          # Recording UI components
├── lib/                     # Utilities
│   ├── queryClient.ts      # API request wrapper (handles 429)
│   ├── supabase.ts         # Supabase client
│   └── auth.ts             # Auth helpers
├── hooks/                   # Custom React hooks
│   ├── use-transcription.tsx         # AssemblyAI transcription
│   ├── use-follow-up-questions.tsx   # AI question generation
│   └── use-recording-state.tsx       # Recording orchestration
├── shared/schema.ts        # Database schema (Drizzle ORM)
└── docs/                    # Technical documentation
    ├── DATA_MODEL.md       # Complete database schema reference
    └── AI_PROMPTING.md     # Pearl & prompt engineering docs
```

## 📊 Database & Data Model

**Complete documentation:** See [DATA_MODEL.md](DATA_MODEL.md)

### Quick Reference

- **21 Tables** with full TypeScript type safety via Drizzle ORM
- **Row Level Security (RLS)** enabled on all tables
- **50+ Performance Indexes** for optimized queries
- **Multi-tenant Architecture** via `has_collaboration_access(user_uuid, storyteller_uuid)` RPC

### Table Categories

- **Core User (3)**: users, profiles, passkeys
- **Content (3)**: stories, photos, active_prompts
- **AI Prompts (5)**: ai_prompts, user_prompts, family_prompts, prompt_feedback, prompt_entities
- **Family Sharing (5)**: family_members, family_invites, family_collaborations, family_sessions, family_access_tokens
- **Admin/Monitoring (3)**: admin_audit_log, ai_usage_log, stripe_customers
- **Supporting (2)**: migrations, expired_prompts

### Key Patterns

```typescript
// Import types from schema
import { type Story, type InsertStory } from "@/shared/schema";

// Type-safe database queries with Drizzle
const userStories = await db.query.stories.findMany({
  where: eq(stories.userId, userId),
  orderBy: desc(stories.createdAt),
});

// Multi-tenant access check (family sharing)
const hasAccess = await supabase.rpc('has_collaboration_access', {
  user_uuid: currentUserId,
  storyteller_uuid: targetUserId
});
```

## 🔑 Key Features

- **Audio Recording**: One-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: AssemblyAI "universal" batch (~3.7s, 58% cheaper, 93.4% accuracy)
- **Pearl AI Interviewer**: Conversational AI via OpenAI Realtime API with WebRTC (see `AI_PROMPTING.md`)
- **AI Prompt System**: Multi-tier reflection prompts (Tier 1: entity-based, Tier 3: milestone analysis)
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade
- **Book View**: Dual-page layout with natural pagination
- **PDF Export**: 2-up (home print) and trim (POD) formats via PDFShift
- **Family Sharing**: Multi-tenant account system with role-based permissions (viewer/contributor)
- **Passkey Auth**: WebAuthn passwordless login (Touch ID, Face ID, Windows Hello)
- **GDPR Compliance**: Data export with IP protection + account deletion

## 🛡️ GDPR Data Export & IP Protection

**Status:** ✅ Production Ready (October 2025)

### Overview

User data export endpoint at `/api/user/export` provides GDPR Article 20 (portability) compliance while protecting trade secrets per GDPR Recital 63.

### IP Protection Strategy

**Catalog Prompts (user_prompts table):**
- ✅ Mask prompt text: `"[Catalog prompt - removed for IP protection]"`
- ✅ Remove `source` and `category` fields (system architecture)
- ✅ Keep user interaction data: `id`, `status`, `queue_position`, `created_at`

**AI-Generated Prompts (active_prompts & prompt_history tables):**
- ✅ Keep full personalized text (references user's specific stories)
- ✅ Remove internal metadata: `tier`, `memory_type`, `prompt_score`, `score_reason`, `anchor_entity`, `anchor_year`, `context_note`
- ✅ Keep user data: `id`, `prompt_text`, `user_status`, `shown_count`, `outcome`, `story_id`, timestamps

**Other Protected Data:**
- ✅ AI costs: `cost_usd → null` (pricing strategy)
- ✅ AI models: `model → "AI model"` (tech stack)
- ✅ IP addresses: Partial masking (`xxx.xxx.xxx.123`)
- ✅ Third-party emails: Masking (`j***@gmail.com`)

### Rate Limiting

- **Limit:** 1 export per 24 hours per user
- **Tracking:** `users.last_data_export_at` and `data_exports_count`
- **Error Handling:** User-friendly message with hours remaining (handled in `app/profile/page.tsx`)
- **Dev Bypass:** `?bypass_rate_limit=true` (development only)

### Key Files

- `/app/api/user/export/route.ts` - Main export endpoint with IP filtering
- `/app/api/user/delete/route.ts` - Account deletion (GDPR Art. 17)
- `/app/profile/page.tsx` - Export button with rate limit handling
- `/lib/queryClient.ts` - API wrapper (allows 429 responses through for custom handling)

### Legal Basis

GDPR Recital 63: "The right to data portability should not adversely affect the rights and freedoms of others, including trade secrets and intellectual property."

## 🐛 Common Issues & Fixes

### Rate Limiting (429 Errors)

```typescript
// Custom 429 handling in queryClient.ts
if (res.status !== 429) {
  await throwIfResNotOk(res);
}
return res; // Let caller handle 429

// In page component:
if (response.status === 429) {
  const errorData = await response.json();
  const hoursRemaining = errorData.retry_after_hours || 24;
  toast({ title: "Export limit reached", description: `...${hoursRemaining} hours.` });
}
```

### Authentication & Sessions

- **Session Retries:** 5x 100ms retries to handle race conditions
- **JWT Tokens:** Automatic refresh via Supabase
- **Passkey Sessions:** Dual session support (Supabase + iron-session cookie)

### Database Queries

- **Multi-tenant:** Always check `has_collaboration_access()` before querying other users' data
- **RLS Policies:** Use `(SELECT auth.uid())` pattern for performance
- **Field Names:** Database uses `snake_case`, frontend expects `camelCase` - map in API routes

### Dev Server Issues

1. **Port conflicts:** Check `lsof -ti:3000` and kill processes
2. **Module errors:** Clear `.next` cache: `rm -rf .next`
3. **Vite/TSX issues:** Run `npm rebuild vite tsx`

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
```

## 🔌 MCP Servers

Configured in `/Users/paul/Documents/DevProjects/.mcp.json`:

- ✅ GitHub MCP - Repository management
- ✅ Supabase MCP - Database queries (read-only)
- ✅ Vercel MCP - Deployment management
- ✅ Stripe MCP - Payment APIs
- ✅ Resend MCP - Email sending

## 🎯 Known Issues

- **Book View Cursor**: Directional cursor arrows (w-resize/e-resize) flicker despite forced styles (clicking still works)
- **Pearl Personalization**: Temporarily disabled - needs story fetching before re-enabling

---

_Last updated: October 28, 2025_

_For historical fixes, feature archives, and migration notes, see CLAUDE_HISTORY.md_

_For AI prompting documentation, see AI_PROMPTING.md_
