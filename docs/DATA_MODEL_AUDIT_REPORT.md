# Data Model Documentation Audit Report

> **Date:** January 25, 2025
> **Auditor:** Claude (Automated Schema Review)
> **Scope:** Complete database schema verification against documentation

## Executive Summary

**Status:** ⚠️ SIGNIFICANT GAPS FOUND

The initial DATA_MODEL.md documentation is **incomplete and partially inaccurate**. A comprehensive audit against the production database schema revealed:

- **16 tables missing** from documentation (40% of production tables)
- **24+ columns missing** from documented tables
- **15+ RPC functions** not documented
- **1 view** not documented
- **Relationship inaccuracies** in ER diagrams
- **shared/schema.ts is outdated** - missing 7 production tables

## Critical Findings

### 1. Missing Tables (16 Total)

**High Priority - Active Production Tables:**

1. **`prompt_feedback`** - Quality ratings for AI prompts (admin dashboard feature)
2. **`family_invites`** - Token-based family member invitation system
3. **`family_collaborations`** - JOIN table for family member access control
4. **`family_prompts`** - Family-submitted questions to storytellers
5. **`user_prompts`** - User's saved prompts from catalog
6. **`ai_usage_log`** - AI cost tracking and budget enforcement
7. **`admin_audit_log`** - Admin action audit trail (security requirement)
8. **`subscriptions`** - Stripe subscription management

**Medium Priority - Supporting Tables:**

9. **`activity_notifications`** - Notification system for family activity
10. **`audio_files`** - Audio file metadata tracking
11. **`events`** - Analytics/telemetry tracking
12. **`gift_passes`** - Gift subscription code redemption
13. **`recording_sessions`** - Legacy recording session tracking

**Low Priority - Deprecated/Unused:**

14. **`shares`** - Single story sharing (marked for removal per CLAUDE.md)
15. **`usage_tracking`** - Duplicate of ai_usage_log?
16. **`family_sessions`** - Session management for family members

### 2. Missing Columns in Documented Tables

**`users` table:**
- `role` (TEXT) - CHECK: 'user', 'admin', 'moderator' - **CRITICAL for RBAC**
- `ai_daily_budget_usd` (DECIMAL) - AI cost control
- `ai_monthly_budget_usd` (DECIMAL) - AI cost control
- `ai_processing_enabled` (BOOLEAN) - User's AI consent flag

**`active_prompts` table:**
- `user_status` (TEXT) - CHECK: 'available', 'queued', 'dismissed' - **Queue management**
- `queue_position` (INTEGER) - User's queue ordering
- `dismissed_at` (TIMESTAMP) - When user dismissed prompt
- `queued_at` (TIMESTAMP) - When user queued prompt

**`family_members` table:**
- `auth_user_id` (UUID, FK → users.id) - When family member creates account
- `invited_by_user_id` (UUID, FK → users.id) - Who sent the invite
- `first_accessed_at` (TIMESTAMP) - First access tracking
- `access_count` (INTEGER) - Usage metrics
- `permission_level` (TEXT) - CHECK: 'viewer', 'contributor' (was in permissions JSONB)

**`stories` table:**
- `word_count` (INTEGER) - Story length metric
- `play_count` (INTEGER) - Audio playback tracking
- `share_count` (INTEGER) - Sharing analytics
- `is_enhanced` (BOOLEAN) - Enhanced processing flag
- `voice_notes` (TEXT) - User annotations
- `session_id` (UUID) - Recording session reference
- `status` (TEXT) - Story lifecycle status
- `audio_raw_path` (TEXT) - Raw audio storage
- `audio_clean_path` (TEXT) - Processed audio storage
- `transcript_fast` (JSONB) - Fast transcription result
- `transcript_clean` (JSONB) - Clean transcription result
- `followups_initial` (JSONB) - Initial follow-up questions
- `metrics` (JSONB) - Story quality metrics
- `enhancement_job_id` (TEXT) - Background job tracking
- `enhancement_error` (TEXT) - Error tracking

**`prompt_history` table:**
- `outcome` supports **4 values**, not 3: 'used', 'skipped', 'expired', **'dismissed'**

### 3. Missing Database Objects

**RPC Functions (15+):**
1. `archive_expired_prompts()` - Automated cleanup
2. `check_ai_budget(user_id, operation, cost)` - Budget enforcement
3. `log_ai_usage(...)` - Cost tracking
4. `cleanup_expired_family_access()` - Family invite cleanup
5. `cleanup_expired_family_sessions()` - Session cleanup
6. `rotate_family_session_token(session_id)` - Security rotation
7. `increment_pdf_export(user_id)` - Counter increment
8. `increment_data_export(user_id)` - Counter increment
9. `get_next_queue_position(user_id)` - Queue management
10. `clone_user_account(...)` - Test infrastructure
11. `set_user_story_milestone(...)` - Test infrastructure
12. `clean_test_prompts(...)` - Test infrastructure
13. `delete_test_account(...)` - Test infrastructure
14. `get_test_account_info(...)` - Test infrastructure
15. `has_collaboration_access(user_id, storyteller_id)` - **DOCUMENTED** ✓

**Views:**
1. `prompt_quality_stats` - Aggregated feedback analytics

