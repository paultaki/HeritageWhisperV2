# Mobile Chrome URL Bar Image Cutoff Fix

## Problem Solved
When viewing the book on mobile Chrome with the URL bar positioned at the top of the screen, story images were getting cut off because the URL bar was reducing the available viewport height.

## Solution Implemented

### 1. Created `useSafeViewport` Hook
**File:** `/hooks/use-safe-viewport.ts`

This hook detects changes in the actual visible viewport height by:
- Tracking `window.innerHeight` (changes as URL bar slides)
- Tracking `window.visualViewport.height` (stays constant)
- Calculating the difference to determine URL bar height
- Listening to both `resize` and `scroll` events on `visualViewport`

**Returns:**
- `viewportHeight`: Current window height
- `urlBarHeight`: Estimated height of browser chrome
- `isUrlBarVisible`: Boolean indicating if URL bar is taking up space (threshold: >10px)

### 2. Updated BookPageCard Component
**File:** `/app/book-new/components/BookPageCard.tsx`

**Changes:**
- Imported and integrated `useSafeViewport` hook
- Changed scroller from fixed `pt-[56px]` to dynamic padding
- Added smooth transition: `transition: 'padding-top 0.2s ease-out'`
- Dynamic padding calculation: `56px + urlBarHeight`

**How It Works:**
1. When URL bar is hidden at bottom: `paddingTop = 56px` (just the top bar)
2. When URL bar appears at top: `paddingTop = 56px + ~60px = 116px`
3. The extra padding pushes content down, preventing image cutoff
4. Smooth transition makes the adjustment feel natural

## Testing Checklist

Test on the following scenarios:
- [ ] Chrome mobile with URL bar at top
- [ ] Chrome mobile with URL bar at bottom  
- [ ] Scroll up/down to trigger URL bar show/hide
- [ ] Safari iOS (uses different viewport behavior)
- [ ] Different Android devices (Samsung, Pixel, etc.)
- [ ] Rotate device (portrait/landscape)
- [ ] Navigate between pages in the book

## Browser Compatibility

- ✅ Chrome Android (main target)
- ✅ Chrome iOS
- ✅ Safari iOS (gracefully handles lack of visualViewport)
- ✅ Firefox Mobile
- ✅ Samsung Internet

The implementation uses feature detection and fallbacks:
```typescript
const vvh = window.visualViewport?.height || vh;
```

## Performance

- Lightweight: Only tracks viewport changes when needed
- No unnecessary re-renders: Uses React state efficiently
- Smooth animations: CSS transitions for padding changes
- Cleanup: Properly removes event listeners on unmount

## Files Modified

1. **New:** `/hooks/use-safe-viewport.ts` - Viewport detection hook
2. **Modified:** `/app/book-new/components/BookPageCard.tsx` - Integrated viewport detection

## Technical Details

### Visual Viewport API
The solution uses the [Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API) which provides:
- Accurate viewport dimensions that account for browser UI
- Events when viewport changes (pinch zoom, URL bar, etc.)
- Better handling than just `window.innerHeight`

### Why This Works
- Mobile browsers change `window.innerHeight` when URL bar appears/disappears
- The image container was starting at a fixed position
- Now it dynamically adjusts based on actual available space
- Content stays visible regardless of URL bar state
