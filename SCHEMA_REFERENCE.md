# Schema Reference - Detailed Table Documentation

> **Version:** 4.0  
> **Last Updated:** October 31, 2025  
> **Tables Documented:** 22 production tables  
> **Related Documentation:** [DATA_MODEL.md](DATA_MODEL.md) | [RPC_FUNCTIONS.md](RPC_FUNCTIONS.md) | [ANTI_PATTERNS.md](ANTI_PATTERNS.md)

## Table of Contents

### Core User Tables (3)
1. [users](#1-users) - Main user accounts
2. [passkeys](#2-passkeys) - WebAuthn credentials
3. [user_agreements](#3-user_agreements) - Legal compliance tracking

### Content Tables (2)
4. [stories](#4-stories) - User-generated stories
5. [shares](#5-shares) - Story sharing links

### AI Prompt System (4)
6. [active_prompts](#6-active_prompts) - Active AI prompts
7. [prompt_history](#7-prompt_history) - Archived prompts
8. [user_prompts](#8-user_prompts) - Catalog-saved prompts
9. [prompt_feedback](#9-prompt_feedback) - Prompt quality ratings

### Family Sharing V3 (5)
10. [family_members](#10-family_members) - Family access management
11. [family_invites](#11-family_invites) - Invitation tokens
12. [family_collaborations](#12-family_collaborations) - Multi-tenant access
13. [family_prompts](#13-family_prompts) - Family-submitted questions
14. [family_activity](#14-family_activity) - Engagement tracking

### Admin & Monitoring (3)
15. [admin_audit_log](#15-admin_audit_log) - Admin actions
16. [ai_usage_log](#16-ai_usage_log) - AI cost tracking
17. [prompt_feedback](#17-prompt_feedback) - Same as #9 above

### Auxiliary Tables (6)
18. [recording_sessions](#18-recording_sessions) - Recording flow state
19. [subscriptions](#19-subscriptions) - Stripe integration
20. [gift_passes](#20-gift_passes) - Gift codes
21. [events](#21-events) - Analytics tracking
22. [usage_tracking](#22-usage_tracking) - Legacy cost tracking
23. [activity_notifications](#23-activity_notifications) - Notifications

---

## Core User Tables

### 1. users

**Purpose:** Main user accounts with authentication and preferences

**Row Count:** ~500 (active users)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | User ID (auth.uid()) |
| `email` | text | UNIQUE, NOT NULL | User email address |
| `password` | text | NULL | Hashed password (nullable for OAuth) |
| `name` | text | NULL | User display name |
| `birth_year` | integer | NULL | User birth year |
| `bio` | text | NULL | User biography |
| `profile_photo_url` | text | NULL | Profile photo URL |
| `story_count` | integer | DEFAULT 0 | Number of stories created |
| `is_paid` | boolean | DEFAULT false | Premium subscription status |
| `email_notifications` | boolean | DEFAULT true | Email notification preference |
| `weekly_digest` | boolean | DEFAULT true | Weekly email digest |
| `family_comments` | boolean | DEFAULT true | Family comment notifications |
| `printed_books_notify` | boolean | DEFAULT true | Book printing updates |
| `default_story_visibility` | boolean | DEFAULT false | Default story visibility |
| `pdf_exports_count` | integer | DEFAULT 0 | Number of PDF exports |
| `last_pdf_export_at` | timestamp | NULL | Last PDF export time |
| `data_exports_count` | integer | DEFAULT 0 | Number of data exports |
| `last_data_export_at` | timestamp | NULL | Last data export time |
| `latest_terms_version` | text | NULL | Accepted terms version |
| `latest_privacy_version` | text | NULL | Accepted privacy version |
| `free_stories_used` | integer | DEFAULT 0 | Free stories used |
| `subscription_status` | text | CHECK | 'none', 'active', 'cancelled', 'expired' |
| `last_tier2_attempt` | timestamp | NULL | Last Tier 2 prompt attempt |
| `do_not_ask` | jsonb | NULL | Array of dismissed prompt IDs |
| `onboarding_t3_ran_at` | timestamp | NULL | Tier 3 onboarding timestamp |
| `profile_interests` | jsonb | NULL | {general, people, places} |
| `role` | text | CHECK, DEFAULT 'user' | 'user', 'admin', 'moderator' |
| `ai_daily_budget_usd` | integer | NULL | Daily AI spend limit (USD) |
| `ai_monthly_budget_usd` | integer | NULL | Monthly AI spend limit (USD) |
| `ai_processing_enabled` | boolean | DEFAULT true | AI features enabled flag |
| `created_at` | timestamp | DEFAULT now() | Account creation time |
| `updated_at` | timestamp | DEFAULT now() | Last modification time |

**Indexes:**
- `idx_users_email` (UNIQUE)
- `idx_users_role`
- `idx_users_subscription_status`

**RLS Policy:** Users can only access their own records

---

### 2. passkeys

**Purpose:** WebAuthn credentials for passwordless authentication

**Row Count:** ~200 (users with passkeys enabled)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Passkey record ID |
| `user_id` | uuid | FK → users, NOT NULL | Owner user ID |
| `credential_id` | text | UNIQUE, NOT NULL | WebAuthn credential ID |
| `public_key` | text | NOT NULL | Public key for verification |
| `sign_count` | bigint | DEFAULT 0 | Signature counter |
| `credential_backed_up` | boolean | DEFAULT false | Cloud backup status |
| `credential_device_type` | text | NULL | Device type (platform/cross-platform) |
| `transports` | jsonb | NULL | Available transports array |
| `friendly_name` | text | NULL | User-defined device name |
| `created_at` | timestamp | DEFAULT now() | Registration time |
| `last_used_at` | timestamp | NULL | Last authentication time |

**Unique Constraints:**
- `passkeys_credential_id_key` (credential_id)
- `passkeys_user_id_credential_id_key` (user_id, credential_id) - Prevents cross-tenant clashes

**Cascade:** ON DELETE CASCADE from users

**RLS Policy:** Users can only access their own passkeys

---

### 3. user_agreements

**Purpose:** Legal compliance tracking for Terms of Service and Privacy Policy

**Row Count:** ~1000 (one per user per agreement type)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Agreement record ID |
| `user_id` | uuid | FK → users, NOT NULL | User who accepted |
| `agreement_type` | text | CHECK, NOT NULL | 'terms' or 'privacy' |
| `version` | text | NOT NULL | Version string (e.g., "1.0") |
| `accepted_at` | timestamp | DEFAULT now() | Acceptance timestamp |
| `ip_address` | text | NULL | IP address (hashed for privacy) |
| `user_agent` | text | NULL | Browser user agent |
| `method` | text | CHECK | 'signup', 'reacceptance', 'oauth' |

**Indexes:**
- `idx_user_agreements_user_id`
- `idx_user_agreements_type`

**RLS Policy:** Users can only view their own agreements

---

## Content Tables

### 4. stories

**Purpose:** User-generated story content with audio, transcripts, and metadata

**Row Count:** ~2500 (active stories)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Story ID |
| `user_id` | uuid | FK → users, NOT NULL | Story owner |
| `title` | text | NULL | Story title |
| `audio_url` | text | NULL | Original audio file URL |
| `transcript` | text | NULL | Primary transcription |
| `duration_seconds` | integer | CHECK(1-120) | Audio duration (1-120 seconds) |
| `wisdom_clip_url` | text | NULL | Wisdom clip audio URL |
| `wisdom_text` | text | NULL | Wisdom clip transcription |
| `story_year` | integer | NULL | Year the story took place |
| `story_date` | timestamp | NULL | Full date (month/day) |
| `life_age` | integer | NULL | User's age when story occurred |
| `lesson_learned` | text | NULL | Main lesson/insight |
| `lesson_alternatives` | jsonb | NULL | Alternative lessons array |
| `entities_extracted` | jsonb | NULL | Named entities (people, places) |
| `source_prompt_id` | uuid | FK → active_prompts | Originating prompt |
| `life_phase` | text | CHECK | 'childhood', 'teen', 'early_adult', 'mid_adult', 'late_adult', 'senior' |
| `photo_url` | text | NULL | Legacy single photo URL |
| `photo_transform` | jsonb | NULL | Legacy photo transform data |
| `photos` | jsonb | NULL | Array of photo objects with transforms |
| `emotions` | jsonb | NULL | Emotion tags array |
| `pivotal_category` | text | NULL | Pivotal moment category |
| `include_in_book` | boolean | DEFAULT true | Include in book generation |
| `include_in_timeline` | boolean | DEFAULT true | Show in timeline view |
| `is_favorite` | boolean | DEFAULT false | User favorite flag |
| `formatted_content` | jsonb | NULL | AI-formatted story structure |
| `extracted_facts` | jsonb | NULL | Key facts extracted by AI |
| `status` | text | CHECK | 'recorded', 'saved', 'enhanced' |
| `audio_raw_path` | text | NULL | Storage path for raw audio |
| `audio_clean_path` | text | NULL | Storage path for processed audio |
| `transcript_fast` | jsonb | NULL | AssemblyAI fast transcription |
| `transcript_clean` | jsonb | NULL | Final clean transcript |
| `followups_initial` | jsonb | NULL | AI-generated followup questions |
| `metrics` | jsonb | NULL | Processing metrics |
| `enhancement_job_id` | text | NULL | Async job tracking ID |
| `enhancement_error` | text | NULL | Error messages |
| `created_at` | timestamp | DEFAULT now() | Story creation time |
| `updated_at` | timestamp | DEFAULT now() | Last modification time |

**Indexes:**
- `idx_stories_user_id`
- `idx_stories_created_at` (DESC)
- `idx_stories_story_year`
- `idx_stories_status`

**RLS Policy:** Users can only access their own stories (except via family sharing)

---

### 5. shares

**Purpose:** Public/private story sharing with view tracking

**Row Count:** ~100 (active shares)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Share record ID |
| `story_id` | uuid | FK → stories, NOT NULL | Shared story |
| `share_code` | text | UNIQUE, NOT NULL | URL-safe share token |
| `is_public` | boolean | DEFAULT false | Public vs private share |
| `view_count` | integer | DEFAULT 0 | Number of views |
| `last_viewed_at` | timestamp | NULL | Last view timestamp |
| `expires_at` | timestamp | NULL | Optional expiration |
| `created_at` | timestamp | DEFAULT now() | Share creation time |

**Indexes:**
- `idx_shares_share_code` (UNIQUE)
- `idx_shares_story_id`

**RLS Policy:** Public shares accessible to anyone, private shares require share_code

---

## AI Prompt System Tables

### 6. active_prompts

**Purpose:** Currently active AI-generated prompts awaiting user response

**Row Count:** ~5000 (active prompts across all users)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Prompt ID |
| `user_id` | uuid | FK → users, NOT NULL | Prompt recipient |
| `prompt_text` | text | NOT NULL | Question text |
| `context_note` | text | NULL | Additional context |
| `anchor_entity` | text | NULL | Referenced person/place |
| `anchor_year` | integer | NULL | Referenced year |
| `anchor_hash` | text | UNIQUE | SHA1(tier + entity + year) for deduplication |
| `tier` | integer | CHECK(0-3) | 0=fallback, 1=template, 2=on-demand, 3=milestone |
| `memory_type` | text | NULL | Memory category |
| `prompt_score` | integer | CHECK(0-100) | Quality score (0-100) |
| `score_reason` | text | NULL | Scoring explanation |
| `model_version` | text | NULL | AI model used |
| `created_at` | timestamp | DEFAULT now() | Generation time |
| `expires_at` | timestamp | NULL | Expiration (7 days default) |
| `is_locked` | boolean | DEFAULT false | Paywall flag |
| `shown_count` | integer | DEFAULT 0 | Times displayed to user |
| `last_shown_at` | timestamp | NULL | Last display time |
| `user_status` | text | CHECK | 'available', 'queued', 'dismissed' |
| `queue_position` | integer | NULL | Position in user's queue |
| `dismissed_at` | timestamp | NULL | Dismissal time |
| `queued_at` | timestamp | NULL | Queue addition time |

**Indexes:**
- `idx_active_prompts_user`
- `idx_active_prompts_tier`
- `idx_active_prompts_expires`
- `idx_active_prompts_anchor_hash` (UNIQUE)

**RLS Policy:** Users can only access their own prompts

---

### 7. prompt_history

**Purpose:** Archived used/skipped/expired prompts for analytics

**Row Count:** ~10000 (historical prompts)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | History record ID |
| `user_id` | uuid | FK → users, NOT NULL | Prompt recipient |
| `prompt_text` | text | NOT NULL | Question text |
| `anchor_hash` | text | NULL | Deduplication hash |
| `anchor_entity` | text | NULL | Referenced person/place |
| `anchor_year` | integer | NULL | Referenced year |
| `tier` | integer | NULL | Prompt tier (0-3) |
| `memory_type` | text | NULL | Memory category |
| `prompt_score` | integer | NULL | Quality score |
| `shown_count` | integer | DEFAULT 0 | Times shown before archive |
| `outcome` | text | CHECK | 'used', 'skipped', 'expired', 'dismissed' |
| `story_id` | uuid | FK → stories | Resulting story (if used) |
| `created_at` | timestamp | DEFAULT now() | Original creation time |
| `resolved_at` | timestamp | DEFAULT now() | Archive time |

**Indexes:**
- `idx_prompt_history_user_id`
- `idx_prompt_history_outcome`

**RLS Policy:** Users can only access their own history

---

### 8. user_prompts

**Purpose:** User-saved prompts from catalog or AI suggestions

**Row Count:** ~3000 (saved prompts)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Prompt ID |
| `user_id` | uuid | FK → users, NOT NULL | Prompt owner |
| `text` | text | NOT NULL | Prompt question |
| `category` | text | NULL | Catalog category |
| `source` | text | CHECK | 'catalog' or 'ai' |
| `status` | text | CHECK | 'ready', 'queued', 'dismissed', 'recorded', 'deleted' |
| `queue_position` | integer | NULL | Queue order |
| `dismissed_at` | timestamp | NULL | Dismissal time |
| `queued_at` | timestamp | NULL | Queue addition time |
| `created_at` | timestamp | DEFAULT now() | Save time |

**Indexes:**
- `idx_user_prompts_user_id`
- `idx_user_prompts_status`

**RLS Policy:** Users can only access their own saved prompts

---

### 9. prompt_feedback

**Purpose:** Admin tool for rating prompt quality

**Row Count:** ~500 (rated prompts)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Feedback record ID |
| `prompt_id` | uuid | FK → active_prompts | Rated prompt |
| `prompt_text` | text | NOT NULL | Prompt copy |
| `story_id` | uuid | FK → stories | Resulting story |
| `story_excerpt` | text | NULL | Story snippet |
| `rating` | text | CHECK | 'good', 'bad', 'excellent', 'terrible' |
| `feedback_notes` | text | NULL | Admin notes |
| `tags` | text[] | NULL | Quality tags |
| `prompt_tier` | integer | NULL | Tier level |
| `prompt_type` | text | NULL | Type category |
| `anchor_entity` | text | NULL | Referenced entity |
| `word_count` | integer | NULL | Story word count |
| `prompt_score` | numeric | NULL | Quality score |
| `quality_report` | jsonb | NULL | Detailed report |
| `reviewed_by` | uuid | FK → users | Admin reviewer |
| `reviewed_at` | timestamp | NULL | Review time |
| `created_at` | timestamp | DEFAULT now() | Feedback creation |
| `updated_at` | timestamp | DEFAULT now() | Last update |

**Indexes:**
- `idx_prompt_feedback_rating`
- `idx_prompt_feedback_tier`

**RLS Policy:** Admin-only access

---

## Family Sharing Tables

### 10. family_members

**Purpose:** Family member invitations and access management

**Row Count:** ~300 (family relationships)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Family member ID |
| `user_id` | uuid | FK → users, NOT NULL | Storyteller (owner) |
| `email` | text | NOT NULL | Family member email |
| `name` | text | NULL | Family member name |
| `relationship` | text | CHECK | 'spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other' |
| `status` | text | CHECK | 'pending', 'active', 'suspended' |
| `permission_level` | text | CHECK | 'viewer', 'contributor' |
| `invited_at` | timestamp | DEFAULT now() | Invitation time |
| `invited_by_user_id` | uuid | FK → users | Inviter |
| `auth_user_id` | uuid | FK → users | Family member's own account |
| `first_accessed_at` | timestamp | NULL | First access time |
| `last_accessed_at` | timestamp | NULL | Last access time |
| `access_count` | integer | DEFAULT 0 | Access counter |
| `custom_message` | text | NULL | Invitation message |
| `permissions` | jsonb | NULL | Granular permissions |
| `created_at` | timestamp | DEFAULT now() | Record creation |

**Indexes:**
- `idx_family_members_user_status`
- `idx_family_members_email`

**RLS Policy:** Users can access family members they invited

---

### 11. family_invites

**Purpose:** Token-based invitation system for family members

**Row Count:** ~150 (pending invites)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Invite ID |
| `family_member_id` | uuid | FK → family_members, NOT NULL | Target family member |
| `token` | text | UNIQUE, NOT NULL | Invitation token |
| `expires_at` | timestamp | NOT NULL | Expiration time |
| `used_at` | timestamp | NULL | Redemption time |
| `created_at` | timestamp | DEFAULT now() | Invite creation |

**Indexes:**
- `idx_family_invites_token` (UNIQUE)
- `idx_family_invites_expires_at`

**RLS Policy:** Public access with valid token

---

### 12. family_collaborations

**Purpose:** Multi-tenant access control (JOIN table)

**Row Count:** ~300 (active collaborations)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Collaboration ID |
| `family_member_id` | uuid | FK → family_members, NOT NULL | Family member |
| `storyteller_user_id` | uuid | FK → users, NOT NULL | Storyteller account |
| `invited_by_user_id` | uuid | FK → users | Inviter |
| `permission_level` | text | CHECK | 'viewer', 'contributor' |
| `relationship` | text | NULL | Relationship type |
| `status` | text | CHECK | 'active', 'suspended', 'removed' |
| `created_at` | timestamp | DEFAULT now() | Collaboration start |
| `last_viewed_at` | timestamp | NULL | Last access time |

**Indexes:**
- `idx_family_collaborations_family_member`
- `idx_family_collaborations_storyteller`

**RLS Policy:** Complex policy checking collaboration status

---

### 13. family_prompts

**Purpose:** Family-submitted questions to storytellers

**Row Count:** ~200 (submitted questions)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Prompt ID |
| `storyteller_user_id` | uuid | FK → users, NOT NULL | Question recipient |
| `submitted_by_family_member_id` | uuid | FK → family_members | Submitter |
| `prompt_text` | text | NOT NULL | Question text |
| `status` | text | CHECK | 'pending', 'answered', 'archived' |
| `answered_at` | timestamp | NULL | Answer time |
| `created_at` | timestamp | DEFAULT now() | Submission time |

**Indexes:**
- `idx_family_prompts_storyteller`
- `idx_family_prompts_status`

**RLS Policy:** Storytellers and submitters can access

---

### 14. family_activity

**Purpose:** Family engagement tracking for activity feed

**Row Count:** ~1000 (activity events)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Activity ID |
| `user_id` | uuid | FK → users, NOT NULL | Storyteller |
| `family_member_id` | uuid | FK → family_members | Acting member |
| `story_id` | uuid | FK → stories | Related story |
| `activity_type` | text | NOT NULL | 'viewed', 'commented', 'favorited', 'shared' |
| `details` | text | NULL | Activity details |
| `created_at` | timestamp | DEFAULT now() | Activity time |

**Indexes:**
- `idx_family_activity_user_id`
- `idx_family_activity_created_at` (DESC)

**RLS Policy:** Users can access activity on their own content

---

## Admin & Monitoring Tables

### 15. admin_audit_log

**Purpose:** Admin action audit trail for compliance

**Row Count:** ~500 (admin actions)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Audit record ID |
| `admin_user_id` | uuid | FK → users, NOT NULL | Admin who acted |
| `action` | text | NOT NULL | Action type |
| `target_user_id` | uuid | FK → users | Affected user |
| `details` | jsonb | NULL | Action details |
| `ip_address` | text | NULL | Admin IP (hashed) |
| `user_agent` | text | NULL | Browser info |
| `created_at` | timestamp | DEFAULT now() | Action time |

**Indexes:**
- `idx_admin_audit_log_created_at` (DESC)
- `idx_admin_audit_log_admin`

**RLS Policy:** Admin-only access

---

### 16. ai_usage_log

**Purpose:** AI API usage and cost tracking

**Row Count:** ~50000 (API calls)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK | Usage record ID |
| `user_id` | uuid | FK → users | API user |
| `operation` | text | NOT NULL | Operation type |
| `model` | text | NOT NULL | AI model used |
| `tokens_used` | integer | DEFAULT 0 | Token count |
| `cost_usd` | numeric | DEFAULT 0 | Cost in USD |
| `ip_address` | text | NULL | Request IP (hashed) |
| `created_at` | timestamp | DEFAULT now() | Usage time |

**Indexes:**
- `idx_ai_usage_log_user_id`
- `idx_ai_usage_log_created_at` (DESC)

**RLS Policy:** Users can view their own usage, admins can view all

---

## Auxiliary Tables

### 18. recording_sessions

**Purpose:** Temporary state for multi-step recording flow

**Row Count:** ~57 (active sessions)

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `story_prompt` | text | Recording prompt |
| `user_age` | integer | User age |
| `start_time` | timestamp | Session start |
| `end_time` | timestamp | Session end |
| `context` | text | Context notes |
| `followup_count` | integer | Followup count |
| `followups_asked` | jsonb | Followup array |
| `status` | text | 'recording', 'completed' |
| `main_audio_url` | text | Main audio |
| `wisdom_audio_url` | text | Wisdom audio |
| `wisdom_clip_text` | text | Wisdom text |
| `duration` | integer | Duration |
| `emotion_tags` | text[] | Emotions |
| `created_at` | timestamp | Creation |

**Usage:** Cleaned up after story finalization

---

### 19. subscriptions

**Purpose:** Stripe subscription management

**Row Count:** 0 (schema only)

**Status:** Payment integration not yet implemented

---

### 20. gift_passes

**Purpose:** Gift subscription codes

**Row Count:** 0 (schema only)

**Status:** Gift feature not yet implemented

---

### 21. events

**Purpose:** Analytics event tracking

**Row Count:** 0 (schema only)

**Status:** Analytics infrastructure not yet populated

---

### 22. usage_tracking

**Purpose:** Legacy service cost tracking

**Row Count:** 0 (replaced by ai_usage_log)

**Status:** Superseded by `ai_usage_log`

---

### 23. activity_notifications

**Purpose:** Real-time notification system

**Row Count:** 0 (schema only)

**Status:** Notification feature not yet implemented

---

## Database Constraints Summary

### Primary Keys
All tables use UUID primary keys with `gen_random_uuid()` default

### Unique Constraints
- `users.email`
- `passkeys.credential_id`
- `passkeys(user_id, credential_id)` - Composite
- `active_prompts.anchor_hash`
- `family_invites.token`
- `shares.share_code`

### Foreign Key Cascades
- `passkeys.user_id` → ON DELETE CASCADE
- `active_prompts.user_id` → ON DELETE CASCADE
- `prompt_history.user_id` → ON DELETE CASCADE
- `user_prompts.user_id` → ON DELETE CASCADE
- `family_members.user_id` → ON DELETE CASCADE
- `family_activity.user_id` → ON DELETE CASCADE
- `family_activity.family_member_id` → ON DELETE CASCADE
- `admin_audit_log.target_user_id` → ON DELETE SET NULL
- `prompt_feedback.story_id` → ON DELETE SET NULL

### Indexes (50+)
- User lookups: `idx_users_role`, `idx_users_subscription_status`
- Story queries: `idx_stories_user_id`, `idx_stories_created_at` DESC
- Prompt system: `idx_active_prompts_user`, `idx_active_prompts_tier`
- Family features: `idx_family_members_user_status`
- Admin: `idx_admin_audit_log_created_at` DESC

---

**Related Documentation:**
- [DATA_MODEL.md](DATA_MODEL.md) - Overview and quick reference
- [RPC_FUNCTIONS.md](RPC_FUNCTIONS.md) - Database functions
- [ANTI_PATTERNS.md](ANTI_PATTERNS.md) - Common mistakes
- [DATA_FLOW_PATTERNS.md](DATA_FLOW_PATTERNS.md) - Operation flows

---

_Last verified: October 31, 2025 - All 22 production tables synchronized with Supabase database_

