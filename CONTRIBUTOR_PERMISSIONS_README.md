# Contributor Permissions - Phase 1 Implementation

## ✅ Status: Ready to Test

Added two-level permission system: **Viewers** (read-only) and **Contributors** (can submit prompts).

---

## 🎯 What's New

### Permission Levels

**👁 Viewer (Default)**
- View timeline & book
- Listen to audio
- See photos
- No editing capabilities

**✏️ Contributor**
- Everything Viewer can do
- **Plus:** Submit questions they want the storyteller to answer
- Questions appear in storyteller's prompts page as "Family Prompts"

---

## 📁 Files Created/Modified

### New Files (2)
1. `/migrations/0006_add_contributor_permissions.sql` - Database migration
2. `/app/api/family/prompts/route.ts` - Submit prompts API

### Modified Files (2)
1. `/app/family/page.tsx` - Added permission level selector to invite form
2. `/app/api/family/invite/route.ts` - Save permission level with invitation

---

## 🗄️ Database Changes

### Added to `family_members` table:
```sql
permission_level TEXT DEFAULT 'viewer' 
CHECK (permission_level IN ('viewer', 'contributor'))
```

### New `family_prompts` table:
- `id` - UUID primary key
- `storyteller_user_id` - Who will answer this
- `submitted_by_family_member_id` - Who asked
- `prompt_text` - The question (10-500 chars)
- `context` - Optional context about why they want to know
- `status` - 'pending', 'answered', 'skipped', 'archived'
- `answered_story_id` - Link to story that answered it
- `answered_at` - Timestamp when answered
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- `idx_family_prompts_storyteller` - Fast lookup by storyteller + status
- `idx_family_prompts_submitted_by` - Track who submitted what
- `idx_family_prompts_status` - Find pending prompts

---

## 🧪 How to Test

### Step 1: Run Migration
1. Open Supabase SQL Editor
2. Paste contents of `/migrations/0006_add_contributor_permissions.sql`
3. Run migration
4. Verify: `SELECT * FROM family_members;` should show `permission_level` column

### Step 2: Send New Invite with Contributor Permission
1. Go to `/family` page
2. Click "Invite Family"
3. Fill out form
4. **Select "✏️ Contributor" from Permission Level dropdown**
5. Send invite
6. Check database: `SELECT email, permission_level FROM family_members WHERE status = 'pending';`

### Step 3: Test Contributor Features
1. Copy magic link from server console
2. Open in incognito window
3. Click through welcome screen
4. **Look for "Submit a Question" button** (coming in next step!)

---

## 🚀 Next Steps

### Immediate (30 minutes)
- [ ] Create "Submit Question" form component
- [ ] Show button on family timeline/book for contributors only
- [ ] Store permission level in family session localStorage

### Phase 2 (1-2 hours)
- [ ] Show family prompts on storyteller's prompts page
- [ ] Let storyteller mark prompts as answered/skipped
- [ ] Add badge count showing pending family prompts

### Phase 3 (Future)
- [ ] Email notifications when family submits prompts
- [ ] Let contributors add stories (with approval flow)
- [ ] Show prompt history (what questions they've asked)

---

## 🎨 UI Changes

### Invite Dialog
**Before:**
- Email
- Relationship
- Personal Message

**After:**
- Email
- Relationship
- **Permission Level** (new dropdown)
  - 👁 Viewer - View stories only
  - ✏️ Contributor - Can submit questions
- Personal Message

**Helper text** shows based on selected permission.

---

## 🔐 Security

### Permission Checks
- ✅ API validates `permission_level` before allowing prompt submission
- ✅ Only 'contributor' family members can POST to `/api/family/prompts`
- ✅ Session token must be valid and not expired
- ✅ Storyteller user ID must match family member's user_id

### Data Validation
- ✅ Prompt text: 10-500 characters
- ✅ Context: Optional, trimmed
- ✅ XSS protection via React (auto-escaping)

---

## 💡 Example Flow

**Storyteller invites grandson as contributor:**
1. Sends invite with permission: 'contributor'
2. Grandson clicks magic link
3. Sees family timeline with **"Submit a Question" button**
4. Clicks button, fills form:
   - Question: "What was it like when you first came to America?"
   - Context: "I'm doing a school project on immigration"
5. Submits → Saved to `family_prompts` table
6. Storyteller sees new badge on prompts page: "Family Questions (1)"
7. Storyteller answers the question by recording a story
8. System links story to prompt, marks as answered

---

## 📊 Database Queries

### Check Permission Levels
```sql
SELECT 
  email, 
  name, 
  relationship,
  permission_level,
  status
FROM family_members
ORDER BY created_at DESC;
```

### View Family Prompts
```sql
SELECT 
  fp.prompt_text,
  fp.context,
  fp.status,
  fm.name as submitted_by,
  fm.relationship,
  u.email as storyteller_email,
  fp.created_at
FROM family_prompts fp
JOIN family_members fm ON fp.submitted_by_family_member_id = fm.id
JOIN users u ON fp.storyteller_user_id = u.id
ORDER BY fp.created_at DESC;
```

### Pending Prompts for Storyteller
```sql
SELECT 
  prompt_text,
  context,
  submitted_by_family_member_id
FROM family_prompts
WHERE storyteller_user_id = 'YOUR-USER-ID'
AND status = 'pending'
ORDER BY created_at ASC;
```

---

## 🎓 Developer Notes

### Why Two Levels (Not Three)?
- **Simple mental model**: viewer vs contributor
- **Common use case**: Most people want read-only OR can help
- **Easy to expand**: Can add 'editor' level later if needed

### Why Store in family_members Table?
- **Single source of truth** for access control
- **Applies to all access methods** (magic link, future features)
- **Simple permission checks** in API routes

### Why Separate family_prompts Table?
- **Scalability**: Won't bloat prompts table
- **Attribution**: Track who submitted each prompt
- **Status tracking**: Separate workflow from AI prompts
- **Future features**: Can add voting, comments, etc.

---

## 🐛 Troubleshooting

### "Failed to submit prompt"
- Check family session is valid
- Verify permission_level = 'contributor'
- Check prompt text length (10-500 chars)

### Permission dropdown not showing
- Clear browser cache
- Check React component re-rendered
- Verify state update: `console.log(invitePermission)`

### Migration fails on CHECK constraint
- If `family_members` already has `permission_level`, drop constraint first:
  ```sql
  ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_permission_level_check;
  ```

---

**Ready to continue with UI components?** Let me know and I'll create the "Submit Question" form for contributor family members! 🚀
