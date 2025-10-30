# Book V2: Scrollable Single-Page Stories

## Overview

Book V2 is a duplicate of the production book view with a key architectural change: **each story is complete on a single page** that scrolls internally, rather than wrapping across multiple pages.

## Key Differences from Book V1

| Feature | Book V1 (/book) | Book V2 (/book-v2) |
|---------|----------------|-------------------|
| **Story Layout** | Stories can span multiple pages with text wrapping | Each story fits on ONE page |
| **Scrolling** | No scrolling within pages | Scroll within each page to see full story |
| **Page Size** | Fixed height, content truncated to fit | Fixed height, content scrollable |
| **Pagination Logic** | Complex: splits paragraphs, balances content | Simple: one page per story |
| **Dynamic Reflow** | Yes - moves content between pages | No - pages are independent |

## Technical Implementation

### 1. New Pagination Library (`lib/bookPaginationV2.ts`)

- **`paginateStoryV2()`**: Always creates exactly 1 page per story
- **`paginateBookV2()`**: Builds the book with single-page stories
- **`getPageSpreadsV2()`**: Pairs pages for desktop spread view

```typescript
// V1: Story might span 2-3 pages
const storyPages = paginateStory(story, pageNumber); // Returns array with multiple pages

// V2: Story always gets 1 page
const storyPages = paginateStoryV2(story, pageNumber); // Always returns array with 1 page
```

### 2. Updated CSS (`app/book-v2/book.css`)

**Key Change**: `.page-content` now scrolls

```css
/* V1: Overflow hidden */
.page-content {
  overflow: hidden;
}

/* V2: Scrollable */
.page-content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Smooth iOS scrolling */
  scroll-behavior: smooth;
}
```

**Additional Features**:
- Custom scrollbar styling
- Scroll fade indicator at bottom
- Smooth momentum scrolling on iOS

### 3. Simplified Page Component (`app/book-v2/page.tsx`)

**Removed**:
- Dynamic pagination logic (no content redistribution)
- `outerHeightWithMargins()` helper
- `pageContent()` helper
- Page balancing algorithms

**Kept**:
- All navigation (keyboard, arrows, swipe)
- Audio playback
- Photo carousels
- TOC and decade markers
- Mobile/desktop responsive layout

## User Experience

### Desktop (Spread View)
- See two pages side by side (two stories)
- Each page independently scrollable if content exceeds height
- No stories wrapping from left page to right page

### Mobile (Single Page View)
- Swipe between pages (one story per page)
- Scroll within current page to see full story
- Faster page transitions (no reflow calculations)

## Benefits

1. **Simpler Mental Model**: One story = One page
2. **No Text Cutoff**: Never lose content between pages
3. **Better Performance**: No dynamic content redistribution
4. **Easier Maintenance**: Less complex pagination logic
5. **Predictable Layout**: Each story is self-contained

## Testing

### To Test Book V2:

1. Navigate to `/book-v2` in your browser
2. Verify each story appears on a single page
3. Scroll within a page to see the full story
4. Check both desktop spread view and mobile single-page view
5. Ensure audio, photos, and lesson learned sections work
6. Test keyboard navigation (Arrow Left/Right)

### Compare with Book V1:

1. Open `/book` in one tab
2. Open `/book-v2` in another tab
3. Notice how V1 wraps long stories across pages
4. Notice how V2 keeps each story on one scrollable page

## Migration Path

If you want to make V2 the production version:

```bash
# Backup current /book
mv app/book app/book-v1-backup

# Promote V2 to production
mv app/book-v2 app/book
```

## Files Modified

- ✅ `/app/book-v2/` - Entire duplicated book directory
- ✅ `/app/book-v2/page.tsx` - Main component (simplified)
- ✅ `/app/book-v2/book.css` - Updated styles (scrollable content)
- ✅ `/lib/bookPaginationV2.ts` - New pagination logic
- ✅ `/BOOK_V2_SCROLLABLE_PAGES.md` - This documentation

## Future Enhancements

- [ ] Add "Top" button when scrolled down in a page
- [ ] Show scroll position indicator within page
- [ ] Sync scroll positions when navigating back to same story
- [ ] Add option to toggle between V1 and V2 modes

