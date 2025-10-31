# HeritageWhisperV2 - Next.js 15 Documentation

> **📝 Note:** This file contains current, active documentation for Claude sessions. Historical fixes, migration notes, and archived information can be found in `CLAUDE_HISTORY.md`.

## 🔧 Meta-Instructions: Maintaining This Document

**For AI Assistants updating this file:**

### When to Update This File
- ✅ New development patterns or conventions established
- ✅ Tech stack changes (new dependencies, version upgrades)
- ✅ New common commands or workflows
- ✅ Updates to environment variables or configuration
- ✅ New known issues discovered (with workarounds)

### When to Move to CLAUDE_HISTORY.md Instead
- ❌ Implementation details of a completed feature
- ❌ Bug fixes with detailed troubleshooting steps (once resolved)
- ❌ Migration notes or one-time setup instructions
- ❌ Historical context about "why we did X" (unless still relevant)

### How to Update (Keep It Clean!)
1. **Replace, don't append:** If updating existing info, REPLACE the old content, don't add duplicate sections
2. **Condense before adding:** If adding a known issue, check if similar issue exists - merge if possible
3. **Remove obsolete info:** If a workaround is no longer needed, remove it entirely
4. **Check file size:** Keep this file under 400 lines (~3,000 tokens). If approaching limit, move historical content to CLAUDE_HISTORY.md
5. **Update "Last updated" date** at bottom when making changes

### Structure Priority
Keep sections in this order (most frequently needed first):
1. Common Commands
2. Project Overview & Tech Stack
3. Code Style & Conventions
4. Development Workflows
5. Project Structure & Key Files
6. Everything else

### Quality Standards
- Be concise: One clear sentence is better than a paragraph
- Be actionable: Include commands, file paths, concrete examples
- Be current: Remove outdated information immediately
- Cross-reference: Use @filename syntax to link to detailed docs

## 🚀 Common Commands

