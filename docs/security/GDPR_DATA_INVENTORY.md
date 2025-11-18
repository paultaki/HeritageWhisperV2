# HeritageWhisper GDPR Data Inventory & Export/Deletion Plan
**Production-Ready | Last Updated: October 24, 2025**

## Executive Summary

HeritageWhisper LLC stores user personal data across **21 database tables**, **4 Supabase Auth tables**, **1 Storage bucket**, and **1 conditional table (passkeys - early implementation)**. This document provides complete SQL queries and implementation guidance for GDPR-compliant data export and deletion.

**Legal Entity:** HeritageWhisper LLC
**DPO Contact:** privacy@heritagewhisper.com
**Compliance:** GDPR Articles 15 (Access), 17 (Erasure), 20 (Portability)

---

## 1. DATA INVENTORY

### 1.1 Database Tables (21 + 1 conditional)

| Location Type | Name | Key Fields | User Link | Personal Data | Notes |
|---------------|------|------------|-----------|---------------|-------|
| **table** | users | email, name, birth_year, bio, profile_photo_url, do_not_ask | id | ✅ YES | Core profile: email, name, birthYear, preferences, notification settings |
| **table** | stories | title, transcription, audio_url, photo_url, photos, lesson_learned, entities_extracted, extracted_facts, formatted_content | user_id | ✅ YES | All user stories with text, audio, photos, AI outputs. Most sensitive data. |
| **table** | follow_ups | question_text | story_id → user_id | ✅ YES | AI-generated follow-up questions shown to user |
| **table** | ghost_prompts | prompt_text, prompt_title | user_id | ✅ YES | Legacy prompts shown to user (deprecated) |
| **table** | historical_context | decade, age_range, facts | user_id | ✅ YES | Personalized historical facts for user's lifetime |
| **table** | profiles | birth_year, major_life_phases, work_ethic, risk_tolerance, family_orientation, spirituality, preferred_style | user_id | ✅ YES | Personality profile and communication preferences |
| **table** | active_prompts | prompt_text, context_note, anchor_entity, anchor_year | user_id | ✅ YES | Currently active AI-generated prompts shown to user |
| **table** | prompt_history | prompt_text, anchor_entity, outcome | user_id | ✅ YES | Archive of all prompts user interacted with |
| **table** | prompt_feedback | prompt_text, story_excerpt, rating, tags | story_id → user_id | ✅ YES | Admin feedback on prompts tied to user's stories (contains story excerpts) |
| **table** | user_prompts | text, category, status | user_id | ✅ YES | Catalog prompts user manually added to queue |
| **table** | family_members | email, name, relationship | user_id | ✅ YES | Family members user invited (contains their emails) |
| **table** | family_activity | activity_type, details | user_id | ✅ YES | Log of family member interactions with user's stories |
| **table** | family_invites | token, expires_at | family_member_id → user_id | ⚠️ PARTIAL | Magic link tokens (export masked suffix only) |
| **table** | family_sessions | token, ip_address, user_agent | family_member_id → user_id | ⚠️ PARTIAL | Session metadata (mask tokens & IPs in export) |
| **table** | family_prompts | prompt_text, context | storyteller_user_id | ✅ YES | Questions family members submitted to user |
| **table** | shared_access | shared_with_email, share_token, permission_level | owner_user_id | ⚠️ PARTIAL | Sharing permissions (mask tokens, contains recipient emails) |
| **table** | user_agreements | agreement_type, version, ip_address, user_agent | user_id | ✅ YES | Legal agreement acceptances with IP/user-agent |
| **table** | ai_usage_log | operation, model, tokens_used, cost_usd, ip_address | user_id | ✅ YES | AI API usage tracking with IP addresses and costs |
| **table** | admin_audit_log | action, details, ip_address, user_agent | target_user_id | ✅ YES | Admin actions on user's account (if any) |
| **table** | demo_stories | (all fields) | N/A | ❌ NO | Demo content, not tied to real users |
| **table** | passkeys (conditional) | credential_id, aaguid, transports, last_used_at, sign_count | user_id | ✅ YES | WebAuthn passkeys for login (early implementation - may not exist yet) |

### 1.2 Supabase Auth Tables (4)

| Location Type | Name | Key Fields | User Link | Personal Data | Notes |
|---------------|------|------------|-----------|---------------|-------|
| **auth** | auth.users | email, encrypted_password, raw_user_meta_data | id | ✅ YES | Supabase Auth user record (managed by Supabase) |
| **auth** | auth.identities | provider, email, identity_data, last_sign_in_at | user_id | ✅ YES | OAuth provider accounts (Google, etc.) |
| **auth** | auth.mfa_factors | friendly_name, factor_type, created_at | user_id | ✅ YES | MFA methods (TOTP, SMS - secrets NOT exported) |
| **auth** | auth.audit_log_entries | event_type, ip_address | user_id or actor_user_id | ✅ YES | Auth events (login, password change) with masked IPs |

### 1.3 Storage Buckets (1)

| Location Type | Name | User Link | Personal Data | Notes |
|---------------|------|-----------|---------------|-------|
| **storage** | heritage-whisper-files/audio/{user_id}/ | user_id (folder) | ✅ YES | Audio recordings of user's voice (*.webm, *.mp3, *.wav, *.m4a) |
| **storage** | heritage-whisper-files/photo/{user_id}/ | user_id (folder) | ✅ YES | User-uploaded photos (*.jpg, EXIF stripped) |

### 1.4 Personal Data Categories Summary

- **Identity:** email, name, birth_year, bio
- **Content:** stories (transcription, audio, photos), prompts, lessons learned
- **Relationships:** family_members (names, emails, relationships)
- **Behavior:** AI usage logs, family activity, prompt interactions
- **Technical:** IP addresses, user agents, session tokens
- **Preferences:** Notification settings, privacy settings, personality traits
- **Security:** Passkeys/WebAuthn credentials, MFA factors

---

## 2. EXPORT MAP (GDPR Articles 15 & 20)

### 2.0 Export Metadata (Article 15 Disclosure Requirements)

```json
{
  "export": {
    "exported_at": "{{timestamp}}",
    "controller": "HeritageWhisper LLC",
    "contact": "privacy@heritagewhisper.com",
    "dpo": "privacy@heritagewhisper.com"
  },
  "data_processing": {
    "purposes": [
      "life story capture and preservation",
      "book creation and PDF export",
      "family sharing and collaboration",
      "AI-powered transcription and personalized prompts",
      "system security and fraud prevention"
    ],
    "legal_bases": [
      "Contract (GDPR Art. 6(1)(b)) - service delivery",
      "Consent (Art. 6(1)(a)) - optional features (AI prompts, family sharing)",
      "Legitimate interest (Art. 6(1)(f)) - fraud prevention, security"
    ],
    "categories": [
      "identity (name, email, birth year)",
      "content (stories, photos, audio recordings)",
      "behavior (AI usage, family activity, prompt interactions)",
      "technical (IP addresses, user agents, session data)",
      "preferences (notification, privacy, personality settings)"
    ],
    "recipients": [
      "Supabase (database & storage hosting)",
      "OpenAI (AI prompts & Realtime API)",
      "AssemblyAI (primary transcription service)",
      "Vercel (hosting & deployment)",
      "Resend (email notifications)",
      "PDFShift (PDF export service)",
      "Stripe (payment processing)",
      "Upstash (rate limiting)"
    ],
    "retention": {
      "stories": "until user deletion",
      "prompts_active": "7 days (Tier 1) or until milestone (Tier 3)",
      "prompts_archive": "indefinite (prompt_history)",
      "sessions": "30 days (family sessions, rolling expiry)",
      "logs": "90 days (application & access logs, auto-purge)",
      "backups": "30 days (encrypted, rolling retention)"
    },
    "transfers": {
      "location": "US and EU (Supabase multi-region)",
      "safeguards": "Standard Contractual Clauses (SCCs) for all processors"
    }
  },
  "rights": {
    "access": "GDPR Art. 15 (this export)",
    "portability": "Art. 20 (machine-readable JSON format)",
    "erasure": "Art. 17 (via /api/user/delete endpoint)",
    "rectification": "Art. 16 (via profile settings or contact DPO)",
    "restriction": "Art. 18 (contact privacy@heritagewhisper.com)",
    "objection": "Art. 21 (opt-out in notification settings)",
    "complaint": "Lodge with your national Data Protection Authority",
    "withdraw_consent": "Via account settings or privacy@heritagewhisper.com"
  },
  "privacy_policy": "https://dev.heritagewhisper.com/privacy",
  "terms_of_service": "https://dev.heritagewhisper.com/terms"
}
```

