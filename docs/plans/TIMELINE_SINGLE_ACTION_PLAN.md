# Plan: Timeline Single-Action Cards for Family Viewers

**Date:** December 8, 2025
**Status:** Awaiting Approval

---

## Problem Statement

Timeline cards have **two competing tap targets**:
1. **Play button** → plays audio inline on Timeline
2. **Card body** → navigates to Book View

User feedback: Family viewers hit play, listen, and never discover Book View exists. The written content (often richer than audio) goes unseen.

This violates senior UX principles (one action per panel, fewer visible choices).

---

## Current Implementation Analysis

### 1. MemoryCard.tsx Click Handling

**Play button** (`handlePlayAudio`, lines 243-336):
- Calls `e.stopPropagation()` to prevent card navigation
- Manages audio state via `audioManager` singleton
- Shows `PlayPillButton` component with progress ring

**Card click** (`handleCardClick`, lines 356-376):
- Stores navigation context in `sessionStorage`
- Navigates: `router.push(\`/book?storyId=${story.id}\`)`

**Play button locations**:
- **Non-V2:** Overlaid on photo (lines 700-761) - 44px circular button
- **V2 mode:** In card body (lines 793-798) - `PlayPillButton` component

### 2. Book View URL Parameters

`app/book/page.tsx` (line 99):
```typescript
const urlStoryId = searchParams?.get('storyId') || undefined;
```

Navigation effect (lines 555-588):
- Finds story spread, sets `currentSpreadIndex`
- Opens book: `setIsBookOpen(true)`
- Clears URL: `window.history.replaceState({}, '', '/book')`

### 3. Audio in Book View

**Desktop:** `WaveformAudioPlayer` component
- Manual play only (no autoplay prop)
- Has `onPlayStateChange` callback

**Mobile:** `MobileBookViewV2` → `BookPageRenderer` → `BookStoryPage`
- Similar manual play pattern
- No autoplay mechanism exists

---

## Proposed Changes

### Phase 1: Add Viewer Role Detection

**File:** `components/timeline/MemoryCard.tsx`

Add new prop to detect if user is a family viewer (not the storyteller):
```typescript
interface MemoryCardProps {
  // ... existing props
  isViewerMode?: boolean; // true for family viewers
}
```

Pass this from parent components (`TimelineMobileV2.tsx`, `TimelineDesktop.tsx`) using:
```typescript
const { activeContext } = useAccountContext();
const isViewerMode = activeContext?.type === 'viewer';
```

### Phase 2: Modify MemoryCard for Single-Action

**Condition:** When `isViewerMode === true`:

1. **Remove play button overlay** from photo area
2. **Remove PlayPillButton** from card body
3. **Keep duration badge** (shows "2:34" without play affordance)
4. **Card click** navigates with autoplay flag:
   ```typescript
   router.push(`/book?storyId=${story.id}&autoplay=1`);
   ```

**Visual changes:**
- Replace play button with a simple duration badge (non-interactive)
- Entire card remains one tap target
- Preserve existing card styling (photo, title, date, border)

### Phase 3: Book View Autoplay Detection

**File:** `app/book/page.tsx`

Add autoplay detection:
```typescript
const urlStoryId = searchParams?.get('storyId') || undefined;
const autoplay = searchParams?.get('autoplay') === '1';

// After navigation, trigger autoplay
useEffect(() => {
  if (autoplay && urlStoryId && !isLoading) {
    // Clear autoplay flag from URL to prevent re-trigger
    window.history.replaceState({}, '', '/book');

    // Signal autoplay to the audio player
    setAutoplayTriggered(true);
  }
}, [autoplay, urlStoryId, isLoading]);
```

**File:** `app/book/components/BookPageV4.tsx`

Add autoplay prop to `WaveformAudioPlayer`:
```typescript
<WaveformAudioPlayer
  src={story.audioUrl}
  autoplay={autoplayTriggered && story.id === targetStoryId}
/>
```

**File:** `app/book/components/WaveformAudioPlayer.tsx`

Add autoplay support:
```typescript
interface WaveformAudioPlayerProps {
  // ... existing
  autoplay?: boolean;
}

// In useEffect:
useEffect(() => {
  if (autoplay && audioRef.current) {
    audioRef.current.play().catch(() => {
      // Silently fail if browser blocks autoplay
    });
  }
}, [autoplay]);
```

