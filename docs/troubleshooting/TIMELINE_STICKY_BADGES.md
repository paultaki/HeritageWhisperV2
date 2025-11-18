# Timeline Sticky Date Badges - Troubleshooting Guide

> **Last Updated:** January 7, 2025
> **Purpose:** Complete reference for fixing sticky date badge issues on desktop Timeline view
> **Context:** These issues recur frequently and require precise troubleshooting

---

## Overview

The desktop Timeline view uses sticky positioning for year badges along the spine. When scrolling, badges stick to the top of the viewport and smoothly transition as the next badge arrives. This system has three common failure modes that break frequently.

---

## Problem 1: Badges Going Under the Header

### Symptom
Date badges slide under the page header, cutting off their top border.

### Root Cause
The `stickyTop` value is too small - badges stick too close to the top of the viewport and overlap with the header.

### How to Fix

**Step 1: Measure the header height**
- Open browser DevTools
- Inspect `DesktopPageHeader` component
- Current header height: **62px**

**Step 2: Calculate desired sticky position**
- Header height: 62px
- Add clearance: 18px (for comfortable spacing)
- Total: **80px** (or adjust as needed)

**Step 3: Update JavaScript variable**

**File:** `/components/timeline/TimelineDesktop.tsx` (line ~1010)
```typescript
const stickyTop = 80; // Header height 62px + 18px clearance
```

**File:** `/components/timeline/TimelineDesktopV2.tsx` (line ~866)
```typescript
const stickyTop = 80; // Header height 62px + 18px clearance
```

**Step 4: Update CSS**

**File:** `/components/timeline/TimelineDesktop.tsx` (line ~1302)
```css
.timeline-dot {
  position: sticky;
  top: 80px;
  z-index: 30;
}
```

**File:** `/components/timeline/TimelineDesktopV2.tsx` (line ~1118)
```css
.timeline-dot {
  position: sticky;
  top: 80px;
  z-index: 30;
}
```

### Critical Requirements
- ⚠️ **JavaScript `stickyTop` and CSS `top` MUST be identical**
- ⚠️ **Update BOTH TimelineDesktop.tsx AND TimelineDesktopV2.tsx**
- ⚠️ If values don't match, collision detection will break

---

## Problem 2: Gap Between Badges During Transition

### Symptom
When scrolling, there's a visible gap between the sticky badge releasing and the next badge arriving.

### Root Cause
Sticky positioning calculates the release point based on **margin edges**, not element edges. Without negative margin, the element releases before the next one arrives.

### How to Fix

**Step 1: Add negative bottom margin**

**File:** `/components/timeline/TimelineDesktop.tsx` (line ~843)
```typescript
<div
  className="z-10 flex-shrink-0 timeline-dot transition-all duration-500"
  style={{
    transform: position === "left" ? "translateX(-12px)" : "translateX(12px)",
    marginBottom: '-40px',  // This pulls the next badge closer
  }}
>
```

**File:** `/components/timeline/TimelineDesktopV2.tsx` (line ~710)
```typescript
<div
  className="z-10 flex-shrink-0 timeline-dot transition-all duration-500"
  style={{
    transform: position === "left" ? "translateX(-12px)" : "translateX(12px)",
    marginBottom: '-40px',  // This pulls the next badge closer
  }}
>
```

**Current value:** `-40px`

**To adjust gap:**
- Gap still visible: INCREASE negative margin (e.g., `-40px` → `-45px`)
- Badges overlapping: DECREASE negative margin (e.g., `-40px` → `-35px`)

### Trade-off: Vertical Alignment

Negative margin affects the vertical position of badges relative to connector lines.

**If badges become misaligned after adjusting margin:**

**File:** `/components/timeline/TimelineDesktop.tsx` (line ~859)
```typescript
style={{
  // ... other styles ...
  position: 'relative',
  top: '-19px',  // Adjust this to re-align with connector lines
}}
```

**File:** `/components/timeline/TimelineDesktopV2.tsx` (line ~727)
```typescript
style={{
  // ... other styles ...
  position: 'relative',
  top: '2px',  // Adjust this to re-align with connector lines
}}
```

**To adjust alignment:**
- Badges too high: INCREASE top value (less negative or more positive)
- Badges too low: DECREASE top value (more negative or less positive)

---

## Problem 3: Badges Fading Too Early

### Symptom
Badge fades out before the next badge collides with it.

### Root Cause
The fade distance threshold is too large - the fade animation starts when badges are still far apart.

### How to Fix

**File:** `/components/timeline/TimelineDesktop.tsx` (line ~1047)
```typescript
} else if (proximityToNext > -38) {
  // Fade out over the last 38px of overlap
  const overlapProgress = Math.abs(proximityToNext) / 38;
  // ...
}
```

