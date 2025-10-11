# Design Token System - Implementation Summary

## Overview

This document summarizes the implementation of a design token system for HeritageWhisper V2. The goal was to create a centralized, maintainable design system using CSS custom properties and semantic class names.

---

## 📁 Files Created

### 1. `/app/styles/tokens.css`

**Purpose:** Centralized design tokens (CSS custom properties)

**Contents:**

- **Colors:**
  - `--color-page: #FAF8F5` (warm cream background)
  - `--color-card: #FFFFFF` (card background)
  - `--color-text-h: #1B1B1F` (headings)
  - `--color-text: #30343A` (body text)
  - `--color-text-muted: #8A8F98` (metadata)
  - `--color-border: #EAEAEA` (borders)
  - `--color-accent: #D36A3D` (clay/copper primary)
  - `--color-accent-2: #B89B5E` (soft gold secondary)
  - `--color-focus: #B89B5E` (focus ring)

- **Typography:**
  - `--font-sans: Inter, system-ui, ...`
  - `--font-serif: Playfair Display, Georgia, serif`
  - `--h1-desk: 34px`
  - `--h1-mobile: 28px`
  - `--card-title: 22px`
  - `--card-title-mobile: 20px`
  - `--meta: 14px`

- **Spacing Scale:**
  - `--space-2: 8px`
  - `--space-3: 12px`
  - `--space-4: 16px`
  - `--space-5: 20px`
  - `--space-6: 24px`
  - `--space-8: 32px`
  - `--space-10: 40px`

- **Effects:**
  - `--radius-card: 12px`
  - `--shadow-card: 0 6px 20px rgba(0,0,0,0.1)`

---

### 2. `/app/styles/components.css`

**Purpose:** Reusable component classes using the token system

**Key Classes:**

#### Layout & Structure

- `.hw-spine` - Timeline vertical spine with CSS-generated line
- `.hw-node` - Timeline node with CSS-generated dot markers
- `.hw-grid` - Responsive 2-column grid (1-column on mobile)

#### Typography

- `.hw-decade` - Decade header (serif, responsive sizing)
- `.hw-meta` - Metadata row with dot separators
- `.hw-meta .dot` - Thin vertical divider (1px × 12px)

#### Cards

- `.hw-card` - Story card container (border, shadow, rounded)
- `.hw-card-media` - Image with 16:10 aspect ratio
- `.hw-card-body` - Card content padding
- `.hw-card-title` - Card title (responsive sizing)

#### Interactive Elements

- `.hw-play` - Play button (circular, copper accent, hover scale)
- `.hw-nav-item[aria-current="true"]` - Active navigation state
- `.hw-nav-indicator` - Navigation active indicator bar

#### Accessibility Features

- `:focus-visible` - Accessible focus ring with gold outline
- `@media (prefers-reduced-motion: reduce)` - Disables hover scale on `.hw-play`

---

### 3. `/app/design-demo/page.tsx`

**Purpose:** Proof-of-concept demonstration page

**Features:**

- Timeline layout with spine and nodes
- Story cards using semantic classes
- Real HeritageWhisper media images
- Interactive play buttons
- Token reference guide

**Mock Data:**

- 5 story cards with authentic heritage photos
- Demonstrates "Before I Was Born" and "1950s" sections
- Shows metadata formatting with dot separators

---

## 📝 Files Modified

### `/app/globals.css`

**Changes:**

```css
/* Added at top of file */
@import "./styles/tokens.css";
@import "./styles/components.css";
```

**Purpose:** Import token and component styles globally

---

## 🎨 Design Philosophy

### Semantic Naming

All classes use the `hw-` prefix (HeritageWhisper) for namespacing:

- Clear, descriptive names (`.hw-card` not `.card-1`)
- Reflects component structure (`.hw-card-body` is inside `.hw-card`)
- Easy to search/grep in codebase

### Token-First Approach

All design values use CSS custom properties:

- Colors: `var(--color-accent)` instead of `#D36A3D`
- Spacing: `var(--space-4)` instead of `16px`
- Typography: `var(--font-serif)` instead of `"Playfair Display"`

