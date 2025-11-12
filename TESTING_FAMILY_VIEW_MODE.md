# Family View Mode - Manual Testing Guide

**Date:** January 12, 2025
**Dev Server:** http://localhost:3001
**Tester:** Paul

---

## Test Setup Requirements

### Accounts Needed
1. **Account A (Owner)** - Your primary account with existing stories
2. **Account B (Viewer)** - A family member account that has been invited to view Account A's timeline

### Before You Begin
- [ ] Dev server is running at http://localhost:3001
- [ ] You have two separate browser profiles OR use incognito + regular mode
- [ ] Account B has been invited and accepted family sharing from Account A
- [ ] Both accounts can successfully log in

---

## Test 1: Account Owner View (Your Own Timeline)

**Login as:** Account A (Owner)
**Expected:** Full edit permissions, all features visible

### Navigation Tests

#### Mobile Navigation (< 768px viewport)
- [ ] See 5 nav buttons: Timeline | Book | Record | Keepsakes | Profile
- [ ] Grid layout uses `grid-cols-5`
- [ ] All buttons are clickable and navigate correctly
- [ ] Profile button goes to `/profile`

#### Desktop Sidebar (≥ 768px viewport)
- [ ] Profile avatar appears at top of sidebar
- [ ] See navigation links: Timeline | Book | Record | Keepsakes
- [ ] Record button has Mic icon and navigates to `/review/book-style?new=true`
- [ ] Profile link is visible and clickable

#### Hamburger Menu
- [ ] Menu opens when clicked
- [ ] "Settings" option is visible
- [ ] "New Memory" action button appears
- [ ] Clicking "New Memory" navigates to recording flow

### Book View Tests (`/book`)

#### Mobile (< 768px)
- [ ] Closed book header shows Edit icon (Pencil)
- [ ] Open book header shows Edit icon (Pencil)
- [ ] Clicking Edit icon navigates to edit page

#### Desktop (≥ 768px)
- [ ] Edit button appears above story content
- [ ] Timeline button appears next to Edit button
- [ ] Both buttons are clickable
- [ ] Story content is readable

### Memory Box Tests (`/memory-box`)

#### Tab Visibility
- [ ] See both tabs: "Manage My Stories" and "My Treasures"
- [ ] Can switch between both tabs
- [ ] Stories tab shows actual story count (e.g., "15 memories")

#### Functionality
- [ ] "Add Treasure" floating button appears (bottom-right)
- [ ] Clicking "Add Treasure" opens upload modal
- [ ] Can view and manage stories in Stories tab
- [ ] Can view and manage treasures in Treasures tab

---

## Test 2: Family Viewer (Viewing Shared Timeline)

**Login as:** Account B (Viewer)
**Then:** Switch to Account A's timeline using account switcher
**Expected:** View-only mode, edit features hidden

### Navigation Tests

#### Mobile Navigation (< 768px viewport)
- [ ] See 4 nav buttons: Timeline | Book | Keepsakes | Ask Question
- [ ] Grid layout uses `grid-cols-4` (equal width)
- [ ] NO "Record" button visible
- [ ] NO "Profile" button visible
- [ ] "Ask Question" button is visible and clickable

#### Desktop Sidebar (≥ 768px viewport)
- [ ] NO Profile avatar at top
- [ ] See navigation links: Timeline | Book | Keepsakes
- [ ] "Submit Question" button appears (gradient amber/orange/rose)
- [ ] NO "Record" link visible
- [ ] Submit Question button opens modal when clicked

#### Hamburger Menu
- [ ] Menu opens when clicked
- [ ] NO "Settings" option visible
- [ ] NO "New Memory" action button
- [ ] Action items section is empty

### Book View Tests (`/book`)

#### Mobile (< 768px)
- [ ] NO Edit icon (Pencil) in closed book header
- [ ] NO Edit icon (Pencil) in open book header
- [ ] Can still read story content
- [ ] Audio playback works (if story has audio)

#### Desktop (≥ 768px)
- [ ] NO Edit button above story content
- [ ] NO Timeline button
- [ ] Can still read story content
- [ ] Audio playback works (if story has audio)
- [ ] Page navigation works (left/right arrows)

### Memory Box Tests (`/memory-box`)

#### Tab Visibility
- [ ] See ONLY "My Treasures" tab (full width)
- [ ] NO "Manage My Stories" tab visible
- [ ] Tab header shows "My Treasures" as active

