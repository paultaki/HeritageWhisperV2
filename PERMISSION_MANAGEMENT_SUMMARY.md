# Permission Management - Complete Implementation

## ✅ Features Implemented

### 1. Set Permissions at Invite Time
**Location:** `/family` page → "Invite Family" button

**UI:**
- Dropdown selector with two options:
  - 👁 **Viewer** - View stories only (default)
  - ✏️ **Contributor** - Can submit questions

**How it works:**
- Choose permission level before sending invite
- Saved to `family_members.permission_level` in database
- Included in magic link verification response
- Stored in family member's localStorage session

---

### 2. Change Permissions After Invitation
**Location:** `/family` page → Active Members list

**UI:**
- Each family member row shows:
  - Name + Relationship badge
  - Permission badge (✏️ Contributor or 👁 Viewer)
  - **Dropdown to change permission** (new!)
  - Remove button

**How it works:**
- Click dropdown next to family member
- Select new permission level
- Instantly saves via `PATCH /api/family/[memberId]/permissions`
- Shows toast confirmation
- Updates take effect on their next page load

---

## 🎯 User Experience

### For Storyteller (You)

**Inviting:**
1. Click "Invite Family"
2. Fill out email, relationship
3. **Choose permission level** from dropdown
4. Send invite

**Managing:**
1. Go to `/family` page
2. See all active members
3. **Each member has a permission dropdown**
4. Change from Viewer → Contributor or vice versa
5. Get instant confirmation

**Visual Indicators:**
- Contributors have filled badge: `✏️ Contributor`
- Viewers have outline badge: `👁 Viewer`

### For Family Member

**As Viewer:**
- Can read all stories
- Can listen to audio
- Can view photos
- **No "Submit Question" button**

**As Contributor:**
- Everything Viewer can do
- **Plus: "Submit a Question" button** on timeline & book
- Can submit questions with optional context
- Questions go to storyteller's prompts page

**Permission Change:**
- Takes effect on next page load
- If downgraded to Viewer: "Submit Question" button disappears
- If upgraded to Contributor: Button appears!

---

## 📁 Files Modified/Created

### New Files (2)
1. `/app/api/family/[memberId]/permissions/route.ts` - Update permissions API
2. `/PERMISSION_MANAGEMENT_SUMMARY.md` - This file

### Modified Files (3)
1. `/app/family/page.tsx` - Added permission dropdown & mutation
2. `/app/family/page.tsx` interface - Added `permissionLevel` to FamilyMember
3. `/app/api/family/verify/route.ts` - Return permission level in response

---

## 🔐 Security

### Permission Validation
- ✅ Only storyteller can change permissions for their family members
- ✅ Validates `user_id` matches before update
- ✅ Only accepts 'viewer' or 'contributor' values
- ✅ Returns 403 if trying to update someone else's family member

### API Protection
- ✅ Requires valid auth token
- ✅ Checks family member exists and belongs to user
- ✅ Returns proper error messages

---

## 🧪 Testing Checklist

### Invite with Permission
- [ ] Send invite with "Viewer" permission
- [ ] Check database: `SELECT email, permission_level FROM family_members;`
- [ ] Should show `permission_level = 'viewer'`
- [ ] Family member should NOT see "Submit Question" button

### Change Permission
- [ ] Go to `/family` page
- [ ] Click permission dropdown next to active member
- [ ] Change from Viewer → Contributor
- [ ] Check database: permission_level should update
- [ ] Family member refreshes page → sees "Submit Question" button
- [ ] Change back to Viewer → button disappears

### Badge Display
- [ ] Viewer shows outline badge: `👁 Viewer`
- [ ] Contributor shows filled badge: `✏️ Contributor`
- [ ] Dropdown shows current permission selected

---

## 📊 Database Queries

### Check Permission Levels
```sql
SELECT 
  email,
  name,
  permission_level,
  status
FROM family_members
ORDER BY created_at DESC;
```

### Find All Contributors
```sql
SELECT 
  email,
  name,
  relationship
FROM family_members
WHERE permission_level = 'contributor'
AND status = 'active';
```

### Change Permission Manually (if needed)
```sql
UPDATE family_members
SET permission_level = 'contributor'
WHERE email = 'example@email.com';
```

---

## 🎨 UI Components

### Permission Dropdown (Active Members)
```tsx
<Select
  value={member.permissionLevel || 'viewer'}
  onValueChange={(value) => 
    updatePermissionMutation.mutate({ 
      memberId: member.id, 
      permissionLevel: value 
    })
  }
>
  <SelectTrigger className="h-9 w-[140px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="viewer">👁 Viewer</SelectItem>
    <SelectItem value="contributor">✏️ Contributor</SelectItem>
  </SelectContent>
</Select>
```

### Permission Badge
```tsx
<Badge 
  variant={member.permissionLevel === 'contributor' ? 'default' : 'outline'} 
  className="text-xs"
>
  {member.permissionLevel === 'contributor' ? '✏️ Contributor' : '👁 Viewer'}
</Badge>
```

---

## 🐛 Troubleshooting

### Permission doesn't change
- Check server console for errors
- Verify auth token is valid
- Check `family_member_id` exists
- Ensure user owns this family member

### "Submit Question" button doesn't appear
- Family member needs to refresh page
- Check localStorage has updated session:
  ```js
  JSON.parse(localStorage.getItem('family_session')).permissionLevel
  ```
- Should show 'contributor'

### Dropdown shows wrong permission
- Check database value matches UI
- Clear React Query cache
- Refresh page

---

## ✨ Summary

**Storyteller Can:**
1. ✅ Set permission when inviting (Viewer or Contributor)
2. ✅ Change permission anytime from family page
3. ✅ See current permission as badge on each member
4. ✅ Get confirmation toast when permission changes

**System Automatically:**
1. ✅ Saves permission to database
2. ✅ Returns permission in magic link verification
3. ✅ Stores in family member's session
4. ✅ Shows/hides "Submit Question" button based on permission
5. ✅ Validates permission before allowing API calls

---

**All permission management features are complete and ready to use!** 🎉
