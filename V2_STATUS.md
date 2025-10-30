# Timeline V2 Status - What Works & What's Left

## ✅ Completed Infrastructure

### Plumbing is Done:
1. ✅ `/timeline-v2` route created
2. ✅ `TimelineMobileV2` component created 
3. ✅ `useV2Features` prop added to types
4. ✅ `useV2Features` flows through:
   - TimelineMobileV2 (passes true)
   - → TimelineDecadeSection (accepts & passes)
   - → MemoryCard (accepts prop)
5. ✅ FloatingAddButton works on desktop
6. ✅ Bottom "Add Memory" button works on mobile
7. ✅ Year scrubber added (though you said you already had one)

### Working Features:
- ✅ Page loads at `/timeline-v2`
- ✅ Desktop floating "Add Memory" button
- ✅ Mobile bottom "Add Memory" button  
- ✅ Year scrubber on mobile (new component)

## 🚧 NOT Yet Implemented in MemoryCard

The `useV2Features` prop is being passed, but MemoryCard doesn't actually USE it yet to change the UI. Need to add:

### 1. Audio Indicator Changes
**Current:** Simple play/pause button
**Needed:** When `useV2Features={true}`:
- Show "Listen • 2:14" text label
- Circular progress ring during playback
- Show "Playing..." label during playback
- Display current time / total time

### 2. Photo Carousel
**Current:** Single photo display
**Needed:** When `useV2Features={true}` AND multiple photos:
- Show "1 of 3 photos" badge
- Add 44x44px left/right arrow buttons
- Add swipe gesture handlers
- Add dot indicators
- Cycle through photos without modal

### 3. Date Format Improvement
**Current:** "1962 • Age 7" or similar
**Needed:** When `useV2Features={true}`:
- Format: "Age 7 • Summer 1962" (age first)
- Extract season from date (Spring/Summer/Fall/Winter)
- More readable for seniors

## 📝 What Needs to Be Done

### Option 1: Complete MemoryCard V2 Implementation (Recommended)
Add conditional rendering in MemoryCard.tsx around lines 390-600:

```typescript
// Around line 390 - Audio button section
{story.audioUrl && (
  useV2Features ? (
    // V2: Show "Listen • 2:14" with circular progress
    <div className="v2-audio-indicator">
      {/* Circular progress ring */}
      {/* "Listen • 2:14" or "Playing..." */}
      {/* Time display when playing */}
    </div>
  ) : (
    // Original: glass-play-button-mobile
    <button className="glass-play-button-mobile">
      {/* existing code */}
    </button>
  )
)}
```

Similar conditional blocks needed for:
- Photo display (add carousel when `useV2Features && photos.length > 1`)
- Metadata format (use new format when `useV2Features`)

### Option 2: Create MemoryCardV2 Component (Easier but Duplicates Code)
- Copy MemoryCard.tsx → MemoryCardV2.tsx
- Implement all V2 features in the new component
- Update TimelineDecadeSection to use MemoryCardV2 when `useV2Features={true}`

## 🎯 Quick Test to Verify Plumbing

Add this temporary test in MemoryCard around line 420:

```typescript
{useV2Features && (
  <div className="bg-green-500 text-white p-2 text-xs">
    V2 FEATURES ENABLED ✓
  </div>
)}
```

If you see green banners on your cards at `/timeline-v2`, the plumbing works!

## 📊 Current State Summary

| Feature | Infrastructure | UI Implementation |
|---------|---------------|-------------------|
| V2 Route | ✅ Done | ✅ Done |
| Floating Button | ✅ Done | ✅ Done |
| Bottom Nav Button | ✅ Done | ✅ Done |
| Year Scrubber | ✅ Done | ✅ Done |
| Audio Indicator | ✅ Prop passes | ❌ Not implemented |
| Photo Carousel | ✅ State added | ❌ Not implemented |
| Date Format | ✅ Prop passes | ❌ Not implemented |

## 🔧 Next Steps

1. **Quick Test:** Add green banner test above to verify `useV2Features` is reaching MemoryCard
2. **Implement:** Add conditional rendering for V2 features in MemoryCard.tsx
3. **Test:** Verify each feature works at `/timeline-v2`
4. **Polish:** Adjust sizing, colors, animations

## 💡 Why You're Only Seeing Buttons

The **buttons work** because they're separate components (FloatingAddButton, bottom nav).

The **card features don't work yet** because MemoryCard needs to be updated to actually render different UI when `useV2Features={true}`.

Think of it like this:
- ✅ Light switch installed (useV2Features prop)
- ✅ Wiring done (prop flows through components)
- ❌ Light bulbs not installed yet (UI changes not implemented)

The switch is on, but there are no bulbs to light up! 💡

---

**Status:** 60% complete - Infrastructure done, UI changes needed
**Estimated Time:** 30-45 minutes to implement V2 UI in MemoryCard
**Files to Modify:** Just `components/timeline/MemoryCard.tsx`