#### Functionality
- [ ] NO "Add Treasure" floating button
- [ ] Can view existing treasures
- [ ] Story count shows as "0" (doesn't leak private info)
- [ ] Cannot access Stories tab (even via URL manipulation)

### Submit Question Feature

#### Desktop Sidebar Button
- [ ] "Submit Question" button visible in sidebar
- [ ] Button has gradient background (amber → orange → rose)
- [ ] Clicking opens modal
- [ ] Modal title shows: "Ask [Account A Name] a question"

#### Modal Functionality
- [ ] Question field (required, 500 char max)
- [ ] Context field (optional, 300 char max)
- [ ] Character count indicators visible
- [ ] Submit button enabled when question filled
- [ ] Toast notification appears on success
- [ ] Modal closes after submission

---

## Test 3: Account Switching

**Test rapid switching between own account and family account**

### Switch from Owner → Viewer
- [ ] Account switcher shows both accounts
- [ ] Click to switch to family member account
- [ ] Navigation immediately updates (5 buttons → 4 buttons)
- [ ] Edit buttons disappear from Book view
- [ ] Memory Box hides Stories tab

### Switch from Viewer → Owner
- [ ] Click to switch back to own account
- [ ] Navigation restores (4 buttons → 5 buttons)
- [ ] Edit buttons reappear in Book view
- [ ] Memory Box shows both tabs again

### Persistence Tests
- [ ] Refresh page while viewing family account
- [ ] Correct permissions persist after refresh
- [ ] activeContext loads correctly
- [ ] No flash of owner UI before switching to viewer UI

---

## Test 4: Edge Cases & Security

### URL Manipulation (as Viewer)
Try accessing owner-only routes directly:

- [ ] Navigate to `/profile` → Should redirect or show error
- [ ] Navigate to `/review/book-style?new=true` → Should block
- [ ] Navigate to `/memory-box?tab=stories` → Should force to treasures tab
- [ ] Try to edit story via URL → Should block (if edit route exists)

### API Security (Check browser console)
While viewing as family member:

- [ ] No 403/401 errors on legitimate requests
- [ ] Stories API respects `storyteller_id` parameter
- [ ] No sensitive owner data in responses
- [ ] RLS policies enforced (check Network tab)

### Race Conditions
- [ ] Clear browser cache and reload
- [ ] Login and immediately switch accounts
- [ ] Check if `activeContext` loads before rendering
- [ ] No flash of incorrect permissions

### Browser Back Button
- [ ] Navigate: Timeline → Book → Memory Box
- [ ] Click browser back button multiple times
- [ ] Permissions remain correct throughout
- [ ] No bypassing restrictions via history navigation

---

## Test 5: Mobile Responsiveness

### Test at these viewport widths:
- [ ] 375px (iPhone SE) - Minimum supported width
- [ ] 390px (iPhone 12/13)
- [ ] 428px (iPhone 14 Pro Max)
- [ ] 768px (iPad portrait - breakpoint)
- [ ] 1024px (Desktop)

### Check for:
- [ ] Navigation buttons fit without wrapping
- [ ] Touch targets are 44x44px minimum
- [ ] No horizontal scrolling
- [ ] Text remains readable (14px minimum)
- [ ] Submit Question button renders properly on mobile

---

## Test 6: Console Errors

**Open browser DevTools → Console**

### As Owner
- [ ] No errors when navigating between pages
- [ ] No warnings about missing props
- [ ] No TypeScript errors in console

### As Viewer
- [ ] No errors when switching to family account
- [ ] No errors about undefined `activeContext`
- [ ] No warnings about conditional rendering

---

## Known Limitations to Verify

From implementation docs, these are expected:

1. **Mobile "Ask Question" button** - May link to placeholder route
   - [ ] Clicking "Ask Question" on mobile - does it work or 404?

2. **Contributors treated as viewers** - No differentiation yet
   - [ ] If Account B is "contributor", still shows viewer UI
   - [ ] Contributors cannot edit stories (expected)

3. **No visual indicators** - Per user request
   - [ ] No "View Only" badges visible
   - [ ] No lock icons on stories (expected)

---

## Issues Found (Document Here)

### Issue Template
```
**Issue #X:** [Brief title]
- **Severity:** Critical / High / Medium / Low
- **Affected:** Owner / Viewer / Both
- **Steps to reproduce:**
  1.
  2.
  3.
- **Expected:**
- **Actual:**
- **Screenshots:** [If applicable]
- **Console errors:** [If any]
```

---

### Issue #1:
_[Document any issues you find during testing]_

---

## Test Results Summary

**Date Tested:** _________
**Tested By:** Paul
**Total Tests:** 100+
**Passed:** _____
**Failed:** _____
**Blocked:** _____

### Overall Status
- [ ] ✅ Ready for Production
- [ ] ⚠️ Minor Issues (document above)
- [ ] ❌ Critical Issues Found (block deployment)

### Next Steps
1. _[Based on test results]_
2. _[...]_

---

## Quick Reference: Permission Differences

| Feature | Owner | Viewer |
|---------|-------|--------|
| Mobile Nav Buttons | 5 (Timeline, Book, Record, Keepsakes, Profile) | 4 (Timeline, Book, Keepsakes, Ask Question) |
| Profile Avatar (Desktop) | ✅ Visible | ❌ Hidden |
| Record Button | ✅ Visible | ❌ Hidden |
| Edit Icons (Book) | ✅ Visible | ❌ Hidden |
| Timeline Button (Book) | ✅ Visible | ❌ Hidden |
| Stories Tab (Memory Box) | ✅ Visible | ❌ Hidden |
| Add Treasure Button | ✅ Visible | ❌ Hidden |
| Submit Question Button | ❌ Hidden | ✅ Visible |
| Settings Menu | ✅ Visible | ❌ Hidden |
| New Memory Action | ✅ Visible | ❌ Hidden |

---

**Happy Testing! 🧪**
