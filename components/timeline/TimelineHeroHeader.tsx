/**
 * TimelineHeroHeader Component
 *
 * Dynamic greeting header for the Timeline page that adapts based on
 * the viewer's relationship to the storyteller:
 * - Owner: Warm time-of-day greeting with "Add memory" button
 * - Viewer: Context line + book-cover title
 * - Public: Book-cover title only
 *
 * Created: December 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  type TimelineViewerContext,
  getTimelineHeaderState,
} from '@/lib/timelineHeader';

interface TimelineHeroHeaderProps {
  /** Context describing the viewer and storyteller relationship */
  viewerContext: Omit<TimelineViewerContext, 'localHour'>;
  /** Whether the page is in dark mode */
  isDark?: boolean;
  /** Optional callback to open recording modal instead of navigation */
  onAddMemory?: () => void;
}

/**
 * Hero header component for the Timeline page.
 *
 * Renders a warm greeting for owners, a context line for family viewers,
 * or a simple book-cover title for public viewers. All conditional logic
 * is centralized in getTimelineHeaderState - this component just renders.
 */
export function TimelineHeroHeader({
  viewerContext,
  isDark = false,
  onAddMemory,
}: TimelineHeroHeaderProps) {
  const router = useRouter();

  // Derive local hour on client side to avoid hydration mismatch
  const [localHour, setLocalHour] = useState<number | undefined>(undefined);

  useEffect(() => {
    setLocalHour(new Date().getHours());
  }, []);

  // Build complete context with local hour
  const fullContext: TimelineViewerContext = {
    ...viewerContext,
    localHour,
  };

  // Get header state - all logic centralized here
  const headerState = getTimelineHeaderState(fullContext);

  // Handle add memory button click
  const handleAddMemory = () => {
    if (onAddMemory) {
      onAddMemory();
    } else {
      router.push('/recording');
    }
  };

  // Colors based on dark mode
  const textPrimary = isDark ? '#e4e6e9' : '#111827';
  const textSecondary = isDark ? '#b0b3b8' : '#4b5563';
  const textMuted = isDark ? '#8a8d92' : '#6b7280';

  return (
    <div className="text-center mb-[114px]">
      {/* Owner mode: Large serif greeting + subtext + Add Memory button */}
      {headerState.mode === 'owner' && headerState.greeting && (
        <>
          {/* Greeting line - large serif */}
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight mb-4 font-serif"
            style={{ color: textPrimary }}
          >
            {headerState.greeting}
          </h1>

          {/* Warm subtext */}
          {headerState.greetingSubtext && (
            <p
              className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-center"
              style={{ color: textSecondary }}
            >
              {headerState.greetingSubtext}
            </p>
          )}

          {/* Add Memory button - primary CTA */}
          {headerState.showAddMemoryButton && (
            <button
              onClick={handleAddMemory}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-medium text-white transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--hw-primary, #203954)',
                minHeight: '60px',
              }}
              aria-label="Add a new memory"
            >
              <Plus className="w-5 h-5" />
              Add memory
            </button>
          )}
        </>
      )}

      {/* Viewer mode: Context line + book-cover title */}
      {headerState.mode === 'viewer' && (
        <>
          {/* Context line - small sans-serif above title */}
          {headerState.viewerContextLine && (
            <p
              className="text-base md:text-lg mb-3"
              style={{ color: textMuted }}
            >
              {headerState.viewerContextLine}
            </p>
          )}

          {/* Book-cover title */}
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight mb-6"
            style={{ color: textPrimary }}
          >
            {headerState.title}
          </h1>

          {/* Subtitle */}
          {headerState.subtitle && (
            <p
              className="text-xl max-w-2xl mx-auto text-center"
              style={{ color: textSecondary }}
            >
              {headerState.subtitle}
            </p>
          )}
        </>
      )}

      {/* Public share mode: Book-cover title only */}
      {headerState.mode === 'publicShare' && (
        <>
          {/* Book-cover title */}
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight mb-6"
            style={{ color: textPrimary }}
          >
            {headerState.title}
          </h1>

          {/* Subtitle */}
          {headerState.subtitle && (
            <p
              className="text-xl max-w-2xl mx-auto text-center"
              style={{ color: textSecondary }}
            >
              {headerState.subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}
