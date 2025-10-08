'use client';

import { useState, useEffect } from 'react';

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

export type ViewMode = 'single' | 'spread';

export interface ViewportConfig {
  mode: ViewMode;
  scale: number;
  bodyFontSize: number;
  scaledWidth: number; // Computed width for centering
}

// Page geometry tokens (from book.css)
export const PAGE_WIDTH = 528;   // px (5.5in × 96 DPI)
export const SPREAD_GAP = 30;    // px
export const SPREAD_PADDING = 28; // px padding on each side of .book-spread (cream layer)
export const CHROME_PADDING = 220; // px (left sidebar 112px + arrows/margins + breathing room)

// Screen typography
const SCREEN_BODY_SIZE = 20; // px base font size for screen
const MIN_BODY_SIZE = 18;    // px minimum readable size

/**
 * Calculate viewport width needed for a given scale
 */
function spreadWidthNeeded(scale: number): number {
  const contentWidth = (PAGE_WIDTH * 2 + SPREAD_GAP) * scale;
  return contentWidth + CHROME_PADDING;
}

/**
 * Calculate body font size at a given scale
 */
function bodyFontAt(scale: number): number {
  return SCREEN_BODY_SIZE * scale;
}

/**
 * Calculate optimal viewport configuration
 */
function calculateViewportConfig(viewportWidth: number): ViewportConfig {
  // Try spread at 1.0 scale
  if (viewportWidth >= spreadWidthNeeded(1.0)) {
    return {
      mode: 'spread',
      scale: 1.0,
      bodyFontSize: SCREEN_BODY_SIZE,
      scaledWidth: (PAGE_WIDTH * 2 + SPREAD_GAP) * 1.0 + (SPREAD_PADDING * 2),
    };
  }

  // Try spread at 0.95 scale (only if body font stays ≥ 18px)
  const scaleAt95 = 0.95;
  if (
    viewportWidth >= spreadWidthNeeded(scaleAt95) &&
    bodyFontAt(scaleAt95) >= MIN_BODY_SIZE
  ) {
    return {
      mode: 'spread',
      scale: scaleAt95,
      bodyFontSize: bodyFontAt(scaleAt95),
      scaledWidth: (PAGE_WIDTH * 2 + SPREAD_GAP) * scaleAt95 + (SPREAD_PADDING * 2),
    };
  }

  // Default: single page at 1.0 scale, centered
  return {
    mode: 'single',
    scale: 1.0,
    bodyFontSize: SCREEN_BODY_SIZE,
    scaledWidth: PAGE_WIDTH * 1.0 + (SPREAD_PADDING * 2),
  };
}

/**
 * Hook to track viewport configuration
 */
export function useViewportConfig(): ViewportConfig {
  const [config, setConfig] = useState<ViewportConfig>(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') {
      return {
        mode: 'single',
        scale: 1.0,
        bodyFontSize: SCREEN_BODY_SIZE,
        scaledWidth: PAGE_WIDTH + (SPREAD_PADDING * 2),
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

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
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
