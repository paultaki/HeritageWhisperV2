# HeritageWhisper

AI-powered storytelling platform for seniors to preserve life memories through voice recordings and AI-generated prompts.

**I'm a non-developer doing vibe coding.** When making changes:
- Explain what you're doing in plain English
- Test on mobile (375px) — seniors are our users
- Don't break existing features
- Run quality checks before saying you're done

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run check        # TypeScript checking
npm run lint         # ESLint
npm test             # Run tests
```

**Quality gate (run before commits):**
```bash
npm run check && npm run lint && npm test && npm run build
```

**Troubleshooting:**
```bash
rm -rf .next                      # Clear cache
lsof -ti:3000 | xargs kill -9     # Kill port 3000
```

**Custom slash commands:** `/pre-commit`, `/api-route`, `/component`, `/db-query`, `/family-access`

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL via Supabase (project: pwuzksomxnbdndeeivzf)
- **Auth:** Supabase Auth + WebAuthn passkeys
- **Storage:** Supabase Storage (bucket: heritage-whisper-files)
- **AI:** AssemblyAI (transcription) + OpenAI (GPT-4o, Realtime API)
- **State:** TanStack Query v5
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel (dev.heritagewhisper.com)

## Non-Negotiables

These rules prevent bugs and security issues:

1. **Validate session before any database access**
2. **Filter queries by `user_id` or `storyteller_id`**
3. **Check `has_collaboration_access()` for multi-tenant features**
4. **Map database fields:** `snake_case` (DB) → `camelCase` (frontend)
5. **Test on mobile viewport** (375px minimum)
6. **Never expose:** `tier`, `prompt_score`, `cost_usd`, `anchor_entity`
7. **Never commit:** secrets, API keys, tokens
8. **Use `lib/logger.ts`** not `console.log` for sensitive data

## Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | All database types — import these! |
| `lib/supabase.ts` | Database client |
| `lib/queryClient.ts` | API wrapper with 429 handling |
| `app/api/CLAUDE.md` | API route patterns and boilerplate |
| `hooks/use-recording-state.tsx` | Recording flow orchestration |

## Project Structure

```
app/
├── api/            # API routes
├── timeline/       # Story timeline (main view)
├── book/           # Book view (dual-page layout)
├── prompts/        # Prompts library
├── interview-chat/ # Pearl AI interviewer
└── profile/        # Settings & data export
components/         # React components
lib/                # Utilities
hooks/              # Custom hooks
shared/schema.ts    # Database types
docs/               # Technical documentation
```

## Documentation (Read When Needed)

Don't memorize these — read the relevant file when working on that area:

| Area | File |
|------|------|
| Database schema & tables | `docs/architecture/DATA_MODEL.md` |
| API route patterns | `app/api/CLAUDE.md` |
| Security implementation | `docs/security/SECURITY.md` |
| Pearl AI & prompting | `AI_PROMPTING.md` |
| Family sharing system | Read `has_collaboration_access` RPC |
| Design system | `DESIGN_GUIDELINES.md` |
| Historical fixes | `CLAUDE_HISTORY.md` |

## MCP Servers

These are configured — just ask me to use them:

- **Supabase** — Database schema, RLS policies
- **Vercel** — Deployment status, logs
- **GitHub** — Issues, PRs
- **Stripe** — Subscription status
- **Resend** — Email delivery

## Database Quick Reference

- **22 tables** with Row Level Security (RLS) on all
- **Multi-tenant:** Use `has_collaboration_access(user_uuid, storyteller_uuid)`
- **Types:** Import from `shared/schema.ts`
- **Field naming:** Database = `snake_case`, TypeScript = `camelCase`

## Common Patterns

**API route authentication:**
```typescript
const { data: { user } } = await supabaseAdmin.auth.getUser(token);
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**Multi-tenant query:**
```typescript
const { data: hasAccess } = await supabaseAdmin.rpc("has_collaboration_access", {
  p_user_id: user.id,
  p_storyteller_id: storytellerId,
});
if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

## Known Issues

- **Book View Cursor:** Arrow buttons flicker (cosmetic only)
- **Pearl Personalization:** Temporarily disabled

## Environment Variables

See `env.example` for full list. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `ASSEMBLYAI_API_KEY`
- `SESSION_SECRET`

---

*Last updated: December 2025*
