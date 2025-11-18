# Pan/Zoom Image Editor - Complete Guide

> **Purpose:** Document the existing pan/zoom editor system for reuse in new features
> **Status:** Production-ready, used in AddTreasureModal and BookStyleReview
> **Last Updated:** November 9, 2025

---

## Quick Reference

### Files Using Pan/Zoom

1. **AddTreasureModal** (`components/memory-box/AddTreasureModal.tsx`)
   - Treasure image upload and positioning
   - 16:10 aspect ratio
   - Standalone modal flow

2. **MultiPhotoUploader** (`components/MultiPhotoUploader.tsx`)
   - Story photo editing (used in BookStyleReview)
   - Multiple photos with slot selection
   - Dual-URL system for master/display

3. **BookStyleReview** (`components/BookStyleReview.tsx`)
   - Calls MultiPhotoUploader
   - Used in edit story flow

### Using the Pan/Zoom Editor

**Option 1: AddTreasureModal (Simplest)**
```typescript
import { AddTreasureModal } from "@/components/memory-box/AddTreasureModal";

<AddTreasureModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={async (treasure) => {
    // Handle save with image file + transform
  }}
/>
```

**Option 2: MultiPhotoUploader (Most Flexible)**
```typescript
import { MultiPhotoUploader, type StoryPhoto } from "@/components/MultiPhotoUploader";

<MultiPhotoUploader
  photos={photos}
  onPhotosChange={setPhotos}
  onPhotoUpload={async (file, index) => {
    // Upload handler
  }}
/>
```

**Option 3: Custom Component (from scratch)**
```typescript
// Use the code snippets below to build custom
```

---

## Transform Object

### Structure

```typescript
type PhotoTransform = {
  zoom: number;           // 1.0 to 3.0
  position: {
    x: number;            // -50 to +50 (percentages)
    y: number;            // -50 to +50 (percentages)
  };
};
```

### Application

```typescript
// CSS Transform
style={{
  transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
  transformOrigin: 'center center'
}}

// In database (JSONB)
{
  "zoom": 1.5,
  "position": { "x": -10, "y": 5 }
}
```

### Initial Value

```typescript
// No zoom/pan
{ zoom: 1, position: { x: 0, y: 0 } }

// Zoomed and panned
{ zoom: 2, position: { x: 25, y: -15 } }
```

---

## AddTreasureModal - Detailed Implementation

### Entry Point

```typescript
const [addTreasureModalOpen, setAddTreasureModalOpen] = useState(false);

<AddTreasureModal
  isOpen={addTreasureModalOpen}
  onClose={() => setAddTreasureModalOpen(false)}
  onSave={handleSaveTreasure}
/>
```

### Save Handler

```typescript
const handleSaveTreasure = async (treasureData: {
  title: string;
  description?: string;
  category: string;
  year?: number;
  imageFile: File;
  transform?: { zoom: number; position: { x: number; y: number } };
}) => {
  const formData = new FormData();
  formData.append("image", treasureData.imageFile);
  formData.append("title", treasureData.title);
  formData.append("category", treasureData.category);
  if (treasureData.description) {
    formData.append("description", treasureData.description);
  }
  if (treasureData.year) {
    formData.append("year", treasureData.year.toString());
  }
  if (treasureData.transform) {
    formData.append("transform", JSON.stringify(treasureData.transform));
  }

  const response = await fetch("/api/treasures", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to create treasure");

  // Refetch and show success toast
  queryClient.invalidateQueries({
    queryKey: ["/api/treasures", storytellerId, session?.access_token],
  });
  toast({ title: "Treasure added successfully!" });
};
```

### Modal States

```typescript
// Upload State - Show image picker
!isEditing && !imagePreview
  → Drag-drop zone visible
  → Form fields NOT visible

// Editing State - Show pan/zoom editor
isEditing && imagePreview
  → 16:10 frame visible
  → Zoom slider visible
  → Form fields HIDDEN
  → "Continue" to proceed

// Details State - Show form
!isEditing && imagePreview
  → Form fields visible
  → Save/Cancel buttons visible
```

### Component Props

```typescript
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (treasure: {
    title: string;
    description?: string;
    category: TreasureCategory;
    year?: number;
    imageFile: File;
    transform?: { zoom: number; position: { x: number; y: number } };
  }) => Promise<void>;
};
```

---

## Pan/Zoom Implementation Patterns

### Pattern 1: Basic Pan/Zoom State

```typescript
const [zoom, setZoom] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });

// Combined
const [transform, setTransform] = useState({
  zoom: 1,
  position: { x: 0, y: 0 }
});
```

