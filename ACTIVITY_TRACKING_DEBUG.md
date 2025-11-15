# Activity Tracking Debug Guide

## Current Status
✅ Database table `activity_events` exists and is working  
✅ Direct database inserts work (verified with test script)  
✅ Activity tracking code is implemented  
❓ Need to verify API calls are being made from frontend

## How to Test & Debug

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser Console
Open your browser's Developer Tools (F12 or Cmd+Option+I) and go to the Console tab.

### 3. Test Each Activity Type

#### A. Test Story Listened (5-second rule)
**As a family member viewing the timeline:**

1. Navigate to `/family/timeline-v2/[storyteller-user-id]`
2. Click play on any story audio
3. **Let it play for at least 5 seconds**
4. Watch console for these messages:
   ```
   [Timeline] Logging story_listened activity: {...}
   [Timeline] ✅ Story listened activity logged successfully
   ```

**What to check:**
- Are you authenticated as a family member (not the storyteller)?
- Did you wait 5+ seconds?
- Any errors in the console?

#### B. Test Invite Sent
**As the storyteller (owner):**

1. Go to `/family` page
2. Click "Invite Family Member"
3. Fill out the form and send invite
4. Watch console and server logs for:
   ```
   [Family Invite] Logging invite_sent activity for: email@example.com
   [Family Invite] ✅ Activity logged: {success: true, eventId: "..."}
   ```

**What to check:**
- Check browser console for errors
- Check terminal/server logs for the messages above
- Verify you're logged in as the storyteller

#### C. Test Invite Resent
**As the storyteller:**

1. Go to `/family` page
2. Find a pending invitation
3. Click "Resend"
4. Watch for:
   ```
   [Family Resend] Logging invite_resent activity for: email@example.com
   [Family Resend] ✅ Activity logged: {success: true, eventId: "..."}
   ```

#### D. Test Question Submitted
**As a family member:**

1. Navigate to family timeline
2. Click "Submit Question" button
3. Fill out and submit a question
4. This should trigger activity logging (if implemented)

### 4. Check Activity Feed
After performing actions above, go to `/family` page and check the "Recent Activity" card.

### 5. Manual Database Check
Run this script to see all events in database:

```bash
npx tsx scripts/check-activity-table.ts
```

## Common Issues & Solutions

### Issue: "No activity showing up"

**Possible causes:**

1. **Not waiting 5 seconds for audio**
   - Solution: Let audio play for at least 5 seconds

2. **Testing as wrong user**
   - Story listened: Must be viewed as family member, not storyteller
   - Invites: Must be done as storyteller
   - Solution: Use correct user role for each test

3. **API calls failing silently**
   - Check browser console for errors
   - Check Network tab for failed requests
   - Look for authentication errors

4. **Migration not run**
   - Run: `npx tsx scripts/check-activity-table.ts`
   - If table doesn't exist, migration needs to be applied

### Issue: "Authentication errors"

Check that you're properly authenticated:
- Regular users: Should have Supabase session token
- Family members: Should have family session token in localStorage

### Issue: "Events logged but not appearing in feed"

1. Check RLS policies on `activity_events` table
2. Verify `GET /api/activity` endpoint works:
   ```bash
   curl -X GET "http://localhost:3000/api/activity?limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Debug Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Browser console open (F12)
- [ ] Server terminal visible
- [ ] Tested as correct user role
- [ ] Waited 5+ seconds for audio
- [ ] Checked browser console for errors
- [ ] Checked server logs for activity messages
- [ ] Ran `check-activity-table.ts` to verify database
- [ ] Checked Network tab for failed API calls

## Need Help?

If activity still isn't tracking after following this guide:

1. Copy all console logs from browser
2. Copy all server terminal output
3. Run `npx tsx scripts/check-activity-table.ts` and share output
4. Share what user role you're testing as (storyteller vs family member)
