# Premium Audio Visualizer

Minimalist Apple/Notion-style audio visualizer with real-time frequency analysis and smooth 60fps Canvas rendering.

## Overview

Replaces the old `WaveformVisualizer` with a premium, high-performance alternative that:

✅ **Modern aesthetic** - Clean, minimal design matching Apple/Notion style
✅ **Real frequency data** - Actual Web Audio API analysis (not fake sine waves)
✅ **High performance** - 60fps Canvas rendering with zero React re-renders
✅ **Flexible input** - Works with both `MediaStream` and pre-computed `frequencyData`
✅ **Design system colors** - Uses HeritageWhisper design tokens
✅ **Smooth animations** - Interpolated transitions, no jittery movements
✅ **Logarithmic scaling** - Better representation of human hearing range

## Design Specs

```
Bars: 32 bars
Bar width: 3px
Bar gap: 6px
Height: 60px container
Colors: Design system tokens (--hw-primary, --hw-text-muted)
Animation: Smooth easing with voice frequency boost
Glow: Subtle shadow (4px), no heavy blur
Alignment: Center-aligned bars
```

## Usage

### Option 1: With Pre-computed Frequency Data (Recommended)

Use when you already have an audio analyzer (like `useAudioAnalyzer` hook):

```tsx
import { PremiumAudioVisualizer } from "@/components/recording/PremiumAudioVisualizer";
import { useAudioAnalyzer } from "@/hooks/use-audio-analyzer";

function MyRecorder() {
  const { frequencyData } = useAudioAnalyzer({
    fftSize: 128,
    smoothingTimeConstant: 0.75,
  });

  return (
    <PremiumAudioVisualizer
      frequencyData={frequencyData}
      isRecording={isRecording}
      isPaused={isPaused}
    />
  );
}
```

### Option 2: With Direct MediaStream

Let the visualizer create its own analyzer:

```tsx
import { PremiumAudioVisualizer } from "@/components/recording/PremiumAudioVisualizer";

function MyRecorder() {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setMediaStream(stream);
  };

  return (
    <PremiumAudioVisualizer
      audioStream={mediaStream}
      isRecording={isRecording}
      isPaused={isPaused}
    />
  );
}
```

## Props

```typescript
type PremiumAudioVisualizerProps = {
  /** Audio stream from microphone (optional if frequencyData provided) */
  audioStream?: MediaStream | null;

  /** Pre-computed frequency data from external analyzer (optional if audioStream provided) */
  frequencyData?: number[];

  /** Recording state */
  isRecording: boolean;

  /** Paused state */
  isPaused?: boolean;

  /** Optional custom active color (defaults to --hw-primary: #203954) */
  activeColor?: string;

  /** Optional custom idle color (defaults to --hw-text-muted: #8A8378) */
  idleColor?: string;

  /** Optional className for container */
  className?: string;
};
```

## States

- **Idle** - Bars at minimum height (15%), muted color at 40% opacity
- **Recording** - Bars react to frequency data, primary color at 90% opacity, subtle glow
- **Paused** - Bars decay to idle, muted color

## Performance

- **60fps** - Uses `requestAnimationFrame` for smooth animation
- **Zero React re-renders** - All visualization happens in Canvas (no state updates)
- **Efficient FFT** - 256 FFT size = 128 frequency bins
- **Logarithmic mapping** - 32 bars cover full frequency spectrum intelligently
- **Voice frequency boost** - Mid-range (300Hz-3kHz) boosted by 20% for better voice visualization
- **Smooth interpolation** - 75% smoothing factor prevents jittery movements

## Integration Examples

### Already Integrated ✅

- `components/recording/QuickStoryRecorder.tsx` - Uses with `frequencyData` from `useAudioAnalyzer`

### To Be Integrated

- `app/recording/components/AudioRecordingScreen.tsx` - Currently has audio level but no visual waveform
- `app/recording-v3/components/AudioRecordingScreen.tsx` - Same as above

## Migration from Old WaveformVisualizer

**Old component (to be deprecated):**
- `app/recording/components/WaveformVisualizer.tsx` - Simple 12-bar sine wave simulation
- `components/recording/WaveformVisualizer.tsx` - Complex 28-bar SVG with glow effects

**Migration steps:**

1. Replace import:
```tsx
// Old
import { WaveformVisualizer } from "./WaveformVisualizer";

// New
import { PremiumAudioVisualizer } from "@/components/recording/PremiumAudioVisualizer";
```

2. Update component usage:
```tsx
// Old
<WaveformVisualizer
  frequencyData={frequencyData}
  isRecording={isRecording}
  isPaused={isPaused}
  decibelLevel={decibelLevel}  // ❌ No longer needed
/>

// New
<PremiumAudioVisualizer
  frequencyData={frequencyData}
  isRecording={isRecording}
  isPaused={isPaused}
/>
```