### Development
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Production build
npm run check           # TypeScript type checking
npm test                # Run test suite
```

### Database
```bash
npm run db:push         # Sync schema to Supabase
npx supabase gen types typescript --project-id tjycibrhoammxohemyhq  # Generate types
```

### Troubleshooting
```bash
rm -rf .next            # Clear Next.js cache
lsof -ti:3000 | xargs kill -9  # Kill processes on port 3000
npm rebuild vite tsx    # Fix Vite/TSX issues
```

## 📋 Project Overview

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

## 📝 Code Style & Conventions

### TypeScript
- Use TypeScript for all new files (no .js or .jsx)
- Import types from `@/shared/schema` for database entities
- Prefer `type` over `interface` for props
- Example: `import { type Story, type InsertStory } from "@/shared/schema";`

### Components
- Use functional components with hooks (no class components)
- File naming: PascalCase for components (`BookView.tsx`)
- Co-locate styles with components when possible
- Minimum 44x44px tap targets for mobile buttons

### API Routes
- Always validate user session first
- Use service role key ONLY when necessary (document why in comments)
- Map snake_case DB fields to camelCase for frontend responses
- Return proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Check `has_collaboration_access()` for multi-tenant queries

### Database
- Always use RLS policies with `(SELECT auth.uid())` pattern for performance
- Never expose internal metadata in API responses:
  - ❌ `tier`, `prompt_score`, `score_reason`, `cost_usd`, `anchor_entity`
  - ✅ User-facing data only
- Store file paths in DB, generate signed URLs on-demand (1-week expiry)

### Mobile-First
- Test all changes on mobile viewport (responsive design critical)
- Use left-align for body text (justified text causes huge gaps on mobile)
- Minimum 14px font size for readability

## 🤖 Development Workflows

### When Creating New Features
1. Check @DATA_MODEL.md for existing tables/fields first
2. Verify RLS policies before adding database queries
3. Use TypeScript types from @shared/schema
4. Test family sharing access controls if multi-tenant feature
5. Update appropriate documentation file

### When Fixing Bugs
1. Check @CLAUDE_HISTORY.md for similar past issues
2. Test in both own account and family member views (account switcher)
3. Verify RLS policies aren't blocking legitimate access
4. Check browser console for errors

### When Adding API Routes
1. Validate session: `const { data: { session } } = await supabase.auth.getSession()`
2. For multi-tenant: Check `has_collaboration_access(user_uuid, storyteller_uuid)`
3. Map database fields: `snake_case` → `camelCase`
4. Handle rate limiting (429 responses) for data export endpoints

### Before Committing
1. Run `npm run check` for type errors
2. Test on mobile viewport (Chrome DevTools)
3. Clear browser cache if testing auth changes
4. Verify no console.log with sensitive data

## 📁 Project Structure

```
HeritageWhisperV2/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── timeline/          # Timeline view
│   ├── book/              # Book view (dual-page layout)
│   ├── prompts/           # Prompts library
│   ├── interview-chat/    # Pearl AI interviewer
│   └── profile/           # User settings & data export
├── components/            # React components
├── lib/                   # Utilities (queryClient, supabase, auth)
├── hooks/                 # Custom React hooks
├── shared/schema.ts       # Database schema (Drizzle ORM)
└── docs/                  # Technical documentation
```

### Key Files & Documentation
- `@shared/schema.ts` - All database types (use these for type safety!)
- `@lib/queryClient.ts` - API wrapper with custom 429 handling
- `@lib/supabase.ts` - Supabase client configuration
- `@hooks/use-recording-state.tsx` - Recording orchestration
- `@DATA_MODEL.md` - Complete database schema reference
- `@AI_PROMPTING.md` - Pearl & prompt engineering docs
- `@SECURITY.md` - Security implementation status
- `@FAMILY_SHARING_README.md` - Multi-tenant system documentation

## 📊 Database & Data Model

**Complete documentation:** See @DATA_MODEL.md

### Quick Reference
- **21 Tables** with TypeScript types via Drizzle ORM (`@shared/schema.ts`)
- **Row Level Security (RLS)** enabled on all tables
- **50+ Performance Indexes** for optimized queries
- **Multi-tenant RPC:** `has_collaboration_access(user_uuid, storyteller_uuid)`

### Table Categories
- **Core User (3)**: users, profiles, passkeys
- **Content (3)**: stories, photos, active_prompts
- **AI Prompts (5)**: ai_prompts, user_prompts, family_prompts, prompt_feedback, prompt_entities
- **Family Sharing (5)**: family_members, family_invites, family_collaborations, family_sessions, family_access_tokens
- **Admin/Monitoring (3)**: admin_audit_log, ai_usage_log, stripe_customers

## 🔑 Key Features

- **Audio Recording**: One-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: AssemblyAI "universal" batch (~3.7s, 58% cheaper, 93.4% accuracy)
- **Pearl AI Interviewer**: Conversational AI via OpenAI Realtime API with WebRTC (see @AI_PROMPTING.md)
- **AI Prompt System**: Multi-tier reflection prompts (Tier 1: entity-based, Tier 3: milestone analysis)
- **Photo Management**: Multi-upload with cropping & hero images (EXIF data stripped for privacy)
- **Timeline View**: Chronological story organization by decade
- **Book View**: Dual-page layout with natural pagination
- **PDF Export**: 2-up (home print) and trim (POD) formats via PDFShift
- **Family Sharing**: Multi-tenant account system with role-based permissions (viewer/contributor)
- **Passkey Auth**: WebAuthn passwordless login (Touch ID, Face ID, Windows Hello)
- **GDPR Compliance**: Data export with IP protection + account deletion

## 🧪 Testing Guidelines

### API Routes
- New API routes should have basic integration tests
- Test multi-tenant access control for family sharing features
- Verify RLS policies block unauthorized access

### Database
- Test RLS policies in isolation before deploying
- Use SQL test scripts in `/migrations` folder

### UI Changes
- Manual testing checklist:
  - [ ] Test on mobile viewport (375px width minimum)
  - [ ] Test in both light/dark mode if applicable
  - [ ] Verify account switcher works (family sharing)
  - [ ] Check touch targets are 44x44px minimum

## ✅ Quality Checklists

### Pre-Commit Security Checklist
- [ ] No console.log with sensitive data (tokens, API keys, user emails)
- [ ] Service role key usage documented with reason
- [ ] RLS policies tested and enabled on new tables
- [ ] User session validated before data access
- [ ] IP addresses masked in logs (xxx.xxx.xxx.123)

### Pre-Commit Code Quality
- [ ] TypeScript compilation passes (`npm run check`)
- [ ] Database fields properly mapped (snake_case → camelCase)
- [ ] API routes return proper HTTP status codes
- [ ] Mobile responsive (test at 375px width)

### Pre-Commit Multi-Tenant
- [ ] Tested with `storyteller_id` parameter
- [ ] Family sharing access controls verified
- [ ] Works for both owner and contributor roles
- [ ] `has_collaboration_access()` called before queries

## 🛡️ GDPR & Data Privacy

**Status:** ✅ Production Ready

### Data Export (`/api/user/export`)
- **Rate Limit:** 1 export per 24 hours (tracked in `users.last_data_export_at`)
- **IP Protection:** Catalog prompts masked, AI costs/models removed, IP addresses partially masked
- **Custom 429 Handling:** `@lib/queryClient.ts` allows rate limit responses through for UI handling
- **Dev Bypass:** `?bypass_rate_limit=true`

### Account Deletion (`/api/user/delete`)
- Cascade deletes all user data (stories, photos, prompts, sessions)
- GDPR Article 17 compliance

**Key Files:** `/app/api/user/export/route.ts`, `/app/api/user/delete/route.ts`, `/app/profile/page.tsx`

## 🐛 Common Issues & Fixes

### Authentication & Sessions
- **Session Retries:** 5x 100ms retries to handle race conditions
- **Passkey Sessions:** Dual session support (Supabase + iron-session cookie)
- **401 Errors After Login:** Wait for session + query invalidation before fetching data

### Database Queries
- **Multi-tenant:** Always check `has_collaboration_access()` before querying other users' data
- **RLS Policies:** Use `(SELECT auth.uid())` pattern for performance (not `auth.uid()`)
- **Field Names:** Database uses `snake_case`, frontend expects `camelCase` - map in API routes

### Dev Server Issues
1. **Port conflicts:** `lsof -ti:3000 | xargs kill -9`
2. **Module errors:** Clear `.next` cache: `rm -rf .next`
3. **Vite/TSX issues:** `npm rebuild vite tsx`

### Rate Limiting (429)
- `@lib/queryClient.ts` allows 429 responses through - handle in calling component
- Check for `response.status === 429` and show user-friendly error with retry time

### Photo Display Issues
- **With crop/zoom:** Use `<img>` tag for transforms
- **Without transforms:** Use Next.js `<Image>` component
- **Signed URLs:** Regenerate with 1-week expiry if expired

### Sticky Header Gap Issues (Timeline)

**Mobile Timeline - Decade Headers:**
- **Symptom:** Decade headers "unstick" too early, leaving visible gap before next header takes over
- **Root Cause:** `margin-top` and `margin-bottom` on `.hw-decade-band` cause premature release
- **Solution:** Remove margins on sticky elements - set both to `0px` in `/app/styles/components.css`
- **Why it happens:** Sticky positioning calculates release point based on margin edges, not element edges
- **File:** `/app/styles/components.css` lines ~107-109 (`.hw-decade-band` margins)

**Desktop Timeline - Year Badges:**
- **Symptom:** Year badges along spine "unstick" too early with ~30px gap, cards flicker during transition
- **Root Cause:** Insufficient negative margin on timeline cards - next badge doesn't get close enough before current releases
- **Solution:** Increase negative margin from `-mt-[108px]` to `-mt-[147px]` on timeline card wrappers
- **Additional fixes:** Update `stickyTop` to `62px`, remove forced `position: fixed` override, adjust fade timing
- **File:** `/components/timeline/TimelineDesktop.tsx` line ~1117 (card wrapper className)

## 🎯 Known Issues & Workarounds

### Book View Cursor Issue
- **Issue:** Directional cursor arrows (w-resize/e-resize) flicker despite forced styles
- **Workaround:** Navigation still works by clicking page margins - ignore visual glitch
- **Status:** Low priority cosmetic issue

### Pearl Personalization Disabled
- **Issue:** Pearl AI temporarily doesn't reference user's past stories
- **Why:** Needs story fetching implementation before re-enabling
- **Workaround:** Pearl works great for standalone conversations
- **Status:** Planned for future release

## 🔧 Environment Variables

See `env.example` for complete list. Key variables:

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tjycibrhoammxohemyhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Use sparingly!

# OpenAI
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OPENAI_API_KEY=sk-...  # For browser WebRTC

# AssemblyAI
ASSEMBLYAI_API_KEY=your_key
```

