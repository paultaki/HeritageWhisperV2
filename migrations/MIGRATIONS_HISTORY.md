# Database Migrations History

**Last Updated:** November 18, 2025
**Database:** PostgreSQL via Supabase (project: tjycibrhoammxohemyhq)

## Purpose of This Document

This document summarizes **key migration milestones** in the HeritageWhisperV2 database schema evolution. For complete migration details, see the Git history. For current schema state, see `/SCHEMA_REFERENCE.md`.

---

## Current Schema Source of Truth

**File:** `/SCHEMA_REFERENCE.md` (updated Oct 31, 2025)
**Active Tables:** 21 tables with Row Level Security (RLS)
**Production Migrations:** 0000-0027 (sequential, clean numbering as of Nov 18, 2025)

**To create a fresh database:**
```bash
# Use schema file, not migrations
rails db:schema:load  # or equivalent for Supabase
```

---

## Archived Migrations

**Location:** `/migrations/archive-oct-2025/`
**Archived Date:** November 18, 2025
**Reason:** All migrations applied to production. Duplicates, superseded versions, and development utilities removed to reduce codebase clutter.

See `/migrations/archive-oct-2025/README.md` for full list and restoration instructions.

---

## Key Migration Milestones

### Initial Schema (October 6, 2025)
**Migration:** `0000_initial_schema.sql`

**Created:**
- Core user system (users, profiles)
- Content storage (stories, photos, treasures, active_prompts)
- Basic relationships and indexes

**Foundation:** All subsequent migrations build on this base schema.

---

### Legal & Compliance (October 2025)

**User Agreements System**
**Migration:** `0001_add_user_agreements.sql`
- User agreement tracking (T&C, Privacy Policy)
- Version management for legal compliance

**GDPR AI Processing Flag**
**Migration:** `0012_add_ai_processing_enabled.sql`
- User opt-out for AI processing
- Default: enabled, user-controllable
- GDPR Article 22 compliance

---

### AI Prompt System (October 2025)

**Core AI Infrastructure**
**Migration:** `0002_add_ai_prompt_system_safe.sql`
- Tables: `active_prompts`, `prompt_history`
- Multi-tier prompt generation (entity-based, milestone analysis)
- Prompt scoring and quality metrics

**Prompt Catalog**
**Migration:** `0004_add_user_prompts_catalog.sql`
- User-selected "200+ ideas" catalog
- Prompt status tracking (active, answered, saved, dismissed)

**Admin Feedback System**
**Migration:** `0005_add_prompt_feedback.sql`
- Admin prompt quality ratings
- Training data export for AI improvement

**Queue Management**
**Migration:** `0014_add_queue_and_archive_system.sql`
- Unified prompt workflow
- Queue position tracking
- Archive functionality

**Cost Control**
**Migration:** `0013_ai_cost_tracking.sql`
- `ai_usage_log` table for monitoring
- Daily/monthly budget limits
- Abuse prevention

---

### Family Sharing System (October-November 2025)

**Multi-Tenant Foundation**
**Migration:** `0007_add_family_sharing.sql`
- Tables: `family_members`, `family_invites`, `family_sessions`
- Magic link invitations
- Relationship tracking
- Session management

**Permission System**
**Migration:** `0009_add_contributor_permissions.sql`
- Two-level roles: Viewer (read-only), Contributor (submit prompts)
- `family_prompts` table for contributor submissions
- RLS policies for access control

**Session Security**
**Migration:** `0011_family_session_security.sql`
- Absolute expiry timestamps
- Token rotation functions
- Cleanup jobs for expired sessions

---

### Security Enhancements (October 2025)

**Function Security**
**Migration:** `0010_fix_function_search_paths.sql`
- `SET search_path = public` for SQL injection prevention
- Fixed: `has_collaboration_access()`, trigger functions

**Row Level Security (RLS)**
**Migration:** `0015_fix_missing_rls.sql`
- Comprehensive RLS policies on all tables
- Performance optimization: `(SELECT auth.uid())` pattern
- Service role bypass for admin operations

**Security Definer Fix**
**Migration:** `0016_fix_security_definer_view.sql`
- Removed SECURITY DEFINER from `prompt_quality_stats` view
- Runs with invoker permissions (safer)

---

### Authentication System (October 2025)

**WebAuthn Passkeys**
**Migration:** `0021_add_passkeys_table.sql`
- Passwordless authentication (Touch ID, Face ID, Windows Hello)
- Credential storage with RLS
- Multi-device passkey support

