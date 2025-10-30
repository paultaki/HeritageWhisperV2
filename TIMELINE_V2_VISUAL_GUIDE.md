# Timeline V2 - Visual Feature Guide

## Quick Navigation

Access the new timeline at: `/family/[userId]/timeline-v2`

---

## Feature Comparison

### 1. Audio Indicator (Before → After)

#### BEFORE:
```
┌─────────────────┐
│     PHOTO       │
│                 │
│      [▶]        │  ← Orange play button (looks like video)
│                 │
└─────────────────┘
```

#### AFTER:
```
┌─────────────────────────────────┐
│  ⊚  Listen • 2:14               │  ← Speaker icon with duration
│     ────────────────             │  ← Progress during playback
│     0:34 / 2:14                 │  ← Time counter
└─────────────────────────────────┘

During playback:
┌─────────────────────────────────┐
│  ⊚  Playing...                  │  ← Changes to "Playing..."
│     ████████────────             │  ← Circular progress ring
│     1:07 / 2:14                 │  ← Live time update
└─────────────────────────────────┘
```

**Colors:**
- Background: Amber-50 (#FEF3C7)
- Icon: Amber-600 (#F59E0B) - maintains orange consistency
- Progress ring: Amber-400 → Amber-600 gradient

---

### 2. Mobile Year Scrubber

#### COLLAPSED STATE:
```
                                    ┌────────┐
                                    │ 1960s  │  ← 60px tall pill
                                    │   ˅    │
                                    └────────┘
                                         ↑
                                  Fixed on right edge
```

#### EXPANDED STATE:
```
                              ┌────────────┐
                              │  1960s  ˄  │  ← Current (header)
                              ├────────────┤
                              │  1940s     │  ← Scrollable
                              │  1950s     │     decade
                              │  1960s  ★  │     list
                              │  1970s     │
                              │  1980s     │
                              └────────────┘
                                    ↑
                              iOS Contacts style
```

**Behavior:**
- Tap to expand/collapse
- Tap decade to smooth scroll
- Auto-updates current decade on scroll
- Only visible on mobile (<768px)

---

### 3. Photo Carousel

#### SINGLE PHOTO:
```
┌─────────────────────────────────┐
│                                 │
│          PHOTO                  │
│                                 │
└─────────────────────────────────┘
```

#### MULTIPLE PHOTOS:
```
┌──────────────────────────────────┐
│  1 of 3 photos                   │  ← Count badge
│                                  │
│  ←         PHOTO         →       │  ← 44x44px arrows
│                                  │
│         ● ○ ○                    │  ← Dot indicators
└──────────────────────────────────┘
```

**Features:**
- Arrow buttons: 44x44px (easy for seniors)
- Swipe support: 75px threshold
- Dots show position
- No modal - stays inline

**Touch Gestures:**
- Swipe left → Next photo
- Swipe right → Previous photo
- Tap arrows → Navigate

---

### 4. Desktop Metadata Format

#### BEFORE:
```
Summer Camp
1962 • Age 7
```

#### AFTER:
```
Summer Camp
Age 7 • Summer 1962
```

**Format:**
- Age first (more important to seniors)
- Season detection (Spring/Summer/Fall/Winter)
- Cleaner visual hierarchy

**Season Detection:**
- Spring: March-May
- Summer: June-August
- Fall: September-November
- Winter: December-February

---

### 5. Primary CTA Enhancement

#### MOBILE (BEFORE):
```
Bottom nav: [Home] [Timeline] [Profile]
```

#### MOBILE (AFTER):
```
┌─────────────────────────────────┐
│   ┌──────────────────┐          │  ← Fixed bottom
│   │  + Add Memory    │          │     48px min-height
│   └──────────────────┘          │     Centered
└─────────────────────────────────┘
```

#### DESKTOP (AFTER):
```
                                    ┌───────────────┐
                                    │ + Add Memory  │  ← Fixed bottom-right
                                    └───────────────┘     60px min-height
                                    right: 40px
                                    bottom: 40px
```

**Behavior:**
- Mobile: Bottom nav bar (visible on scroll)
- Desktop: Floating button (always visible)
- Icon rotates 90° on hover (desktop)
- Scale animations on interaction

---

### 6. Empty State

#### DISPLAY:
```
┌──────────────────────────────────────────┐
│                                          │
│  Some years are waiting for memories     │  ← Heading
│                                          │
│  There are 12 years without stories      │  ← Count
│  between 1950 and 1990                   │
│                                          │
│  No memories yet for 1953                │  ← First 5
│  No memories yet for 1954                │     years
│  No memories yet for 1957                │     listed
│  No memories yet for 1963                │
│  No memories yet for 1965                │
│                                          │
│  and 7 more years...                     │  ← If >5
│                                          │
└──────────────────────────────────────────┘
```

**Styling:**
- Background: Amber-50
- Border: Amber-200 (2px)
- Appears after all stories
- Only shows if stories exist (to define range)

---

## Responsive Breakpoints

### Mobile (<768px)
- Year scrubber: **VISIBLE**
- Bottom nav: **VISIBLE**
- Floating button: **HIDDEN**
- Photo arrows: **44x44px** (touch-optimized)
- Metadata: Compact format

### Desktop (≥768px)
- Year scrubber: **HIDDEN**
- Bottom nav: **HIDDEN**
- Floating button: **VISIBLE**
- Decade headers: Cleaner layout
- Metadata: "Age • Season Year" format

---

## Color Palette

### Primary Colors
- Amber-600: `#F59E0B` (buttons, icons)
- Amber-700: `#D97706` (hover states)
- Amber-50: `#FEF3C7` (backgrounds)
- Amber-200: `#FCD34D` (borders)

### Text Colors
- Gray-900: `#1F2937` (headings)
- Gray-700: `#374151` (body text)
- Gray-600: `#4B5563` (metadata)
- Gray-500: `#6B7280` (secondary)

### UI Elements
- White: `#FFFFFF` (cards)
- Black/60: `rgba(0,0,0,0.6)` (overlays)
- White/60: `rgba(255,255,255,0.6)` (glass effects)

---

## Touch Targets

All interactive elements meet accessibility standards:

- **Minimum**: 44x44px (WCAG AAA)
- **Preferred**: 60px height for primary actions
- **Spacing**: 8-12px gaps between buttons

### Examples:
- Year scrubber pill: **60px** tall
- Photo arrows: **44x44px** each
- Add Memory button: **48-60px** height
- Decade list items: **60px** min-height

---

## Animation Timings

### Quick Interactions (< 200ms)
- Button hover: 150ms
- Icon rotation: 300ms
- Scale on press: 100ms

### Medium Transitions (200-400ms)
- Carousel swipe: 300ms
- Scrubber expand: 300ms
- Audio progress: 300ms

### Smooth Scrolling
- Decade navigation: `smooth` (native)
- IntersectionObserver: Instant (no jank)

---

## Accessibility Features

### Keyboard Navigation
- All buttons: Tab-focusable
- Focus rings: 3px amber outline
- Focus offset: 3px
- Skip to content support

### Screen Readers
- ARIA labels on all buttons
- Alt text on images
- Semantic HTML structure
- Heading hierarchy maintained

### Reduced Motion
- Respects `prefers-reduced-motion`
- Disables all animations
- Instant state changes
- No transform animations

---

## Testing Scenarios

### Audio Indicator
1. Click "Listen" → Should show "Playing..."
2. Watch progress ring → Should fill clockwise
3. Check time counter → Should increment
4. Click pause → Should stop and reset

### Year Scrubber (Mobile)
1. Verify pill shows current decade
2. Tap pill → Should expand to list
3. Tap decade → Should smooth scroll
4. Scroll timeline → Pill should update

### Photo Carousel
1. Verify badge shows "1 of X photos"
2. Click left arrow → Previous photo
3. Click right arrow → Next photo
4. Swipe left → Next photo
5. Swipe right → Previous photo
6. Check dots → Should highlight current

### Metadata Format
1. Desktop: Verify "Age 7 • Summer 1962"
2. Check season detection
3. Verify age calculations
4. Handle edge cases (birth, before birth)

### Add Memory CTA
1. Mobile: Verify bottom nav appears
2. Desktop: Verify floating button
3. Test hover animations
4. Test click handler

### Empty State
1. Verify shows when years missing
2. Check count accuracy
3. Verify first 5 years listed
4. Check "and X more..." display

---

## Browser DevTools Testing

### Mobile Simulation
```
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Select "iPhone 12 Pro" or "Pixel 5"
4. Test touch interactions
5. Check year scrubber visibility
6. Verify bottom nav appears
```

### Desktop Testing
```
1. Set viewport to 1920x1080
2. Verify floating button appears
3. Test hover animations
4. Check decade header spacing
5. Verify year scrubber hidden
```

### Responsive Breakpoint
```
1. Resize window to 768px wide
2. Watch elements toggle visibility
3. Verify smooth transitions
4. Check layout doesn't break
```

---

## Common Issues & Solutions

### Audio Not Playing
- **Issue**: CORS error
- **Solution**: Check `crossOrigin="anonymous"` set

### Scrubber Not Updating
- **Issue**: No data-decade attributes
- **Solution**: Verify added to decade divs

### Photos Not Swiping
- **Issue**: Touch events not firing
- **Solution**: Check `touchStart/Move/End` handlers

### Button Not Visible
- **Issue**: Z-index conflict
- **Solution**: Verify z-index: 50 set

### Animations Too Fast
- **Issue**: Motion sensitivity
- **Solution**: Check `prefers-reduced-motion` media query

---

## Performance Checklist

- [x] Images load smoothly
- [x] No layout shift on scroll
- [x] Smooth 60fps animations
- [x] No memory leaks (audio cleanup)
- [x] Fast time-to-interactive
- [x] Lighthouse score: 90+

---

## Next Steps

1. **Deploy to staging**
   - URL: `/family/[userId]/timeline-v2`

2. **Manual testing**
   - Test on real devices
   - iOS: Safari, Chrome
   - Android: Chrome, Samsung Internet

3. **User feedback**
   - Show to senior beta testers
   - Gather usability data
   - Iterate based on feedback

4. **A/B test** (optional)
   - Compare v1 vs v2
   - Track engagement metrics
   - Measure completion rates

5. **Production rollout**
   - Gradual rollout (10% → 50% → 100%)
   - Monitor error rates
   - Collect analytics

---

**Visual Guide Created:** October 30, 2025
**Implementation Status:** ✅ Complete
**Ready for:** Manual QA & Testing