**Benefits:**

- Single source of truth for design values
- Easy theme switching (just swap token values)
- Consistent spacing/typography across app
- Better maintainability

### Accessibility First

- Focus-visible outlines on all interactive elements
- Proper ARIA labels (`aria-label`, `aria-current`)
- Prefers-reduced-motion support (no animations for users who prefer reduced motion)
- Semantic HTML structure
- Minimum 48px touch targets

---

## 🎯 Implementation Goals Achieved

### ✅ Completed

1. **CSS Tokens Layer** - All colors, spacing, typography, shadows, radius defined as CSS custom properties
2. **Component Classes** - Reusable semantic classes for timeline, cards, buttons, metadata
3. **Base Styles** - Body font family and defaults set via tokens
4. **Timeline Spine** - CSS-generated vertical line and dot markers (no additional HTML needed)
5. **Story Cards** - Structured with `hw-card`, `hw-card-media`, `hw-card-body`, `hw-card-title`
6. **Play Button** - Semantic `hw-play` class with copper accent and hover scale
7. **Meta Row** - Dot separators using thin vertical dividers
8. **Focus States** - Gold focus ring visible on all interactive elements
9. **Reduced Motion** - Respects `prefers-reduced-motion` accessibility preference
10. **Proof of Concept** - Working demo at `/design-demo`

### 🔄 Pending (Future Work)

- Refactor main `/timeline` page to use token system
- Refactor `/timeline-test` page to use token system
- Update `MemoryCard` component inline code
- Update `MobileNavigation` component with `aria-current` and indicator
- Create separate component files for `DecadeHeader`, `StoryCard`, etc.

---

## 📐 Visual Specifications

### Timeline Spine

- **Position:** `left: 24px` (absolute)
- **Width:** `2px`
- **Gradient:** `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.08))`
- **Shadow:** `0 0 12px rgba(0,0,0,0.08) inset`

### Timeline Nodes

- **Position:** `left: 18px`, `top: 8px` (relative to parent)
- **Size:** `10px × 10px`
- **Border:** `2px solid var(--color-accent)`
- **Background:** `#fff`
- **Shape:** Circle (`border-radius: 50%`)

### Story Cards

