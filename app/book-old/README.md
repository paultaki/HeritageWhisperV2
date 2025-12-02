# Book V4 - Premium 3D Book Design

## Overview
A complete redesign of the book view with premium 3D perspective, page stacking effects, and dual-page spread layout.

## Features

### Desktop
- **Dual-page spread** with realistic 3D perspective
- **Page stack layers** behind main pages (3 layers with progressive opacity)
- **Spine binding** with decorative elements
- **Scrollable content** within each page (hidden scrollbars)
- **Progress bar** at top showing scroll progress
- **Table of contents** drawer
- **Click margins** to navigate between spreads
- **Paper textures** and vignettes for realism

### Mobile
- **Single-page view** with horizontal swipe
- **Snap scrolling** for smooth navigation
- **Touch-friendly controls** with arrow buttons
- **Same premium styling** adapted for mobile

## Design Elements

### Colors
- Dark background: `#0b0d12`
- Indigo accents: `#6366f1`, `#818cf8`
- Page color: `#fafaf9` (neutral-50)
- Book cover: Brown leather gradient (`#2e1f14` → `#1f150d`)

### 3D Effects
- Perspective: `2000px`
- Page rotation: `rotateY(±3deg)`
- Stacked pages with translate transforms
- Ground shadow with blur
- Gutter shadows (inner spine shadows)

## Data Flow

```
API (/api/stories)
  ↓
Filter (includeInBook && storyYear && transcription)
  ↓
Sort by storyYear
  ↓
Split into spreads (pairs)
  ↓
Render LeftPage + RightPage
```

## Components

### Main: `BookV4Page`
- Fetches stories from API
- Manages current spread index
- Handles navigation and scroll progress

### `LeftPage` & `RightPage`
- Renders 3D page with stack layers
- Contains scrollable `StoryContent`
- Page numbers
- Paper textures

### `StoryContent`
- Title, year, age
- Photos with captions
- Story transcription (split into paragraphs)
- Lesson learned callout

### `MobileView` & `MobilePage`
- Horizontal scroll container
- Individual mobile pages with snap
- Same content, mobile-optimized

## Navigation

- **Desktop spreads**: Click left/right margins (8% width)
- **Mobile**: Swipe or use arrow buttons
- **Table of Contents**: Jump to specific stories
- **Progress bar**: Shows scroll position within current page

## Accessing

Visit: `http://localhost:3000/book-v4`

## Differences from Original Book

| Feature | Original (/book) | Book V4 |
|---------|------------------|---------|
| Layout | Single vertical scroll | Dual-page spreads |
| Navigation | Arrow keys, scroll | Click margins, spreads |
| Design | Flat pages | 3D perspective book |
| Background | Cream | Dark (#0b0d12) |
| Mobile | Responsive columns | Swipeable pages |
| Progress | Sidebar | Top bar |
| Editing | Not editable (was in HTML) | Read-only |

## Story Data Required

Each story needs:
- `title` - Story title
- `storyYear` - Year of the story
- `transcription` - Story content
- `includeInBook` - Must not be false
- Optional:
  - `lifeAge` - Age at time of story
  - `photos[]` - Array with `url`, `caption`
  - `wisdomClipText` - Lesson learned

## Styling

All styles use Tailwind CSS with custom classes for:
- 3D transforms (`[transform-style:preserve-3d]`)
- Perspective (`[perspective:2000px]`)
- Aspect ratios (`aspect-[110/85]`, `aspect-[55/85]`)
- Hidden scrollbars (`js-flow` class in book.css)

## Future Enhancements

Potential additions:
- [ ] Keyboard navigation (arrow keys)
- [ ] Page flip animations
- [ ] Print-friendly export
- [ ] Edit mode (if needed)
- [ ] Audio player integration
- [ ] Search within book
- [ ] Bookmarks
- [ ] Night mode toggle
