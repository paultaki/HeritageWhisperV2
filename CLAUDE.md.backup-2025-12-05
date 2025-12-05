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
- Cross-reference: Link to detailed docs when needed

## 🚀 Common Commands

### Development
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Production build
npm run check           # TypeScript type checking
npm test                # Run test suite
npm run lint            # Run ESLint
```

### Database
```bash
npm run db:push         # Sync schema to Supabase
npx supabase gen types typescript --project-id tjycibrhoammxohemyhq  # Generate types
```

### Pre-Commit Quality Gate
```bash
npm run check && npm run lint && npm test && npm run build
```
Or use: `/pre-commit` (custom command)

### Troubleshooting
```bash
rm -rf .next            # Clear Next.js cache
lsof -ti:3000 | xargs kill -9  # Kill processes on port 3000
npm rebuild vite tsx    # Fix Vite/TSX issues
```

### Custom Slash Commands
Available in `.claude/commands/`:
- `/api-route` - Generate new API route with boilerplate
- `/component` - Create new component with TypeScript pattern
- `/db-query` - Add database query with RLS checks
- `/pre-commit` - Run full quality gate
- `/family-access` - Add family sharing access control

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

### Universal Rules (RFC-2119 Language)

#### MUST (Non-negotiable)
- **MUST** validate user session before any database access
- **MUST** use TypeScript for all new files (no `.js` or `.jsx`)
- **MUST** filter database queries by `user_id` or `storyteller_id`
- **MUST** check `has_collaboration_access()` for multi-tenant queries
- **MUST** map database fields from `snake_case` to `camelCase` in API responses
- **MUST** use RLS policies with `(SELECT auth.uid())` pattern for performance
- **MUST** test on mobile viewport (375px minimum width)
- **MUST NOT** expose internal metadata: `tier`, `prompt_score`, `cost_usd`, `anchor_entity`
- **MUST NOT** commit secrets, API keys, or tokens
- **MUST NOT** use `console.log` with sensitive data (emails, tokens, passwords)
- **MUST NOT** bypass TypeScript errors with `@ts-ignore` without justification

#### SHOULD (Strongly recommended)
- **SHOULD** use functional components with hooks (not class components)
- **SHOULD** import types from `@/shared/schema` for database entities
- **SHOULD** use `type` over `interface` for props
- **SHOULD** use TanStack Query for data fetching
- **SHOULD** use Tailwind utility classes only (no hardcoded colors)
- **SHOULD** run `/pre-commit` before creating PRs
- **SHOULD** add tests for new features
- **SHOULD** use descriptive variable names (no single letters except loops)

#### MAY (Optional)
- **MAY** use `@ts-ignore` if absolutely necessary (document reason in comment)
- **MAY** use service role key if RLS needs bypassing (document why in comment)

### TypeScript
- Import types: `import { type Story, type InsertStory } from "@/shared/schema";`
- File naming: PascalCase for components (`BookView.tsx`)
- Example type definition:
  ```typescript
  type ComponentProps = {
    id: string;
    title: string;
    onSubmit: (data: FormData) => void;
  };
  ```

### Components
- Functional components with hooks only
- File structure: One component per file
- Co-locate styles with components when possible
- Minimum 44x44px tap targets for mobile buttons
- Example:
  ```typescript
  "use client";
  import { type ReactNode } from "react";
  
  type Props = { children?: ReactNode };
  
  export function Component({ children }: Props) {
    return <div>{children}</div>;
  }
  ```

### API Routes
See detailed patterns in [app/api/CLAUDE.md](app/api/CLAUDE.md)
- Always validate user session first
- Map snake_case DB fields to camelCase for frontend responses
- Return proper HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500)
- Use `lib/logger.ts` not `console.log`

### Database
- Store file paths in DB, generate signed URLs on-demand (1-week expiry)
- Full schema reference: [DATA_MODEL.md](DATA_MODEL.md)

### Mobile-First
- Test all changes on mobile viewport (responsive design critical)
- Use left-align for body text (justified text causes huge gaps on mobile)
- Minimum 14px font size for readability

## 🤖 Development Workflows

### When Creating New Features
1. Check [DATA_MODEL.md](DATA_MODEL.md) for existing tables/fields first
2. Verify RLS policies before adding database queries
3. Use TypeScript types from `shared/schema.ts`
4. Test family sharing access controls if multi-tenant feature
5. Update appropriate documentation file

### When Fixing Bugs
1. Check [CLAUDE_HISTORY.md](CLAUDE_HISTORY.md) for similar past issues
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

**Core Code:**
- `shared/schema.ts` - All database types (use these for type safety!)
- `lib/queryClient.ts` - API wrapper with custom 429 handling
- `lib/supabase.ts` - Supabase client configuration
- `hooks/use-recording-state.tsx` - Recording orchestration
- [app/api/CLAUDE.md](app/api/CLAUDE.md) - API route patterns and boilerplate

**Documentation Structure (as of Nov 18, 2025):**
- **`/docs/architecture/`** - Data model, schema, RPC functions, patterns, anti-patterns
- **`/docs/security/`** - Security implementation, CSRF, GDPR compliance
- **`/docs/features/`** - Feature implementation guides, testing docs
- **`/docs/troubleshooting/`** - Fix guides, debugging, optimization
- **`/docs/deployment/`** - Deployment checklists, domain migration
- **`/migrations/`** - Database migrations (0000-0027) + MIGRATIONS_HISTORY.md

**Root Documentation (Quick Reference):**
- [AI_PROMPTING.md](AI_PROMPTING.md) - Pearl & prompt engineering (production reference)
- [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) - Design system and UI principles
- [HeritageWhisper North Star.md](HeritageWhisper North Star.md) - Product vision
- [FAMILY_SHARING_README.md](FAMILY_SHARING_README.md) - Multi-tenant system

### Alternative Routes & Experimental Features

The following routes exist but are **not linked in main navigation**. Each has comprehensive documentation:

**Active Alternative Implementations:**
- **`/app/book-new/`** - ✅ Mobile-first book view (used internally by `/book` for mobile displays)
  - See [/app/book-new/README.md](app/book-new/README.md) for details
  - Status: Active in production, accessible at `/book-new` for testing

- **`/app/interview-chat-v2/`** - ✅ Conversational AI with Pearl's voice (premium feature)
  - See [/app/interview-chat-v2/README.md](app/interview-chat-v2/README.md) for details
  - Status: Production ready, ~$3-5 per interview vs $1.13 for standard
  - Consider: Premium tier, feature flag, or optional upgrade

**Experimental Routes:**
- **`/app/recording-v2/`** - 🧪 State machine recording flow (kept for future testing)
  - See [/app/recording-v2/README.md](app/recording-v2/README.md) for details
  - Status: Experimental, cleaner architecture with distinct screens
  - Use: Testing alternative state machine approach

**Family Routes:**
- **`/app/family/timeline-v2/[userId]/`** - ✅ Enhanced family timeline with V2 features
  - Status: Active for family member viewing
  - Features: Age display, circular audio progress, photo carousel

### Archived Documentation & Components (November 2025)

**Code Cleanup (Nov 18, 2025):**
- **`/archive/planning-docs-2025/`** - Historical AI planning docs (AI_PROMPTING_SYSTEM.md, AI PRD)
- **`/archive/mobile-fixes-2025-11/`** - Deprecated mobile fix iterations
- **`/archive/completed-implementations-2025/`** - One-time implementation guides (7 files)
- **`/migrations/archive-oct-2025/`** - Archived SQL migrations (13 duplicates, 3 utilities)

**Component Cleanup (Nov 17, 2025):**
- **`/archive/orphaned-components-2025-11-17/`** - Unused components (landing-v2, MemoryToolbar variants)

Each archive directory has a README with restoration instructions and context.

## 🔍 Finding Code

Ask Claude to find code patterns, or see [SEARCH_PATTERNS.md](SEARCH_PATTERNS.md) for ripgrep commands (if exists in root, or check /docs/).

**Common searches:**
- "Find where BookView component is defined"
- "Show me all API routes that query the stories table"
- "Where do we use the has_collaboration_access function?"
- "Find all components that import useRecording"

## 🔌 MCP Servers

Configured in `~/.mcp.json`:

- **Supabase MCP** - Database schema inspection, RLS policy checks
- **GitHub MCP** - Create issues/PRs, check workflow status
- **Vercel MCP** - Deployment status, environment variables, build logs
- **Stripe MCP** - Subscription status, payment tracking
- **Resend MCP** - Email delivery status, bounce tracking

**Usage:** Just ask Claude to use these services (e.g., "Check RLS policies on stories table" or "Show recent deployment logs")

## 📊 Database & Data Model

**Complete documentation:** See [/docs/architecture/DATA_MODEL.md](docs/architecture/DATA_MODEL.md)

### Quick Reference
- **21 Tables** with TypeScript types via Drizzle ORM (`shared/schema.ts`)
- **Row Level Security (RLS)** enabled on all tables
- **50+ Performance Indexes** for optimized queries
- **Multi-tenant RPC:** `has_collaboration_access(user_uuid, storyteller_uuid)`

### Table Categories
- **Core User (3)**: users, profiles, passkeys
- **Content (4)**: stories, photos, treasures, active_prompts
- **AI Prompts (5)**: ai_prompts, user_prompts, family_prompts, prompt_feedback, prompt_entities
- **Family Sharing (5)**: family_members, family_invites, family_collaborations, family_sessions, family_access_tokens
- **Admin/Monitoring (3)**: admin_audit_log, ai_usage_log, stripe_customers

## 🔑 Key Features

- **Audio Recording**: One-session flow with 3-2-1 countdown, 5-minute max, auto-transcription
- **AI Transcription**: AssemblyAI "universal" batch (~3.7s, 58% cheaper, 93.4% accuracy)
- **Pearl AI Interviewer**: Conversational AI via OpenAI Realtime API with WebRTC (see [AI_PROMPTING.md](AI_PROMPTING.md))
- **AI Prompt System**: Multi-tier reflection prompts (Tier 1: entity-based, Tier 3: milestone analysis)
- **My Treasures**: Photo upload with zoom/pan editing (4:3 aspect ratio), stores transform as JSONB in `treasures.transform`
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

### Sticky Header Issues (Timeline)

Desktop and mobile timeline sticky positioning issues are detailed in [TIMELINE_STICKY_BADGES.md](TIMELINE_STICKY_BADGES.md). Common fixes involve adjusting `stickyTop` values and negative margins.

## 🎯 Known Issues

- **Book View Cursor:** Directional arrows flicker (cosmetic only, navigation works)
- **Pearl Personalization:** Temporarily disabled pending story fetching implementation

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

## ⚙️ Claude Code Automation

### Hooks (`.claude/settings.json`)

Automated safety and quality checks:

**PreToolUse Hooks (Before executing):**
- 🚫 Block dangerous commands (`rm -rf`, `git push --force`, `DROP TABLE`)
- ⚠️  Warn when editing API routes (RLS reminder)
- ⚠️  Warn when editing `.env` files (secrets reminder)

**PostToolUse Hooks (After executing):**
- ✨ Auto-format TypeScript files with Prettier
- 🔍 Type-check API routes after editing

### Custom Slash Commands (`.claude/commands/`)

Five productivity commands for common workflows:
- `/api-route` - Generate new API route with boilerplate
- `/component` - Create new component with TypeScript pattern
- `/db-query` - Add database query with RLS checks
- `/pre-commit` - Run full quality gate
- `/family-access` - Add family sharing access control

Each command includes step-by-step instructions and code templates.

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

Aim to keep the file under 700 lines (~5,000 tokens).
```