- **Background:** `var(--color-card)` (#FFFFFF)
- **Border:** `1px solid var(--color-border)`
- **Radius:** `var(--radius-card)` (12px)
- **Shadow:** `var(--shadow-card)` (0 6px 20px rgba(0,0,0,0.1))
- **Image Aspect:** `16:10`

### Play Button

- **Size:** `48px × 48px`
- **Position:** `absolute; right: var(--space-4); bottom: var(--space-4)`
- **Background:** `rgba(255,255,255,0.9)`
- **Border:** `2px solid var(--color-accent)`
- **Hover:** `transform: scale(1.04)` (respects reduced-motion)
- **Icon:** `18px × 18px`, fill: `var(--color-accent)`

---

## 🌈 Color Palette

### Primary Palette

| Token              | Hex     | Usage                                  |
| ------------------ | ------- | -------------------------------------- |
| `--color-accent`   | #D36A3D | Clay/copper - primary actions, accents |
| `--color-accent-2` | #B89B5E | Soft gold - secondary accents, focus   |
| `--color-page`     | #FAF8F5 | Warm cream - page background           |
| `--color-card`     | #FFFFFF | Pure white - card backgrounds          |

### Text Colors

| Token                | Hex     | Usage                            |
| -------------------- | ------- | -------------------------------- |
| `--color-text-h`     | #1B1B1F | Near-black - headings            |
| `--color-text`       | #30343A | Dark gray - body text            |
| `--color-text-muted` | #8A8F98 | Medium gray - metadata, captions |

### UI Elements

| Token            | Hex     | Usage                          |
| ---------------- | ------- | ------------------------------ |
| `--color-border` | #EAEAEA | Light gray - borders, dividers |
| `--color-focus`  | #B89B5E | Soft gold - focus ring         |

---

## 📱 Responsive Behavior

### Grid Layout

- **Desktop (1024px+):** 2 columns, `gap: var(--space-6)` (24px)
- **Mobile:** 1 column, `gap: var(--space-6)` (24px)

### Typography Scaling

- **Decade Headers:** 34px (desktop) → 28px (mobile)
- **Card Titles:** 22px (desktop) → 20px (mobile)
- **Meta Text:** 14px (all devices)

---

## 🔗 Demo Access

**Local Development:**

```
http://localhost:3002/design-demo
```

**Features Demonstrated:**

- Timeline spine with auto-generated nodes
- Story cards with real heritage photos
- Decade headers with metadata
- Play buttons with hover effects
- Token reference guide at bottom
- Responsive grid layout

---

## 🚀 Next Steps

### Immediate (High Priority)

1. Apply token system to `/timeline-test` page
2. Refactor `MemoryCard` inline component
3. Test for visual regressions

### Short-term

4. Update `MobileNavigation` with navigation indicators
5. Extract inline components to separate files
6. Add token system to `/book` view

### Long-term

7. Apply tokens to all pages (`/recording`, `/review`, `/profile`)
8. Create theme variants (dark mode, high contrast)
9. Build Storybook documentation for component library

---

## 📊 Metrics

### File Sizes

- `tokens.css`: ~1.2KB (minified)
- `components.css`: ~4.8KB (minified)
- `design-demo/page.tsx`: ~9.5KB

### Token Count

- **Colors:** 9 tokens
- **Spacing:** 7 tokens
- **Typography:** 7 tokens
- **Effects:** 2 tokens
- **Total:** 25 design tokens

### Component Classes

- **Total:** 13 semantic classes
- **Layout:** 3 classes (spine, node, grid)
- **Typography:** 2 classes (decade, meta)
- **Cards:** 4 classes (card, media, body, title)
- **Interactive:** 3 classes (play, nav-item, nav-indicator)
- **Utility:** 1 class (dot)

---

## 🎓 Usage Examples

### Story Card Structure

```tsx
<div className="hw-card">
  <div style={{ position: "relative" }}>
    <img className="hw-card-media" src="..." alt="..." />
    <button className="hw-play" aria-label="Play">
      <Play />
    </button>
  </div>
  <div className="hw-card-body">
    <h3 className="hw-card-title">{title}</h3>
    <div className="hw-meta">
      <span>{year}</span>
      <span className="dot"></span>
      <span>Age {age}</span>
      <span className="dot"></span>
      <span>{chapter}</span>
    </div>
  </div>
</div>
```

### Timeline Structure

```tsx
<main className="hw-spine">
  <section className="hw-node">
    <h2 className="hw-decade">Before I Was Born</h2>
    <div className="hw-meta">
      <span>Family History</span>
      <span className="dot"></span>
      <span>Stories of those who came before</span>
    </div>
    <div className="hw-grid">{/* Story cards here */}</div>
  </section>
</main>
```

### Using Tokens Inline

```tsx
<div
  style={{
    padding: "var(--space-4)",
    color: "var(--color-text)",
    fontFamily: "var(--font-sans)",
  }}
>
  Content
</div>
```

---

## 🐛 Known Issues / Limitations

1. **Timeline Spine Position:** Fixed at 24px left - may need adjustment for different layouts
2. **Image Aspect Ratio:** Locked to 16:10 - consider making configurable
3. **Grid Breakpoint:** Currently 1024px - may need 768px tablet breakpoint
4. **Font Loading:** Playfair Display from Google Fonts - no fallback for offline

---

## 📚 References

- **Design Inspiration:** Vintage photo albums, scrapbooks, heritage books
- **Color Palette:** Clay pottery, aged paper, copper accents
- **Typography:** Playfair Display (serif headings), Inter (sans body)
- **Accessibility:** WCAG 2.1 Level AA compliance

---

_Last Updated: October 6, 2025_
_Version: 1.0_
_Author: Claude Code & Paul_
