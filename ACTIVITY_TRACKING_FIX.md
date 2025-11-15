# Activity Tracking Fix - Family Session Token Support

## Issue
Activity tracking was failing with **401 Unauthorized** errors when family members (invited guests) tried to trigger activity events. The console showed:
```
POST http://localhost:3000/api/activity 401 (Unauthorized)
[BookPage] Failed to log story_listened activity: Error: Invalid authentication
```

## Root Cause
The `/api/activity` POST endpoint only accepted **Supabase JWT tokens** (for authenticated users), but family members viewing stories use **family session tokens** (from the `family_sessions` table), which are NOT Supabase JWTs.

## Solution
Updated `/app/api/activity/route.ts` to accept **both** authentication methods:

### Changes Made:

1. **Dual Authentication Support**
   - First tries Supabase JWT authentication (for regular users)
   - Falls back to family session token validation (for family members)
   - Validates session expiration for family tokens

2. **Actor ID Handling**
   - Regular users: `actorUserId = user.id` (Supabase user ID)
   - Family members: `actorUserId = null` (guest viewers without accounts)
   - This allows tracking that "someone" listened without requiring them to have an account

3. **Access Control**
   - Regular users: Validates via `has_collaboration_access` RPC
   - Family members: Already validated via session token lookup
   - No additional permission check needed for family members

## How It Works Now

### For Regular Authenticated Users:
```typescript
Authorization: Bearer <supabase_jwt_token>
→ Validated via supabaseAdmin.auth.getUser(token)
→ actorId = user.id
```

### For Family Members (Guest Viewers):
```typescript
Authorization: Bearer <family_session_token>
→ Validated via family_sessions table lookup
→ Checks session expiration
→ actorId = null (or auth_user_id if they have an account)
```

## Activity Event Structure

Events logged with family member activity:
```typescript
{
  userId: "storyteller-uuid",           // Owner of the family circle
  actorId: null,                        // Guest viewer (no account)
  familyMemberId: "family-member-uuid", // Optional
  storyId: "story-uuid",
  eventType: "story_listened",
  metadata: {
    duration_seconds: 180,
    title: "Story Title"
  },
  occurredAt: "2025-11-15T..."
}
```

## Testing

### Test as Family Member:
1. Access a story via family invitation link
2. Play audio for 5+ seconds
3. Check console - should see:
   ```
   [Activity API] Authenticated as family member: ...
   [Activity API] Log result: {success: true, eventId: "..."}
   ```
4. Go to `/family` page as storyteller
5. Check "Recent Activity" card - should show the listen event

### Test as Regular User:
1. Send yourself an invitation
2. Check console/server logs for:
   ```
   [Family Invite] ✅ Activity logged: {success: true, eventId: "..."}
   ```
3. Refresh `/family` page - event should appear

## Files Modified
- `app/api/activity/route.ts` - Added family session token support (+69 lines)

## Next Steps
- ✅ Family members can now trigger activity events
- ✅ Activity will show up in Recent Activity feed
- Test all event types (story_listened, invite_sent, invite_resent)
- Verify activity appears on storyteller's family page
