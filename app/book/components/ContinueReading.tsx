"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

type ContinueReadingProps = {
  onClick?: () => void;
  showIndicator?: boolean;
  className?: string;
};

/**
 * Continue Reading Fade Overlay
 *
 * A gradient fade at the bottom of scrollable content indicating
 * more content below. Replaces the "Continue Reading" pill button.
 *
 * Features:
 * - Linear gradient from paper color to transparent
 * - Optional animated chevron indicator
 * - Click handler for scroll-to-next
 * - Reduced motion support
 *
 * Usage:
 * <div className="relative overflow-hidden">
 *   ... scrollable content ...
 *   <ContinueReading onClick={scrollToNext} />
 * </div>
 */
export default function ContinueReading({
  onClick,
  showIndicator = true,
  className = ""
}: ContinueReadingProps) {
  return (
    <div className={`book-fade-bottom ${className}`}>
      {showIndicator && (
        <button
          type="button"
          onClick={onClick}
          className="book-fade-indicator animate-bounce-gentle"
          aria-label="Continue reading"
          tabIndex={onClick ? 0 : -1}
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

/**
 * Scroll Progress Indicator
 *
 * Optional component showing scroll progress through long content.
 * Uses CSS custom properties for theming.
 */
export function ScrollProgress({
  progress,
  className = ""
}: {
  progress: number; // 0-100
  className?: string;
}) {
  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/10 rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Reading progress: ${Math.round(progress)}%`}
    >
      <div
        className="h-full bg-[var(--book-accent)] rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
