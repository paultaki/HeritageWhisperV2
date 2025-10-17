# Navigation & Link Audit Report
**Date:** $(date)
**Status:** In Progress

## ✅ WORKING CORRECTLY

### 1. Timeline Cards → Book View Links
- **Timeline (main)**: ✅ Links to `/book?storyId=${story.id}` 
- **Timeline-v2**: ✅ Links to `/book?storyId=${story.id}`
- **Timeline-v3**: ✅ Links to `/book?storyId=${story.id}`
- **Timeline-test**: ✅ Links to `/book?storyId=${story.id}`

### 2. Scroll Position Preservation (Back Navigation)
- **Timeline (main)**: ✅ Saves scroll position in sessionStorage
- **Timeline-v3**: ✅ Saves scroll position in sessionStorage  
- **Timeline-test**: ✅ Saves scroll position in sessionStorage
- **Restoration**: ✅ Restores exact scroll position on return from book view

### 3. Recording Return Navigation
- **useRecordModal**: ✅ Stores `returnPath` in NavCache
- **Review page**: ✅ Uses `returnPath` for cancel button
- **Behavior**: ✅ Returns to exact origin (timeline/book/memory-box)

### 4. Logo Links (Auth Pages)
- **Login**: ✅ Logo clickable, links to `/` (home)
- **Register**: ✅ Logo clickable, links to `/` (home)

### 5. Authentication Timing
- **Profile page**: ✅ Fixed with isAuthLoading check
- **Recording page**: ✅ Fixed with isAuthLoading check
- **Review page**: ✅ Fixed with isAuthLoading check
- **Family page**: ✅ Fixed with isAuthLoading check
- **No redirect issues**: ✅ All pages wait for auth before redirecting

## ⚠️ ISSUES FOUND & FIXES NEEDED

### Issue #1: Timeline-v2 Missing Scroll Restoration
**Problem**: Timeline-v2 saves scroll position but doesn't restore it on return
**Location**: `/app/timeline-v2/page.tsx`
**Fix**: Add scroll restoration logic (like timeline/timeline-v3 have)

### Issue #2: Timeline-v3 Wrong Return Path
**Problem**: Stores `returnPath: "/timeline"` but page is at `/timeline-v3`
**Location**: `/app/timeline-v3/page.tsx:470`
**Fix**: Change to `returnPath: "/timeline-v3"`

### Issue #3: Timeline-v3 Restoration Path Check
**Problem**: Checks `if (context.returnPath === "/timeline")` but should check for `/timeline-v3`
**Location**: `/app/timeline-v3/page.tsx:847`
**Fix**: Change to `context.returnPath === "/timeline-v3"`

## 📋 FIX CHECKLIST

- [x] Fix #1: Add scroll restoration to timeline-v2
- [x] Fix #2: Update timeline-v3 returnPath value  
- [x] Fix #3: Update timeline-v3 restoration check
- [ ] Test: Click timeline card → book → back (verify scroll position)
- [ ] Test: Record new memory → cancel (verify return to origin)
- [ ] Test: Click logo on auth pages (verify goes to home)
- [ ] Test: Refresh pages while logged in (verify no redirect)

## ✅ FIXES IMPLEMENTED

### Fix #1: Timeline-v2 Scroll Restoration
**File**: `/app/timeline-v2/page.tsx`
**Changes**:
- Added `returnHighlightId` state for visual feedback
- Added `useEffect` to restore scroll position from sessionStorage
- Added `data-memory-id` attribute to timeline cards  
- Added highlight styling for returned card (orange tint)
- Scroll restoration with smooth animation to highlighted card

### Fix #2: Timeline-v3 Return Path
**File**: `/app/timeline-v3/page.tsx:470`
**Change**: `returnPath: "/timeline"` → `returnPath: "/timeline-v3"`

### Fix #3: Timeline-v3 Restoration Check
**File**: `/app/timeline-v3/page.tsx:847`
**Change**: `context.returnPath === "/timeline"` → `context.returnPath === "/timeline-v3"`

## 🧪 TESTING INSTRUCTIONS

### Test 1: Timeline → Book → Back (Scroll Position)
1. Go to `/timeline-v2`
2. Scroll down 500px
3. Click any story card
4. Book view opens to that story
5. Click back button
6. **Expected**: Returns to timeline-v2 at exact scroll position (500px)
7. **Expected**: Card briefly highlights in orange
8. Repeat for `/timeline` and `/timeline-v3`

### Test 2: Recording → Cancel (Return to Origin)
1. Go to `/timeline` (or book/memory-box)
2. Click "+" to record new memory
3. Record audio and transcribe
4. On review page, click "Cancel"
5. **Expected**: Returns to `/timeline` (wherever you started)
6. Repeat from `/book` and `/memory-box`

### Test 3: Logo Links (Auth Pages)
1. Go to `/auth/login`
2. Click Heritage Whisper logo
3. **Expected**: Navigates to `/` (home page)
4. Go to `/auth/register`
5. Click logo
6. **Expected**: Navigates to `/` (home page)

### Test 4: Auth Timing (Page Reload)
1. Log in to app
2. Navigate to `/profile`
3. Refresh browser (Cmd+R / Ctrl+R)
4. **Expected**: Stays on `/profile` (brief loading spinner)
5. **Expected**: Does NOT redirect to `/timeline` or `/login`
6. Repeat for `/recording`, `/review`, `/family`

## 📊 TEST RESULTS

Run tests and record results here:

- [ ] Test 1 (Timeline-v2): PASS / FAIL
- [ ] Test 1 (Timeline): PASS / FAIL  
- [ ] Test 1 (Timeline-v3): PASS / FAIL
- [ ] Test 2 (Recording Cancel): PASS / FAIL
- [ ] Test 3 (Logo Links): PASS / FAIL
- [ ] Test 4 (Auth Timing): PASS / FAIL