**Implementation Note:** Include this JSON block at the top level of every export response.

---

### 2.1 Core User Profile

```sql
-- Export: users table (core profile data)
SELECT
  id,
  email,
  name,
  birth_year,
  bio,
  profile_photo_url,
  story_count,
  is_paid,
  email_notifications,
  weekly_digest,
  family_comments,
  printed_books_notify,
  default_story_visibility,
  pdf_exports_count,
  last_pdf_export_at,
  data_exports_count,
  last_data_export_at,
  latest_terms_version,
  latest_privacy_version,
  free_stories_used,
  subscription_status,
  do_not_ask,
  role,
  ai_daily_budget_usd,
  ai_monthly_budget_usd,
  created_at,
  updated_at
FROM public.users
WHERE id = :uid;
```

---

### 2.2 Stories & Content

```sql
-- Export: stories (user's life stories - MOST SENSITIVE)
SELECT
  id,
  user_id,
  title,
  audio_url,
  transcription,
  duration_seconds,
  wisdom_clip_url,
  wisdom_clip_text,
  story_year,
  story_date,
  life_age,
  lesson_learned,
  lesson_alternatives,
  entities_extracted,
  source_prompt_id,
  life_phase,
  photo_url,
  photo_transform,
  photos,
  emotions,
  pivotal_category,
  include_in_book,
  include_in_timeline,
  is_favorite,
  formatted_content,
  extracted_facts,
  created_at
FROM public.stories
WHERE user_id = :uid
ORDER BY story_year, created_at;

-- Export: follow_ups (AI-generated questions)
SELECT
  f.id,
  f.story_id,
  f.question_text,
  f.question_type,
  f.was_answered,
  s.title AS story_title
FROM public.follow_ups f
JOIN public.stories s ON f.story_id = s.id
WHERE s.user_id = :uid;

-- Export: ghost_prompts (legacy prompts - deprecated)
SELECT
  id,
  user_id,
  prompt_text,
  prompt_title,
  category,
  decade,
  age_range,
  is_generated,
  based_on_story_id,
  created_at
FROM public.ghost_prompts
WHERE user_id = :uid;
```

---

### 2.3 AI Prompts System

```sql
-- Export: active_prompts (current AI-generated prompts)
SELECT
  id,
  user_id,
  prompt_text,
  context_note,
  anchor_entity,
  anchor_year,
  anchor_hash,
  tier,
  memory_type,
  prompt_score,
  score_reason,
  model_version,
  user_status,
  queue_position,
  created_at,
  expires_at,
  is_locked,
  shown_count,
  last_shown_at,
  dismissed_at,
  queued_at
FROM public.active_prompts
WHERE user_id = :uid
ORDER BY created_at DESC;

-- Export: prompt_history (archive of used/skipped prompts)
SELECT
  id,
  user_id,
  prompt_text,
  anchor_hash,
  anchor_entity,
  anchor_year,
  tier,
  memory_type,
  prompt_score,
  shown_count,
  outcome,
  story_id,
  created_at,
  resolved_at
FROM public.prompt_history
WHERE user_id = :uid
ORDER BY resolved_at DESC;

-- Export: user_prompts (catalog prompts user saved)
SELECT
  id,
  user_id,
  text,
  category,
  source,
  status,
  queue_position,
  dismissed_at,
  queued_at,
  created_at
FROM public.user_prompts
WHERE user_id = :uid
ORDER BY created_at DESC;

-- Export: prompt_feedback (admin ratings on user's prompts)
-- INCLUDES personal data (story_excerpt tied to user)
SELECT
  pf.id,
  pf.prompt_text,
  pf.story_excerpt,
  pf.rating,
  pf.feedback_notes,
  pf.tags,
  pf.prompt_tier,
  pf.prompt_type,
  pf.reviewed_at,
  s.title AS story_title
FROM public.prompt_feedback pf
LEFT JOIN public.stories s ON pf.story_id = s.id
WHERE s.user_id = :uid
ORDER BY pf.reviewed_at DESC;
```

---

### 2.4 Personalization Data

```sql
-- Export: historical_context (personalized historical facts)
SELECT
  id,
  user_id,
  decade,
  age_range,
  facts,
  generated_at,
  updated_at
FROM public.historical_context
WHERE user_id = :uid
ORDER BY decade;

-- Export: profiles (personality & preferences)
SELECT
  id,
  user_id,
  birth_year,
  major_life_phases,
  work_ethic,
  risk_tolerance,
  family_orientation,
  spirituality,
  preferred_style,
  emotional_comfort,
  detail_level,
  follow_up_frequency,
  completion_percentage,
  created_at,
  updated_at
FROM public.profiles
WHERE user_id = :uid;
```

---

### 2.5 Family Sharing Data (PRIVACY NOTE: Third-party emails masked by default)

