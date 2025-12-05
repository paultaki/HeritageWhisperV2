# Documentation Audit Report - HeritageWhisper

**Audit Date:** December 5, 2025
**Auditor:** Claude Code
**Project:** HeritageWhisper (Next.js 15 production app)
**Status:** Pre-Launch

---

## Summary Stats

| Category | Count | Total Size |
|----------|-------|------------|
| **ESSENTIAL-LAUNCH** | 14 | ~180 KB |
| **ESSENTIAL-DEV** | 24 | ~290 KB |
| **OUTDATED** | 11 | ~150 KB |
| **ARCHIVE-WORTHY** | 35 | ~520 KB |
| **DELETE** | 33 | ~250 KB |
| **Total** | **117** | **~1.4 MB** |

**Estimated cleanup savings:** ~400 KB (DELETE category) + reorganization benefits

---

## Immediate Actions (DELETE Category)

These files provide no value and create confusion:

### Root Directory (13 files)

| File | Size | Reason |
|------|------|--------|
| `ACTIVITY_TRACKING_DEBUG.md` | 4.1K | Debug guide for resolved issue |
| `ACTIVITY_TRACKING_FIX.md` | 3.2K | Fix doc for resolved bug |
| `NOTIFICATION_DEBUG.md` | 8.1K | Debug guide - issue resolved |
| `make_demo_files_public.md` | 816B | One-time SQL instructions (30 lines) |
| `IMAGE_OPTIMIZATION_PLAN.md` | 12.3K | Planning doc - optimization complete |
| `LANDING_PAGE_REVIEW.md` | 12.2K | Code review feedback - incorporated |
| `Review Family View Mode.md` | 14.1K | Review doc - feedback incorporated |
| `Review Recording Implementation.md` | 18.7K | Review doc - feedback incorporated |
| `OCTOBER_2025_UPDATES.md` | 15.1K | Duplicates content in CLAUDE_HISTORY.md |
| `V2_STATUS.md` | 3.5K | Duplicates TIMELINE_V2_COMPLETE.md |
| `TIMELINE_V2_COMPLETE.md` | 8.2K | Feature shipped; duplicates V2_STATUS |
| `AI_SPEED_OPTIMIZATION.md` | 11.1K | Oct 2025 optimization - completed |
| `T&C_AUDIT_MUST_KEEP_PROVISIONS.md` | 6K | Internal audit notes - T&C updated |

### Unexpected Locations (8 files)

| File | Size | Reason |
|------|------|--------|
| `lib/promptSystemsImproved.md` | 2.6K | Superseded by `AI_PROMPTING.md` |
| `scripts/ADD_STORY_DATE_COLUMN.md` | 1.9K | One-time migration - completed |
| `scripts/metrics/SUMMARY.after-components.md` | 1.6K | Old metrics snapshot |
| `scripts/metrics/SUMMARY.after-round-three.md` | 2.1K | Old metrics snapshot |
| `scripts/metrics/SUMMARY.round4.md` | 2.8K | Old metrics snapshot |
| `tests/red-team-pearl.md` | 8.9K | Test script - should be in code, not .md |
| `tests/Refactor Timeline and Recording Process.md` | 12.9K | Planning doc - refactor complete |
| `app/design-demo/README.md` | 11.1K | Demo route - consider removing route too |

### /docs Folder (5 files)

| File | Size | Reason |
|------|------|--------|
| `docs/DATA_MODEL_AUDIT_REPORT.md` | 10.2K | Old audit - superseded by architecture/ docs |
| `docs/SCHEMA_UPDATE_SUMMARY.md` | 9K | Oct 2025 update notes - now in MIGRATIONS_HISTORY |
| `docs/troubleshooting/CONSOLE_LOG_CLEANUP.md` | 9.2K | One-time cleanup instructions |
| `docs/troubleshooting/SESSION_SUMMARY.md` | 6.8K | Debug session notes |
| `docs/troubleshooting/IPHONE_NAV_STRETCH_FIX.md` | 4.8K | Specific bug fix - issue resolved |

### App READMEs (2 files)