**Triggers:**
1. `update_updated_at_column()` - Auto-timestamps
2. `trigger_cleanup_expired_sessions()` - Auto-cleanup on INSERT
3. `update_prompt_feedback_updated_at()` - Feedback timestamps
4. `update_family_prompts_updated_at()` - Prompt timestamps

### 4. Relationship Inaccuracies

**`family_members` table has 3 user relationships, not 1:**

```sql
-- ACTUAL SCHEMA:
family_members.user_id → users.id (storyteller)
family_members.invited_by_user_id → users.id (who invited them)
family_members.auth_user_id → users.id (their own account when registered)

-- MY DOCUMENTATION SHOWED ONLY:
family_members.user_id → users.id
```

**`stories.user_id` references:**
```sql
-- PRODUCTION:
FOREIGN KEY (user_id) REFERENCES auth.users(id)

-- MY DOCUMENTATION:
FOREIGN KEY (user_id) REFERENCES public.users(id)
```

**Missing `family_collaborations` table:**
- Acts as JOIN table between family_members and storytellers
- Tracks permission_level ('viewer', 'contributor')
- Tracks relationship status ('active', 'suspended', 'removed')

### 5. shared/schema.ts Discrepancies

**Tables in production DB but NOT in shared/schema.ts:**
1. `prompt_feedback`
2. `admin_audit_log`
3. `ai_usage_log`
4. `family_invites`
5. `family_collaborations`
6. `family_prompts`
7. `user_prompts`

**This means:**
- TypeScript types are missing for 7 tables
- Drizzle ORM queries unavailable for these tables
- Must use raw SQL or Supabase client for these features

### 6. Documentation Best Practices Violations

**Per Microsoft ERD Best Practices:**

❌ **Missing metadata** - No version numbers, last updated dates on diagrams
❌ **Incomplete labeling** - Relationship cardinalities not clearly marked
❌ **No change log** - No tracking of schema evolution
❌ **Ambiguous lines** - Some relationships lack directional arrows
❌ **Missing constraints** - CHECK constraints not documented in diagrams
❌ **No state diagrams** - Complex workflows (prompt lifecycle, story status) not visualized

✓ **Good practices followed:**
- Using standard Mermaid notation
- Consistent naming conventions
- Clear entity groupings
- Directional arrows on most relationships

## Impact Assessment

### High Impact (Immediate Action Required)

1. **Security Gap**: `admin_audit_log` not documented - critical for compliance
2. **RBAC Gap**: `users.role` column missing - admin features undocumented
3. **Family Sharing**: Missing `family_collaborations`, `family_invites`, `family_prompts` tables
4. **AI Budget Control**: Missing AI cost tracking tables and RPC functions
5. **Type Safety**: 7 tables missing from shared/schema.ts

### Medium Impact (Should Address)

1. **Prompt System**: `user_prompts` table (catalog prompts) vs `active_prompts` (AI prompts) confusion
2. **Queue Management**: `active_prompts.user_status` column critical for UX
3. **Analytics**: Missing notification, events, and tracking tables
4. **Session Management**: `family_sessions` table for family member auth

### Low Impact (Nice to Have)

1. **Legacy Tables**: `recording_sessions`, `shares` (deprecated)
2. **Admin Tools**: `gift_passes`, `subscriptions` (Stripe integration)
3. **Metrics**: Story play_count, share_count tracking

## Recommendations

### Immediate Actions (P0)

1. **Update DATA_MODEL.md** with all 16 missing tables
2. **Fix ER diagrams** with correct relationships
3. **Document RPC functions** - especially `check_ai_budget()` and `has_collaboration_access()`
4. **Update shared/schema.ts** to match production schema
5. **Add admin tables** (audit_log, ai_usage_log) to documentation

### Short-term Actions (P1)

1. **Create state diagrams** for:
   - Prompt lifecycle (available → queued → used/dismissed/expired)
   - Story status flow (recorded → enhanced → saved)
   - Family member status (pending → active → suspended)
2. **Document CHECK constraints** in table definitions
3. **Add schema versioning** metadata to diagrams
4. **Create index documentation** - 50+ indexes exist but not documented

### Long-term Actions (P2)

1. **Schema governance**: Process to keep schema.ts in sync with production
2. **Migration audit**: Review all 33 migration files for missed elements
3. **Deprecation tracking**: Mark tables like `shares`, `recording_sessions` as deprecated
4. **API documentation**: Map each table to its API endpoints

## Verification Checklist

- [ ] All 36+ production tables documented
- [ ] All columns documented with data types and constraints
- [ ] All foreign key relationships mapped correctly
- [ ] All RPC functions documented with signatures
- [ ] All views documented
- [ ] All triggers documented
- [ ] All CHECK constraints listed
- [ ] All unique constraints listed
- [ ] shared/schema.ts synchronized with production
- [ ] State diagrams created for complex workflows
- [ ] Index strategy documented
- [ ] Change log established

## Next Steps

1. Create comprehensive update to DATA_MODEL.md (all missing tables)
2. Regenerate ER diagrams with accurate relationships
3. Add RPC function reference section
4. Create state diagrams for key workflows
5. Update shared/schema.ts with missing tables
6. Establish schema documentation maintenance process

---

**Audit Completed:** January 25, 2025
**Production Schema Version:** Based on 33 migration files through `0013_add_profile_interests.sql`
**Documentation Version:** v1.0 (initial, incomplete)
**Recommended Next Version:** v2.0 (complete and accurate)