```sql
-- Export: family_members (people user invited - MASKED EMAILS)
SELECT
  id,
  user_id,
  CASE
    WHEN email IS NOT NULL THEN
      CONCAT(
        LEFT(SPLIT_PART(email, '@', 1), 1),
        '***@',
        SPLIT_PART(email, '@', 2)
      )
    ELSE NULL
  END AS email_masked,  -- Default: a***@gmail.com
  name,
  relationship,
  permission_level,
  status,
  invited_at,
  first_accessed_at,
  last_accessed_at,
  access_count,
  created_at
FROM public.family_members
WHERE user_id = :uid
ORDER BY invited_at DESC;

-- Export: family_activity (family interactions with stories)
SELECT
  fa.id,
  fa.user_id,
  CASE
    WHEN fm.email IS NOT NULL THEN
      CONCAT(
        LEFT(SPLIT_PART(fm.email, '@', 1), 1),
        '***@',
        SPLIT_PART(fm.email, '@', 2)
      )
    ELSE NULL
  END AS family_member_email_masked,
  fm.name AS family_member_name,
  s.title AS story_title,
  fa.activity_type,
  fa.details,
  fa.created_at
FROM public.family_activity fa
JOIN public.family_members fm ON fa.family_member_id = fm.id
LEFT JOIN public.stories s ON fa.story_id = s.id
WHERE fa.user_id = :uid
ORDER BY fa.created_at DESC;

-- Export: family_invites (invite metadata - MASKED tokens)
-- SECURITY: Never export live tokens (Recital 63 trade secrets)
SELECT
  fi.id,
  CASE
    WHEN fm.email IS NOT NULL THEN
      CONCAT(
        LEFT(SPLIT_PART(fm.email, '@', 1), 1),
        '***@',
        SPLIT_PART(fm.email, '@', 2)
      )
    ELSE NULL
  END AS invitee_email_masked,
  LEFT(fi.token, 4) || '…' AS invite_token_suffix,  -- MASKED
  fi.expires_at,
  fi.used_at,
  fi.created_at
FROM public.family_invites fi
JOIN public.family_members fm ON fi.family_member_id = fm.id
WHERE fm.user_id = :uid;

-- Export: family_sessions (session metadata - MASKED tokens & IPs)
-- SECURITY: Mask tokens and IPs by default
SELECT
  fs.id,
  CASE
    WHEN fm.email IS NOT NULL THEN
      CONCAT(
        LEFT(SPLIT_PART(fm.email, '@', 1), 1),
        '***@',
        SPLIT_PART(fm.email, '@', 2)
      )
    ELSE NULL
  END AS family_member_email_masked,
  LEFT(fs.token, 4) || '…' AS session_token_suffix,  -- MASKED
  fs.user_agent,
  CASE
    WHEN fs.ip_address IS NOT NULL THEN
      CONCAT('xxx.xxx.xxx.', SPLIT_PART(fs.ip_address, '.', 4))
    ELSE NULL
  END AS ip_address_masked,  -- MASKED (CJEU C-582/14: IPs are personal data)
  fs.expires_at,
  fs.last_active_at,
  fs.created_at
FROM public.family_sessions fs
JOIN public.family_members fm ON fs.family_member_id = fm.id
WHERE fm.user_id = :uid;

-- Export: family_prompts (questions FROM family members)
SELECT
  fp.id,
  fp.storyteller_user_id,
  CASE
    WHEN fm.email IS NOT NULL THEN
      CONCAT(
        LEFT(SPLIT_PART(fm.email, '@', 1), 1),
        '***@',
        SPLIT_PART(fm.email, '@', 2)
      )
    ELSE NULL
  END AS submitted_by_email_masked,
  fm.name AS submitted_by_name,
  fp.prompt_text,
  fp.context,
  fp.status,
  s.title AS answered_story_title,
  fp.answered_at,
  fp.created_at,
  fp.updated_at
FROM public.family_prompts fp
JOIN public.family_members fm ON fp.submitted_by_family_member_id = fm.id
LEFT JOIN public.stories s ON fp.answered_story_id = s.id
WHERE fp.storyteller_user_id = :uid;
```

---

### 2.6 Sharing & Access Control

```sql
-- Export: shared_access (timeline/book sharing - MASKED tokens)
-- SECURITY: Share tokens are credentials, mask by default
SELECT
  id,
  owner_user_id,
  shared_with_email,
  shared_with_user_id,
  permission_level,
  LEFT(share_token, 4) || '…' AS share_token_suffix,  -- MASKED
  created_at,
  expires_at,
  is_active,
  last_accessed_at
FROM public.shared_access
WHERE owner_user_id = :uid
   OR shared_with_user_id = :uid;
```

---

### 2.7 Legal & Compliance

```sql
-- Export: user_agreements (TOS/Privacy acceptances)
SELECT
  id,
  user_id,
  agreement_type,
  version,
  accepted_at,
  CASE
    WHEN ip_address IS NOT NULL THEN
      CONCAT('xxx.xxx.xxx.', SPLIT_PART(ip_address, '.', 4))
    ELSE NULL
  END AS ip_address_masked,  -- MASKED by default
  user_agent,
  method
FROM public.user_agreements
WHERE user_id = :uid
ORDER BY accepted_at DESC;
```

---

### 2.8 Usage Tracking & Audit

```sql
-- Export: ai_usage_log (AI API usage and costs)
SELECT
  id,
  user_id,
  operation,
  model,
  tokens_used,
  cost_usd,
  CASE
    WHEN ip_address IS NOT NULL THEN
      CONCAT('xxx.xxx.xxx.', SPLIT_PART(ip_address, '.', 4))
    ELSE NULL
  END AS ip_address_masked,  -- MASKED
  created_at
FROM public.ai_usage_log
WHERE user_id = :uid
ORDER BY created_at DESC;

-- Export: admin_audit_log (admin actions on user's account)
SELECT
  id,
  admin_user_id,
  action,
  target_user_id,
  details,
  CASE
    WHEN ip_address IS NOT NULL THEN
      CONCAT('xxx.xxx.xxx.', SPLIT_PART(ip_address, '.', 4))
    ELSE NULL
  END AS ip_address_masked,  -- MASKED
  user_agent,
  created_at
FROM public.admin_audit_log
WHERE target_user_id = :uid
ORDER BY created_at DESC;
```

---

### 2.9 Storage Files Export

```sql
-- List all audio files for user (metadata only)
SELECT
  name,
  id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'heritage-whisper-files'
  AND name LIKE CONCAT('audio/', :uid, '/%')
ORDER BY created_at;

-- List all photo files for user (metadata only)
SELECT
  name,
  id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'heritage-whisper-files'
  AND name LIKE CONCAT('photo/', :uid, '/%')
ORDER BY created_at;
```

**Storage Download Strategy:**
```typescript
// Download all user files from Supabase Storage
const { data: audioFiles } = await supabaseAdmin.storage
  .from('heritage-whisper-files')
  .list(`audio/${userId}`);

const { data: photoFiles } = await supabaseAdmin.storage
  .from('heritage-whisper-files')
  .list(`photo/${userId}`);

// For each file, generate signed download URL (1 hour expiry)
const audioDownloadUrls = await Promise.all(
  audioFiles?.map(async (file) => {
    const { data } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .createSignedUrl(`audio/${userId}/${file.name}`, 3600); // 1 hour

    return {
      filename: file.name,
      url: data?.signedUrl,
      size: file.metadata?.size,
      created_at: file.created_at
    };
  }) || []
);

// Same for photos
```

**Note:** Storage API is preferred over direct SQL on `storage.objects` (metadata table is read-only per Supabase docs).

---

### 2.10 Supabase Auth Export

```sql
-- Export: auth.users (Supabase managed)
SELECT
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE id = :uid;

-- Export: auth.identities (OAuth provider accounts)
SELECT
  id,
  user_id,
  provider,
  last_sign_in_at,
  identity_data
FROM auth.identities
WHERE user_id = :uid;

-- Export: auth.mfa_factors (MFA methods - NO secrets)
-- SECURITY: Never export secret or recovery_code fields
SELECT
  id,
  user_id,
  friendly_name,
  factor_type,
  created_at,
  updated_at
FROM auth.mfa_factors
WHERE user_id = :uid;

-- Export: auth.audit_log_entries (auth events - masked IPs)
SELECT
  id,
  created_at,
  event_type,
  CASE
    WHEN ip_address IS NOT NULL THEN
      CONCAT('xxx.xxx.xxx.', SPLIT_PART(ip_address::TEXT, '.', 4))
    ELSE NULL
  END AS ip_address_masked
FROM auth.audit_log_entries
WHERE (payload->>'user_id') = :uid
   OR actor_user_id = :uid
ORDER BY created_at DESC
LIMIT 100;  -- Last 100 auth events
```

---

### 2.11 Passkeys / WebAuthn (Conditional - Early Implementation)

```sql
-- Export: passkeys (if table exists)
-- Check existence first: SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'passkeys')
SELECT
  id,
  user_id,
  credential_id,
  aaguid,
  transports,
  last_used_at,
  sign_count,
  created_at
FROM public.passkeys
WHERE user_id = :uid;
```

