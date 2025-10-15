# Family Sharing - End-to-End Testing Guide

## ✅ Complete Implementation Summary

### Files Created (13 total)

**API Routes (5):**
- ✅ `/app/api/family/invite/route.ts` - Send invitations
- ✅ `/app/api/family/members/route.ts` - List family members
- ✅ `/app/api/family/[memberId]/route.ts` - Delete member
- ✅ `/app/api/family/[memberId]/resend/route.ts` - Resend invite
- ✅ `/app/api/family/verify/route.ts` - Verify magic link
- ✅ `/app/api/family/stories/[userId]/route.ts` - Get stories for family

**Pages (6):**
- ✅ `/app/family/page.tsx` - Family dashboard (updated)
- ✅ `/app/family/access/page.tsx` - Magic link handler
- ✅ `/app/family/timeline/[userId]/page.tsx` - View-only timeline
- ✅ `/app/family/book/[userId]/page.tsx` - View-only book
- ✅ `/app/family/expired/page.tsx` - Expired session error
- ✅ `/app/family/unauthorized/page.tsx` - Unauthorized error

**Components & Hooks (4):**
- ✅ `/hooks/use-family-auth.ts` - Family session management
- ✅ `/components/FamilyGuard.tsx` - Auth wrapper
- ✅ `/components/FamilyBanner.tsx` - View-only header
- ✅ `/components/MoreIdeas.tsx` - Already exists (catalog prompts)

**Database:**
- ✅ Migration `0004_add_family_sharing.sql` applied

---

## 🧪 Testing Procedure

### Step 1: Invite a Family Member

1. **Login as a user** with stories
2. **Navigate to** `/family`
3. **Click** "Invite Family" button
4. **Fill out form:**
   - Email: `test@example.com`
   - Relationship: `Daughter`
   - (Optional) Personal message
5. **Click** "Send Invitation"
6. **Expected:** Success toast, member appears in "Pending Invitations"

### Step 2: Get Magic Link

1. **Check server console** for magic link output:
   ```
   === FAMILY INVITE ===
   To: test@example.com
   From: John Smith
   Link: http://localhost:3002/family/access?token=abc123...
   Expires: 2025-XX-XX
   ====================
   ```

2. **Copy the link** from console

### Step 3: Access Stories (Family Member View)

1. **Open incognito window** (to simulate different user)
2. **Paste magic link** into address bar
3. **Expected flow:**
   - Loading spinner: "Verifying your invitation..."
   - Welcome screen: "Welcome, [Name]!"
   - Shows access details & benefits
   - "Continue to Timeline" button
   - Auto-redirects after 5 seconds

4. **Click "Continue to Timeline"**

### Step 4: View Timeline

1. **Should see:**
   - ✅ Amber banner: "Viewing [Name]'s Stories"
   - ✅ "👁 View Only" badge
   - ✅ All stories with `includeInTimeline = true`
   - ✅ Story cards with photos, text, audio
   - ✅ "👁 View Only" badge on each card

2. **Should NOT see:**
   - ❌ Edit buttons
   - ❌ Delete buttons
   - ❌ Favorite buttons
   - ❌ Record button
   - ❌ Private stories

### Step 5: View Book

1. **Navigate to** `/family/book/[userId]` (change URL or add nav link)
2. **Should see:**
   - ✅ Stories grouped by decade
   - ✅ "Memory Book" title with book icon
   - ✅ Same view-only restrictions as timeline

### Step 6: Test Session Persistence

1. **Close browser tab**
2. **Reopen and paste magic link again**
3. **Expected:**
   - Should verify token again
   - Create new session (or show existing)
   - Welcome screen appears again
   - Can access stories

### Step 7: Test Expiration (Optional)

**To test expiration, manually update database:**

```sql
-- Make session expire in the past
UPDATE family_sessions 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE token = 'your-session-token';
```

Then refresh page → Should redirect to `/family/expired`

### Step 8: Test Unauthorized Access (Optional)

**To test wrong user access:**

1. Create invite for User A
2. Get magic link and create session
3. Manually change URL to User B's ID: `/family/timeline/[different-user-id]`
4. **Expected:** Redirect to `/family/unauthorized`

---

## 🔍 Verification Checklist

### Database Checks

```sql
-- Check family member was created
SELECT * FROM family_members WHERE email = 'test@example.com';

-- Check invite was created
SELECT * FROM family_invites WHERE family_member_id = 'member-uuid';

-- Check session was created after magic link click
SELECT * FROM family_sessions WHERE family_member_id = 'member-uuid';

-- Verify member status changed to 'active'
SELECT status, first_accessed_at, last_accessed_at, access_count 
FROM family_members 
WHERE email = 'test@example.com';
```

