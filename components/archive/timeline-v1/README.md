# Timeline V1 Archive

**Archived:** December 8, 2025

## What This Is

Original timeline implementation with inline audio playback on Timeline cards. This version has a "split affordance" UX issue where cards have two competing tap targets:
1. Play button → plays audio inline on Timeline
2. Card tap → navigates to Book View

User feedback indicated family viewers weren't discovering Book View because they hit play, listened, and never saw the richer written content.

## Why It Was Archived

We simplified to a single-action pattern:
- Entire card is now one tap target → Book View
- Audio auto-plays when you arrive at Book View
- Better for seniors (simpler mental model, fewer choices)

## How to Restore

If you need to restore this version:

1. Copy `components/` contents back to `/components/timeline/`
2. Copy `hooks/` contents back to `/hooks/`
3. Copy `types/timeline.ts` back to `/types/timeline.ts`
4. Copy `app-timeline/page.tsx` back to `/app/timeline/page.tsx`

## Files Included

### Components (14 files)
- `TimelineMobileV2.tsx` - Main mobile timeline layout
- `TimelineDesktop.tsx` - Main desktop timeline layout
- `MemoryCard.tsx` - Story card with inline audio playback
- `TimelineDecadeSection.tsx` - Decade section container
- `TimelineCardV2.tsx` - Alternative card style
- `TimelineHeader.tsx` - Sticky page header
- `TimelineEnd.tsx` - Timeline ending section
- `AddMemoryCard.tsx` - Add memory CTA card
- `StarterMemoryCard.tsx` - Template cards for new users
- `PlayPillButton.tsx` - Audio play progress button
- `PlayPillButton.module.css` - CSS module for play button
- `YearScrubber.tsx` - Mobile year navigator
- `TimelineNearEndNudge.tsx` - End-of-timeline prompt
- `FloatingAddButton.tsx` - Desktop floating action button

### Hooks (3 files)
- `use-timeline-data.tsx` - Data fetching & decade grouping
- `use-timeline-navigation.tsx` - Scroll tracking & highlights
- `use-timeline-ui.tsx` - Color scheme & UI state

### Types (1 file)
- `timeline.ts` - All Timeline type definitions

### Page (1 file)
- `page.tsx` - Timeline route entry point

## Related Documentation

- `/DESIGN_GUIDELINES.md` - Design system rules
- `/docs/architecture/DATA_MODEL.md` - Database schema
- `/CLAUDE_HISTORY.md` - Historical fixes and decisions