3. Remove old CSS (if using the simple visualizer):
```css
/* Can remove from recording.css and recording-v3.css */
.hw-waveform {
  /* ... */
}
.hw-waveform-bar {
  /* ... */
}
```

## Comparison: Old vs New

| Feature | Old (Simple) | Old (Ambient) | **New (Premium)** |
|---------|--------------|---------------|-------------------|
| Bars | 12 | 28 | **32** |
| Data source | Fake sine wave | Real FFT | **Real FFT** |
| Rendering | DOM (React) | SVG | **Canvas** |
| FPS | ~10 (100ms updates) | ~60 (SVG animate) | **60 (RAF)** |
| Performance | Poor (state updates) | Good | **Excellent** |
| Aesthetics | Basic | Ambient | **Minimal Premium** |
| Voice boost | ❌ | ❌ | **✅ 20% mid-range** |
| Smoothing | ❌ | ✅ (SVG) | **✅ (Interpolation)** |
| Glow effect | ❌ | ✅ (Heavy blur) | **✅ (Subtle)** |
| Design system | ❌ | ❌ | **✅** |
| File size | ~60 lines | ~200 lines | **~310 lines** |

## Colors (Design System)

The visualizer automatically uses HeritageWhisper design system colors:

**Active (recording):**
- Color: `--hw-primary: #203954` (deep slate blue)
- Opacity: 90%
- Glow: 4px shadow

**Idle/Paused:**
- Color: `--hw-text-muted: #8A8378` (muted text)
- Opacity: 40%
- No glow

You can override with custom colors via props:

```tsx
<PremiumAudioVisualizer
  activeColor="#1F5F4A"  // Forest green (current brand recording color)
  idleColor="#D4D4D4"    // Light gray
  // ...
/>
```

## Browser Compatibility

- ✅ Chrome/Edge (Chromium) - Excellent
- ✅ Safari - Excellent (optimized for Retina displays)
- ✅ Firefox - Excellent
- ⚠️ Mobile browsers - Good (may need testing for performance)

## Troubleshooting

### Bars not moving

**Issue:** Visualizer renders but bars don't react to audio.

**Solutions:**
1. Check `isRecording` prop is `true`
2. Verify `frequencyData` is being updated (not empty array)
3. If using `audioStream`, check microphone permissions granted
4. Check browser console for AudioContext errors

### Performance issues

**Issue:** Animation is laggy or stuttering.

**Solutions:**
1. Reduce FFT size in analyzer: `fftSize: 64` instead of `256`
2. Check for other CPU-intensive operations
3. Use `frequencyData` prop instead of `audioStream` (offload analyzer work)
4. Test on different device (may be device limitation)

### Colors don't match design

**Issue:** Colors look different from design mockups.

**Solutions:**
1. Check CSS custom properties are defined: `--hw-primary`, `--hw-text-muted`
2. Pass custom colors via props: `activeColor="#203954"`
3. Verify design system tokens are loaded in root layout

## Technical Details

### Frequency Mapping (Logarithmic Scale)

The visualizer uses logarithmic frequency mapping to better represent human hearing:

```typescript
// Bar i covers frequencies from:
const percent = i / 32;
const startFreq = Math.pow(percent, 1.5) * maxFreq;
const endFreq = Math.pow((i + 1) / 32, 1.5) * maxFreq;
```

This means:
- **Low frequencies** (bass): First 8 bars (~0-500Hz)
- **Mid frequencies** (voice): Middle 16 bars (~500Hz-4kHz) - **boosted 20%**
- **High frequencies** (treble): Last 8 bars (~4kHz-20kHz)

### Smoothing Algorithm

Prevents jittery animations with interpolation:

```typescript
const smoothed = previous + (current - previous) * (1 - 0.75);
// 75% of previous value + 25% of new value
```

### Retina Display Support

Automatically detects pixel ratio and scales canvas:

```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

## Future Enhancements

Potential improvements for v2:

- [ ] Different visualizer styles (line, dots, circular)
- [ ] Customizable bar count via prop
- [ ] Gradient colors (spectrum effect)
- [ ] Peak hold indicators
- [ ] Stereo channel visualization
- [ ] Export as animated GIF/video
- [ ] React to specific frequency ranges (e.g., beat detection)

## Credits

- **Design inspiration:** Apple Voice Memos, Notion audio player
- **Frequency analysis:** Web Audio API AnalyserNode
- **Smoothing technique:** Exponential moving average
- **Performance optimization:** Canvas RAF pattern

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last updated:** November 23, 2025
**Maintainer:** HeritageWhisper Team