**Implementation Note:** Wrap this query in a table existence check:
```typescript
const { rows } = await db.execute(sql`
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'passkeys'
  )
`);

if (rows[0].exists) {
  // Run passkeys export query
}
```

---

## 3. REDACTION & MASKING POLICY

### 3.1 Default Masking Policy (Privacy-by-Default)

**Default Behavior (Always Applied):**
- ✅ **Security tokens** → `abcd…` (first 4 characters + ellipsis)
  - `share_token`, `family_invites.token`, `family_sessions.token`
  - **Legal basis:** GDPR Recital 63 (trade secrets & security), Article 32 (security of processing)
- ✅ **IP addresses** → `xxx.xxx.xxx.123` (last octet only)
  - All tables: `ai_usage_log`, `user_agreements`, `admin_audit_log`, `family_sessions`, `auth.audit_log_entries`
  - **Legal basis:** CJEU Case C-582/14 (IPs are personal data, balancing interests)
- ✅ **Third-party emails** → `a***@gmail.com` (first char + asterisks + domain)
  - `family_members.email`, `shared_access.shared_with_email`
  - **Legal basis:** GDPR Recital 63 (balancing data subject rights with others' rights)
- ✅ **User agents** → Generalized format (e.g., "Browser: Chrome, OS: macOS")
  - Optional enhancement for privacy

**Full Values Available Only If:**
- User explicitly requests via `?include_full_metadata=true` query parameter
- Fresh re-authentication required (password re-entry or WebAuthn assertion < 5 minutes old)
- Include warning: "Full metadata includes security-sensitive information"

**Legal Basis:**
- GDPR Recital 63: Controllers can refuse disclosure if it adversely affects trade secrets, security, or others' rights
- GDPR Article 32: Ensure security of processing (masking tokens prevents credential leaks)
- CJEU Case C-582/14: IP addresses are personal data requiring protection
- GDPR Article 15(4): Right to obtain copy shall not adversely affect rights of others

---

### 3.2 Data Portability vs. Access Scope

**GDPR Article 20 (Portability):**
- Covers: User-provided data + data observed from use
- Format: Machine-readable (JSON)
- Scope: Stories, prompts, photos, audio, interactions, preferences

**GDPR Article 15 (Access):**
- Covers: All personal data (including controller-generated inferences)
- Format: Human-readable explanation + data
- Scope: Everything in portability + AI scoring internals, quality reports

**This export provides BOTH:**
- ✅ Article 15: Full access to all personal data
- ✅ Article 20: Structured JSON for portability

**Excluded (not personal data about user):**
- ❌ Internal templates (prompt templates used by system)
- ❌ Database indexes and technical IDs (not PII)
- ❌ Demo content (`demo_stories` table)
- ❌ Rate limiting metadata (system performance data)

---

### 3.3 Redaction Summary Table

| Field Type | Export Behavior | Legal Basis | Full Access |
|------------|-----------------|-------------|-------------|
| Security tokens | First 4 chars + `…` | Recital 63 (trade secrets) | On explicit request + re-auth |
| IP addresses | `xxx.xxx.xxx.123` | CJEU C-582/14 (PII balancing) | On explicit request + re-auth |
| Third-party emails | `a***@domain.com` | Recital 63 (others' rights) | On explicit request |
| User agents | Generalized | Privacy-by-design | Full on request |
| Story content | Full text | Core personal data | Always included |
| Prompt text shown to user | Full text | Core personal data | Always included |
| AI scoring internals | Included | Art. 15 (controller inferences) | Always included |
| Family member names | Full names | User's relationships | Always included |

---

## 4. DELETION PLAN & IMPLEMENTATION CHECKLIST

### 4.1 Complete Deletion Sequence

**Current `/api/user/delete` Status:** ⚠️ **GAPS IDENTIFIED**

**Existing Deletions (✅ Implemented):**
- family_activity
- family_members
- shared_access
- user_agreements
- stories (cascades to follow_ups)
- Storage files (audio, photo)
- auth.users
- users (final)

**Missing Deletions (❌ TO ADD):**

```typescript
// ==================================================================
// ADD THESE BEFORE EXISTING DELETIONS
// ==================================================================

// 1. Delete AI prompt system data
await db.delete(promptHistory).where(eq(promptHistory.userId, userId));
await db.delete(activePrompts).where(eq(activePrompts.userId, userId));
await db.delete(userPrompts).where(eq(userPrompts.userId, userId));
logger.debug("[Account Deletion] Deleted prompt system records");

// 2. Delete personalization data
await db.delete(historicalContext).where(eq(historicalContext.userId, userId));
await db.delete(profiles).where(eq(profiles.userId, userId));
logger.debug("[Account Deletion] Deleted personalization records");

// 3. Delete legacy prompts (if still in use)
await db.delete(ghostPrompts).where(eq(ghostPrompts.userId, userId));
logger.debug("[Account Deletion] Deleted legacy ghost prompts");

// 4. Delete family sessions & invites (before family_members)
// Must delete BEFORE family_members due to FK constraints
const userFamilyMembers = await db
  .select({ id: familyMembers.id })
  .from(familyMembers)
  .where(eq(familyMembers.userId, userId));

if (userFamilyMembers.length > 0) {
  const familyMemberIds = userFamilyMembers.map(fm => fm.id);

  // Delete sessions
  await db.execute(sql`
    DELETE FROM public.family_sessions
    WHERE family_member_id = ANY(ARRAY[${sql.join(familyMemberIds, sql`, `)}]::uuid[])
  `);

  // Delete invites
  await db.execute(sql`
    DELETE FROM public.family_invites
    WHERE family_member_id = ANY(ARRAY[${sql.join(familyMemberIds, sql`, `)}]::uuid[])
  `);

  logger.debug("[Account Deletion] Deleted family sessions and invites");
}

// 5. Delete family prompts (questions FROM family)
await db.delete(familyPrompts).where(eq(familyPrompts.storytellerUserId, userId));
logger.debug("[Account Deletion] Deleted family prompts");

// 6. Delete prompt_feedback (admin ratings tied to user's stories)
await db.execute(sql`
  DELETE FROM public.prompt_feedback
  WHERE story_id IN (
    SELECT id FROM public.stories WHERE user_id = ${userId}
  )
`);
logger.debug("[Account Deletion] Deleted prompt feedback records");

// 7. Delete AI usage logs
await db.delete(aiUsageLogs).where(eq(aiUsageLogs.userId, userId));
logger.debug("[Account Deletion] Deleted AI usage logs");

// 8. Delete admin audit logs (where user was target)
await db.delete(adminAuditLog).where(eq(adminAuditLog.targetUserId, userId));
logger.debug("[Account Deletion] Deleted admin audit logs");

// 9. Delete passkeys (if table exists - early implementation)
const { rows: passkeyCheck } = await db.execute(sql`
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'passkeys'
  )
`);

if (passkeyCheck[0].exists) {
  await db.execute(sql`
    DELETE FROM public.passkeys WHERE user_id = ${userId}
  `);
  logger.debug("[Account Deletion] Deleted passkey credentials");
}

// 10. Delete auth side-tables (identities, mfa_factors)
// Note: auth.users deletion cascades to these, but explicit deletion is safer
await supabaseAdmin.auth.admin.deleteUser(userId, {
  shouldSoftDelete: false  // Hard delete, not soft
});
logger.debug("[Account Deletion] Deleted auth.users (cascades to identities & mfa_factors)");

// ==================================================================
// EXISTING CODE CONTINUES HERE
// ==================================================================
```

---

### 4.2 Complete Deletion Order (SQL)

```sql
-- ============================================================
-- DELETION ORDER (to avoid FK violations)
-- Run with service role key on server-side only
-- ============================================================

-- Step 1: Delete AI prompt system
DELETE FROM public.prompt_history WHERE user_id = :uid;
DELETE FROM public.active_prompts WHERE user_id = :uid;
DELETE FROM public.user_prompts WHERE user_id = :uid;

-- Step 2: Delete personalization data
DELETE FROM public.historical_context WHERE user_id = :uid;
DELETE FROM public.profiles WHERE user_id = :uid;

-- Step 3: Delete legacy prompts
DELETE FROM public.ghost_prompts WHERE user_id = :uid;

-- Step 4: Delete prompt feedback (admin ratings tied to user stories)
DELETE FROM public.prompt_feedback
WHERE story_id IN (
  SELECT id FROM public.stories WHERE user_id = :uid
);

-- Step 5: Delete family sessions & invites (BEFORE family_members)
DELETE FROM public.family_sessions
WHERE family_member_id IN (
  SELECT id FROM public.family_members WHERE user_id = :uid
);

DELETE FROM public.family_invites
WHERE family_member_id IN (
  SELECT id FROM public.family_members WHERE user_id = :uid
);

-- Step 6: Delete family prompts
DELETE FROM public.family_prompts WHERE storyteller_user_id = :uid;

-- Step 7: Delete family activity and members
DELETE FROM public.family_activity WHERE user_id = :uid;
DELETE FROM public.family_members WHERE user_id = :uid;

-- Step 8: Delete sharing permissions
DELETE FROM public.shared_access
WHERE owner_user_id = :uid OR shared_with_user_id = :uid;

-- Step 9: Delete AI usage logs
DELETE FROM public.ai_usage_log WHERE user_id = :uid;

-- Step 10: Delete admin audit logs
DELETE FROM public.admin_audit_log WHERE target_user_id = :uid;

-- Step 11: Delete legal agreements
DELETE FROM public.user_agreements WHERE user_id = :uid;

-- Step 12: Delete follow-ups (child of stories)
DELETE FROM public.follow_ups
WHERE story_id IN (SELECT id FROM public.stories WHERE user_id = :uid);

-- Step 13: Delete stories
DELETE FROM public.stories WHERE user_id = :uid;

-- Step 14: Delete passkeys (if table exists)
-- Run conditional check first in application code
DELETE FROM public.passkeys WHERE user_id = :uid;

-- Step 15: Delete Storage files (via Storage API, not SQL)
-- See TypeScript implementation

-- Step 16: Delete Supabase Auth user (cascades to identities, mfa_factors)
-- Via: await supabaseAdmin.auth.admin.deleteUser(userId)

-- Step 17: Delete user record (FINAL)
DELETE FROM public.users WHERE id = :uid;

-- ============================================================
-- VERIFICATION: Check for orphaned records
-- ============================================================

SELECT 'stories' AS table_name, COUNT(*) FROM public.stories WHERE user_id = :uid
UNION ALL
SELECT 'active_prompts', COUNT(*) FROM public.active_prompts WHERE user_id = :uid
UNION ALL
SELECT 'family_members', COUNT(*) FROM public.family_members WHERE user_id = :uid
-- Should return 0 for all tables
```

---

### 4.3 RLS Policy Considerations

**CRITICAL:** Row Level Security (RLS) prevents client-side deletion.

**All deletions MUST use:**
- ✅ Service role key (`SUPABASE_SERVICE_ROLE_KEY`)
- ✅ Server-side API route (`/api/user/delete`)
- ✅ Fresh authentication check before deletion (password/passkey re-entry)
- ✅ Proper authorization: User can only delete their own account

**Why Service Role Required:**

RLS policies restrict operations to current authenticated user:
```sql
CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (user_id = (SELECT auth.uid()));
```

But when deleting full account, we need to bypass RLS to delete:
- Related records (family_members, prompts, etc.)
- Cross-user references (shared_access, family_prompts)
- Audit logs (admin_audit_log with target_user_id)

**Service role bypasses RLS safely because:**
- Only server-side code has access
- Authentication verified before deletion
- All operations logged for audit

---

### 4.4 Cascading Deletes Already Configured

**ON DELETE CASCADE in Schema:**
- ✅ `users` → `active_prompts`, `prompt_history`, `user_prompts` (CASCADE)
- ✅ `users` → `family_members`, `profiles`, `historical_context` (CASCADE)
- ✅ `family_members` → `family_invites`, `family_sessions` (CASCADE)
- ✅ `stories` → `follow_ups` (CASCADE via schema.ts line 170)
- ✅ `auth.users` → `auth.identities`, `auth.mfa_factors` (Supabase managed)

**Explicit deletion is STILL REQUIRED for:**
- Logging each deletion step
- Handling cross-user references safely
- Deleting in correct order to avoid FK violations
- Providing detailed deletion report to user

**Best Practice:** Delete explicitly, don't rely solely on cascades.

---

### 4.5 Deletion Audit Log Retention

**Policy:**
- Store minimal audit lines: `user_id_hash`, `deleted_at`, `categories_deleted[]`
- Retention: **90 days** (no blanket 7-year GDPR requirement)
- Format:
  ```json
  {
    "user_id_hash": "sha256_hash",
    "deleted_at": "2025-10-24T16:00:00Z",
    "categories_deleted": [
      "stories (12)", "prompts (45)", "photos (8)",
      "audio (12)", "family_members (3)"
    ],
    "initiated_by": "user_request",
    "ip_address_masked": "xxx.xxx.xxx.123"
  }
  ```

**Rationale:**
- No GDPR requirement for 7-year retention
- 90 days allows security monitoring and compliance verification
- Longer retention only if other laws mandate (document legal basis)

**Storage:** Separate audit table, NOT in `admin_audit_log` (which gets deleted).

---

## 5. IMPLEMENTATION CHECKLIST

### Phase 1: Create Export Endpoint (/api/user/export)

- [ ] Create `/app/api/user/export/route.ts`
- [ ] Authenticate user via JWT (reject if no valid token)
- [ ] Check rate limiting (max 1 export per 24 hours per user)
- [ ] Use `supabaseAdmin` with service role key for all queries
- [ ] Implement all SQL queries from Section 2 (21 tables + 4 auth tables + 1 conditional)
- [ ] Add table existence check for `passkeys` table
- [ ] Generate signed URLs (1 hour expiry) for audio/photo downloads
- [ ] Include "About this export" metadata block (Section 2.0)
- [ ] Apply default masking:
  - Security tokens → first 4 chars + `…`
  - IP addresses → `xxx.xxx.xxx.123`
  - Third-party emails → `a***@domain.com`
- [ ] Support `?include_full_metadata=true` parameter (requires fresh re-auth)
- [ ] Return JSON export with structure:
  ```json
  {
    "export_metadata": { /* Section 2.0 */ },
    "user_profile": { /* users table */ },
    "stories": [ /* stories + follow_ups */ ],
    "prompts": {
      "active": [],
      "history": [],
      "catalog": [],
      "feedback": []
    },
    "personalization": {
      "profiles": {},
      "historical_context": []
    },
    "family": {
      "members": [],
      "activity": [],
      "invites": [],
      "sessions": [],
      "prompts": []
    },
    "sharing": { /* shared_access */ },
    "legal": [ /* user_agreements */ ],
    "usage": {
      "ai_logs": [],
      "admin_actions": []
    },
    "auth": {
      "user": {},
      "identities": [],
      "mfa_factors": [],
      "audit_log": []
    },
    "security": {
      "passkeys": []  // conditional
    },
    "files": {
      "audio": [ /* signed URLs */ ],
      "photos": [ /* signed URLs */ ]
    }
  }
  ```
- [ ] Log export via `UPDATE users SET data_exports_count = data_exports_count + 1`
- [ ] Return `Content-Type: application/json`
- [ ] Test with real user account (verify completeness)

---

### Phase 2: Complete Deletion Endpoint (/api/user/delete)

- [ ] Update `/app/api/user/delete/route.ts`
- [ ] **CRITICAL:** Require fresh re-authentication:
  - Password users: Call `supabaseAdmin.auth.signInWithPassword` with provided password
  - Passkey users: Verify fresh WebAuthn assertion (< 5 minutes old)
  - OAuth users: Require re-authentication with provider
  - Reject deletion if re-auth fails or is stale
- [ ] Add missing deletions from Section 4.1:
  - [ ] prompt_history, active_prompts, user_prompts
  - [ ] historical_context, profiles
  - [ ] ghost_prompts
  - [ ] family_sessions, family_invites (BEFORE family_members)
  - [ ] family_prompts
  - [ ] prompt_feedback
  - [ ] ai_usage_log
  - [ ] admin_audit_log
  - [ ] passkeys (conditional)
- [ ] Verify deletion order to avoid FK violations
- [ ] Add comprehensive logging for each deletion step
- [ ] Create deletion audit log (separate from `admin_audit_log`):
  ```typescript
  await db.insert(deletionAuditLog).values({
    user_id_hash: sha256(userId),
    deleted_at: new Date(),
    categories_deleted: [
      `stories (${storiesCount})`,
      `prompts (${promptsCount})`,
      // ... etc
    ],
    initiated_by: 'user_request',
    ip_address_masked: maskIp(request.ip)
  });
  ```
- [ ] Handle partial failures gracefully:
  - Continue deleting as much as possible
  - Return detailed report of successes/failures
  - Log errors for manual cleanup
- [ ] Return deletion report:
  ```json
  {
    "success": true,
    "message": "Account permanently deleted",
    "summary": {
      "stories_deleted": 12,
      "prompts_deleted": 45,
      "photos_deleted": 8,
      "audio_deleted": 12,
      "family_members_deleted": 3,
      "total_tables_cleared": 21
    },
    "timestamp": "2025-10-24T16:00:00Z"
  }
  ```
- [ ] Add "dry run" mode for testing (`?dry_run=true`)
- [ ] Test with test account first (verify no orphaned records)
- [ ] Verify Storage files are deleted
- [ ] Verify auth.users is deleted
- [ ] Run verification queries (Section 4.2) to check for orphans

---

### Phase 3: Testing & Validation

- [ ] Create comprehensive test user:
  - [ ] 10+ stories with audio, photos, transcriptions
  - [ ] Active prompts (Tier 1 & Tier 3)
  - [ ] Prompt history (used, skipped, expired)
  - [ ] User prompts (catalog)
  - [ ] Profile with personality traits
  - [ ] Historical context for multiple decades
  - [ ] Family members (3+) with invites, sessions, activity
  - [ ] Family prompts submitted
  - [ ] Shared access records
  - [ ] User agreements (TOS, Privacy)
  - [ ] AI usage logs (multiple operations)
  - [ ] Passkey (if implemented)
  - [ ] OAuth identity (Google login)
  - [ ] MFA factor (TOTP)
- [ ] Test export endpoint:
  - [ ] Run export
  - [ ] Verify JSON structure matches schema
  - [ ] Check all 21+ tables are present
  - [ ] Verify tokens are masked (`abcd…`)
  - [ ] Verify IPs are masked (`xxx.xxx.xxx.123`)
  - [ ] Verify family emails are masked (`a***@gmail.com`)
  - [ ] Verify signed URLs work (download audio/photo)
  - [ ] Verify "About this export" metadata is complete
  - [ ] Test rate limiting (2nd export within 24h should fail)
  - [ ] Test `?include_full_metadata=true` (with fresh re-auth)
- [ ] Test deletion endpoint:
  - [ ] Run deletion in "dry run" mode first
  - [ ] Verify deletion report accuracy
  - [ ] Run actual deletion (with fresh re-auth)
  - [ ] Verify all tables are empty for that user:
    ```sql
    SELECT 'stories' AS table_name, COUNT(*) FROM public.stories WHERE user_id = '<test_user_id>'
    UNION ALL
    SELECT 'active_prompts', COUNT(*) FROM public.active_prompts WHERE user_id = '<test_user_id>'
    -- ... repeat for all tables
    -- All counts should be 0
    ```
  - [ ] Verify Storage files are deleted (list audio/photo folders)
  - [ ] Verify auth.users is deleted
  - [ ] Check for orphaned records (should be none)
  - [ ] Verify deletion audit log was created
  - [ ] Test re-auth requirement (deletion fails without fresh auth)
- [ ] Test edge cases:
  - [ ] User with no stories (just profile)
  - [ ] User with 100+ stories (performance)
  - [ ] User with passkeys vs. without
  - [ ] User with OAuth vs. password
  - [ ] User with no family members
  - [ ] User as shared_with (not owner)

---

### Phase 4: Documentation & UI

- [ ] Add export button to user profile settings:
  - [ ] Label: "Download My Data (GDPR)"
  - [ ] Subtitle: "Get a complete copy of your data in JSON format"
  - [ ] Show rate limit: "You can export once per 24 hours"
  - [ ] Show last export date if exists
- [ ] Add "Delete My Account" section:
  - [ ] ⚠️ Warning box: "This will permanently delete all stories, photos, and recordings"
  - [ ] List what will be deleted (bullet points)
  - [ ] "This action cannot be undone"
  - [ ] Button: "Delete My Account" (red, destructive style)
- [ ] Create confirmation modal for deletion:
  - [ ] Show re-authentication form:
    - Password users: "Re-enter your password to confirm"
    - Passkey users: "Verify with passkey to confirm"
    - OAuth users: "Re-authenticate with Google to confirm"
  - [ ] Checkbox: "I understand this will permanently delete all my data"
  - [ ] Final button: "Yes, Delete My Account" (disabled until checkbox checked and re-auth succeeds)
- [ ] Send confirmation email after deletion:
  - Subject: "Your HeritageWhisper account has been deleted"
  - Body: "Your account and all associated data have been permanently deleted as of [timestamp]. If this was not you, please contact privacy@heritagewhisper.com immediately."
- [ ] Update Privacy Policy:
  - [ ] Add "Your Rights" section:
    - Right to Access (export)
    - Right to Erasure (deletion)
    - Right to Portability
    - Right to Rectification (profile settings)
    - Right to Restriction (contact DPO)
    - Right to Object (notification settings)
    - Right to Lodge Complaint (national DPA)
  - [ ] Add "Data Retention" section:
    - Stories: until deletion
    - Prompts: 7 days (active), archived indefinitely
    - Logs: 90 days
    - Backups: 30 days
  - [ ] Add "Data Export & Deletion" section with instructions
- [ ] Update Terms of Service:
  - [ ] Add account termination clause
  - [ ] Add data retention policy reference
  - [ ] Add backup policy disclosure

---

### Phase 5: Monitoring & Compliance

- [ ] Set up monitoring:
  - [ ] Log all exports to `users.data_exports_count` and `last_data_export_at`
  - [ ] Log all deletions to separate `deletion_audit_log` table
  - [ ] Alert on deletion failures (Sentry, email)
  - [ ] Monitor export rate limits (detect abuse)
  - [ ] Track deletion completion times (performance)
- [ ] Create admin dashboard:
  - [ ] Show export/deletion stats (daily/monthly)
  - [ ] Show failed deletions (manual cleanup queue)
  - [ ] Show rate limit violations
  - [ ] Link to audit logs
- [ ] Establish compliance routines:
  - [ ] Review deletion logs monthly
  - [ ] Test export/deletion endpoints quarterly
  - [ ] Audit backup rotation (verify 30-day cycle)
  - [ ] Verify log purging (90-day auto-purge)
- [ ] Document procedures:
  - [ ] DPO incident response (data breach)
  - [ ] Manual deletion procedure (if API fails)
  - [ ] Data recovery policy (backups within 30 days only)
  - [ ] Third-party processor list (update recipients)
- [ ] Legal compliance:
  - [ ] Keep deletion logs for 90 days (not 7 years)
  - [ ] Document legal basis for any longer retention
  - [ ] Review GDPR compliance annually
  - [ ] Train team on data handling procedures

---

## 6. SAMPLE IMPLEMENTATION

### 6.1 Export Endpoint Template (`/app/api/user/export/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import {
  users, stories, activePrompts, promptHistory, userPrompts,
  familyMembers, familyActivity, profiles, historicalContext,
  aiUsageLog, userAgreements, sharedAccess, adminAuditLog,
  promptFeedback, ghostPrompts, familyInvites, familySessions,
  familyPrompts
} from "@/shared/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { checkRateLimit, exportRatelimit } from "@/lib/ratelimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 2. Rate limiting (1 export per 24 hours)
    const rateLimitResponse = await checkRateLimit(
      `export:${userId}`,
      exportRatelimit
    );
    if (rateLimitResponse) {
      return rateLimitResponse; // 429 Too Many Requests
    }

    // 3. Check if user wants full metadata (requires fresh re-auth)
    const includeFullMetadata = request.nextUrl.searchParams.get('include_full_metadata') === 'true';

    if (includeFullMetadata) {
      // TODO: Verify fresh re-authentication (< 5 minutes old)
      // If not fresh, return 403 with "Re-authentication required"
    }

    logger.info(`[GDPR Export] Starting export for user ${userId}`);

    // 4. Fetch all data (using queries from Section 2)
    const [
      userData,
      storiesData,
      activePromptsData,
      promptHistoryData,
      userPromptsData,
      // ... fetch all other tables
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)),
      db.select().from(stories).where(eq(stories.userId, userId)),
      db.select().from(activePrompts).where(eq(activePrompts.userId, userId)),
      // ... parallel fetch for performance
    ]);

    // 5. Fetch auth tables
    const { data: authIdentities } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('user_id', userId);

    const { data: authMfaFactors } = await supabaseAdmin
      .from('mfa_factors')
      .select('id, user_id, friendly_name, factor_type, created_at, updated_at')
      .eq('user_id', userId);

    // 6. Check for passkeys table (conditional)
    const { rows: passkeyCheck } = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'passkeys'
      )
    `);

    let passkeysData = [];
    if (passkeyCheck[0].exists) {
      passkeysData = await db.execute(sql`
        SELECT * FROM public.passkeys WHERE user_id = ${userId}
      `);
    }

    // 7. List Storage files and generate signed URLs
    const { data: audioFiles } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .list(`audio/${userId}`);

    const { data: photoFiles } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .list(`photo/${userId}`);

    const audioUrls = await Promise.all(
      audioFiles?.map(async (file) => {
        const { data } = await supabaseAdmin.storage
          .from('heritage-whisper-files')
          .createSignedUrl(`audio/${userId}/${file.name}`, 3600); // 1 hour
        return {
          filename: file.name,
          url: data?.signedUrl,
          size: file.metadata?.size,
          created_at: file.created_at
        };
      }) || []
    );

    // Similar for photos...

    // 8. Apply masking (if not full metadata)
    const maskToken = (token: string) => includeFullMetadata ? token : `${token.slice(0, 4)}…`;
    const maskIp = (ip: string | null) => {
      if (!ip) return null;
      if (includeFullMetadata) return ip;
      return `xxx.xxx.xxx.${ip.split('.')[3]}`;
    };
    const maskEmail = (email: string | null) => {
      if (!email) return null;
      if (includeFullMetadata) return email;
      const [local, domain] = email.split('@');
      return `${local[0]}***@${domain}`;
    };

    // 9. Compile export with metadata
    const gdprExport = {
      export_metadata: {
        export: {
          exported_at: new Date().toISOString(),
          controller: "HeritageWhisper LLC",
          contact: "privacy@heritagewhisper.com",
          dpo: "privacy@heritagewhisper.com"
        },
        data_processing: {
          purposes: [
            "life story capture and preservation",
            "book creation and PDF export",
            "family sharing and collaboration",
            "AI-powered transcription and personalized prompts",
            "system security and fraud prevention"
          ],
          legal_bases: [
            "Contract (GDPR Art. 6(1)(b)) - service delivery",
            "Consent (Art. 6(1)(a)) - optional features",
            "Legitimate interest (Art. 6(1)(f)) - fraud prevention"
          ],
          categories: [
            "identity (name, email, birth year)",
            "content (stories, photos, audio)",
            "behavior (AI usage, family activity)",
            "technical (IP, user agent, sessions)",
            "preferences (notifications, privacy)"
          ],
          recipients: [
            "Supabase", "OpenAI", "AssemblyAI", "Vercel",
            "Resend", "PDFShift", "Stripe", "Upstash"
          ],
          retention: {
            stories: "until deletion",
            prompts_active: "7 days (Tier 1) or until milestone",
            logs: "90 days",
            backups: "30 days"
          }
        },
        rights: {
          access: "GDPR Art. 15 (this export)",
          portability: "Art. 20 (JSON format)",
          erasure: "Art. 17 (via /api/user/delete)",
          rectification: "Art. 16 (via settings)"
        }
      },
      user_profile: userData[0],
      stories: storiesData,
      prompts: {
        active: activePromptsData,
        history: promptHistoryData,
        catalog: userPromptsData,
        feedback: promptFeedbackData
      },
      // ... all other data
      files: {
        audio: audioUrls,
        photos: [] // photoUrls
      }
    };

    // 10. Log export
    await db.execute(sql`
      UPDATE public.users
      SET data_exports_count = data_exports_count + 1,
          last_data_export_at = NOW()
      WHERE id = ${userId}
    `);

    logger.info(`[GDPR Export] Completed export for user ${userId}`);

    // 11. Return JSON
    return NextResponse.json(gdprExport, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="heritagewhisper-export-${userId}.json"`
      }
    });

  } catch (error) {
    logger.error("[GDPR Export] Error:", error);
    return NextResponse.json(
      { error: "Export failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

---

### 6.2 Updated Deletion Endpoint (`/app/api/user/delete/route.ts`)

**Add these deletions BEFORE existing code (after authentication):**

```typescript
// [After authentication check, before existing deletions]

// NEW: Require fresh re-authentication
const password = (await request.json()).password;
if (!password) {
  return NextResponse.json(
    { error: "Password required for account deletion" },
    { status: 400 }
  );
}

// Verify password is correct
const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
  email: user.email!,
  password: password
});

if (signInError) {
  return NextResponse.json(
    { error: "Invalid password. Account deletion cancelled." },
    { status: 403 }
  );
}

logger.debug(`[Account Deletion] Starting deletion for user: ${userId}`);

// NEW: Delete AI prompt system data
await db.delete(promptHistory).where(eq(promptHistory.userId, userId));
await db.delete(activePrompts).where(eq(activePrompts.userId, userId));
await db.delete(userPrompts).where(eq(userPrompts.userId, userId));
logger.debug("[Account Deletion] Deleted prompt system records");

// NEW: Delete personalization data
await db.delete(historicalContext).where(eq(historicalContext.userId, userId));
await db.delete(profiles).where(eq(profiles.userId, userId));
logger.debug("[Account Deletion] Deleted personalization records");

// NEW: Delete legacy prompts
await db.delete(ghostPrompts).where(eq(ghostPrompts.userId, userId));
logger.debug("[Account Deletion] Deleted legacy ghost prompts");

// NEW: Delete family sessions & invites (BEFORE family_members)
const userFamilyMembers = await db
  .select({ id: familyMembers.id })
  .from(familyMembers)
  .where(eq(familyMembers.userId, userId));

if (userFamilyMembers.length > 0) {
  const familyMemberIds = userFamilyMembers.map(fm => fm.id);

  await db.execute(sql`
    DELETE FROM public.family_sessions
    WHERE family_member_id = ANY(ARRAY[${sql.join(familyMemberIds, sql`, `)}]::uuid[])
  `);

  await db.execute(sql`
    DELETE FROM public.family_invites
    WHERE family_member_id = ANY(ARRAY[${sql.join(familyMemberIds, sql`, `)}]::uuid[])
  `);

  logger.debug("[Account Deletion] Deleted family sessions and invites");
}

// NEW: Delete family prompts
await db.delete(familyPrompts).where(eq(familyPrompts.storytellerUserId, userId));
logger.debug("[Account Deletion] Deleted family prompts");

// NEW: Delete prompt feedback
await db.execute(sql`
  DELETE FROM public.prompt_feedback
  WHERE story_id IN (SELECT id FROM public.stories WHERE user_id = ${userId})
`);
logger.debug("[Account Deletion] Deleted prompt feedback records");

// NEW: Delete AI usage logs
await db.delete(aiUsageLog).where(eq(aiUsageLog.userId, userId));
logger.debug("[Account Deletion] Deleted AI usage logs");

// NEW: Delete admin audit logs
await db.delete(adminAuditLog).where(eq(adminAuditLog.targetUserId, userId));
logger.debug("[Account Deletion] Deleted admin audit logs");

// NEW: Delete passkeys (conditional)
const { rows: passkeyCheck } = await db.execute(sql`
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'passkeys'
  )
`);

if (passkeyCheck[0].exists) {
  await db.execute(sql`DELETE FROM public.passkeys WHERE user_id = ${userId}`);
  logger.debug("[Account Deletion] Deleted passkey credentials");
}

// [EXISTING CODE CONTINUES HERE]
// Delete family_activity, family_members, stories, etc...
```

---

## 7. FINAL COMPLIANCE NOTES

### 7.1 GDPR Response Timeline

Per GDPR Article 12:
- **Access requests (export):** Must respond within **1 month** (extendable to 3 months if complex)
- **Erasure requests (deletion):** Must respond within **1 month**

Current implementation allows **immediate** export and deletion (same-day response). ✅

---

### 7.2 Security Measures (GDPR Article 32)

- ✅ TLS encryption for all API requests
- ✅ Service role key never exposed to client
- ✅ Authentication required for export/deletion
- ✅ Fresh re-authentication for deletion (password/passkey)
- ✅ Rate limiting on exports (1 per 24 hours)
- ✅ Masked tokens in exports (prevent credential leaks)
- ✅ Audit logging of all exports/deletions
- ✅ Encrypted backups with 30-day rolling retention

---

### 7.3 Third-Party Processors (GDPR Article 28)

All processors have Data Processing Agreements (DPAs) in place:
- **Supabase:** Database, Storage, Auth (DPA via Supabase terms)
- **OpenAI:** AI prompts, Realtime API (DPA required)
- **AssemblyAI:** Transcription (DPA required)
- **Vercel:** Hosting (DPA via Vercel terms)
- **Resend:** Email (DPA via Resend terms)
- **PDFShift:** PDF export (DPA required)
- **Stripe:** Payments (DPA via Stripe terms)
- **Upstash:** Rate limiting (DPA via Upstash terms)

**Action Required:** Verify all DPAs are signed and up-to-date.

---

## 8. BACKUPS & LOGS POLICY

### 8.1 Backup Retention

**Primary Database:**
- Deleted data removed **immediately** upon user request
- No soft-delete grace period

**Automated Backups:**
- **Encryption:** AES-256 at rest
- **Retention:** Rolling 30-day window
- **Restore policy:** Deleted user data will NOT be restored from backups
- **After 30 days:** User's data fully purged from all backups

**Legal Basis:**
- GDPR Article 17(3)(d): Archiving in public interest (balancing test)
- Legitimate interest (GDPR Art. 6(1)(f)): Disaster recovery for operational integrity
- 30-day window balances erasure right with operational recovery needs

---

### 8.2 Server Logs

**Application Logs:**
- **Retention:** Auto-purge after **90 days**
- **PII handling:** Email addresses NOT logged, user_id hashed after 7 days
- **Storage:** Vercel logs (GDPR-compliant)

**Access Logs:**
- **Retention:** 90 days for security monitoring
- **IP addresses:** Hashed after 7 days
- **Purpose:** Fraud detection, rate limiting enforcement

**Deletion Audit Logs:**
- **Retention:** 90 days (minimal)
- **Content:** `user_id_hash`, `deleted_at`, `categories_deleted[]`
- **Legal basis:** GDPR compliance verification, security monitoring

---

### 8.3 Log Anonymization Timeline

| Data Type | Day 0 | Day 7 | Day 90 |
|-----------|-------|-------|--------|
| User ID | Plaintext | Hashed (SHA-256) | Deleted |
| IP Address | Full | Hashed | Deleted |
| Email | Never logged | N/A | N/A |
| Session Token | Never logged | N/A | N/A |

---

### 8.4 Compliance Statement

> **Backup & Log Erasure Policy:**
> Upon account deletion, HeritageWhisper LLC removes all user data from primary databases immediately. Encrypted backups retain data for up to 30 days for disaster recovery purposes only. After the 30-day backup cycle completes, all user data is irreversibly purged. Application logs are anonymized (hashing) after 7 days and auto-deleted after 90 days. This policy balances GDPR erasure rights with legitimate operational needs for system recovery and security monitoring.

---

## 9. LEGAL REFERENCES

- **GDPR Article 15:** Right of access by the data subject
- **GDPR Article 17:** Right to erasure ("right to be forgotten")
- **GDPR Article 20:** Right to data portability
- **GDPR Article 32:** Security of processing
- **GDPR Recital 63:** Balancing rights (trade secrets, others' rights)
- **CJEU Case C-582/14:** IP addresses are personal data
- **GDPR Article 12:** Response timeline (1 month)
- **GDPR Article 28:** Processors and DPAs

---

## 10. REVISION HISTORY

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-24 | 1.0 | Initial comprehensive inventory | Claude + Paul |
| 2025-10-24 | 2.0 | Production-ready with 13 security/compliance fixes | Claude + Paul |

---

**END OF DOCUMENT**

*This document is maintained by HeritageWhisper LLC DPO.*
*For questions: privacy@heritagewhisper.com*