### Optional Features
```bash
# Pearl AI Interviewer
NEXT_PUBLIC_ENABLE_REALTIME=true

# PDF Export
PDFSHIFT_API_KEY=sk_...
NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Development
- Copy `env.example` to `.env.local`
- Never commit `.env.local` to git
- Ask team for production keys (don't use dev keys in prod)

## 🔌 MCP Servers

Configured in `/Users/paul/Documents/DevProjects/.mcp.json`:

- ✅ GitHub MCP - Repository management
- ✅ Supabase MCP - Database queries (read-only)
- ✅ Vercel MCP - Deployment management
- ✅ Stripe MCP - Payment APIs
- ✅ Resend MCP - Email sending

---

## 📋 Update Protocol

**When asking Claude to update this file, use this format:**

```
Please update CLAUDE.md with [specific change].

Before updating:
1. Check if similar information already exists
2. Replace/condense existing content rather than adding duplicates
3. Remove any obsolete information
4. If this is historical/implementation detail, add to CLAUDE_HISTORY.md instead

Keep the file under 400 lines.
```

**Examples:**
- ✅ "Update CLAUDE.md: Add new MCP server [ServerName] to the MCP Servers section"
- ✅ "Update Known Issues: Remove the Book View Cursor issue - it's been fixed"
- ✅ "Update Code Conventions: We now use Zod for API validation (add to API Routes section)"
- ❌ "Add detailed implementation notes about how we fixed the pagination bug" → Goes to CLAUDE_HISTORY.md

---

_Last updated: October 31, 2025_

**Other Documentation:**
- [@CLAUDE_HISTORY.md](CLAUDE_HISTORY.md) - Historical fixes, feature archives, and migration notes
- [@AI_PROMPTING.md](AI_PROMPTING.md) - Pearl AI prompting & system instructions
- [@DATA_MODEL.md](DATA_MODEL.md) - Complete database schema reference
- [@SECURITY.md](SECURITY.md) - Security implementation status
- [@FAMILY_SHARING_README.md](FAMILY_SHARING_README.md) - Multi-tenant system docs
