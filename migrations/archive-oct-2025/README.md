# Archived Migrations - October 2025

**Archived Date:** November 18, 2025
**Reason:** Database consolidation and cleanup

## Why These Migrations Were Archived

All migrations in this archive have been **successfully applied to production**. They are preserved here for historical reference only. The production migration sequence has been renumbered to a clean 0000-0027 sequence.

**Key Reasons for Archival:**
1. **Duplicates** - Multiple versions of the same migration (v1 superseded by v2)
2. **Number Conflicts** - Same migration number used for different features
3. **Superseded** - Later migrations consolidated or replaced functionality
4. **Development Utilities** - One-time verification scripts not needed in production
5. **Idempotency Issues** - Migrations that fail on re-run (replaced by safe versions)

---

## Archived Migration Categories

### Duplicates (15 files)

**Initial Agreement System (3 files - superseded by 0001)**
- `0000_add_user_agreements_only.sql` - Partial agreement system
- `0000_add_agreements_to_actual_schema.sql` - Intermediate version
- **Canonical:** 0001_add_user_agreements.sql (kept in production)

**AI Prompt System (1 file - not idempotent)**
- `0002_add_ai_prompt_system.sql` - Has constraint conflicts on re-run
- **Canonical:** 0002_add_ai_prompt_system_safe.sql (production version)

**Role Systems (1 file - basic admin only)**
- `0006_add_user_roles.sql` - Basic admin/moderator roles only
- **Canonical:** 0006_add_contributor_permissions.sql (includes family contributor roles)

**Row Level Security (2 files - consolidated)**
- `0007_enable_row_level_security.sql` - Initial RLS implementation
- `0009_rls_patch_remaining_tables.sql` - Partial RLS patch
- **Canonical:** 0011_fix_missing_rls.sql (comprehensive RLS consolidation)

**Prompt Feedback (1 file - duplicate)**
- `0012_setup_admin_and_feedback.sql` - Redundant with 0003_add_prompt_feedback.sql
- **Canonical:** 0003_add_prompt_feedback.sql (original implementation)

**Family Sessions (2 files - emergency fixes)**
- `0017_create_family_sessions.sql` - Emergency recreation of table
- `fix_family_sessions_table.sql` - Another emergency fix (unnumbered)
- **Canonical:** 0004_add_family_sharing.sql (original table creation)
- **Note:** Kept as reference for troubleshooting

**Passkey Table (1 file - v1)**
- `add_passkeys_table.sql` - Original passkey table
- **Canonical:** add_passkeys_table_v2.sql → Renumbered to 0021 in production

**Visibility Columns (1 file - should have been in initial schema)**
- `add_visibility_columns.sql` - Added include_in_book, include_in_timeline, is_favorite
- **Note:** Should have been in 0000_initial_schema.sql, but applied later

### Utilities (3 files)

**Verification Scripts**
- `verify_and_fix_prompt_tables.sql` - One-time verification for prompt system deployment
- `0003_test_account_infrastructure.sql` - Development utility for cloning test accounts

**Purpose:** These were diagnostic/development tools, not production schema changes.

---

## Complete Archive Inventory

### duplicates/
```
0000_add_user_agreements_only.sql          (1.8K, Oct 6)
0000_add_agreements_to_actual_schema.sql   (3.2K, Oct 6)
0002_add_ai_prompt_system.sql              (10K, Oct 9)
0006_add_user_roles.sql                    (1.7K, Oct 15)
0007_enable_row_level_security.sql         (9.2K, Oct 15)
0009_rls_patch_remaining_tables.sql        (4.6K, Oct 15)
0012_setup_admin_and_feedback.sql          (2.4K, Nov 4)
0017_create_family_sessions.sql            (1.6K, Nov 8)
add_passkeys_table.sql                     (2.4K, Oct 24)
add_visibility_columns.sql                 (1.0K, Oct 16)
fix_family_sessions_table.sql              (1.5K, Nov 8)
```

### utilities/
```
verify_and_fix_prompt_tables.sql           (4.5K, Oct 14)
0003_test_account_infrastructure.sql       (10K, Oct 14)
```

**Total:** 18 archived files

---

## Migration Number Conflicts Resolved

The following number conflicts existed before cleanup:

**0002 (2 files):**
- ❌ `0002_add_ai_prompt_system.sql` → Archived (not idempotent)
- ✅ `0002_add_ai_prompt_system_safe.sql` → Kept as 0002

**0003 (4 files):**
- ✅ `0003_add_user_preferences.sql` → Kept as 0003
- ✅ `0003_add_user_prompts_catalog.sql` → Renumbered to 0004
- ✅ `0003_add_prompt_feedback.sql` → Renumbered to 0005
- ❌ `0003_test_account_infrastructure.sql` → Archived (dev utility)

**0006 (2 files):**
- ❌ `0006_add_user_roles.sql` → Archived (basic roles only)
- ✅ `0006_add_contributor_permissions.sql` → Renumbered to 0009

**0007 (2 files):**
- ❌ `0007_enable_row_level_security.sql` → Archived (superseded)
- ✅ `0007_fix_function_search_paths.sql` → Renumbered to 0010

**0009 (2 files):**
- ❌ `0009_rls_patch_remaining_tables.sql` → Archived (superseded)
- ✅ `0009_add_ai_processing_enabled.sql` → Renumbered to 0012

**0011 (2 files):**
- ✅ `0011_add_queue_and_archive_system.sql` → Renumbered to 0014
- ✅ `0011_fix_missing_rls.sql` → Renumbered to 0015

**0012 (3 files):**
- ✅ `0012_fix_security_definer_view.sql` → Renumbered to 0016
- ✅ `0012_remove_character_traits.sql` → Renumbered to 0017
- ❌ `0012_setup_admin_and_feedback.sql` → Archived (duplicate)

---

## Restoration Instructions

### If You Need to Restore a Migration:

**Step 1: Understand the Risk**
- Archived migrations may have dependency issues
- They may conflict with current schema
- They may not be idempotent (safe to re-run)

**Step 2: Copy Back**
```bash
# From archive to production folder
cp /migrations/archive-oct-2025/duplicates/MIGRATION_NAME.sql /migrations/

# Or restore from Git history
git checkout COMMIT_HASH -- migrations/MIGRATION_NAME.sql
```

**Step 3: Review Dependencies**
- Check if tables/columns already exist
- Verify constraints won't conflict
- Review RLS policies for overlaps

**Step 4: Test in Development First**
```bash
# Never run untested archived migrations in production
psql -d development_db -f migrations/MIGRATION_NAME.sql
```

### Better Alternative: Use Schema File

Instead of restoring old migrations, consider:
1. Use `/SCHEMA_REFERENCE.md` for current schema documentation
2. Use Supabase schema export for fresh database setup
3. Review Git history for migration implementation details

---

## What Was Kept in Production

**22 production migrations (renumbered 0000-0027):**

```
0000 - Initial schema
0001 - User agreements
0002 - AI prompt system (safe version)
0003 - User preferences
0004 - User prompts catalog
0005 - Prompt feedback
0006 - Entity caching
0007 - Family sharing
0008 - Fix family relationship constraint
0009 - Contributor permissions
0010 - Fix function search paths
0011 - Family session security
0012 - AI processing enabled flag
0013 - AI cost tracking
0014 - Queue and archive system
0015 - Fix missing RLS
0016 - Fix security definer view
0017 - Remove character traits
0018 - Profile interests
0019 - Passkey prompt tracking
0020 - Ensure story_date column
0021 - Passkeys table (v2)
0022 - Add photos column
0023 - Treasures WebP columns
0024 - Treasure transform
0025 - Paywall events
0026 - Activity events
0027 - Beta codes
```

---

## Historical Context

**Migration Period:** October 6 - November 15, 2025
**Total Original Files:** 40
**Production Sequence:** 22 (after cleanup)
**Archived:** 18

**Cleanup Date:** November 18, 2025
**Cleanup Reason:** Reduce codebase clutter, eliminate number conflicts, preserve only essential production migrations

---

## Related Documentation

- **Migration History:** `/migrations/MIGRATIONS_HISTORY.md` (key milestones summary)
- **Current Schema:** `/SCHEMA_REFERENCE.md` (complete table documentation)
- **Data Model:** `/DATA_MODEL.md` (architecture overview)
- **Main Documentation:** `/CLAUDE.md`

---

_Archived by: Development team during November 2025 codebase cleanup_
_All migrations preserved in Git history_
_For questions, see MIGRATIONS_HISTORY.md or contact development team_