**Examples:**
- ✅ "Update CLAUDE.md: Add new MCP server [ServerName] to the MCP Servers section"
- ✅ "Update Known Issues: Remove the Book View Cursor issue - it's been fixed"
- ✅ "Update Code Conventions: We now use Zod for API validation (add to API Routes section)"
- ❌ "Add detailed implementation notes about how we fixed the pagination bug" → Goes to CLAUDE_HISTORY.md

---

_Last updated: November 18, 2025_

## 📚 Additional Documentation

**Organized Documentation (Nov 18, 2025 restructure):**

### Core Reference
- [CLAUDE_HISTORY.md](CLAUDE_HISTORY.md) - Historical fixes and migration notes
- [AI_PROMPTING.md](AI_PROMPTING.md) - Pearl AI prompting (production reference)
- [FAMILY_SHARING_README.md](FAMILY_SHARING_README.md) - Multi-tenant system

### Architecture & Database
- [/docs/architecture/DATA_MODEL.md](docs/architecture/DATA_MODEL.md) - Schema overview & navigation hub
- [/docs/architecture/SCHEMA_REFERENCE.md](docs/architecture/SCHEMA_REFERENCE.md) - Complete table documentation
- [/docs/architecture/RPC_FUNCTIONS.md](docs/architecture/RPC_FUNCTIONS.md) - PostgreSQL functions & triggers
- [/docs/architecture/DATA_FLOW_PATTERNS.md](docs/architecture/DATA_FLOW_PATTERNS.md) - Operation sequences
- [/docs/architecture/ANTI_PATTERNS.md](docs/architecture/ANTI_PATTERNS.md) - Common mistakes & best practices
- [/migrations/MIGRATIONS_HISTORY.md](migrations/MIGRATIONS_HISTORY.md) - Database migration milestones