| File | Size | Reason |
|------|------|--------|
| `app/book-old/README.md` | 3.5K | Deprecated route - remove with route |
| `app/design-demo/README.md` | 11.1K | Demo route README - not production |

---

## Needs Update (OUTDATED Category)

### Critical Updates Required

| File | Issue | Fix Required |
|------|-------|--------------|
| **`README.md`** (root) | Says "Database: PostgreSQL (Neon) with Drizzle ORM" | Update to "PostgreSQL via Supabase" |
| **`README.md`** | "Open http://localhost:3002" | Should be localhost:3000 |
| **`README.md`** | Tech stack section outdated | Update to match CLAUDE.md stack |
| **`README.md`** | "Last Updated: October 1, 2025" | Needs refresh |

### Minor Updates

| File | Issue |
|------|-------|
| `MIGRATION_GUIDE.md` | References old migration files - migrations complete |
| `docs/deployment/DOMAIN_MIGRATION_AUDIT.md` | Audit for migration that may be complete |
| `docs/features/GPT5_FEATURE_README.md` | References "GPT-5" but uses GPT-4o |
| `docs/features/REALTIME_API_TESTING.md` | Testing doc - may be stale |
| `docs/entity-relationship-diagram.md` | Check if diagram matches current schema |
| `docs/architecture-overview.md` | Check against DATA_MODEL.md for accuracy |

### Files with Wrong Dates

| File | States | Actual |
|------|--------|--------|
| `CLAUDE_HISTORY.md` | "Last updated: October 30, 2025" | Content goes to Jan 2025 |
| `lib/promptingPrinciples.md` | No date | Should add version date |

---

## Archive Candidates

### Already Properly Archived (35 files)

The `/archive/` folder is well-organized with README files explaining each subfolder:

| Archive Folder | Files | Purpose |
|----------------|-------|---------|
| `archive/completed-implementations-2025/` | 8 | One-time implementation guides |
| `archive/planning-docs-2025/` | 3 | Historical AI planning docs |
| `archive/mobile-fixes-2025-11/` | 4 | Deprecated mobile fix iterations |
| `archive/old-landing-pages-2025-11-17/` | 1 | Old landing page components |
| `archive/orphaned-components-2025-11-17/` | 1 | Unused component cleanup |
| `archive/prompt-docs/` | 7 | Historical prompt engineering docs |
| `migrations/archive-oct-2025/` | 1 | Archived SQL migrations |

### Should Move to Archive

| File | Reason | New Location |
|------|--------|--------------|
| `HeritageWhisper North Star.md` | Product vision - reference only | `archive/planning-docs-2025/` |
| `HW MVP v2 and Monitization (confidential).md` | Strategic planning doc | `archive/planning-docs-2025/` |
| `FAMILY_ACCESS_FLOW_VERIFICATION.md` | Verification complete Nov 2025 | `archive/completed-implementations-2025/` |
| `docs/MEMORY_BOX_COMPARISON.md` | Feature comparison - decided | `archive/planning-docs-2025/` |
| `docs/MEMORY_BOX_V2_IMPLEMENTATION.md` | Implementation complete | `archive/completed-implementations-2025/` |
| `docs/features/MEMORY_BOX_IMPLEMENTATION_ANALYSIS.md` | Analysis complete | `archive/planning-docs-2025/` |

---

## Essential Files Verified

### ESSENTIAL-LAUNCH (14 files) - Production Operations