**File:** `/components/timeline/TimelineDesktopV2.tsx` (similar location)
```typescript
} else if (proximityToNext > -38) {
  // Fade out over the last 38px of overlap
  const overlapProgress = Math.abs(proximityToNext) / 38;
  // ...
}
```

**Current value:** `-38px`

**To adjust fade timing:**
- Badges hold longer: DECREASE the number (e.g., `-38` → `-30`)
- Badges fade earlier: INCREASE the number (e.g., `-38` → `-50`)

---

## Troubleshooting Checklist

When sticky badges aren't working correctly, check these items in order:

### 1. ✅ Verify Header Height
```bash
# Open browser DevTools
# Inspect DesktopPageHeader component
# Check computed height (should be 62px)
```

### 2. ✅ Check JavaScript/CSS Sync
```bash
# Search for "const stickyTop" in both files
# Search for ".timeline-dot" CSS in both files
# Verify both values are identical (currently 80px)
```

### 3. ✅ Test Browser Zoom
```bash
# Set browser zoom to 100%
# Zoom levels affect pixel measurements
# Cmd+0 (Mac) or Ctrl+0 (Windows) to reset
```

### 4. ✅ Clear Browser Cache
```bash
# Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
# Or clear cache in DevTools Network tab
```

### 5. ✅ Check for CSS Overrides
```bash
# Search codebase for ".timeline-dot" styles
# Look for any conflicting position or top values
# Check global styles that might override
```

### 6. ✅ Verify Negative Margin Values
```bash
# Search for "marginBottom" in timeline components
# Current value: -40px in both files
# Check if badges are vertically aligned with connectors
```

---

## Quick Reference: Current Values

| Setting | TimelineDesktop.tsx | TimelineDesktopV2.tsx | Line Numbers |
|---------|---------------------|----------------------|--------------|
| **stickyTop (JS)** | 80px | 80px | ~1010, ~866 |
| **top (CSS)** | 80px | 80px | ~1302, ~1118 |
| **marginBottom** | -40px | -40px | ~843, ~710 |
| **top offset** | -19px | 2px | ~859, ~727 |
| **fade distance** | -38px | -38px | ~1047, ~similar |

---

## Common Mistakes

### ❌ Updating only one file
- Must update BOTH TimelineDesktop.tsx AND TimelineDesktopV2.tsx
- Values must be identical in both files

### ❌ Updating JS but not CSS (or vice versa)
- JavaScript `stickyTop` and CSS `top` must match exactly
- Mismatch breaks collision detection

### ❌ Forgetting about negative margin side effects
- Negative margin fixes the gap BUT affects vertical alignment
- After adjusting margin, must also adjust `top` offset

### ❌ Testing with browser zoom
- Browser zoom affects pixel calculations
- Always test at 100% zoom level

### ❌ Cached styles
- Old styles can persist after code changes
- Always hard reload after making changes

---

## Files Reference

All changes must be made in these two files:

1. **`/components/timeline/TimelineDesktop.tsx`**
   - JavaScript: `const stickyTop` (~line 1010)
   - CSS: `.timeline-dot { top: ... }` (~line 1302)
   - Inline styles: `marginBottom`, `top` offset (~lines 843, 859)
   - Fade distance: `proximityToNext >` (~line 1047)

2. **`/components/timeline/TimelineDesktopV2.tsx`**
   - JavaScript: `const stickyTop` (~line 866)
   - CSS: `.timeline-dot { top: ... }` (~line 1118)
   - Inline styles: `marginBottom`, `top` offset (~lines 710, 727)
   - Fade distance: `proximityToNext >` (~similar location)

---

## Related Issues

### Mobile Timeline - Decade Headers

Mobile timeline has a similar sticky header issue with decade bands:

- **File:** `/app/styles/components.css` (lines ~107-109)
- **Issue:** Decade headers unstick too early
- **Fix:** Set `.hw-decade-band` margins to `0px`
- **Why:** Sticky positioning calculates release based on margin edges

See CLAUDE.md for mobile-specific troubleshooting.

---

## Testing After Changes

1. **Visual Test:**
   - Scroll slowly through timeline
   - Verify badges stick at correct position below header
   - Verify no gap between badges during transition
   - Verify badges fade smoothly before next arrives

2. **Measurement Test:**
   - Use browser DevTools ruler tool
   - Measure distance from top of viewport to badge
   - Should match `stickyTop` value exactly

3. **Alignment Test:**
   - Check that badges align with connector lines
   - Connectors extend from 50% height of memory cards
   - Badges should be vertically centered on connectors

4. **Edge Cases:**
   - Test with very long story titles
   - Test with rapid scrolling
   - Test at different screen widths (1280px, 1440px, 1920px)

---

_For general development guidelines, see CLAUDE.md_
_For historical context on this feature, see CLAUDE_HISTORY.md_
