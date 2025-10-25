# HeritageWhisperV2 - Entity-Relationship Diagrams

> **Quick Reference:** Visual database schema diagrams

## Complete Database Schema

```mermaid
erDiagram
    users ||--o{ stories : "creates"
    users ||--o{ passkeys : "has"
    users ||--o{ activePrompts : "receives"
    users ||--o{ promptHistory : "archives"
    users ||--o{ familyMembers : "invites (as storyteller)"
    users ||--o{ sharedAccess : "shares timeline (as owner)"
    users ||--o| profiles : "has personalization"
    users ||--o{ userAgreements : "accepts"
    users ||--o{ historicalContext : "caches"

    stories ||--o{ followUps : "generates"
    stories ||--o| activePrompts : "sources from (optional)"

    familyMembers ||--o{ familyActivity : "tracks"

    sharedAccess }o--|| users : "grants access to (when registered)"

    users {
        uuid id PK
        text email UK
        text password "nullable"
        text name
        int birthYear
        text bio
        text profilePhotoUrl
        int storyCount
        bool isPaid
        jsonb profileInterests
        timestamp createdAt
    }

    passkeys {
        uuid id PK
        uuid userId FK
        text credentialId UK
        text publicKey
        bigint signCount
        text friendlyName
        timestamp createdAt
    }

    stories {
        uuid id PK
        uuid userId FK
        text title
        text transcription
        int storyYear
        int lifeAge
        text lessonLearned
        jsonb photos
        jsonb photoTransform
        bool isFavorite
        timestamp createdAt
    }

    activePrompts {
        uuid id PK
        uuid userId FK
        text promptText
        text anchorHash UK
        int tier "0-3"
        int promptScore "0-100"
        bool isLocked
        timestamp expiresAt
    }

    promptHistory {
        uuid id PK
        uuid userId FK
        text promptText
        text outcome "used | skipped | expired"
        uuid storyId FK
        timestamp resolvedAt
    }

    familyMembers {
        uuid id PK
        uuid userId FK
        text email
        text relationship
        text status "pending | active"
        jsonb permissions
    }

    familyActivity {
        uuid id PK
        uuid userId FK
        uuid familyMemberId FK
        uuid storyId FK
        text activityType
        timestamp createdAt
    }

    sharedAccess {
        uuid id PK
        uuid ownerUserId FK
        text sharedWithEmail
        uuid sharedWithUserId FK
        text shareToken UK
        text permissionLevel
        bool isActive
    }

    profiles {
        uuid id PK
        uuid userId FK UK
        int birthYear
        text preferredStyle
        jsonb majorLifePhases
    }

    followUps {
        uuid id PK
        uuid storyId FK
        text questionText
        bool wasAnswered
    }

    historicalContext {
        uuid id PK
        uuid userId FK
        text decade
        jsonb facts
    }

    userAgreements {
        uuid id PK
        uuid userId FK
        text agreementType "terms | privacy"
        text version
        timestamp acceptedAt
    }
```

## Core Entities Simplified

```mermaid
erDiagram
    users ||--o{ stories : creates
    users ||--o{ activePrompts : receives
    users ||--o{ familyMembers : invites

    stories ||--o{ followUps : generates
    stories ||--o| activePrompts : "sources from"

    users {
        uuid id
        text email
        text name
        int birthYear
    }

    stories {
        uuid id
        uuid userId
        text title
        text transcription
        int year
        jsonb photos
    }

    activePrompts {
        uuid id
        uuid userId
        text promptText
        int tier
        bool isLocked
    }

    familyMembers {
        uuid id
        uuid userId
        text email
        text relationship
    }
```

## Authentication System

```mermaid
erDiagram
    users ||--o{ passkeys : "authenticates with"
    users ||--o{ userAgreements : "accepts"

    users {
        uuid id
        text email UK
        text password "nullable for OAuth"
        timestamp createdAt
    }

    passkeys {
        uuid id
        uuid userId
        text credentialId UK
        text publicKey
        bigint signCount
        text friendlyName "e.g. iPhone 14"
        timestamp lastUsedAt
    }

    userAgreements {
        uuid id
        uuid userId
        text agreementType "terms | privacy"
        text version
        timestamp acceptedAt
        text method "signup | oauth"
    }
```