**Passkey UX Tracking**
**Migration:** `0019_add_passkey_prompt_tracking.sql`
- Login count tracking
- Prompt dismissal logic
- Enrollment nudge timing

---

### Content Features (October-November 2025)

**User Preferences**
**Migration:** `0003_add_user_preferences.sql`
- Email notification settings
- Privacy defaults (story visibility)
- Export rate limiting (PDF, data export)

**Profile Interests**
**Migration:** `0018_add_profile_interests.sql`
- JSONB interests (general, people, places)
- Used for personalized AI prompts

**Full Date Support**
**Migration:** `0020_ensure_story_date_column.sql`
- `story_date` column (TIMESTAMP) for complete dates
- Previously only stored `story_year`

**Multi-Photo System**
**Migration:** `0022_add_photos_column.sql`
- Migrated to JSONB `photos` array
- Replaces single `photo_url` field
- Supports multiple photos per story with metadata

**Image Optimization**
**Migration:** `0023_add_treasures_webp_columns.sql`
- Dual WebP format: `master_path` (print), `display_path` (web)
- Print quality + web quality versions

**Pan/Zoom Editor**
**Migration:** `0024_add_treasure_transform.sql`
- JSONB `transform` field for image zoom/pan
- Used in treasure photo editing

**Entity Caching**
**Migration:** `0006_add_entity_caching.sql`
- `stories.entities_extracted` (JSONB)
- Reduces AI API costs by caching extracted entities

---

### Analytics & Business Features (November 2025)

**Paywall Analytics**
**Migration:** `0025_add_paywall_events.sql`
- Upgrade funnel tracking
- Event-based analytics for conversion optimization

**Activity Feed**
**Migration:** `0026_add_activity_events.sql`
- Recent activity tracking
- Story listening, recording, family events
- Powers activity feed UI

**Beta Invite System**
**Migration:** `0027_add_beta_codes.sql`
- Invite-only beta access
- Code generation and usage tracking
- Revocation support

---

### Cleanup & Optimization (October 2025)

**Removed Character Evolution**
**Migration:** `0017_remove_character_traits.sql`
- Dropped `character_evolution` table (unused feature)
- Dropped `stories.character_insights` column
- Simplified AI prompt system

---

## Migration Numbering History

**Pre-November 18, 2025:**
- Messy numbering with duplicates (multiple 0002s, 0003s, 0006s, etc.)
- Unnumbered utility migrations (add_*, fix_*)
- 40 total files with 18 duplicates/superseded

**Post-November 18, 2025:**
- Clean sequential numbering: 0000-0027
- 22 production migrations
- 18 archived duplicates
- 3 archived utilities

---

## Tables by Creation Migration

| Table | Migration | Notes |
|-------|-----------|-------|
| users | 0000 | Core user system |
| stories | 0000 | Story content |
| treasures | 0000 | Photo treasures |
| photos | 0000 | Legacy (use stories.photos) |
| user_agreements | 0001 | Legal compliance |
| active_prompts | 0002 | AI prompt queue |
| prompt_history | 0002 | Prompt archive |
| user_prompts | 0004 | Catalog prompts |
| prompt_feedback | 0005 | Admin ratings |
| family_members | 0007 | Multi-tenant |
| family_invites | 0007 | Magic links |
| family_sessions | 0007 | Session tokens |
| family_prompts | 0009 | Contributor prompts |
| ai_usage_log | 0013 | Cost tracking |
| passkeys | 0021 | WebAuthn |
| paywall_events | 0025 | Analytics |
| activity_events | 0026 | Activity feed |
| beta_codes | 0027 | Access control |

**Total:** 19 active tables (character_evolution dropped in 0017)

---

## When to Reference This Document

### Use This For:
- ✅ Understanding major schema milestones
- ✅ Quick reference for when features were added
- ✅ Context for why certain tables exist

### Use Git History For:
- 🔍 Detailed implementation of specific migration
- 🔍 Exact SQL commands executed
- 🔍 Complete chronological change log

### Use SCHEMA_REFERENCE.md For:
- 📊 Current database structure
- 📊 All fields, types, and constraints
- 📊 RLS policies and indexes

---

## Restoration from Archive

If you need to restore an archived migration:
1. See `/migrations/archive-oct-2025/README.md`
2. Copy file back to `/migrations/`
3. Understand: Archived migrations may have dependency issues
4. Recommended: Use `schema.rb` or Supabase schema export instead

---

_Maintained by: Development Team_
_Archive Location: `/migrations/archive-oct-2025/`_
_Git History: Full migration source available in repository history_