### Pattern 2: Zoom Slider

```typescript
import * as Slider from "@radix-ui/react-slider";

<Slider.Root
  className="flex items-center select-none touch-none flex-1"
  value={[transform.zoom]}
  onValueChange={(value) => {
    setTransform(prev => ({ ...prev, zoom: value[0] }));
  }}
  min={1}
  max={3}
  step={0.1}
>
  <Slider.Track className="bg-gray-200 rounded-full h-[3px]">
    <Slider.Range className="absolute bg-heritage-coral rounded-full h-full" />
  </Slider.Track>
  <Slider.Thumb
    className="block w-6 h-6 bg-heritage-coral rounded-full"
    aria-label="Zoom"
  />
</Slider.Root>
```

### Pattern 3: Mouse Drag (Desktop)

```typescript
const imageRef = useRef<HTMLDivElement>(null);
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true);
  setDragStart({ x: e.clientX, y: e.clientY });
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging || !imageRef.current) return;

  const deltaX = e.clientX - dragStart.x;
  const deltaY = e.clientY - dragStart.y;

  const rect = imageRef.current.getBoundingClientRect();
  const percentX = (deltaX / rect.width) * 100;
  const percentY = (deltaY / rect.height) * 100;

  // Calculate bounds based on zoom
  const maxPercent = (transform.zoom - 1) * 50;

  setTransform(prev => ({
    ...prev,
    position: {
      x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
      y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
    }
  }));

  // Update drag start for next frame
  setDragStart({ x: e.clientX, y: e.clientY });
};

const handleMouseUp = () => {
  setIsDragging(false);
};

// Apply handlers
<div
  ref={imageRef}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
>
  <img style={{
    transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
    transformOrigin: 'center center'
  }} />
</div>
```

### Pattern 4: Touch Drag (Mobile)

```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

const handleTouchStart = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  setIsDragging(true);
  setDragStart({ x: touch.clientX, y: touch.clientY });
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!isDragging || !imageRef.current) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - dragStart.x;
  const deltaY = touch.clientY - dragStart.y;

  const rect = imageRef.current.getBoundingClientRect();
  const percentX = (deltaX / rect.width) * 100;
  const percentY = (deltaY / rect.height) * 100;

  const maxPercent = (transform.zoom - 1) * 50;

  setTransform(prev => ({
    ...prev,
    position: {
      x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
      y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
    }
  }));

  setDragStart({ x: touch.clientX, y: touch.clientY });
};

const handleTouchEnd = () => {
  setIsDragging(false);
};

// Apply handlers
<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* ... */}
</div>
```

### Pattern 5: Bounds Calculation

```typescript
// Max offset depends on zoom level
// When zoom = 1: no movement allowed (maxPercent = 0)
// When zoom = 2: can move ±50% (maxPercent = 50)
// When zoom = 3: can move ±100% (maxPercent = 100)

const maxPercent = (transform.zoom - 1) * 50;

const clampedX = Math.max(-maxPercent, Math.min(maxPercent, newX));
const clampedY = Math.max(-maxPercent, Math.min(maxPercent, newY));
```

### Pattern 6: Aspect Ratio Container

```typescript
// 16:10 aspect ratio for treasures
<div style={{ aspectRatio: '16/10' }} className="relative bg-black rounded-lg">
  <img style={{ /* ... transforms ... */ }} />
</div>

// 3:2 aspect ratio for memory overlay
<div style={{ aspectRatio: '3/2' }} className="relative bg-gray-100">
  <img style={{ /* ... transforms ... */ }} />
</div>
```

---

## Complete Minimal Example

### Create Custom Pan/Zoom Component

```typescript
'use client';

import { useState, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (transform: { zoom: number; position: { x: number; y: number } }) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [transform, setTransform] = useState({ zoom: 1, position: { x: 0, y: 0 } });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // Zoom slider
  const handleZoomChange = (value: number[]) => {
    setTransform(prev => ({ ...prev, zoom: value[0] }));
  };

  // Mouse dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const rect = imageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;
    const maxPercent = (transform.zoom - 1) * 50;

    setTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
      {/* Editor Frame */}
      <div
        ref={imageRef}
        className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-gray-300"
        style={{ aspectRatio: '16/10' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <img
          src={imageUrl}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
            transformOrigin: 'center center'
          }}
          alt="Edit"
          draggable={false}
        />
      </div>

      {/* Zoom Slider */}
      <div className="flex items-center gap-4">
        <span>-</span>
        <Slider.Root
          className="flex-1"
          value={[transform.zoom]}
          onValueChange={handleZoomChange}
          min={1}
          max={3}
          step={0.1}
        >
          <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-6 h-6 bg-blue-600 rounded-full" />
        </Slider.Root>
        <span>+</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(transform)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
```