### Phase 4: Mobile Book View Autoplay

**File:** `app/book-new/components/MobileBookViewV2.tsx`

Same pattern - detect `autoplay=1`, pass to `BookPageRenderer`.

**File:** `app/book-new/components/BookStoryPage.tsx`

Add autoplay handling to the mobile audio player.

---

## Hit Target Compliance (DESIGN_GUIDELINES.md)

Current sizes:
- PlayPillButton: 44px (below 48px minimum)
- Photo overlay play button: 44px

**No changes needed** because we're removing the play button, not resizing it.

The entire card remains the tap target, which is already well above 48px.

---

## Accessibility Considerations

### Keyboard Navigation
- **Current:** Tab focuses card, then play button separately
- **New (viewer mode):** Tab focuses card only
- **Spacebar/Enter:** Navigates to Book View

### Screen Readers
- **Current:** "Card: Story title. Button: Play audio"
- **New (viewer mode):** "Card: Story title, 2 minutes 34 seconds. Opens story in Book View"

### Reduced Motion
- No animation changes needed (card animation preserved)

---

## Edge Cases

### 1. Stories Without Audio
- No change needed (already no play button)
- Card already navigates to Book View

### 2. Autoplay Blocked by Browser
- Catch the promise rejection silently
- User can manually play (controls still visible in Book View)

### 3. Story Not Found
- Existing behavior: Book View shows loading, then "no stories"
- No change needed

### 4. Return Navigation
- Existing `sessionStorage` context preserved
- Timeline scroll position restored

### 5. Owner vs. Viewer Mode
- **Owner:** Keeps current dual-action (can preview inline)
- **Viewer:** Single-action (discovers Book View)

---

## Files to Modify

| File | Change |
|------|--------|
| `components/timeline/MemoryCard.tsx` | Add `isViewerMode` prop, conditionally hide play buttons, add autoplay param |
| `components/timeline/TimelineMobileV2.tsx` | Pass `isViewerMode` prop |
| `components/timeline/TimelineDesktop.tsx` | Pass `isViewerMode` prop |
| `app/book/page.tsx` | Detect `autoplay=1`, pass to page components |
| `app/book/components/BookPageV4.tsx` | Pass autoplay prop to audio player |
| `app/book/components/WaveformAudioPlayer.tsx` | Add `autoplay` prop handling |
| `app/book-new/components/MobileBookViewV2.tsx` | Detect `autoplay=1`, pass to renderer |
| `app/book-new/components/BookStoryPage.tsx` | Add autoplay handling |

---

## Testing Checklist

Before marking complete, verify:

- [ ] Body text is 18px or larger
- [ ] All interactive elements are at least 48px (card is the only target)
- [ ] Spacing between tappable elements is at least 16px
- [ ] Family viewer: tap card → Book View opens → audio starts
- [ ] Owner: tap card → Book View opens (no autoplay)
- [ ] Owner: play button still works inline
- [ ] Refresh Book View → audio does NOT auto-restart
- [ ] Keyboard: Enter/Space on card navigates
- [ ] Screen reader announces card purpose
- [ ] Mobile (375px): card renders correctly
- [ ] Desktop: card renders correctly

---

## Rollback

If issues arise, restore from archive:
```bash
cp -r components/archive/timeline-v1/components/* components/timeline/
cp components/archive/timeline-v1/hooks/* hooks/
cp components/archive/timeline-v1/types/timeline.ts types/
cp components/archive/timeline-v1/app-timeline/page.tsx app/timeline/
```

---

## Questions for Review

1. **Scope:** Should owners also get single-action cards, or keep the current dual-action for self-review?
   - Current plan: Owners keep dual-action (can preview inline)

2. **Duration badge:** For viewer mode, should we show "2:34" as a static badge, or hide duration entirely?
   - Current plan: Show static duration badge (no play affordance)

3. **Mobile vs Desktop:** Should autoplay behavior differ between mobile (more likely on cellular) and desktop?
   - Current plan: Same behavior on both

---

**Ready for implementation upon approval.**