### Security & Compliance
- [/docs/security/SECURITY.md](docs/security/SECURITY.md) - Security implementation status
- [/docs/security/GDPR_DATA_INVENTORY.md](docs/security/GDPR_DATA_INVENTORY.md) - Data compliance
- [/docs/security/CSRF_IMPLEMENTATION.md](docs/security/CSRF_IMPLEMENTATION.md) - CSRF protection

### Troubleshooting
- [/docs/troubleshooting/SCROLL_CARRYOVER_FIX_FINAL.md](docs/troubleshooting/SCROLL_CARRYOVER_FIX_FINAL.md) - Mobile scroll fix
- [/docs/troubleshooting/VIEWPORT_FIX_SUMMARY.md](docs/troubleshooting/VIEWPORT_FIX_SUMMARY.md) - URL bar viewport fix
- [/docs/troubleshooting/TIMELINE_STICKY_BADGES.md](docs/troubleshooting/TIMELINE_STICKY_BADGES.md) - Sticky positioning
- [/docs/troubleshooting/CACHE_INVALIDATION_GUIDE.md](docs/troubleshooting/CACHE_INVALIDATION_GUIDE.md) - TanStack Query patterns

### Archives
- [/archive/planning-docs-2025/](archive/planning-docs-2025/) - Historical planning documents
- [/archive/mobile-fixes-2025-11/](archive/mobile-fixes-2025-11/) - Deprecated fix iterations
- [/archive/completed-implementations-2025/](archive/completed-implementations-2025/) - Implementation guides
- [/migrations/archive-oct-2025/](migrations/archive-oct-2025/) - Archived SQL migrations
