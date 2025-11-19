# Story Notification Debugging Guide

## Quick Diagnostic Checklist

Run through these checks in order to identify why notifications aren't being sent:

### 1. Check Server Logs (MOST IMPORTANT)
Look for these log messages after creating a story:

**Success indicators:**
```
[StoryNotification] ✅ Email sent to {email}: {resend_id}
[StoryNotification] Story notifications complete: X sent, Y failed
```

**Failure indicators:**
```
[StoryNotification] Skipping story emails - no Resend API key configured
[StoryNotification] Failed to fetch storyteller: {error}
[StoryNotification] No active family members to notify
[StoryNotification] Failed to send to {email}: {error}
[Stories API] Failed to send story notification emails: {error}
```

**Where to find logs:**
- **Local dev:** Check your terminal where `npm run dev` is running
- **Vercel production:** https://vercel.com/your-project → Logs tab → Filter by "StoryNotification"

---

### 2. Verify Environment Variables

Check that `RESEND_API_KEY` is configured:

```bash
# Local (.env.local)
RESEND_API_KEY=re_...

# Vercel Production
# Settings → Environment Variables → Search "RESEND"
```

**Test:** If missing, you'll see:
```
[StoryNotification] Skipping story emails - no Resend API key configured
```

---

### 3. Check Family Member Configuration

Run this SQL query in Supabase SQL Editor:

```sql
-- Replace YOUR_USER_ID with the storyteller's user ID
SELECT
  id,
  user_id,
  email,
  name,
  status,
  email_notifications,
  created_at
FROM family_members
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

**Required conditions for notification to be sent:**
- ✅ `status = 'active'` (not 'pending' or 'inactive')
- ✅ `email_notifications = true` (not unsubscribed)
- ✅ Valid email address

**Test:** If no rows match these conditions:
```
[StoryNotification] No active family members to notify
```

---

### 4. Check Storyteller's Name

The notification includes the storyteller's name. Verify it exists:

```sql
-- Replace YOUR_USER_ID with the storyteller's user ID
SELECT
  id,
  "firstName",
  "lastName"
FROM users
WHERE id = 'YOUR_USER_ID';
```

**Test:** If user doesn't exist:
```
[StoryNotification] Failed to fetch storyteller: {error}
```

---

### 5. Verify Resend Integration

Test Resend API key manually:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@your-domain.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

**Expected response:**
```json
{"id": "re_..."}
```

**Error responses:**
- `401 Unauthorized` → API key invalid
- `403 Forbidden` → Domain not verified in Resend
- `422 Unprocessable Entity` → Invalid email format

---

### 6. Check Story Data

Verify the story was created with required fields:

```sql
-- Replace STORY_ID with the ID of the story you just created
SELECT
  id,
  user_id,
  title,
  year,
  photo_url,
  transcript,
  created_at
