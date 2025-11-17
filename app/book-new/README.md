# Mobile Book View V2

A modern, touch-friendly mobile book reading experience with horizontal page swiping, audio playback, and decade-grouped table of contents.

## 📌 Current Status & Usage

**Status:** ✅ **ACTIVE IN PRODUCTION** (as of November 2025)

**How it's used:**
- The `MobileBookViewV2` component is **imported and used by `/app/book/page.tsx`** (line 18)
- Renders for **mobile and tablet devices** (`lg:hidden` breakpoint)
- Desktop users see a different dual-page book layout
- This route (`/book-new`) exists as a **standalone testing route** but is NOT linked in navigation

**Navigation:**
- Primary route: `/book` (uses MobileBookViewV2 internally for mobile)
- Testing route: `/book-new` (direct access to mobile view)

**Recommendation:** Use `/book` as the primary route. The `/book-new` route can be kept for testing mobile-specific features without desktop interference.

## 📁 File Structure

```
/app/book-new/
├── page.tsx                        # Main route (client component)
├── README.md                       # This file
└── components/
    ├── types.ts                    # TypeScript interfaces
    ├── MobileBookViewV2.tsx        # Main container component
    ├── BookPageCard.tsx            # Individual story page
    ├── BookAudioPlayer.tsx         # Audio player with scrubbing
    ├── BookTableOfContents.tsx     # Top-sliding TOC drawer
    ├── BookTopBar.tsx              # Header with navigation
    └── NavigationArrows.tsx        # Left/right arrow buttons
```

## 🎯 Features

### Core Functionality
- ✅ Horizontal page swiping with snap scrolling
- ✅ Vertical scrolling within each page for long content
- ✅ Touch-friendly navigation (swipe, tap edges, arrows)
- ✅ Audio player with scrubbing and progress indicator
- ✅ Decade-grouped table of contents
- ✅ Family sharing support via account context
- ✅ Continue reading hint when content overflows
- ✅ Safe area insets for iOS notch support

### Design Features
- ✅ Dark gradient background (neutral-900 → neutral-950)
- ✅ Stone-colored page cards with rounded corners
- ✅ Hero images with 16:10 aspect ratio
- ✅ Responsive typography (26px mobile, 32px desktop)
- ✅ Translucent bottom navigation with backdrop blur
- ✅ Smooth page transitions with momentum scrolling

## 🔧 Technical Implementation

### Data Flow

```typescript
page.tsx (Client Component)
  ↓
  useAuth() → Check authentication
  ↓
MobileBookViewV2
  ↓
  useAccountContext() → Get active storyteller
  ↓
  useQuery("/api/stories") → Fetch stories
  ↓
  Filter: includeInBook === true
  ↓
  Sort by storyYear, storyDate
  ↓
  Map to BookPageCard components
```

### Key Technologies
- **Framework:** Next.js 15 App Router (client component)
- **State Management:** TanStack Query v5
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Audio:** HTML5 Audio API with custom controls
- **Multi-tenant:** useAccountContext for family sharing

### Component Architecture

#### 1. MobileBookViewV2 (Container)
**Responsibilities:**
- Fetch and filter stories
- Manage horizontal scroll state
- Coordinate child components
- Handle account context

**Key State:**
- `currentIndex` - Current page number
- `isTocOpen` - Table of contents visibility
- `bookStories` - Filtered and sorted stories

#### 2. BookPageCard (Story Display)
**Responsibilities:**
- Render story content with vertical scrolling
- Show/hide "Continue reading" hint
- Display audio player, images, and text
- Handle overflow detection

**Key Features:**
- ResizeObserver for overflow detection
- Scroll event listener for hint visibility
- Paragraph splitting for transcription
- Lesson learned callout styling

#### 3. BookAudioPlayer (Media Control)
**Responsibilities:**
- Play/pause audio
- Scrubbing with mouse and touch
- Time display (current/duration)
- Progress visualization

**Key Implementation:**
- Global mouse/touch event listeners for dragging
- Percentage-based seeking
- Constant-time formatTime() function

#### 4. BookTableOfContents (Navigation)
**Responsibilities:**
- Group stories by decade
- Display thumbnails and metadata
- Handle story selection
- Slide animation from top

**Key Features:**
- Decade grouping algorithm
- Backdrop click to close
- Smooth slide-down animation

#### 5. BookTopBar (Header)
**Responsibilities:**
- Display user avatar and book title
- Navigation buttons (Timeline, Edit, TOC)
- Safe area inset support

#### 6. NavigationArrows (Page Navigation)
**Responsibilities:**
- Show/hide based on current page
- Handle previous/next page clicks
- Touch-friendly 44x44px buttons

## 📊 Data Structure

### BookStory Interface
```typescript
interface BookStory extends Story {
  storyYear: number;        // Required for book inclusion
  transcription: string;    // Required for book inclusion
}
```

### DecadeGroup Interface
```typescript
interface DecadeGroup {
  decade: string;          // e.g., "1940s", "1950s"
  stories: BookStory[];
}
```

## 🎨 Design System

### Colors
- **Background:** neutral-900, neutral-950 (gradient)
- **Page Cards:** stone-50
- **Text:** stone-900, stone-800, stone-500
- **Audio Controls:** stone-900 buttons, stone-200 track
- **Navigation:** black/40 with white/10 ring

### Typography
- **Title:** 26px mobile, 32px desktop (font-semibold)
- **Metadata:** 15px (text-stone-500)
- **Body Text:** 17px with 32px line height (leading-8)
- **TOC:** 15px titles, 11px metadata