## AI Prompt System

```mermaid
erDiagram
    users ||--o{ activePrompts : "has active"
    users ||--o{ promptHistory : "archives"
    stories ||--o| activePrompts : "created from"
    promptHistory }o--|| stories : "resulted in"

    activePrompts {
        uuid id
        uuid userId
        text promptText
        text anchorHash UK "dedup key"
        text anchorEntity
        int tier "0-3"
        int promptScore "0-100"
        text memoryType
        bool isLocked "paywall"
        timestamp expiresAt
    }

    promptHistory {
        uuid id
        uuid userId
        text promptText
        text outcome "used | skipped | expired"
        uuid storyId "nullable"
        int tier
        timestamp resolvedAt
    }

    stories {
        uuid id
        uuid userId
        uuid sourcePromptId "nullable"
        text transcription
    }
```

## Family Sharing System

```mermaid
erDiagram
    users ||--o{ familyMembers : "storyteller invites"
    users ||--o{ sharedAccess : "owner shares"
    familyMembers ||--o{ familyActivity : "generates"
    sharedAccess }o--|| users : "family member claims"

    users {
        uuid id
        text email
        text name
    }

    familyMembers {
        uuid id
        uuid userId "storyteller"
        text email
        text name
        text relationship
        text status "pending | active | declined"
        jsonb permissions "canView, canComment, canDownload"
        timestamp acceptedAt
    }

    sharedAccess {
        uuid id
        uuid ownerUserId
        text sharedWithEmail
        uuid sharedWithUserId "populated on signup"
        text permissionLevel "view | edit"
        text shareToken UK
        bool isActive
        timestamp expiresAt
    }

    familyActivity {
        uuid id
        uuid userId "storyteller"
        uuid familyMemberId
        uuid storyId "nullable"
        text activityType "viewed | commented | favorited"
        timestamp createdAt
    }
```

## Story Data Structure

```mermaid
erDiagram
    stories ||--o{ followUps : "generates questions"
    stories {
        uuid id
        uuid userId
        text title
        text audioUrl
        text transcription
        int durationSeconds "1-120"
        int storyYear "nullable"
        int lifeAge
        text lessonLearned
        jsonb lessonAlternatives "3 AI options"
        jsonb entitiesExtracted "people, places, objects, emotions"
        uuid sourcePromptId "nullable"
        text photoUrl "legacy single photo"
        jsonb photos "array of photo objects"
        jsonb photoTransform "zoom, position"
        jsonb emotions "array"
        bool includeInBook
        bool includeInTimeline
        bool isFavorite
        jsonb formattedContent "pages, paragraphs"
        jsonb extractedFacts "people, places, events"
        timestamp createdAt
    }

    followUps {
        uuid id
        uuid storyId
        text questionText
        text questionType "emotional | wisdom | sensory"
        bool wasAnswered
    }
```

---

## Key Relationships Summary

**One-to-Many:**
- User → Stories
- User → Passkeys (multiple devices)
- User → ActivePrompts (1-5 at a time)
- User → PromptHistory (archives)
- User → FamilyMembers (as storyteller)
- Story → FollowUps

**One-to-One:**
- User → Profile (extended personalization)

**Optional Foreign Keys:**
- Story → ActivePrompt (via `source_prompt_id`, nullable)
- PromptHistory → Story (via `story_id`, nullable if skipped/expired)
- SharedAccess → User (via `shared_with_user_id`, nullable until signup)

**Composite Unique:**
- Passkey(userId, credentialId) - Prevents cross-tenant credential reuse

**Deduplication:**
- ActivePrompts: `anchor_hash` = sha1(`${tier}|${entity}|${year}`)

---

_For complete data model documentation including service and UI layers, see [DATA_MODEL.md](../DATA_MODEL.md)_