### Console Checks

**Server Console (when sending invite):**
```
=== FAMILY INVITE ===
To: test@example.com
From: John Smith
Link: http://localhost:3002/family/access?token=...
Expires: 2025-XX-XX
====================
```

**Browser Console (when clicking magic link):**
```javascript
// Check localStorage
JSON.parse(localStorage.getItem('family_session'))

// Should return:
{
  sessionToken: "abc123...",
  storytellerId: "user-uuid",
  storytellerName: "John Smith",
  familyMemberName: "Sarah",
  relationship: "Daughter",
  expiresAt: "2025-02-15T...",
  firstAccess: false
}
```

### API Response Checks

**GET `/api/family/stories/[userId]`** (with family session token):
```json
{
  "stories": [
    {
      "id": "...",
      "title": "...",
      "transcript": "...",
      "storyYear": 1995,
      "includeInTimeline": true
      // Only public stories returned
    }
  ],
  "total": 5
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "No session token provided"

**Cause:** localStorage not persisting or wrong auth header

**Fix:**
1. Check browser localStorage: `localStorage.getItem('family_session')`
2. Verify token is being sent in Authorization header
3. Clear localStorage and click magic link again

### Issue: "Invalid session"

**Cause:** Session not found in database or token mismatch

**Fix:**
1. Check `family_sessions` table for matching token
2. Verify session hasn't been deleted
3. Get new magic link from invite

### Issue: "Session expired"

**Cause:** 30 days have passed since session creation

**Fix:**
1. Family member needs new invite
2. User can resend from `/family` page
3. Click new magic link

### Issue: Stories not showing

**Cause:** Stories might be private (both `includeInTimeline` and `includeInBook` are false)

**Fix:**
1. Check story settings: At least one must be true
2. Update stories to be public:
   ```sql
   UPDATE stories 
   SET "includeInTimeline" = true 
   WHERE user_id = 'user-uuid';
   ```

### Issue: Magic link shows error immediately

**Cause:** Token already used or expired (7 days for invites)

**Fix:**
1. Check `family_invites` table for `used_at` and `expires_at`
2. Resend invite from family dashboard
3. Use NEW magic link

---

## 📊 Expected Database State After Full Flow

### family_members Table
```
id: uuid
user_id: storyteller-uuid
email: test@example.com
name: Sarah
relationship: Daughter
status: active (changed from 'pending')
invited_at: 2025-01-XX
first_accessed_at: 2025-01-XX (set on first magic link click)
last_accessed_at: 2025-01-XX (updated on each visit)
access_count: 3 (incremented on each visit)
```

### family_invites Table
```
id: uuid
family_member_id: member-uuid
token: abc123... (64 char hex)
expires_at: 2025-01-XX (7 days from creation)
used_at: 2025-01-XX (set when magic link first clicked)
created_at: 2025-01-XX
```

### family_sessions Table
```
id: uuid
family_member_id: member-uuid
token: xyz789... (different from invite token)
user_agent: Mozilla/5.0...
ip_address: 127.0.0.1
expires_at: 2025-02-XX (30 days from last activity)
last_active_at: 2025-01-XX (updated on each API call)
created_at: 2025-01-XX
```

---

## 🎯 Success Criteria

✅ User can invite family member by email  
✅ Invite creates pending member and generates magic link  
✅ Console logs magic link (email integration pending)  
✅ Magic link opens welcome screen  
✅ Session stored in localStorage  
✅ Family member can view timeline with public stories  
✅ Family member can view book organized by decade  
✅ View-only badges show on all pages  
✅ No edit/delete/record actions visible  
✅ Session persists across browser refreshes  
✅ Expired session redirects to error page  
✅ Unauthorized access blocked  
✅ Member status updates to "active"  
✅ Access tracking works (last_accessed_at, access_count)  

---

## 🚀 Next Steps

### Immediate
- [ ] Test the complete flow above
- [ ] Verify all database updates work
- [ ] Check mobile responsiveness

### Phase 2 (Future)
- [ ] Integrate Resend for email sending
- [ ] Add "Resend" button functionality
- [ ] Add navigation links between timeline/book
- [ ] Track story views per family member
- [ ] Add like/comment features

---

## 📧 Email Integration (Not Yet Implemented)

When ready to add email sending:

1. Install Resend SDK:
   ```bash
   npm install resend
   ```

2. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_...
   ```

3. Create email template in `/lib/emails/family-invite.tsx`

4. Update `/app/api/family/invite/route.ts` to send email instead of console.log

---

**Ready to test!** Start with Step 1 and work through the complete flow. 🎉