### Spacing
- **Page Padding:** 12px horizontal, 20px vertical
- **Image Margins:** 12px sides, 12px top
- **Content Padding:** 20px horizontal
- **Audio Player:** 20px top margin

## 🔐 Security & Privacy

### Authentication
- Redirects to `/auth/login` if not authenticated
- Uses `useAuth()` hook for session management
- Loading state while checking authentication

### Multi-Tenant Support
- Uses `useAccountContext()` for storyteller selection
- Queries stories with `storyteller_id` parameter
- Supports viewing family members' books

### Data Filtering
- Only stories with `includeInBook === true` are shown
- Stories must have both `storyYear` and `transcription`
- Empty state shown if no qualifying stories

## 📱 Mobile Optimization

### Touch Interactions
- **Horizontal Swipe:** Page navigation
- **Vertical Scroll:** Within page content
- **Tap Edges:** Previous/next page (via arrows)
- **Audio Scrubbing:** Touch-dragging on progress bar

### Responsive Design
- **100dvh:** Dynamic viewport height (accounts for mobile chrome)
- **Safe Area Insets:** Support for iOS notch/home indicator
- **Backdrop Blur:** GPU-accelerated on modern devices
- **Snap Scrolling:** Native CSS scroll-snap for performance

### Performance
- **Lazy Loading:** Images load with priority flag on active page
- **Efficient Queries:** TanStack Query caching
- **Memoization:** useMemo for expensive computations
- **Debounced Scroll:** RAF-based scroll event handling

## 🚀 Usage

### Accessing the View
Navigate to `/book-new` while authenticated.

### Navigation Methods
1. **Swipe:** Horizontal swipe left/right
2. **Arrows:** Tap chevron buttons on sides
3. **TOC:** Tap menu icon → Select story

### Audio Playback
1. Tap play button on any story
2. Drag progress bar to seek
3. Other players auto-pause when one starts

### Account Switching
Use the account switcher (if family sharing is enabled) to view different storytellers' books.

## 🔄 Differences from SimpleMobileBookView

| Feature | SimpleMobileBookView | MobileBookViewV2 |
|---------|---------------------|------------------|
| **Navigation** | Tap zones + arrows | Swipe + tap + arrows |
| **TOC** | Bottom sheet | Top sheet (slide down) |
| **Styling** | Light/dark mode toggle | Always dark premium theme |
| **Audio Player** | Basic controls | Enhanced scrubbing |
| **Header** | Static bar | Translucent with blur |
| **Bottom Nav** | Old style (border-top) | New style (rounded, blur) |
| **Decade Grouping** | In TOC only | In TOC only (V2 matches V1) |
| **Family Sharing** | Partial support | Full useAccountContext |

## 🐛 Known Issues & Limitations

### Current Limitations
- Edit button is placeholder (console.log only)
- No gesture conflict detection
- No page preloading (performance opportunity)
- No offline support

### Future Enhancements
- [ ] Edit button functionality (navigate to edit view)
- [ ] Page preloading for smoother transitions
- [ ] Gesture velocity detection for momentum scrolling
- [ ] Offline reading with service worker
- [ ] Reading progress persistence
- [ ] Bookmarks and annotations
- [ ] Share individual pages
- [ ] Print individual pages

## 📝 Development Notes

### Adding New Features

**Adding a new component:**
1. Create file in `components/` directory
2. Add TypeScript interface to `types.ts`
3. Import and use in `MobileBookViewV2.tsx`

**Modifying story filtering:**
1. Update filter logic in `MobileBookViewV2.tsx` (line 31)
2. Adjust `BookStory` interface if needed

**Changing navigation behavior:**
1. Modify `handleScroll` in `MobileBookViewV2.tsx`
2. Update `NavigationArrows` visibility logic

### Testing Checklist

- [ ] Horizontal swiping works smoothly
- [ ] Vertical scrolling within pages
- [ ] Audio player plays/pauses correctly
- [ ] Audio scrubbing works (mouse and touch)
- [ ] TOC opens/closes with animation
- [ ] TOC story selection jumps to correct page
- [ ] Arrow buttons show/hide correctly
- [ ] Family account switching works
- [ ] Empty state displays when no stories
- [ ] Loading state shows while fetching
- [ ] Safe area insets work on iOS
- [ ] Continue reading hint appears/disappears
- [ ] Lesson learned callouts display correctly

## 🎓 Code Patterns

### Date Handling
```typescript
// Always handle both string and Date types
dateTime={typeof story.storyDate === 'string'
  ? story.storyDate
  : story.storyDate.toISOString()}
```

### Safe Property Access
```typescript
// Use optional chaining for context properties
const name = activeContext?.storytellerName || "User";
```

### Time Formatting
```typescript
// Pad seconds with leading zero
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
```

### Scroll Synchronization
```typescript
// Use RAF for smooth scroll handling
const handleScroll = useCallback(() => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    // Update UI based on scroll position
  });
}, []);
```

## 📚 Related Documentation

- **Project Overview:** `/CLAUDE.md`
- **Data Model:** `/DATA_MODEL.md`
- **Family Sharing:** `/FAMILY_SHARING_README.md`
- **Original Book View:** `/app/book/README.md`

## 🔗 Integration Points

### API Endpoints Used
- `GET /api/stories?storyteller_id={id}` - Fetch stories

### Hooks Used
- `useAuth()` - Authentication state
- `useAccountContext()` - Multi-tenant context
- `useQuery()` - Data fetching (TanStack Query)
- `useRouter()` - Navigation

### Shared Components Used
- `MobileNavigation` - Bottom navigation bar (updated design)

---

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Last Updated:** November 2, 2025
**Author:** Paul Takisaki
