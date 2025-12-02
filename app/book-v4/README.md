# Book V4 - Premium Skeuomorphic Book View

A premium version of the book view with enhanced skeuomorphic design elements based on Gemini's feedback.

## Features

### Visual Enhancements

- **Cream Paper Background** (`#F5F1E8`) - Warm, authentic paper feel
- **Paper Texture Overlay** - SVG feTurbulence noise for subtle grain
- **Gutter Shadow** - Gradient shadow toward spine for depth
- **Page Stack Lines** - Vertical lines on outer edges (desktop only)

### Typography

- **Drop Caps** - Decorative first letter on story first paragraph
- **Enhanced Line Height** (1.85) - Print-like readability
- **Small-Caps Dates** - `font-variant: small-caps` with letter spacing
- **Crimson Text Serif** - Premium body font

### Photo Styling

- **Subtle Rotation** - ±0.8 degree tilt (±0.5 on mobile)
- **Lifted Shadow** - Multi-layer shadow for depth
- **Rounded Corners** (12px) - Soft edges

### Audio Player

- **Waveform Visualization** - Real audio peaks with wavesurfer.js
- **Click-to-Seek** - Navigate by clicking waveform
- **Sepia/Gold Theming** - Matches book color scheme
- **Tabular Numerals** - Aligned time display

### UI Refinements

- **Hover-Only Edit Button** - Pencil icon in corner, appears on hover
- **Continue Reading Fade** - Gradient fade at bottom for long content
- **Reduced Motion Support** - Respects `prefers-reduced-motion`

## Dual Theme System

The book supports two color themes via CSS custom properties:

### Sepia Theme (Default)
- Paper: `#F5F1E8` (warm cream)
- Accent: `#8B7355` (sepia brown)

### Gold Theme
- Paper: `#FFFDF8` (bright ivory)
- Accent: `#CBA46A` (warm gold)

To switch themes, add `.book-theme-gold` class to the root element.

## File Structure

```
app/book-v4/
├── page.tsx                    # Main page component
├── book-v4.css                 # Premium CSS with dual themes
├── README.md                   # This file
└── components/
    ├── index.ts                # Component exports
    ├── BookPageV4.tsx          # Enhanced page renderer
    ├── DarkBookProgressBarV4.tsx
    ├── PaperTexture.tsx        # SVG noise overlay
    ├── GutterShadow.tsx        # Spine shadow effect
    ├── PageStack.tsx           # Page edge lines
    ├── DropCap.tsx             # Typography components
    ├── PhotoFrame.tsx          # Rotated photo frame
    ├── WaveformAudioPlayer.tsx # Audio with waveform
    ├── EditButton.tsx          # Hover-only edit
    └── ContinueReading.tsx     # Fade indicator
```

## Dependencies

- `wavesurfer.js` - Waveform visualization (~15KB)
- `@wavesurfer/react` - React bindings

## Accessibility

- **WCAG AA Contrast** - All text meets contrast requirements
- **Keyboard Navigation** - Arrow keys + Space for page turns
- **Screen Reader Support** - ARIA live region announces page changes
- **Focus Indicators** - High-visibility focus ring (3px blue)
- **Reduced Motion** - Animations disabled when preferred

## Mobile Considerations

- Paper texture reduced (opacity 0.02)
- Page stack lines hidden
- Photo rotation limited (±0.5 deg)
- Simplified shadows
- Waveform works on touch

## Usage

Navigate to `/book-v4` to view the premium book experience.

## Comparison with /book

| Feature | /book | /book-v4 |
|---------|-------|----------|
| Paper color | White (#FFFFFF) | Cream (#F5F1E8) |
| Paper texture | None | SVG noise |
| Gutter shadow | Simple gradient | Multi-stop gradient |
| Page stack | Hidden | Visible lines |
| Drop caps | None | First paragraph |
| Line height | 1.6-1.7 | 1.85 |
| Audio player | Simple progress | Waveform |
| Edit button | Always visible | Hover only |
| Photo styling | Basic | Rotated + shadow |
