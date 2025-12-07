# Admin Tools Reference

Admin tools are accessible at `/admin` for whitelisted email addresses.

**Access Control:** Email whitelist configured via `NEXT_PUBLIC_ADMIN_EMAILS` environment variable.

---

## Dashboard

### Main Dashboard
**URL:** `/admin`

Central hub with quick stats and links to all admin tools organized by category.

### Beta Codes
**URL:** `/admin/beta`

Manage beta access codes for new users:
- Generate new codes
- Track code usage and redemption
- Revoke codes if needed
- Search existing codes

### Design Guidelines
**URL:** `/admin/design-guidelines`

Reference for the HeritageWhisper design system including colors, typography, and component patterns.

---

## Quality Assurance

### Prompt Quality Dashboard
**URL:** `/admin/prompts`

View all AI-generated prompts with:
- Quality scores and validation details
- Rejection reasons for failed prompts
- Filter by tier (1, 2, 3) and status
- Prompt text and metadata inspection

### Prompt Feedback & Testing
**URL:** `/admin/prompt-feedback`

Interactive prompt review system:
- Rate prompts (thumbs up/down)
- Add feedback comments
- Manual Tier 3 trigger for milestone testing
- View feedback history

---

## Monitoring

### Pre-Launch Audit Dashboard
**URL:** `/admin/audit-dashboard`

Track implementation progress for audit findings:
- 24 audit items with priority levels
- Blocker identification
- Time estimates and ARR impact
- Progress tracking

### Analytics Dashboard
**URL:** `/admin/analytics`

Executive overview of platform metrics:
- User growth trends
- Engagement metrics (stories, recordings, prompts)
- Top 10 power users leaderboard
- Activity graphs

### Market Assessment
**URL:** `/admin/market-assessment`

Comprehensive competitive analysis:
- Market opportunity sizing
- Competitor comparison matrix
- Strategic recommendations
- Positioning analysis

### Photo Album Market
**URL:** `/admin/photo-album-market`

Physical photo album digitization market analysis:
- TAM/SAM/SOM breakdown
- Market trends
- Opportunity assessment

### AI Prompts Inspector
**URL:** `/admin/ai-prompts`

Debug AI integration:
- View all system prompts sent to OpenAI
- Model configurations
- Source code file locations
- Token usage estimates

---

## Testing

### Quality Gate Tester
**URL:** `/admin/quality-tester`

Test prompts through the validation pipeline:
- Input test prompts manually
- See detailed validation results
- Debug quality gate failures
- Test edge cases

### Dev Prompts Tester
**URL:** `/dev/prompts`

Test Tier 3 prompt generation:
- Uses existing stories as context
- Dry-run mode (no database changes)
- See generated prompts before production

### Test Accounts
**URL:** `/admin/test-accounts`

Create test scenarios:
- Clone accounts for testing
- Simulate different milestones (Story 1, 3, 10, etc.)
- Test without affecting real user data

---

## Cleanup Tools

### Prompt Cleanup
**URL:** `/admin/cleanup`

Database maintenance for prompts:
- Remove low-quality prompts
- Delete broken/orphaned prompts
- Bulk cleanup operations

### Fix Audio Durations
**URL:** `/admin/fix-durations`

Repair incorrect audio metadata:
- **Load Broken (1s):** Find stories with 1-second duration (broken)
- **Scan All Stories:** Audit all stories with audio
- Detects actual duration using browser audio element
- Bulk fix or fix individual stories
- Uses "seek to end" trick for webm files with incomplete headers

---

## External Services (Quick Links)

The admin sidebar includes quick links to external dashboards:

| Service | Purpose |
|---------|---------|
| Supabase | Database management |
| Vercel | Deployment and hosting |
| AI Gateway | AI usage observability |
| PDFShift | PDF generation for book exports |
| Resend | Email delivery |
| AssemblyAI | Audio transcription |
| OpenAI | AI model usage |
| Upstash Redis | Rate limiting and caching |
| Stripe | Payment processing |

---

## Competitor Reference Links

Quick access to competitor sites for research:
- StoryWorth
- Remento
- Tell Mel
- Autobiographer
- Life Story AI
- StoryCorps

---

## Adding New Admin Tools

1. Create page at `app/admin/[tool-name]/page.tsx`
2. Add to `ADMIN_TOOLS` array in `app/admin/page.tsx`
3. Add to `NAV_SECTIONS` in `components/AdminSidebar.tsx`
4. Update this documentation

---

*Last updated: December 2024*
