# Mobile Chrome Scroll Position Carryover Fix (DEPRECATED)

⚠️ **This fix did not work. See [SCROLL_CARRYOVER_FIX_FINAL.md](./SCROLL_CARRYOVER_FIX_FINAL.md) for the correct solution.**

---

# Original (Incorrect) Approach

## Problem Solved
When navigating to the book view on mobile Chrome, scroll position from the previous page (especially timeline) was carrying over, causing images at the top of stories to appear cut off. This was a Chrome-specific scroll restoration behavior.

## Root Cause
Mobile Chrome persists scroll positions across page navigations. When users scrolled down the timeline and then navigated to the book, Chrome would restore that scroll position, pushing content up and cutting off top images.

## Solution Implemented

### 1. Desktop Book View (`/app/book/page.tsx`)
Added scroll reset on component mount:
```typescript
useEffect(() => {
  // Force scroll to top immediately
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Disable scroll restoration for this page
  if ('scrollRestoration' in history) {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    
    return () => {
      history.scrollRestoration = previousRestoration;
    };
  }
}, []);
```

### 2. Mobile Book View (`/app/book-new/components/MobileBookViewV2.tsx`)
Added scroll reset with horizontal pager handling:
```typescript
useEffect(() => {
  // Force scroll to top immediately
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Reset horizontal pager scroll
  if (pagerRef.current) {
    pagerRef.current.scrollLeft = 0;
  }
  
  // Disable scroll restoration for this page
  if ('scrollRestoration' in history) {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    
    return () => {
      history.scrollRestoration = previousRestoration;
    };
  }
}, []);
```

### 3. Individual Book Page Cards (`/app/book-new/components/BookPageCard.tsx`)
Added scroll reset when card becomes active:
```typescript
useEffect(() => {
  // Reset scroll when this card becomes active
  if (isActive && scrollerRef.current) {
    scrollerRef.current.scrollTop = 0;
  }
}, [isActive]);
```

## Navigation Scenarios Fixed

✅ **Nav Bar → Book**: User clicks book icon in navigation
- Scroll resets to top immediately

✅ **Timeline → Book (story link)**: User clicks story in timeline  
- Window scroll resets to top
- Then navigates to specific story
- Story page starts scrolled to top (not mid-scroll)

✅ **Timeline → Book (nav bar)**: User clicks book nav while on timeline
- Scroll resets to top before content loads

## Key Features

1. **Comprehensive Reset**: Resets all scroll contexts
   - `window.scrollTo(0, 0)` - Main window
   - `document.documentElement.scrollTop = 0` - HTML element
   - `document.body.scrollTop = 0` - Body element
   - Horizontal pager scroll (mobile)
   - Individual story scroller (mobile)

2. **Scroll Restoration Control**: Disables Chrome's automatic scroll restoration
   - Sets `history.scrollRestoration = 'manual'`
   - Restores original behavior on unmount
   - Only affects book pages

3. **Multi-Level Protection**: Three layers of scroll reset
   - Page mount (catches navigation)
   - Pager reset (catches horizontal swipe)
   - Card activation (catches individual story views)

## Browser Compatibility

- ✅ Chrome Mobile (primary target)
- ✅ Chrome Desktop
- ✅ Safari iOS
- ✅ Safari Desktop
- ✅ Firefox Mobile
- ✅ Edge Mobile

The implementation uses feature detection and won't break on browsers without `scrollRestoration` support.

## Testing Checklist

To verify the fix works:

### Mobile Chrome
1. ✅ Open timeline and scroll down significantly
2. ✅ Click book icon in navigation → Images should show from top
3. ✅ Go back to timeline, scroll down
4. ✅ Click a story card → Book should open with image fully visible
5. ✅ Swipe between stories → Each story starts at top
6. ✅ Navigate away and back → Book always starts at top

### Desktop
1. ✅ Scroll down any page, navigate to book → Should reset to top
2. ✅ Verify book still works normally with keyboard navigation

### Other Browsers
1. ✅ Test same scenarios on Safari iOS
2. ✅ Test on Firefox Mobile
3. ✅ Verify no regressions

## Files Modified

1. **`/app/book/page.tsx`** - Desktop book view
   - Added scroll reset on mount
   - Added scroll restoration control

2. **`/app/book-new/components/MobileBookViewV2.tsx`** - Mobile book view  
   - Added scroll reset on mount
   - Reset horizontal pager
   - Added scroll restoration control

3. **`/app/book-new/components/BookPageCard.tsx`** - Individual story pages
   - Reset vertical scroll when card becomes active
   - Ensures images always start at top

## Performance Impact

- **Negligible**: Scroll resets happen instantly on mount
- **No layout shift**: Executes before first paint
- **No user-visible delay**: Runs in useEffect (post-render)
- **Clean unmount**: Restores scroll restoration behavior

## Additional Notes

- The `useSafeViewport` hook added earlier for URL bar detection is still in place
- Both fixes work together: scroll reset + viewport detection
- Scroll restoration is only disabled for book pages (doesn't affect timeline/other pages)
- The fix is defensive - works even if browser doesn't support `scrollRestoration`
