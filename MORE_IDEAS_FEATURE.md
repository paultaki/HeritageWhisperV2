# More Ideas Feature - Implementation Guide

## Overview

The "More Ideas" feature adds a browsable catalog of non-personalized prompts to the Prompts page. Users can browse by category and add prompts to either their "Ready to Tell" queue (max 3) or "Saved for later" section.

## Features

- **Catalog of 200+ prompts** organized into 30+ categories
- **Sensitive topics toggle** for Dating, Health & Hard Times, Spirituality & Faith, and Reflections & Legacy
- **Smart gating** for categories requiring specific life circumstances (children, college, siblings, spouse, pets)
- **Queue management** that automatically saves to "Saved for later" when queue is full
- **Inline browsing** with collapsible UI that doesn't interrupt the main prompt flow

## Database Migration

Run the migration to create the `user_prompts` table:

```bash
# Connect to Supabase and run:
psql $DATABASE_URL -f migrations/0003_add_user_prompts_catalog.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `/migrations/0003_add_user_prompts_catalog.sql`
3. Run the query

### Schema

```sql
CREATE TABLE user_prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT DEFAULT 'catalog', -- 'catalog' or 'ai'
  status TEXT CHECK (status IN ('ready','saved','recorded','deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Statuses:**
- `ready` - In "Ready to Tell" hero list (max 3)
- `saved` - In "Saved for later" section
- `recorded` - User has recorded a story for this prompt
- `deleted` - User removed the prompt

## API Endpoints

### GET `/api/catalog/prompts`

Fetch prompts by category with gating and sensitivity filters.

**Query params:**
- `category` - Category name (e.g., "Childhood", "Travel")
- `showSensitive` - Boolean, default false

**Response:**
```json
{
  "prompts": [
    {
      "id": "child-1",
      "text": "One of my very first memories is…",
      "category": "Childhood",
      "sensitivity": "low"
    }
  ]
}
```

### POST `/api/prompts/queue-next`

Add a prompt to "Ready to Tell" queue or "Saved for later" if full.

**Body:**
```json
{
  "text": "A favorite holiday memory of mine is…",
  "category": "Celebrations"
}
```

**Response:**
```json
{
  "promoted": true  // true if added to Ready to Tell, false if saved
}
```

### POST `/api/prompts/save`

Save a prompt directly to "Saved for later".

**Body:**
```json
{
  "text": "A favorite holiday memory of mine is…",
  "category": "Celebrations"
}
```

**Response:**
```json
{
  "saved": true
}
```

## Gating System

### Category Gates

Some categories are hidden if the user doesn't meet preconditions:

```typescript
{
  requiresChildren: false,   // Hides "Children" category
  requiresCollege: false,    // Hides "College" category
  hasSiblings: true,         // Shows "Siblings" category
  hasSpouseOrPartner: false, // Hides "Spouse or Partner" category
  hasPets: true              // Shows "Pets" category
}
```

**Default gates** (v1): Set in `/data/user_gates.ts`

**Future:** Load from user profile in database

### Per-Prompt Gates

Individual prompts can have gates:

```typescript
{
  id: 'kids-1',
  text: 'A favorite story from when my child was little is…',
  gates: ['requiresChildren']  // Only shown if user has children
}
```

### Sensitivity Levels

Prompts and categories can be marked sensitive:

- `low` - Default, always visible
- `medium` - Requires "Sensitive topics" toggle
- `high` - Requires "Sensitive topics" toggle

**Sensitive categories:**
- Dating
- Health & Hard Times
- Spirituality & Faith
- Reflections & Legacy

## UX Copy

**Section title:** More ideas

**Subtext:** Browse by category. Add any to your list.

**Toggle:** Sensitive topics

**Buttons:**
- Queue next
- Save for later

**Toasts:**
- "Queued to Ready to Tell" - when space available
- "Added to Saved for later (max 3 ready at a time)" - when queue full
- "Saved for later" - when explicitly saving

## Accessibility

- Minimum 44px hit targets for all buttons
- 16-18px body text with 1.5 line height
- Keyboard accessible with proper focus order
- ARIA labels on toggle checkbox
- Screen reader friendly category navigation

## Testing Checklist

- [ ] Load Prompts page with 0, 1, 2, and 3 hero items
- [ ] Verify "Queue next" adds to Ready to Tell when < 3
- [ ] Verify "Queue next" saves when queue is full (3 items)
- [ ] Toggle "Sensitive topics" and verify categories appear/hide
- [ ] Verify gated categories hide when gates are false
- [ ] Select multiple categories and verify correct prompts load
- [ ] Verify toasts appear with correct messages
- [ ] Test keyboard navigation through categories and buttons
- [ ] Verify 44px minimum touch targets on mobile

## Future Enhancements

### v2 - Profile Integration
- Load user gates from profile table
- Add profile settings to enable/disable categories
- Track which prompts users have already seen

### v3 - Personalization
- AI-generated catalog prompts based on user's stories
- Mix catalog and AI prompts in More Ideas
- Recommend categories based on user interests

### v4 - Analytics
- Track most popular categories
- Track conversion rate (browsed → queued → recorded)
- A/B test prompt phrasing

## Files Added

```
/data/prompt_catalog.ts          - Static catalog with 200+ prompts
/data/user_gates.ts              - User gate helper (returns defaults)
/components/MoreIdeas.tsx        - Main UI component
/app/api/catalog/prompts/route.ts - GET handler for prompts
/app/api/prompts/queue-next/route.ts - POST handler for queueing
/app/api/prompts/save/route.ts   - POST handler for saving
/migrations/0003_add_user_prompts_catalog.sql - Database migration
```

## Files Modified

```
/app/prompts/page.tsx - Added <MoreIdeas /> component
```

## Categories

### Base Categories (always visible)
- Advice
- Ancestry
- Celebrations
- Childhood
- Feelings
- Friends
- Grandparents
- Historical
- Humor & Jokes
- Interests
- Other
- Parents
- Personality & Quirks
- Sayings & Quotes
- Songs & Music
- Teen Years
- Travel
- Work & Career

### Gated Categories (require user attribute)
- Children (requiresChildren)
- College (requiresCollege)
- Pets (hasPets)
- Siblings (hasSiblings)
- Spouse or Partner (hasSpouseOrPartner)

### Sensitive Categories (require toggle)
- Dating
- Health & Hard Times
- Reflections & Legacy
- Spirituality & Faith