### Usage

```typescript
import { ImageEditor } from '@/components/ImageEditor';

export default function MyComponent() {
  const [showEditor, setShowEditor] = useState(false);
  const [image, setImage] = useState<string>('');

  return (
    <>
      {showEditor ? (
        <ImageEditor
          imageUrl={image}
          onSave={(transform) => {
            console.log('Transform:', transform);
            setShowEditor(false);
          }}
          onCancel={() => setShowEditor(false)}
        />
      ) : (
        <button onClick={() => setShowEditor(true)}>Edit Image</button>
      )}
    </>
  );
}
```

---

## Integration Checklist

When adding pan/zoom to a new feature:

- [ ] Import Radix UI Slider: `npm install @radix-ui/react-slider`
- [ ] Define transform state with zoom (1-3) and position (x, y percentages)
- [ ] Create container with fixed aspect ratio
- [ ] Apply CSS transform to image
- [ ] Add zoom slider (1 to 3, 0.1 step)
- [ ] Add mouse drag handlers (delta calculation + bounds)
- [ ] Add touch drag handlers (same logic as mouse)
- [ ] Calculate bounds: `maxPercent = (zoom - 1) * 50`
- [ ] Clamp position values: `Math.max(-maxPercent, Math.min(maxPercent, value))`
- [ ] Save transform to database as JSONB
- [ ] Display transform when showing image (CSS transform or data-driven)
- [ ] Test on mobile (touch drag)
- [ ] Test at different zoom levels
- [ ] Test with different aspect ratios

---

## API Integration

### Save Treasure with Transform

```typescript
// POST /api/treasures
const formData = new FormData();
formData.append("image", imageFile);
formData.append("title", "My Photo");
formData.append("category", "photos");
formData.append("transform", JSON.stringify({
  zoom: 1.5,
  position: { x: -10, y: 5 }
}));

const response = await fetch("/api/treasures", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### Update Story with Transform

```typescript
// PUT /api/stories/{id}
const response = await fetch(`/api/stories/${id}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    photos: [
      {
        id: "photo-123",
        url: "https://...",
        transform: {
          zoom: 1.5,
          position: { x: -10, y: 5 }
        }
      }
    ]
  }),
});
```

---

## Common Issues & Solutions

### Issue: Image Jerky When Dragging

**Solution:** Update drag start position every frame (already handled in code)

```typescript
// ✅ Correct - update dragStart each move
setDragStart({ x: e.clientX, y: e.clientY });

// ❌ Wrong - dragStart never updates
// const delta = e.clientX - dragStart.x; (dragStart is stale)
```

### Issue: Pan Doesn't Stop at Bounds

**Solution:** Clamp position after calculating

```typescript
// ✅ Correct
const clamped = Math.max(-maxPercent, Math.min(maxPercent, newValue));

// ❌ Wrong
// newValue might exceed bounds
```

### Issue: Works on Desktop but Not Mobile

**Solution:** Add touch event handlers (code provided above)

```typescript
// ✅ Must have both mouse AND touch
onMouseDown={...}
onTouchStart={...}
```

### Issue: Transform Lost After Upload

**Solution:** Include in FormData or request body

```typescript
// ✅ Include transform when saving
formData.append("transform", JSON.stringify(transform));

// ❌ Missing transform
// formData.append("title", title); // forgot transform!
```

---

## Performance Considerations

1. **Avoid Re-rendering Children**
   - Keep pan/zoom state local
   - Pass only final transform to parent
   - Use memo() on child components

2. **Throttle Touch Events**
   - Touch move fires very frequently
   - Consider debouncing if performance issues
   - Current implementation is optimized

3. **Image Optimization**
   - Use display-quality images (550px) for editing preview
   - Master images (2400px) generated on-demand
   - Reduces load time for editor

---

## Browser Support

- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- iOS Safari: ✅ Touch drag works
- Android Chrome: ✅ Touch drag works

---

## Further Reading

- Transform CSS spec: https://developer.mozilla.org/en-US/docs/Web/CSS/transform
- Radix UI Slider: https://www.radix-ui.com/docs/primitives/components/slider
- Touch events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events

---

_This guide covers all pan/zoom functionality. Ready to be extended or reused._
