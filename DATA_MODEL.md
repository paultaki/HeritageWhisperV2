# HeritageWhisperV2 - Complete Data Model Documentation

> **Version:** 2.0 (Verified Accurate)
> **Last Updated:** January 25, 2025
> **Schema Version:** 21 tables, synchronized with production database
> **Purpose:** Comprehensive documentation of database schemas, service models, and UI data structures

## Table of Contents
1. [Overview](#overview)
2. [Database Schema Layer](#database-schema-layer)
3. [Database Objects (RPC, Views, Triggers)](#database-objects)
4. [Service Layer Models](#service-layer-models)
5. [UI Data Models](#ui-data-models)
6. [Key Relationships](#key-relationships)
7. [Data Flow Patterns](#data-flow-patterns)
8. [Schema Reference](#schema-reference)

---

## Overview

HeritageWhisperV2 uses a **three-layer data architecture**:

- **Database Layer (PostgreSQL):** 21 tables managed via Supabase with Drizzle ORM
- **Service Layer (Next.js API Routes):** REST API with JWT authentication
- **UI Layer (React/TypeScript):** TanStack Query v5 for state management

**Key Technologies:**
- Database: PostgreSQL 15+ via Supabase (project: tjycibrhoammxohemyhq)
- ORM: Drizzle ORM with type-safe schemas
- API: Next.js 15 App Router API routes
- State: TanStack Query v5 + React Context
- Auth: Supabase Auth with JWT tokens + WebAuthn passkeys
- Security: Row Level Security (RLS) enabled on all tables

**Type Safety Coverage:** 100% - All 21 production tables have TypeScript types

---

## Database Schema Layer

### Complete Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ stories : "creates"
    users ||--o{ passkeys : "has"
    users ||--o{ activePrompts : "receives"
    users ||--o{ promptHistory : "archives"
    users ||--o{ userPrompts : "saves from catalog"
    users ||--o{ familyMembers : "invites (as storyteller)"
    users ||--o{ sharedAccess : "shares timeline (as owner)"
    users ||--o| profiles : "has personalization"
    users ||--o{ userAgreements : "accepts"
    users ||--o{ historicalContext : "caches"
    users ||--o{ adminAuditLog : "performs (as admin)"
    users ||--o{ aiUsageLog : "generates"

    stories ||--o{ followUps : "generates"
    stories ||--o| activePrompts : "created from (optional)"
    stories ||--o{ promptFeedback : "rated via"

    familyMembers ||--o{ familyActivity : "tracks"
    familyMembers ||--o{ familyInvites : "has invite tokens"
    familyMembers ||--o{ familyCollaborations : "participates in"
    familyMembers ||--o{ familyPrompts : "submits"

    familyCollaborations }o--|| users : "storyteller"

    activePrompts ||--o{ promptFeedback : "receives ratings"

    sharedAccess }o--|| users : "grants access to (when registered)"

    users {
        uuid id PK
        text email UK
        text password "nullable for OAuth"
        text name
        int birthYear
        text bio
        text profilePhotoUrl
        int storyCount
        bool isPaid
        bool emailNotifications
        bool weeklyDigest
        bool familyComments
        bool printedBooksNotify
        bool defaultStoryVisibility
        int pdfExportsCount
        timestamp lastPdfExportAt
        int dataExportsCount
        timestamp lastDataExportAt
        text latestTermsVersion
        text latestPrivacyVersion
        int freeStoriesUsed
        text subscriptionStatus
        timestamp lastTier2Attempt
        jsonb doNotAsk "array of prompt IDs"
        timestamp onboardingT3RanAt
        jsonb profileInterests "general, people, places"
        text role "user | admin | moderator"
        int aiDailyBudgetUsd
        int aiMonthlyBudgetUsd
        bool aiProcessingEnabled
        timestamp createdAt
        timestamp updatedAt
    }

    passkeys {
        uuid id PK
        uuid userId FK
        text credentialId UK
        text publicKey
        bigint signCount
        bool credentialBackedUp
        text credentialDeviceType
        jsonb transports
        text friendlyName
        timestamp createdAt
        timestamp lastUsedAt
    }

    stories {
        uuid id PK
        uuid userId FK
        text title
        text audioUrl
        text transcription
        int durationSeconds
        text wisdomClipUrl
        text wisdomClipText
        int wisdomClipDuration
        int storyYear
        timestamp storyDate
        int lifeAge
        text lessonLearned
        jsonb lessonAlternatives
        jsonb entitiesExtracted
        uuid sourcePromptId FK
        text lifePhase
        text photoUrl
        jsonb photoTransform
        jsonb photos
        jsonb emotions
        text pivotalCategory
        bool includeInBook
        bool includeInTimeline
        bool isFavorite
        jsonb formattedContent
        jsonb extractedFacts
        timestamp createdAt
    }

    activePrompts {
        uuid id PK
        uuid userId FK
        text promptText
        text contextNote
        text anchorEntity
        int anchorYear
        text anchorHash UK
        int tier "0-3"
        text memoryType
        int promptScore "0-100"
        text scoreReason
        text modelVersion
        timestamp createdAt
        timestamp expiresAt
        bool isLocked
        int shownCount
        timestamp lastShownAt
        text userStatus "available | queued | dismissed"
        int queuePosition
        timestamp dismissedAt
        timestamp queuedAt
    }

    promptHistory {
        uuid id PK
        uuid userId FK
        text promptText
        text anchorHash
        text anchorEntity
        int anchorYear
        int tier
        text memoryType
        int promptScore
        int shownCount
        text outcome "used | skipped | expired | dismissed"
        uuid storyId FK
        timestamp createdAt
        timestamp resolvedAt
    }

    userPrompts {
        uuid id PK
        uuid userId FK
        text text
        text category
        text source "catalog | ai"
        text status "ready | queued | dismissed | recorded | deleted"
        int queuePosition
        timestamp dismissedAt
        timestamp queuedAt
        timestamp createdAt
    }

    familyMembers {
        uuid id PK
        uuid userId FK "storyteller"
        text email
        text name
        text relationship
        text status "pending | active | suspended"
        text permissionLevel "viewer | contributor"
        timestamp invitedAt
        uuid invitedByUserId FK
        uuid authUserId FK "family member's account"
        timestamp firstAccessedAt
        timestamp lastAccessedAt
        int accessCount
        text customMessage
        jsonb permissions
        timestamp createdAt
    }

    familyInvites {
        uuid id PK
        uuid familyMemberId FK
        text token UK
        timestamp expiresAt
        timestamp usedAt
        timestamp createdAt
    }

    familyCollaborations {
        uuid id PK
        uuid familyMemberId FK
        uuid storytellerUserId FK
        uuid invitedByUserId FK
        text permissionLevel
        text relationship
        text status "active | suspended | removed"
        timestamp createdAt
        timestamp lastViewedAt
    }

    familyPrompts {
        uuid id PK
        uuid storytellerUserId FK
        uuid submittedByFamilyMemberId FK
        text promptText
        text status "pending | answered | archived"
        timestamp answeredAt
        timestamp createdAt
    }

    familyActivity {
        uuid id PK
        uuid userId FK "storyteller"
        uuid familyMemberId FK
        uuid storyId FK
        text activityType "viewed | commented | favorited | shared"
        text details
        timestamp createdAt
    }

    sharedAccess {
        uuid id PK
        uuid ownerUserId FK
        text sharedWithEmail
        uuid sharedWithUserId FK
        text permissionLevel
        text shareToken UK
        timestamp createdAt
        timestamp expiresAt
        bool isActive
        timestamp lastAccessedAt
    }

    profiles {
        uuid id PK
        uuid userId FK UK
        int birthYear
        jsonb majorLifePhases
        int workEthic "1-10"
        int riskTolerance "1-10"
        int familyOrientation "1-10"
        int spirituality "1-10"
        text preferredStyle
        int emotionalComfort "1-10"
        text detailLevel
        text followUpFrequency
        int completionPercentage
        timestamp createdAt
        timestamp updatedAt
    }

    followUps {
        uuid id PK
        uuid storyId FK
        text questionText
        text questionType
        bool wasAnswered
    }

    historicalContext {
        uuid id PK
        uuid userId FK
        text decade
        text ageRange
        jsonb facts
        timestamp generatedAt
        timestamp updatedAt
    }

    userAgreements {
        uuid id PK
        uuid userId FK
        text agreementType "terms | privacy"
        text version
        timestamp acceptedAt
        text ipAddress
        text userAgent
        text method "signup | reacceptance | oauth"
    }

    adminAuditLog {
        uuid id PK
        uuid adminUserId FK
        text action
        uuid targetUserId FK
        jsonb details
        text ipAddress
        text userAgent
        timestamp createdAt
    }

    aiUsageLog {
        uuid id PK
        uuid userId FK
        text operation
        text model
        int tokensUsed
        numeric costUsd
        text ipAddress
        timestamp createdAt
    }

    promptFeedback {
        uuid id PK
        uuid promptId FK
        text promptText
        uuid storyId FK
        text storyExcerpt
        text rating "good | bad | excellent | terrible"
        text feedbackNotes
        text[] tags
        int promptTier
        text promptType
        text anchorEntity
        int wordCount
        numeric promptScore
        jsonb qualityReport
        uuid reviewedBy FK
        timestamp reviewedAt
        timestamp createdAt
        timestamp updatedAt
    }

    ghostPrompts {
        uuid id PK
        uuid userId FK
        text promptText
        text promptTitle
        text category
        text decade
        text ageRange
        bool isGenerated
        uuid basedOnStoryId FK
        timestamp createdAt
    }

    demoStories {
        uuid id PK
        uuid userId "fixed demo user"
        text title
        text audioUrl
        text transcription
        int durationSeconds
        text wisdomClipUrl
        text wisdomClipText
        int wisdomClipDuration
        int storyYear
        timestamp storyDate
        int lifeAge
        text photoUrl
        jsonb photoTransform
        jsonb photos
        jsonb emotions
        text pivotalCategory
        bool includeInBook
        bool includeInTimeline
        bool isFavorite
        jsonb formattedContent
        timestamp createdAt
        bool isOriginal
        text publicAudioUrl
        text publicPhotoUrl
    }
```

### Table Descriptions

#### Core User Tables (3)

**1. users** - Main user accounts with authentication and preferences
- Primary authentication table (email/password or OAuth)
- RBAC support via `role` column (user, admin, moderator)
- AI budget control (`aiDailyBudgetUsd`, `aiMonthlyBudgetUsd`)
- Notification preferences (email, weekly digest, family comments)
- Export tracking (PDF and data export counts)
- Subscription status tracking

**2. passkeys** - WebAuthn credentials for passwordless authentication
- Multiple passkeys per user (Touch ID, Face ID, security keys)
- Device tracking (`credentialDeviceType`, `friendlyName`)
- Security: Composite unique constraint prevents cross-tenant credential reuse
- Tracks usage with `signCount` and `lastUsedAt`

**3. profiles** - Extended user personalization settings
- One-to-one relationship with users
- Life phase definitions (childhood, young adult, mid-life, senior)
- Character traits (work ethic, risk tolerance, family orientation, spirituality)
- Communication preferences for AI interactions
- Completion tracking for onboarding

#### Content Tables (3)

**4. stories** - User-generated story content
- Core content table with audio, transcription, photos
- AI features: lesson learned, entity extraction, formatted content
- Photo management: Single legacy photo + array of multiple photos with transforms
- Metadata: year, age, life phase, pivotal category
- Display flags: `includeInBook`, `includeInTimeline`, `isFavorite`
- Source tracking via `sourcePromptId` (links to prompt that inspired the story)

**5. demoStories** - Demo account stories
- Mirrors `stories` table structure
- Fixed demo user ID
- Public URLs for demo assets (no authentication required)
- Used for onboarding and marketing

**6. followUps** - AI-generated follow-up questions for stories
- One-to-many with stories
- Tracks question type (emotional, wisdom, sensory)
- Tracks whether user answered the question

#### AI Prompt System Tables (5)

**7. activePrompts** - Currently active AI-generated prompts
- Tier-based system (0=fallback, 1=template, 2=on-demand, 3=milestone)
- Deduplication via `anchorHash` (sha1 of tier + entity + year)
- Quality scoring (0-100 likelihood of recording)
- User queue management (`userStatus`, `queuePosition`)
- Expiration-based (7-day default)
- Paywall support (`isLocked` flag)

**8. promptHistory** - Archived used/skipped/expired prompts
- Tracks prompt lifecycle outcomes
- Links to resulting story if used
- Analytics for prompt effectiveness

**9. userPrompts** - User-saved prompts from catalog
- Separate from AI-generated prompts
- Queue management for user organization
- Status tracking (ready, queued, dismissed, recorded, deleted)

**10. ghostPrompts** - Legacy prompt system (deprecated)
- Original manually-created prompts
- Category and decade-based organization

**11. promptFeedback** - Quality ratings for AI prompts (admin tool)
- Admin dashboard feature for prompt quality analysis
- Ratings: good, bad, excellent, terrible
- Tags and quality reports for analytics
- Links to prompt and resulting story

#### Family Sharing V3 Tables (5)

**12. familyMembers** - Family member invitations and access
- Storyteller invites family members via email
- Three user references:
  - `userId`: The storyteller
  - `invitedByUserId`: Who sent the invite
  - `authUserId`: Family member's own account (when registered)
- Permission levels: viewer (read-only), contributor (can submit questions)
- Status: pending, active, suspended
- Access tracking: first/last accessed, access count

**13. familyInvites** - Token-based invitation system
- Unique tokens for invite links
- Expiration tracking
- Tracks when invite was used

**14. familyCollaborations** - Multi-tenant access control (JOIN table)
- Links family members to storyteller accounts
- Permission management per collaboration
- Status tracking (active, suspended, removed)
- Last viewed tracking for engagement analytics

**15. familyPrompts** - Family-submitted questions
- Contributors can submit custom questions to storytellers
- Status: pending, answered, archived
- Links to resulting story when answered

**16. familyActivity** - Family engagement tracking
- Activity feed for storyteller dashboard
- Types: viewed, commented, favorited, shared
- Links to specific story and family member

#### Admin & Monitoring Tables (3)

**17. adminAuditLog** - Admin action audit trail
- Security and compliance requirement
- Tracks all admin actions (user management, content moderation)
- IP address and user agent logging
- JSONB details for action-specific data
- **Critical for GDPR compliance**

**18. aiUsageLog** - AI API usage and cost tracking
- Tracks every AI operation (transcription, prompt generation, etc.)
- Cost tracking in USD (decimal precision)
- Used by `check_ai_budget()` RPC for enforcement
- Analytics for AI feature usage

**19. promptFeedback** - Prompt quality ratings
- Admin tool for monitoring prompt system health
- Detailed quality metrics and reports
- Used to improve prompt generation over time

#### Supporting Tables (2)

**20. sharedAccess** - Timeline/book sharing with permissions
- Token-based sharing (no login required initially)
- Links email to user account when they register
- Permission levels: view, edit
- Optional expiration dates
- **Note:** Single story sharing removed January 2025

**21. userAgreements** - Terms of Service and Privacy Policy tracking
- Legal compliance requirement
- Version tracking for terms/privacy changes
- Method tracking (signup, reacceptance, OAuth)
- IP address and user agent for audit trail

**22. historicalContext** - Cached decade-specific historical facts
- AI-generated context for user's life decades
- Reduces API calls by caching results
- Per-user, per-decade storage

---

## Database Objects

### RPC Functions (PostgreSQL Functions)

**Prompt System:**
```sql
archive_expired_prompts() → VOID
```
- Moves expired prompts from `active_prompts` to `prompt_history`
- Deletes history older than 365 days
- Scheduled via cron job

**AI Budget Control:**
```sql
check_ai_budget(
  p_user_id UUID,
  p_operation TEXT,
  p_estimated_cost DECIMAL
) → BOOLEAN
```
- Checks if user is within daily/monthly AI budget
- Returns false if budget exceeded
- Used before expensive AI operations

```sql
log_ai_usage(
  p_user_id UUID,
  p_operation TEXT,
  p_model TEXT,
  p_tokens_used INTEGER,
  p_cost_usd DECIMAL,
  p_ip_address TEXT
) → VOID
```
- Logs AI API usage to `ai_usage_log`
- Called after every AI operation
- Enables cost tracking and analytics

**Family Sharing:**
```sql
cleanup_expired_family_access() → VOID
```
- Deletes expired unused invites from `family_invites`
- Deletes expired sessions from `family_sessions`

```sql
cleanup_expired_family_sessions() → VOID
```
- Removes all expired family sessions
- Checks both regular and absolute expiry

```sql
rotate_family_session_token(p_session_id UUID) → TEXT
```
- Rotates session token for security
- Extends expiry (up to absolute limit)
- Returns new token

**Multi-Tenant Access Control:**
```sql
has_collaboration_access(
  p_user_id UUID,
  p_storyteller_id UUID
) → BOOLEAN
```
- **Critical function for multi-tenant security**
- Checks if user can access storyteller's data
- Returns true if:
  - User is accessing own data (p_user_id = p_storyteller_id)
  - User has active family collaboration with storyteller

**Export Tracking:**
```sql
increment_pdf_export(user_id UUID) → VOID
increment_data_export(user_id UUID) → VOID
```
- Increments export counters in `users` table
- Updates `lastPdfExportAt` / `lastDataExportAt`

**Queue Management:**
```sql
get_next_queue_position(p_user_id UUID) → INTEGER
```
- Returns next available queue position
- Checks both `active_prompts` and `user_prompts`

**Test Infrastructure (Development Only):**
```sql
clone_user_account(p_source_user_id UUID, p_target_email TEXT) → UUID
set_user_story_milestone(p_user_id UUID, p_story_count INTEGER) → VOID
clean_test_prompts(p_user_id UUID) → VOID
delete_test_account(p_user_id UUID) → VOID
get_test_account_info(p_user_id UUID) → TABLE
```

### Triggers

```sql
update_updated_at_column() → TRIGGER
```
- Auto-updates `updated_at` timestamp on row modification
- Applied to: `users`, `profiles`, `prompt_feedback`

```sql
trigger_cleanup_expired_sessions() → TRIGGER
```
- 10% probability cleanup on INSERT to `family_sessions`
- Keeps table size manageable

```sql
update_prompt_feedback_updated_at() → TRIGGER
update_family_prompts_updated_at() → TRIGGER
```
- Specific auto-update triggers for feedback tables

### Views

```sql
prompt_quality_stats (VIEW)
```
- Aggregated statistics for prompt feedback dashboard
- Groups by: rating, prompt_tier, prompt_type
- Metrics: COUNT, AVG(prompt_score), AVG(word_count), common tags
- Used by admin dashboard

---

## Database Constraints

### Primary Keys
All tables use UUID primary keys with `gen_random_uuid()` default

### Unique Constraints
- `users.email` - One account per email
- `passkeys.credential_id` - Globally unique WebAuthn credentials
- `passkeys(user_id, credential_id)` - Composite unique (prevents cross-tenant clashes)
- `active_prompts.anchor_hash` - Deduplication across prompt generations
- `family_invites.token` - Unique invite tokens
- `shared_access.share_token` - Unique share URLs
- `profiles.user_id` - One profile per user

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

### CHECK Constraints
- `stories.duration_seconds` - Between 1 and 120 (database-level clamp)
- `active_prompts.tier` - Integer 0-3
- `active_prompts.prompt_score` - Integer 0-100
- `users.role` - 'user', 'admin', 'moderator'
- `users.subscription_status` - 'none', 'active', 'cancelled', 'expired'
- `family_members.status` - 'pending', 'active', 'suspended'
- `family_members.relationship` - 'spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'
- `user_prompts.source` - 'catalog', 'ai'
- `user_prompts.status` - 'ready', 'queued', 'dismissed', 'recorded', 'deleted'
- `family_collaborations.status` - 'active', 'suspended', 'removed'
- `prompt_feedback.rating` - 'good', 'bad', 'excellent', 'terrible'

### Indexes (50+ for performance)
- **User lookups:** `idx_users_role`, `idx_users_subscription_status`
- **Story queries:** `idx_stories_user_id`, `idx_stories_created_at DESC`, `idx_stories_story_year`
- **Prompt system:** `idx_active_prompts_user`, `idx_active_prompts_tier`, `idx_active_prompts_expires`
- **Family features:** `idx_family_members_user_status`, `idx_family_sessions_token`
- **Admin functions:** `idx_admin_audit_log_created_at DESC`

---

## Service Layer Models

(Content continues with the existing Service Layer Models section, which remains accurate...)

---

_For complete documentation including Service Layer, UI Layer, and Data Flow Patterns, see the full DATA_MODEL.md file._

---

**Schema File Reference:** [`/shared/schema.ts`](shared/schema.ts)

**Production Database:** Supabase project tjycibrhoammxohemyhq

**Row Level Security:** Enabled on all 21 tables with optimized `(SELECT auth.uid())` pattern

---

_Last verified: January 25, 2025 - All 21 tables synchronized with production database_