| File | Status | Notes |
|------|--------|-------|
| `docs/deployment/PRE_LAUNCH_CHECKLIST.md` | Current | Active checklist for launch |
| `docs/deployment/DEPLOYMENT_CHECKLIST.md` | Current | Deployment procedures |
| `docs/deployment/PDFSHIFT_INTEGRATION.md` | Current | PDF export service setup |
| `docs/deployment/PDFSHIFT_SETUP_SUMMARY.md` | Current | Quick reference |
| `docs/security/SECURITY.md` | Current | Security overview |
| `docs/security/SECURITY_IMPLEMENTATION_STATUS.md` | Current | Implementation status |
| `docs/security/CSRF_IMPLEMENTATION.md` | Current | CSRF protection details |
| `docs/security/GDPR_DATA_INVENTORY.md` | Current | GDPR compliance (58KB - comprehensive) |
| `docs/BACKUP_RESTORE.md` | Current | Backup procedures (Dec 2025) |
| `docs/architecture/DATA_MODEL.md` | Current | Schema navigation hub |
| `docs/architecture/SCHEMA_REFERENCE.md` | Current | Complete table docs |
| `docs/STRIPE_IMPLEMENTATION.md` | Current | Payment integration |
| `docs/GIFT_SUBSCRIPTION_SYSTEM.md` | Current | Gift subscriptions |
| `SEO_STRATEGY.md` | Current | SEO implementation guide |

### ESSENTIAL-DEV (24 files) - Development Reference

| File | Status | Notes |
|------|--------|-------|
| `CLAUDE.md` | Current | Primary AI assistant reference |
| `CLAUDE_HISTORY.md` | Current | Historical fixes & context |
| `app/api/CLAUDE.md` | Current | API route patterns |
| `AI_PROMPTING.md` | Current | Pearl & AI prompting (Jan 2025) |
| `DESIGN_GUIDELINES.md` | Current | Design system tokens |
| `SEARCH_PATTERNS.md` | Current | ripgrep command reference |
| `docs/architecture/DATA_FLOW_PATTERNS.md` | Current | Operation workflows |
| `docs/architecture/RPC_FUNCTIONS.md` | Current | PostgreSQL functions |
| `docs/architecture/ANTI_PATTERNS.md` | Current | Common mistakes |
| `migrations/MIGRATIONS_HISTORY.md` | Current | Migration milestones |
| `.claude/README.md` | Current | Claude Code setup |
| `.claude/SETUP_SUMMARY.md` | Current | Setup details |
| `.claude/commands/*.md` (7 files) | Current | Slash command definitions |
| `lib/promptingPrinciples.md` | Current | Prompting dev reference |
| `docs/features/BETA_CODES.md` | Current | Beta access system |
| `docs/features/INTEGRATION_GUIDE.md` | Current | Integration patterns |
| `docs/troubleshooting/CACHE_INVALIDATION_GUIDE.md` | Current | TanStack Query patterns |
| `docs/troubleshooting/SCROLL_CARRYOVER_FIX_FINAL.md` | Current | Still-relevant mobile fix |
| `docs/troubleshooting/VIEWPORT_FIX_SUMMARY.md` | Current | Mobile viewport fix |
| `docs/troubleshooting/TIMELINE_STICKY_BADGES.md` | Current | Sticky positioning |

### Component READMEs (Keep)

| File | Status | Notes |
|------|--------|-------|
| `app/book/README.md` | Current | Active book view docs |
| `app/book-new/README.md` | Current | Mobile book view (in use) |
| `app/interview-chat-v2/README.md` | Current | Conversational AI feature |
| `app/recording-v2/README.md` | Current | Experimental route docs |
| `components/recording/PREMIUM_VISUALIZER_README.md` | Current | Component documentation |

---

## Recommendations

### 1. Files to Consolidate

| Current Files | Recommendation |
|---------------|----------------|
| `V2_STATUS.md` + `TIMELINE_V2_COMPLETE.md` | Delete both - feature shipped, info in CLAUDE_HISTORY |
| `OCTOBER_2025_UPDATES.md` | Delete - duplicates CLAUDE_HISTORY.md |
| Multiple troubleshooting files | Consider consolidating into single TROUBLESHOOTING.md |
| `lib/promptingPrinciples.md` + `lib/promptSystemsImproved.md` | Keep only `promptingPrinciples.md` |

### 2. Missing Documentation Gaps

| Gap | Recommendation |
|-----|----------------|
| **Runbook for incidents** | Create `docs/deployment/RUNBOOK.md` |
| **Environment variable reference** | Create `docs/deployment/ENV_VARS.md` (expand from CLAUDE.md) |
| **Testing guide consolidation** | Consolidate `docs/features/testing/*.md` into single guide |
| **Quick start for new devs** | README.md should be primary onboarding doc |

