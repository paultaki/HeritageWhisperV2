# HeritageWhisper

AI-powered storytelling platform helping seniors preserve their life stories through voice recordings, intelligent prompts, and beautiful book-format presentation.

**Live:** [dev.heritagewhisper.com](https://dev.heritagewhisper.com)

## About

HeritageWhisper captures not just memories, but wisdom. Users press record, tell a 2-minute story, and our AI asks meaningful follow-up questions to extract lessons learned. Every story is preserved in the cloud—accessible on every family member's device, growing with each recording.

### Key Features

- **Voice Recording** — Senior-friendly audio capture with visual feedback and 3-2-1 countdown
- **AI Transcription** — AssemblyAI batch transcription with 93.4% accuracy
- **Pearl AI Interviewer** — Conversational AI via OpenAI Realtime API for guided interviews
- **Smart Prompts** — Multi-tier AI-generated prompts that learn from your stories
- **Photo Management** — Upload, crop, and organize photos with zoom/pan editing
- **Timeline View** — Chronological display organized by decade with age-based dating
- **Book View** — Dual-page book layout with natural pagination
- **PDF Export** — Professional exports via PDFShift (2-up and trim formats)
- **Family Sharing** — Multi-tenant system with role-based permissions (viewer/contributor)
- **Passkey Auth** — Passwordless login with Touch ID, Face ID, Windows Hello
- **GDPR Compliant** — Data export and account deletion

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 with App Router |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **Auth** | Supabase Auth + WebAuthn passkeys |
| **Database** | PostgreSQL via Supabase |
| **Storage** | Supabase Storage |
| **AI** | AssemblyAI (transcription) + OpenAI (GPT-4o, Realtime API) |
| **State** | TanStack Query v5 |
| **Payments** | Stripe |
| **Email** | Resend |
| **PDF** | PDFShift |
| **Deployment** | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (database + storage + auth)
- OpenAI API key
- AssemblyAI API key

### Installation

```bash
# Clone and install
git clone https://github.com/paultaki/HeritageWhisperV2.git
cd HeritageWhisperV2
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Services
OPENAI_API_KEY=sk-proj-...
ASSEMBLYAI_API_KEY=your_key

# Session
SESSION_SECRET=your_32_char_secret
```

See `env.example` for the complete list including optional features.

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # TypeScript type checking
npm run lint         # ESLint
npm test             # Run tests
```

### Quality Gate (Pre-Commit)

```bash
npm run check && npm run lint && npm test && npm run build
```

## Project Structure

```
HeritageWhisper/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── timeline/          # Timeline view
│   ├── book/              # Book view
│   ├── prompts/           # Prompts library
│   ├── interview-chat/    # Pearl AI interviewer
│   └── profile/           # User settings
├── components/            # React components
├── lib/                   # Utilities (supabase, auth, etc.)
├── hooks/                 # Custom React hooks
├── shared/schema.ts       # Database types (Drizzle ORM)
└── docs/                  # Technical documentation
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Primary development reference
- **[docs/architecture/](docs/architecture/)** — Data model, schema, patterns
- **[docs/security/](docs/security/)** — Security implementation
- **[docs/deployment/](docs/deployment/)** — Deployment checklists

## Mobile-First Design

Optimized for seniors on mobile devices:

- Minimum 44x44px touch targets (primary: 60px)
- 18px minimum body text
- AA-compliant contrast ratios
- Simple navigation with clear visual feedback

## Security

- Row Level Security (RLS) on all 22 database tables
- CSRF protection with httpOnly cookies
- Rate limiting via Upstash Redis
- EXIF stripping from uploaded images
- PII protection in logs
- GDPR-compliant data export and deletion

## License

Private and proprietary.

---

**Status:** Pre-Launch
**Last Updated:** December 2025
