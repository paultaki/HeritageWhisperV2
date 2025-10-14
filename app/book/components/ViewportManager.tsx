"use client";

import { useState, useEffect } from "react";

/**
 * ViewportManager - Intelligent viewport detection with scale calculation
 *
 * Determines optimal view mode (spread/single) and scale based on viewport width.
 * Ensures body text never falls below 18px on screen.
 * Always centers content - no left-justify at any breakpoint.
 *
 * Breakpoints (calculated from page geometry):
 * - Spread @ 1.0 scale needs: (528*2 + 30 + 192) = ~1278px minimum
 * - Spread @ 0.95 scale needs: 1278 * 0.95 = ~1214px (body: 19px ≥ 18px ✓)
 * - Below that: Single page @ 1.0 scale, centered
 */

export type ViewMode = "single" | "spread";

export interface ViewportConfig {
  mode: ViewMode;
  scale: number;
  bodyFontSize: number;
  scaledWidth: number; // Computed width for centering
}

// Page geometry tokens (from book.css)
export const PAGE_WIDTH = 528; // px (5.5in × 96 DPI)
export const SPREAD_GAP = 30; // px
export const SPREAD_PADDING = 28; // px padding on each side of .book-spread (cream layer)
export const CHROME_PADDING = 220; // px (left sidebar 112px + arrows/margins + breathing room)

// Screen typography
const SCREEN_BODY_SIZE = 20; // px base font size for screen
const MIN_BODY_SIZE = 18; // px minimum readable size
const MAX_BODY_SIZE = 26; // px maximum readable size (prevents oversized text)

// Scaling constraints
const MAX_SCALE = 1.3; // Maximum scale to prevent text from being too large
const MIN_SCALE = 0.95; // Minimum scale for smaller viewports
const SCALE_STEP = 0.05; // Granularity for scale calculations
const MOBILE_BREAKPOINT = 640; // Mobile devices stay locked at 1.0x

/**
 * Calculate viewport width needed for spread view at a given scale
 */
function spreadWidthNeeded(scale: number): number {
  const contentWidth = (PAGE_WIDTH * 2 + SPREAD_GAP) * scale;
  return contentWidth + CHROME_PADDING;
}

/**
 * Calculate viewport width needed for single page view at a given scale
 */
function singleWidthNeeded(scale: number): number {
  const contentWidth = PAGE_WIDTH * scale;
  return contentWidth + CHROME_PADDING;
}

/**
 * Calculate body font size at a given scale
 */
function bodyFontAt(scale: number): number {
  return SCREEN_BODY_SIZE * scale;
}

/**
 * Calculate optimal viewport configuration with dynamic upscaling
 */
function calculateViewportConfig(viewportWidth: number): ViewportConfig {
  // MOBILE: Lock at 1.0x (DO NOT CHANGE - preserves mobile experience)
  if (viewportWidth <= MOBILE_BREAKPOINT) {
    return {
      mode: "single",
      scale: 1.0,
      bodyFontSize: SCREEN_BODY_SIZE,
      scaledWidth: PAGE_WIDTH * 1.0 + SPREAD_PADDING * 2,
    };
  }

  // DESKTOP/TABLET: Try scaling up from MAX_SCALE down to MIN_SCALE
  // This allows book to grow larger on bigger screens
  // Note: We use transform scale, NOT explicit width (scaledWidth = 0 signals auto-width)
  for (let scale = MAX_SCALE; scale >= MIN_SCALE; scale -= SCALE_STEP) {
    // Round to avoid floating point precision issues
    scale = Math.round(scale * 100) / 100;

    const bodyFont = bodyFontAt(scale);

    // Skip if font size is outside readable range
    if (bodyFont < MIN_BODY_SIZE || bodyFont > MAX_BODY_SIZE) {
      continue;
    }

    // Try spread view first (preferred for larger screens)
    if (viewportWidth >= spreadWidthNeeded(scale)) {
      return {
        mode: "spread",
        scale,
        bodyFontSize: bodyFont,
        scaledWidth: 0, // Auto-width for desktop - let transform scale do the work
      };
    }

    // Try single page view at this scale
    if (viewportWidth >= singleWidthNeeded(scale)) {
      return {
        mode: "single",
        scale,
        bodyFontSize: bodyFont,
        scaledWidth: 0, // Auto-width for desktop - let transform scale do the work
      };
    }
  }

  // Fallback: single page at 1.0 scale, centered
  return {
    mode: "single",
    scale: 1.0,
    bodyFontSize: SCREEN_BODY_SIZE,
    scaledWidth: 0, // Auto-width
  };
}

/**
 * Hook to track viewport configuration
 */
export function useViewportConfig(): ViewportConfig {
  const [config, setConfig] = useState<ViewportConfig>(() => {
    // SSR-safe initialization
    if (typeof window === "undefined") {
      return {
        mode: "single",
        scale: 1.0,
        bodyFontSize: SCREEN_BODY_SIZE,
        scaledWidth: PAGE_WIDTH + SPREAD_PADDING * 2,
      };
    }
    return calculateViewportConfig(window.innerWidth);
  });

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setConfig(calculateViewportConfig(width));
    };

    // Initial check
    checkViewport();

    // Debounced resize listener
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkViewport, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return config;
}

/**
 * Legacy hook for backward compatibility
 */
export function useViewportMode(): ViewMode {
  const { mode } = useViewportConfig();
  return mode;
}

interface ViewportManagerProps {
  children: (config: ViewportConfig) => React.ReactNode;
}

/**
 * Component wrapper that provides viewport config to children
 */
export default function ViewportManager({ children }: ViewportManagerProps) {
  const config = useViewportConfig();
  return <>{children(config)}</>;
}
