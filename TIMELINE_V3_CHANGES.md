# Timeline V3 - Museum-Style Design Changes

## Overview
Timeline V3 implements a subtle, museum-exhibition aesthetic for decade markers while keeping story cards as the primary visual focus.

## Access
- **V3 Timeline**: `/timeline-v3`
- **Current Timeline** (for comparison): `/timeline`

## Key Changes

### 1. **Vertical Timeline Ruler** 
Replaced thick progress line with a subtle ruler:
- **Width**: Reduced from 2px to 1.5px (desktop)
- **Opacity**: 60% with lighter background color
- **Color**: `rgba(107, 114, 128, 0.25)` (light mode), `rgba(176, 179, 184, 0.25)` (dark mode)
- **Shadow**: Removed (was previously prominent)
- **Effect**: Line recedes into the background, serving as ambient context rather than a focal point

### 2. **Decade Labels** (New Component: `DecadeLabel`)
Replaced bulky gray pill markers with minimal text labels:
- **Typography**: 
  - Font: System sans-serif (11px)
  - Weight: 500
  - Letter spacing: 0.5px
  - Transform: Uppercase
- **Color**: Gray with 40-45% opacity
- **Position**: To the right of the vertical line
- **Spacing**: 60px height with 20px bottom margin
- **Visual hierarchy**: z-index 0 (behind cards)

### 3. **Story Card Date Bubbles** (Simplified)
Removed decade marker styling from cards:
- **Before**: Cards could show decade labels (1980s, 1990s, etc.) with gray backgrounds
- **After**: All cards show only the year in consistent styling
- **Effect**: Eliminates visual competition between cards and decade markers

### 4. **Removed Features**
- ❌ Standalone `DecadeBanner` component (gray pills)
- ❌ Conditional decade marker logic on first card of each decade
- ❌ Special styling for decade-transition cards

## Design Philosophy

### Museum Exhibition Aesthetic
The new design treats the timeline like a museum wall:
- **Story cards** = Primary exhibits (rich, detailed, high contrast)
- **Decade labels** = Small plaques on the wall (subtle, ambient)
- **Timeline ruler** = Architectural element (barely visible, structural)

### Visual Hierarchy
1. **Primary**: Story cards with photos, titles, content
2. **Secondary**: Year bubbles on each card
3. **Tertiary**: Decade labels (ambient context)
4. **Background**: Vertical ruler (structural support)

## Technical Implementation

### Files Modified
- ✅ `components/timeline/TimelineDesktopV3.tsx` (new file, copy of original)
- ✅ `app/timeline-v3/page.tsx` (updated to use V3 component)

### Key Code Changes

#### Decade Label Component
```tsx
function DecadeLabel({ decade, isDark = false }: DecadeLabelProps) {
  return (
    <div style={{ height: '60px', marginBottom: '20px' }}>
      <div style={{
        left: '50%',
        transform: 'translateX(calc(-50% - 95px))',
        opacity: isDark ? 0.4 : 0.45,
      }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.5px',
          color: isDark ? '#b0b3b8' : '#6b7280',
          textTransform: 'uppercase',
        }}>
          {decadeNum}s
        </span>
      </div>
    </div>
  );
}
```

#### Subtle Timeline Ruler
```tsx
<div
  className="absolute left-1/2 md:w-[1.5px] w-[2px]"
  style={{
    backgroundColor: isDark ? 'rgba(176, 179, 184, 0.25)' : 'rgba(107, 114, 128, 0.25)',
    opacity: 0.6,
  }}
>
  {/* Progress indicator with no shadow */}
</div>
```

## Testing Checklist

Compare `/timeline` vs `/timeline-v3`:

- [ ] Decade labels are subtle and don't compete with cards
- [ ] Vertical line is thinner and less prominent
- [ ] Story cards remain visually dominant
- [ ] Decade transitions are still clear but understated
- [ ] Dark mode maintains subtle aesthetic
- [ ] Mobile view maintains functionality (uses same TimelineMobile component)
- [ ] No visual "clutter" from decade markers
- [ ] Overall feel is more refined and museum-like

## Best Practices Applied

Based on research from:
- React vertical timeline patterns (react-vertical-timeline-component)
- Museum exhibition timeline designs
- Minimal UI/ambient information design
- CSS layering and z-index hierarchy
- Typography hierarchy for data visualization

## Next Steps

If V3 is approved:
1. Consider applying to TimelineMobile component
2. May replace main `/timeline` route
3. Could adjust decade label position based on user feedback
4. Option to adjust opacity/size further if needed

## Rollback

To revert to current design:
- Timeline V3 is isolated in its own files
- Main `/timeline` route unchanged
- Can delete V3 files without affecting production timeline

