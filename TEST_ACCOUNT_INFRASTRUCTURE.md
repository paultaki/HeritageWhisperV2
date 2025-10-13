# Test Account Infrastructure

Complete testing system for milestone-based prompt generation without manually creating stories.

---

## 🎯 Purpose

Test how the Prompt Intimacy Engine performs at different milestones (Story 1, 3, 10, etc.) using your existing 30-story account as a template. No need to manually add stories - just clone and set milestones.

---

## 🚀 Quick Start

### 1. Clone Your Account

```
1. Go to /admin/test-accounts
2. Enter test email: test@heritagewhisper.com
3. Enter name: Paul (Test)
4. Click "Clone Account"
```

**Result:** Complete copy of your account with all 30 stories and photos. No prompts copied (they'll be generated fresh).

### 2. Set Milestone

```
Click "Story 3" button
```

**Result:** First 3 stories visible, remaining 27 hidden. Story count set to 3.

### 3. Generate Prompts

```
Click "Generate Prompts"
```

**Result:** 
- Tier-1 V2 prompts generated for all 3 visible stories
- Tier-3 analysis runs (Story 3 is a milestone)
- 4 intimacy prompts generated (1 unlocked + 3 locked for paywall)

### 4. Review Prompts

```
Go to /admin/prompts
Filter by test account user ID
```

**Result:** See all generated prompts with quality scores and validation details.

### 5. Test Different Milestone

```
Click "Clean Prompts" (removes all prompts)
Click "Story 10" button
Click "Generate Prompts"
```

**Result:** Test how system performs at Story 10 milestone without adding 7 more stories.

### 6. Delete When Done

```
Click trash icon
Type email to confirm
```

**Result:** Test account completely removed.

---

## 📊 Available Milestones

System triggers Tier-3 analysis at these milestones:

- **Story 1** - First story ever
- **Story 2** - Second story
- **Story 3** - Paywall trigger (1 unlocked + 3 locked prompts)
- **Story 4** - Post-paywall
- **Story 7** - Week of stories
- **Story 10** - Milestone celebration
- **Story 15, 20, 30, 50, 100** - Major milestones

---

## 🛠️ SQL Functions

All operations powered by PostgreSQL functions (see `migrations/0003_test_account_infrastructure.sql`):

### `clone_user_account(source_user_id, new_email, new_name)`

Creates complete copy of user account with all stories and photos.

**Example:**
```sql
SELECT * FROM clone_user_account(
  'your-user-id'::UUID,
  'test@heritagewhisper.com',
  'Paul (Test)'
);
```

**Returns:**
- `new_user_id` - ID of cloned account
- `stories_cloned` - Number of stories copied
- `photos_cloned` - Number of photos copied

**Notes:**
- Does NOT copy prompts (they get regenerated in tests)
- Does NOT copy character evolution (gets regenerated)
- Copies all story metadata (title, transcript, year, wisdom, favorites)

---

### `set_user_story_milestone(target_user_id, target_story_count)`

Adjusts visible story count to simulate milestones.

**Example:**
```sql
SELECT * FROM set_user_story_milestone('test-user-id'::UUID, 3);
```

**How it works:**
- Makes first N stories visible (is_private = false)
- Hides remaining stories (is_private = true)
- Updates user's story_count to N

**Returns:**
- `visible_stories` - Count of visible stories
- `hidden_stories` - Count of hidden stories

**Use case:** Test Story 3 milestone without deleting stories 4-30

---

### `clean_test_prompts(target_user_id)`

Removes all prompts and character evolution for clean slate testing.

**Example:**
```sql
SELECT * FROM clean_test_prompts('test-user-id'::UUID);
```

**Returns:**
- `active_prompts_deleted` - Active prompts removed
- `prompt_history_deleted` - Historical prompts removed
- `character_evolution_deleted` - Character insights removed

**Use case:** Reset before testing different milestone or prompt generation logic

---

### `delete_test_account(target_user_id, confirm_email)`

Completely removes test account and all data.

**Example:**
```sql
SELECT * FROM delete_test_account(
  'test-user-id'::UUID,
  'test@heritagewhisper.com'
);
```

**Returns:**
- `stories_deleted` - Stories removed
- `photos_deleted` - Photos removed
- `prompts_deleted` - Prompts removed

**Safety:** Requires email confirmation to prevent accidental deletion

**Does NOT delete:** Files from Supabase Storage (handle separately if needed)

---

### `get_test_account_info(target_user_id)`

Returns summary of test account data.

**Example:**
```sql
SELECT * FROM get_test_account_info('test-user-id'::UUID);
```

**Returns:**
- `user_email` - Account email
- `user_name` - Account name
- `total_stories` - All stories (visible + hidden)
- `visible_stories` - Currently visible stories
- `active_prompts` - Active prompt count
- `prompt_history` - Historical prompt count
- `has_character_evolution` - Whether insights exist

---

## 🔄 Testing Workflow

### Test Story 3 Paywall

```
1. Clone account
2. Set to Story 3
3. Generate prompts
4. Verify in /admin/prompts:
   - Should see Tier-3 intimacy prompts
   - 1 prompt unlocked (is_locked = false)
   - 3 prompts locked (is_locked = true)
```

### Test Tier-3 Intimacy Types

```
1. Clone account
2. Set to Story 10 (milestone)
3. Generate prompts
4. Verify in /admin/prompts:
   - "I Caught That" (uses exact phrases)
   - "I See Your Pattern" (references multiple stories)
   - "I Notice the Absence" (asks about gaps)
   - "I Understand the Cost" (acknowledges tradeoffs)
```

### Test Quality Gates

```
1. Clone account
2. Set to Story 1
3. Generate prompts
4. Verify in /admin/prompts:
   - All prompts <30 words
   - No generic nouns (girl, boy, man, room)
   - No banned phrases ("tell me more")
   - Score >60
```

### Test Tier-1 V2 Templates

```
1. Clone account
2. Set to Story 2
3. Generate prompts
4. Check prompt types:
   - Person templates ("What did {person} teach you?")
   - Place templates ("When did {place} stop feeling the same?")
   - Object templates ("When did {object} start meaning more?")
   - Emotion templates ("Who helped you carry that {emotion}?")
```

### Compare Milestones

```
1. Clone account
2. Set to Story 1, generate prompts, count Tier-3: 0
3. Clean prompts
4. Set to Story 3, generate prompts, count Tier-3: 4 (paywall)
5. Clean prompts
6. Set to Story 10, generate prompts, count Tier-3: 2-5
```

---

## 🔍 Debugging

### No prompts generated?

Check:
- Are stories visible? (is_private = false)
- Do stories have transcripts?
- Are entities being extracted? (check logs)
- Are prompts passing quality gates?

### Tier-3 not running?

Check:
- Is story count a milestone? [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100]
- Are there multiple stories to analyze?
- Is OpenAI API key configured?

### Test account not appearing in list?

Check:
- Email ends with @heritagewhisper.com OR
- Name contains "(Test)"

---

## 🎨 UI Features

### Test Account Card

Shows:
- Visible/total stories
- Active prompts count
- Prompt history count
- Character evolution status

### Milestone Buttons

- Pre-filtered to available milestones (≤ total stories)
- Currently selected milestone highlighted
- One-click milestone switching

### Actions

- **Generate Prompts** - Runs Tier-1 + Tier-3 for current milestone
- **Clean Prompts** - Removes all prompts for fresh testing
- **Delete** (trash icon) - Removes test account completely

---

## 🛡️ Safety Features

### Email Confirmation

Delete requires typing exact email address to confirm.

### No Impact on Production

Test accounts isolated by email pattern (@heritagewhisper.com or "(Test)" in name).

### Graceful Degradation

If prompt generation fails:
- Stories remain intact
- User can retry
- Errors logged but don't crash

### Storage Not Deleted

SQL functions don't delete Supabase Storage files (audio/photos). Handle separately if needed.

---

## 📈 Benefits

### Faster Testing

Test all milestones in minutes instead of recording 30 stories.

### Consistent Data

Same stories every time = reproducible tests.

### Isolated Environment

Test accounts don't affect production metrics.

### Milestone Validation

Verify Tier-3 triggers at exact milestones.

### Quality Assurance

Test quality gates with real story data.

---

## 🔮 Future Enhancements

- **Snapshot/Restore** - Save prompt state before testing
- **A/B Test Variants** - Test different prompt templates side-by-side
- **Automated Test Runs** - Run test suite on every deployment
- **Performance Metrics** - Track generation time, quality scores
- **Storage Cleanup** - Auto-delete files when test account deleted

---

## 📝 Notes

### Character Evolution

Character insights get regenerated fresh during Tier-3 analysis. Old insights are not copied.

### Prompt Deduplication

SHA1 hashing prevents duplicate prompts even across test runs.

### Story Ordering

Stories maintain original created_at timestamps, so milestone logic works correctly.

### Database Performance

SQL functions use efficient queries with proper indexes. Safe for production.

---

## 🎯 Success Metrics

Use test accounts to validate:

- **0% generic nouns** - All prompts filtered
- **100% <30 words** - Hard limit enforced
- **Story 3 paywall** - 1 unlocked + 3 locked
- **Tier-3 at milestones** - Runs at [1,2,3,4,7,10,15,20,30,50,100]
- **4 intimacy types** - Generated at Tier-3 milestones
- **Quality scores** - Average >70

---

**Built for Paul's vision of creating magical, testable AI experiences.** 🎯