FROM stories
WHERE id = 'STORY_ID';
```

The notification function needs:
- ✅ `title` (displays in email)
- ⚠️ `year` (optional, shows in email if present)
- ⚠️ `photo_url` (optional, displays hero image)
- ⚠️ `transcript` (optional, shows first sentence)

---

## Common Issues & Solutions

### Issue 1: "No active family members to notify"

**Cause:** No family members meet the notification criteria

**Solution:**
1. Check family_members table (see #3 above)
2. Verify `status = 'active'` and `email_notifications = true`
3. If family member just signed up, ensure invite was accepted (check `status`)

---

### Issue 2: "Skipping story emails - no Resend API key configured"

**Cause:** `RESEND_API_KEY` environment variable not set

**Solution:**
1. Add to `.env.local` for local dev
2. Add to Vercel Environment Variables for production
3. Restart dev server or redeploy to Vercel

---

### Issue 3: Email sent but not received

**Cause:** Email might be:
- In spam folder
- Blocked by email provider
- Resend domain not verified

**Solution:**
1. Check Resend dashboard → Logs → Search for recipient email
2. Look for bounce/spam notifications
3. Verify your sending domain in Resend settings
4. Check email spam folder

---

### Issue 4: "Failed to generate signed URL"

**Cause:** Photo path invalid or storage permissions issue

**Solution:**
1. Verify photo exists in Supabase Storage bucket `heritage-whisper-files`
2. Check storage bucket is public or has proper RLS policies
3. Photo will be omitted from email, but notification will still send

---

### Issue 5: Async errors not visible

**Cause:** Notification runs in background, errors caught silently

**Solution:**
Check logs carefully - errors are logged but don't block story creation:
```typescript
// app/api/stories/route.ts:395-398
sendNewStoryNotifications({...}).catch((error) => {
  logger.error('[Stories API] Failed to send story notification emails:', error);
});
```

---

## Manual Test Procedure

To test notifications end-to-end:

### Step 1: Verify Prerequisites
```bash
# Check environment variables
grep RESEND_API_KEY .env.local
grep RESEND_FROM_EMAIL .env.local
```

### Step 2: Create Test Family Member
```sql
-- In Supabase SQL Editor
INSERT INTO family_members (
  user_id,
  email,
  name,
  status,
  email_notifications
) VALUES (
  'YOUR_USER_ID',
  'test@example.com',
  'Test Family Member',
  'active',
  true
) RETURNING *;
```

### Step 3: Create Test Story
Use the app UI or API to create a new story.

### Step 4: Check Logs
```bash
# Local: Watch terminal output
# Look for [StoryNotification] messages

# Vercel: Check logs dashboard
# Filter by "StoryNotification" or "Stories API"
```

### Step 5: Verify Email
1. Check inbox for test@example.com
2. Check spam folder
3. Check Resend dashboard → Logs

---

## Code Flow Reference

```
1. User creates story via UI
   ↓
2. POST /api/stories/route.ts (line 388)
   ↓
3. sendNewStoryNotifications() called asynchronously
   ↓
4. lib/notifications/send-new-story-notifications.ts
   │
   ├─→ Check RESEND_API_KEY (line 84)
   ├─→ Fetch storyteller name (line 90)
   ├─→ Query family_members where:
   │   - user_id = storyteller
   │   - status = 'active'
   │   - email_notifications = true (line 108-113)
   │
   ├─→ For each family member:
   │   ├─→ Generate signed photo URL (line 121)
   │   ├─→ Extract first sentence from transcript (line 124)
   │   ├─→ Generate email content (line 140)
   │   ├─→ Send via Resend (line 150)
   │   └─→ Update last_story_notification_sent_at (line 168)
   │
   └─→ Log results (line 182)
```

---

## Quick SQL Diagnostics

Run all these queries to get a complete picture:

```sql
-- 1. Check your user ID
SELECT id, "firstName", "lastName", email FROM users WHERE email = 'YOUR_EMAIL';

-- 2. Check family members (replace USER_ID)
SELECT
  id, email, name, status, email_notifications,
  last_story_notification_sent_at
FROM family_members
WHERE user_id = 'USER_ID';

-- 3. Check recent stories (replace USER_ID)
SELECT id, title, year, created_at
FROM stories
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if notification timestamp was updated (replace FAMILY_MEMBER_ID)
SELECT
  id,
  email,
  last_story_notification_sent_at,
  email_notifications
FROM family_members
WHERE id = 'FAMILY_MEMBER_ID';
```

If `last_story_notification_sent_at` was updated recently, the email WAS sent successfully!

---

## Need More Help?

1. **Check Vercel logs** for exact error messages
2. **Check Resend dashboard** for delivery status
3. **Run SQL queries above** to verify data
4. **Test Resend API key** with curl command (#5)
5. **Check browser console** for any client-side errors during story creation

If notifications still aren't working after checking all of the above, share:
- Relevant log messages from Vercel
- Results of SQL queries (redact sensitive emails)
- Resend dashboard status for the email