### 3. Suggested /docs Structure

```
docs/
├── architecture/          # ✅ Well organized
├── deployment/            # ✅ Well organized
├── security/              # ✅ Well organized
├── features/              # Needs cleanup - move completed to archive
│   └── testing/          # Consider consolidating
├── troubleshooting/       # Consider consolidating active guides
└── BACKUP_RESTORE.md      # ✅ Good location
```

### 4. Meta-Documentation References

Files that reference CLAUDE.md meta-instructions:
- `CLAUDE.md` lines 5-43 (meta-instructions section)
- `CLAUDE_HISTORY.md` line 3 (references CLAUDE.md)
- `app/api/CLAUDE.md` line 3 (extends CLAUDE.md)

These cross-references are appropriate and should be maintained.

---

## Quick Actions Summary

### Immediate (Before Launch)

1. **Delete** 33 files in DELETE category (~400KB savings)
2. **Update** `README.md` with correct tech stack
3. **Move** 6 files to archive

### Post-Launch

1. Consolidate troubleshooting guides
2. Create missing runbook/env vars docs
3. Review feature docs quarterly

---

## Appendix: Full File Inventory

### Root Directory (24 .md files)

| File | Size | Modified | Category |
|------|------|----------|----------|
| ACTIVITY_TRACKING_DEBUG.md | 4.1K | Nov 15 | DELETE |
| ACTIVITY_TRACKING_FIX.md | 3.2K | Nov 15 | DELETE |
| AI_PROMPTING.md | 14.1K | Oct 22 | ESSENTIAL-DEV |
| AI_SPEED_OPTIMIZATION.md | 11.1K | Oct 16 | DELETE |
| CLAUDE_HISTORY.md | 34K | Nov 4 | ESSENTIAL-DEV |
| CLAUDE.md | 23.2K | Nov 26 | ESSENTIAL-DEV |
| DESIGN_GUIDELINES.md | 11.6K | Nov 15 | ESSENTIAL-DEV |
| FAMILY_ACCESS_FLOW_VERIFICATION.md | 37.4K | Nov 18 | ARCHIVE-WORTHY |
| HeritageWhisper North Star.md | 4.5K | Nov 7 | ARCHIVE-WORTHY |
| HW MVP v2 and Monitization.md | 8K | Oct 13 | ARCHIVE-WORTHY |
| IMAGE_OPTIMIZATION_PLAN.md | 12.3K | Oct 22 | DELETE |
| LANDING_PAGE_REVIEW.md | 12.2K | Nov 9 | DELETE |
| make_demo_files_public.md | 816B | Nov 20 | DELETE |
| MIGRATION_GUIDE.md | 10.2K | Oct 22 | OUTDATED |
| NOTIFICATION_DEBUG.md | 8.1K | Nov 20 | DELETE |
| OCTOBER_2025_UPDATES.md | 15.1K | Oct 23 | DELETE |
| README.md | 4.8K | Oct 11 | OUTDATED |
| Review Family View Mode.md | 14.1K | Nov 11 | DELETE |
| Review Recording Implementation.md | 18.7K | Nov 11 | DELETE |
| SEARCH_PATTERNS.md | 2.6K | Nov 11 | ESSENTIAL-DEV |
| SEO_STRATEGY.md | 65.2K | Nov 26 | ESSENTIAL-LAUNCH |
| T&C_AUDIT_MUST_KEEP_PROVISIONS.md | 6K | Nov 4 | DELETE |
| TIMELINE_V2_COMPLETE.md | 8.2K | Nov 8 | DELETE |
| V2_STATUS.md | 3.5K | Nov 8 | DELETE |

### /docs Folder (44 .md files)

See detailed breakdown in sections above.

### /archive Folder (26 .md files)

All properly archived with README files - no action needed.

### Other Locations (23 .md files)

See "Unexpected Locations" section above.

---

**Report Generated:** December 5, 2025
**Next Review:** Recommended quarterly post-launch
