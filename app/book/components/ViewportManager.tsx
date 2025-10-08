'use client';

import { useState, useEffect } from 'react';

/**
 * ViewportManager - Detects viewport size and determines view mode
 *
 * Breakpoint: 1200px
 * - Below 1200px: Single page view
 * - 1200px and above: Spread view (two pages)
 *
 * Spread width requirement: 1080px (528 + 24 + 528) + margins
 */

export type ViewMode = 'single' | 'spread';

const SPREAD_BREAKPOINT = 1200; // Minimum width for spread view

export function useViewportMode(): ViewMode {
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setViewMode(width >= SPREAD_BREAKPOINT ? 'spread' : 'single');
    };

    // Initial check
    checkViewport();

    // Listen for resize
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return viewMode;
}

interface ViewportManagerProps {
  children: (viewMode: ViewMode) => React.ReactNode;
}

/**
 * Component wrapper that provides view mode to children
 */
export default function ViewportManager({ children }: ViewportManagerProps) {
  const viewMode = useViewportMode();
  return <>{children(viewMode)}</>;
}
