# Memory Box Implementation Analysis

> **Date:** November 9, 2025
> **Purpose:** Understand current memory-box implementation to plan improvements
> **Scope:** Page structure, card components, photo display, edit flows, image pan/zoom system

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Page Structure](#page-structure)
3. [Memory Card Components](#memory-card-components)
4. [Photo Display & Transforms](#photo-display--transforms)
5. [Add Memory Flow](#add-memory-flow)
6. [Edit Memory Flow](#edit-memory-flow)
7. [Pan/Zoom Editor System](#panzoom-editor-system)
8. [Key Design Patterns](#key-design-patterns)

---

## Architecture Overview

### File Organization

```
app/memory-box/
├── page.tsx                           # Main Memory Box page

components/memory-box/
├── MemoryBoxTabs.tsx                  # Tab switcher (Stories/Treasures)
├── StoryCard.tsx                      # Story card display
├── MemoryCard.tsx                     # Generic memory card
├── MemoryList.tsx                     # Story grid + filters
├── QuickStatsBar.tsx                  # Statistics display
├── StoryFilters.tsx                   # Filter pills
├── TreasureGrid.tsx                   # Treasure masonry layout
├── TreasureCard.tsx                   # Individual treasure display
└── AddTreasureModal.tsx               # Add treasure flow

components/
├── MemoryOverlay.tsx                  # Story detail modal
├── MultiPhotoUploader.tsx             # Multi-photo edit with pan/zoom
└── BookStyleReview.tsx                # Full story editor (used on edit)

app/review/book-style/
└── page.tsx                           # Edit story page (redirected from Memory Box)
```

### Data Flow

```
Memory Box Page
├─ Fetch stories & treasures
├─ State: activeTab, selectedStory, filters
├─ Render Stories Tab
│  ├─ StoryCard components
│  └─ MemoryOverlay (detail view)
└─ Render Treasures Tab
   ├─ TreasureGrid
   └─ AddTreasureModal
```

---

## Page Structure

### `/app/memory-box/page.tsx` (746 lines)

**Purpose:** Main memory-box container and orchestrator

#### Key Features:

1. **Tab System (Lines 145-146)**
   - `activeTab: "stories" | "treasures"`
   - Switches between story list and treasure chest

2. **Story Management**
   - Fetches via `GET /api/stories` with optional `storyteller_id` parameter
   - Supports family sharing (multi-tenant via `storyteller_id`)
   - Filters: All, Favorites, Decades, Timeless, Shared, Private
   - Search query for title and transcription

3. **Statistics Bar (Lines 399-413)**
   - Total stories count
   - Total audio duration in hours
   - Favorites count
   - Decade stories count
   - Timeless stories count
   - Shared/Private split
   - Treasures count

4. **Audio Manager (Lines 74-133)**
   - Singleton pattern for single audio playback
   - Prevents multiple simultaneous audio tracks
   - Listener registration for UI sync

5. **Mutations**
   - `updateStory` - Update story metadata (favorite, visibility)
   - `deleteStory` - Delete story with confirmation
   - `toggleTreasureFavorite` - Mark treasure as favorite
   - `deleteTreasure` - Delete treasure with confirmation
   - `handleSaveTreasure` - Create new treasure with transform

#### API Endpoints Used:

```typescript
// Stories
GET    /api/stories?storyteller_id={id}
PUT    /api/stories/{id}                // Update (favorite, visibility)
DELETE /api/stories/{id}
POST   /api/stories/{id}/play            // AudioManager integration

// Treasures
GET    /api/treasures?storyteller_id={id}
PATCH  /api/treasures/{id}               // Toggle favorite
DELETE /api/treasures/{id}
POST   /api/treasures                    // Create with image file + transform
```

---

## Memory Card Components

### 1. `StoryCard.tsx` (Memory Box Stories)

**Purpose:** Display story card in grid (used in main tab)

```typescript
type StoryCardProps = {
  id: string;
  title: string;
  preview: string;              // Not used (empty string passed)
  imageUrl: string;             // Hero photo or placeholder
  photoTransform?: Transform;   // Pan/zoom for hero image
  year?: number;
  age?: number;
  durationSeconds?: number;
  isFavorite: boolean;
  inTimeline: boolean;
  inBook: boolean;
  isPrivate: boolean;
  onView: () => void;
  onPlay?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onToggleTimeline: () => void;
  onToggleBook: () => void;
  onDuplicate: () => void;
};
```

**Key Features:**
- Photo display with transform applied
- Duration badge (🔊 format)
- Year + Age display
- Status icons (Timeline, Book, Favorite, Private)
- Dropdown menu: Favorite, Visibility, Duplicate, Delete
- Listen & Edit quick action buttons

**Photo Display (Lines 536-538):**
```typescript
const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
const imageUrl = heroPhoto?.url || story.photoUrl || "/images/placeholder.jpg";
const photoTransform = heroPhoto?.transform;
```

### 2. `MemoryCard.tsx` (Generic Card)

**Purpose:** Reusable card component with selection mode

**Features:**
- Selection checkbox (top-left)
- Status icons (top-right) showing Timeline/Book/Favorite/Private
- Quick actions: Listen, Edit buttons
- Dropdown menu with Favorite, Visibility, Duplicate, Delete
- Long-press detection for mobile selection (350ms)
- Haptic feedback support
- 44x44px minimum touch targets

---

## Photo Display & Transforms

### Photo Transform Object Structure

```typescript
type PhotoTransform = {
  zoom: number;           // 1.0 to 3.0 (1=no zoom, 3=max zoom)
  position: {
    x: number;            // Horizontal offset in percentages (-50 to +50)
    y: number;            // Vertical offset in percentages (-50 to +50)
  };
};

// Applied as CSS transform:
style={{
  transform: `scale(${zoom}) translate(${x}%, ${y}%)`,
  transformOrigin: 'center center'
}}
```

### Display Locations

#### 1. **Memory Box - Story Card**
- File: `components/memory-box/StoryCard.tsx`
- Applied to hero image using `<img>` tag
- Aspect ratio: variable (image-dependent)

#### 2. **Memory Overlay - Story Detail Modal**
- File: `components/MemoryOverlay.tsx` (Lines 376-395)
- Photo gallery carousel with swipe navigation
- Applied to each photo in `allPhotos` array
- Aspect ratio: 3:2 (fixed)

#### 3. **Treasure Card**
- File: `components/memory-box/TreasureCard.tsx`
- Applied to treasure image
- Aspect ratio: variable

#### 4. **Timeline Card**
- File: `components/timeline/TimelineCard.tsx`
- Applied to story image preview
- Aspect ratio: variable

#### 5. **Book View**
- File: `app/book/page.tsx`
- Applied to chapter photos
- Aspect ratio: article-dependent

### Transform Storage

**In Database:**
- Stored in `JSONB` column `transform`
- Example:
  ```json
  {
    "zoom": 1.5,
    "position": { "x": -10, "y": 5 }
  }
  ```

**In API Responses:**
- Stories: `story.photos[i].transform`
- Treasures: `treasure.transform`

---

## Add Memory Flow

### Story Addition Flow

**Current Implementation:**
1. User clicks "Add Your First Memory" button
2. Navigates to `/recording` page
3. Records audio or uploads existing
4. Transcription happens (AssemblyAI)
5. Story saved via `/api/stories`
6. Redirects back to `/memory-box`

**From Memory Box Code (Line 526):**
```typescript
<Button
  onClick={() => router.push('/recording')}
  className="bg-heritage-coral hover:bg-heritage-coral/90 text-white text-lg px-6 py-3"
>
  Add Your First Memory
</Button>
```

### Treasure Addition Flow

**File:** `components/memory-box/AddTreasureModal.tsx` (477 lines)

**Flow:**
1. Click "Add Treasure" button → Opens modal
2. Upload image via drag-drop or file picker
3. Image previewed in editing mode
4. Enter treasure details:
   - Title (required)
   - Category (required): photos, documents, heirlooms, keepsakes, recipes, memorabilia
   - Year (optional)
   - Description (optional)
5. Edit image with pan/zoom
6. Save → API call to `POST /api/treasures`

**Key Features:**

1. **Image Upload (Lines 244-275)**
   - Drag & drop zone
   - Click to browse
   - MIME type validation (image/* only)
   - Max 5MB file size

2. **Photo Editor (Lines 364-451)**
   - 16:10 aspect ratio frame
   - Zoom slider (1.0 to 3.0)
   - Mouse & touch drag for panning
   - Real-time transform state

3. **Details Form (Lines 278-361)**
   - Title input (required)
   - Category buttons (6 options)
   - Year input (1800-current)
   - Description textarea
   - Form validation before save

4. **Transform Handling (Lines 86-158)**
   - `handleZoomChange()` - Updates zoom via slider
   - `handleMouseDown/Move/Up()` - Mouse panning
   - `handleTouchStart/Move/End()` - Touch panning
   - Bounds checking: `maxPercent = (zoom - 1) * 50`

5. **Save & Reset (Lines 186-235)**
   - Form validation
   - API call with transform
   - Form reset on close

---

## Edit Memory Flow

### Entry Point

**From Memory Box:**
```typescript
onEdit={() => 
  router.push(`/review/book-style?id=${story.id}&returnPath=${encodeURIComponent('/memory-box')}`)
}
```

**From Memory Overlay:**
```typescript
const handleEdit = () => {
  const returnPath = originPath || `/book?storyId=${story.id}`;
  router.push(`/review/book-style?id=${story.id}&returnPath=${encodeURIComponent(returnPath)}`);
};
```

### Edit Page Structure

**File:** `/app/review/book-style/page.tsx` (600+ lines)

**Key Components:**
1. **BookStyleReview** - Main editor component
2. **MultiPhotoUploader** - Photo management with pan/zoom
3. **CustomAudioPlayer** - Audio playback
4. **RecordingOverlay** - Optional re-recording

**Features:**

1. **Title & Year Editing**
   - Text inputs for story metadata
   - Age calculation from birth year
   - Month/Day optional (not stored)

2. **Photo Management (Lines 49-66)**
   - Upload new photos
   - Edit existing with pan/zoom
   - Set hero image
   - Remove photos
   - Add captions

3. **Transcription Editing**
   - Full text editing
   - Replace with re-recorded audio
   - Confirmation dialog

4. **Wisdom/Lesson Editing (Lines 93-109)**
   - Edit lesson learned text
   - Generate new options via AI
   - Three options: practical, emotional, character

5. **Audio Management**
   - Play existing audio
   - Re-record
   - Remove and re-record
   - Process background noise

6. **Save & Cancel**
   - Save all changes
   - Cancel with confirmation
   - Delete story option

---

## Pan/Zoom Editor System

### MultiPhotoUploader Component

**File:** `components/MultiPhotoUploader.tsx` (500+ lines)

**Purpose:** Reusable photo editor used in BookStyleReview

#### Core Functionality

1. **Photo Selection (Lines 118-145)**
   - Click photo to select for editing
   - Opens edit modal overlay
   - Initializes transform state
   - Prevents body scroll

2. **Transform Normalization (Lines 72-95)**
   - Converts legacy pixel-based transforms to percentages
   - Detects old format (abs value > 100)
   - Calculates percentage from assumed container size
   - Backward compatible

3. **Zoom Control (Lines 86-88)**
   - Radix UI Slider component
   - Range: 1.0 to 3.0
   - Step: 0.1
   - Updates state immediately

4. **Pan/Drag Implementation (Lines 90-158)**
   
   **Mouse Handlers:**
   - `handleMouseDown()` - Start tracking
   - `handleMouseMove()` - Calculate delta and update position
   - `handleMouseUp()` - End tracking
   - Bounds checking with `maxPercent = (zoom - 1) * 50`

   **Touch Handlers:**
   - Same logic as mouse but using touch event coordinates
   - Supports multi-touch (uses first touch only)

   **Position Calculation:**
   ```typescript
   const deltaX = (clientX - dragStart.x) / containerWidth * 100;
   const deltaY = (clientY - dragStart.y) / containerHeight * 100;
   const maxPercent = (zoom - 1) * 50;
   
   x = Math.max(-maxPercent, Math.min(maxPercent, prev.x + deltaX));
   y = Math.max(-maxPercent, Math.min(maxPercent, prev.y + deltaY));
   ```

5. **UI Layout**
   - Photo slot grid (up to 3 photos)
   - Selected photo edit modal
   - Zoom slider with icons
   - Action buttons (Edit, Remove, Save, Cancel)

#### Transform Data Model

```typescript
interface StoryPhoto {
  id: string;
  // Dual WebP system (new)
  masterPath?: string;    // 2400px @ 85% quality
  displayPath?: string;   // 550px @ 80% quality
  masterUrl?: string;     // Signed URL (generated on-demand)
  displayUrl?: string;    // Signed URL (generated on-demand)
  
  // Legacy (backward compatibility)
  url?: string;
  filePath?: string;
  
  // Transform applied to all URLs/paths
  transform?: {
    zoom: number;
    position: { x: number; y: number };
  };
  
  // Metadata
  caption?: string;
  isHero?: boolean;       // Hero image for card/timeline
  file?: File;            // Pending upload only
}
```

#### Key Design Decisions

1. **Percentage-Based Positioning**
   - Scale-independent
   - Works at any resolution
   - Survives image crop/resize

2. **No Boundaries Lock**
   - Smooth dragging experience
   - Bounds calculated per-zoom level
   - Max offset = `(zoom - 1) * 50%`

3. **Container-Relative Calculations**
   - Reads container dimensions at drag time
   - No hardcoded aspect ratios
   - Responsive to resize

4. **Transform Persistence**
   - Stored in database
   - Applied on display
   - Survives edits/resaves

---

## Key Design Patterns

### 1. Memory Box as Hub

**Purpose:** Central view for all memories and treasures

**Pattern:** Tab-based interface
- Stories tab: All memories with filters
- Treasures tab: Visual keepsakes

**Benefits:**
- Single entry point for memory management
- Unified filtering/search across types
- Easy context switching

### 2. Overlay Modal for Details

**File:** `MemoryOverlay.tsx`

**Pattern:** Modal shows full story details without navigation

**Features:**
- Swipe/arrow navigation between stories
- Photo carousel
- Audio playback
- Edit/View in Book actions
- Keyboard shortcuts (arrow keys, space for play, escape to close)

### 3. Modal-Based Editing

**Pattern:** Edit flows in modals/pages over existing content

**Benefits:**
- Non-destructive editing
- Clear save/cancel actions
- Can preserve scroll position in background

### 4. Pan/Zoom as Separate Feature

**Pattern:** Image editing isolated in MultiPhotoUploader

**Reuse Points:**
- AddTreasureModal - Treasure image editing
- BookStyleReview - Story photo editing
- Could be reused for avatar/profile photos

### 5. Transform-Based Image Positioning

**Pattern:** Store pan/zoom as mathematical transform, not cropped pixels

**Benefits:**
- Survives image re-export
- Lossless positioning
- Resolution-independent
- Animatable

### 6. Dual URL System for Photos

**Old:** Single URL or path
**New:** Master + Display URLs
- Master: 2400px @ 85% for high-quality print
- Display: 550px @ 80% for fast web loading
- Both generated on-demand with signed URLs

### 7. Multi-Tenant via storyteller_id

**Pattern:** All story/treasure queries support `storyteller_id` parameter

**Benefits:**
- Family sharing without separate tables
- Account switcher shows different data
- Same UI, different data source
- RPC: `has_collaboration_access()` gates access

---

## Related Flows (Not Detailed Here)

These are entry points and related flows:

1. **Story Recording** (`/recording`)
   - Creates initial story with optional photos
   - Saves to `/api/stories`

2. **Book View** (`/app/book`)
   - Display mode for stories
   - Shows all content
   - Edit button redirects to review page

3. **Timeline View** (`/app/timeline`)
   - Chronological view
   - Links to book or story details
   - Edit button redirects to review page

4. **Family Sharing**
   - Account switcher in Memory Box header
   - Loads family member's stories
   - Contributor role can add/edit

---

## Improvements Opportunities

### 1. Direct Treasure Editing
- Currently: Can add/delete, but no edit UI for existing treasures
- Potential: Modal to re-edit image pan/zoom and metadata

### 2. Duplicate Story
- Button exists but returns "Coming Soon" toast
- Could duplicate with photo transforms intact

### 3. Link Treasure to Story
- UI exists in dropdown
- Backend API could support this
- Would enrich story context

### 4. Batch Operations
- Action bar for bulk favorite/delete exists
- Could extend to bulk move to Timeline/Book

### 5. Advanced Photo Crop
- Current: Pan/zoom only
- Could add: Rotate, flip, brightness/contrast
- Keep transforms separate from crop

### 6. Photo Import from External
- Currently: Upload local files only
- Could add: Google Photos, OneDrive, camera roll integration

---

## Files Reference

### Absolute Paths

**Main Page:**
- `/Users/paul/Development/HeritageWhisperV2/app/memory-box/page.tsx`

**Components:**
- `/Users/paul/Development/HeritageWhisperV2/components/memory-box/MemoryBoxTabs.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/memory-box/StoryCard.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/memory-box/AddTreasureModal.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/memory-box/TreasureGrid.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/memory-box/TreasureCard.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/MemoryOverlay.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/MultiPhotoUploader.tsx`
- `/Users/paul/Development/HeritageWhisperV2/components/BookStyleReview.tsx`

**Edit Page:**
- `/Users/paul/Development/HeritageWhisperV2/app/review/book-style/page.tsx`

---

## Summary

The memory-box implementation is well-structured with:

1. **Clear Separation of Concerns**
   - Page handles data fetching and state
   - Components handle rendering and user interaction
   - Modals handle complex workflows

2. **Reusable Components**
   - Pan/zoom editor (AddTreasureModal, MultiPhotoUploader)
   - Card components for stories and treasures
   - Overlay for detail view

3. **Smart Data Handling**
   - Transform-based image positioning
   - Dual URL system for performance
   - Family sharing support via storyteller_id

4. **Good UX Patterns**
   - Non-destructive editing
   - Clear navigation (overlay, buttons, keyboard)
   - Touch-optimized (44x44px targets, haptic feedback)

5. **Extension Points**
   - Modal pattern makes adding features easy
   - Component props allow customization
   - API endpoints support new parameters

---

_Analysis complete. Ready for improvement planning._
