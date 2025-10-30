/**
 * TimelineDecadeSection Component
 *
 * Renders a decade section with sticky header and story grid.
 *
 * Features:
 * - Sticky decade header (band)
 * - Story grid with MemoryCard components
 * - Ghost prompt card integration
 * - IntersectionObserver registration
 * - Fade animations for sticky headers
 *
 * Performance:
 * - React.memo to prevent unnecessary re-renders
 * - Delegates rendering to memoized MemoryCard components
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 1560-1631
 */

"use client";

import React from "react";
import { MemoryCard } from "./MemoryCard";
import { GhostPromptCard } from "@/components/GhostPromptCard";
import type { TimelineDecadeSectionProps } from "@/types/timeline";

/**
 * TimelineDecadeSection - Decade header + story grid
 *
 * Memoized to prevent re-renders when parent updates
 */
export const TimelineDecadeSection = React.memo(
  function TimelineDecadeSection({
    decadeId,
    title,
    subtitle,
    stories,
    isActive,
    isDarkTheme,
    colorScheme,
    birthYear,
    onRegisterRef,
    onGhostPromptClick,
    onOpenOverlay,
    highlightedStoryId,
    returnHighlightId,
    useV2Features = false,
  }: TimelineDecadeSectionProps) {
    return (
      <section
        id={decadeId}
        ref={(el) => onRegisterRef(decadeId, el)}
        data-decade-id={decadeId}
        className="hw-decade"
        style={isDarkTheme ? { borderColor: "#3b3d3f" } : undefined}
      >
        {/* Decade Band - Sticky Header */}
        <div
          className={`hw-decade-band ${isActive ? "current" : ""}`}
          style={
            isDarkTheme
              ? {
                  // Enhanced glassmorphism for dark theme - more transparent
                  backgroundColor: "rgba(37, 39, 40, 0.60)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  borderBottom: "1px solid rgba(59, 61, 63, 0.5)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#b0b3b8",
                }
              : undefined
          }
        >
          <div
            className="title"
            style={isDarkTheme ? { color: "#b0b3b8" } : undefined}
          >
            {title}
          </div>
          <div
            className="meta"
            style={isDarkTheme ? { color: "#8a8d92" } : undefined}
          >
            {subtitle}
          </div>
        </div>

        {/* Spacing before first card */}
        <div className="hw-decade-start"></div>

        {/* Stories Grid */}
        <div className="hw-grid">
          {stories.map((storyOrPrompt: any, storyIndex: number) => {
            // Check if this is a ghost prompt
            if (storyOrPrompt.isGhost) {
              return (
                <GhostPromptCard
                  key={storyOrPrompt.id ?? String(storyIndex)}
                  prompt={storyOrPrompt}
                  onClick={() => onGhostPromptClick(storyOrPrompt)}
                />
              );
            }
            // Regular story
            return (
              <MemoryCard
                key={storyOrPrompt.id ?? String(storyIndex)}
                story={storyOrPrompt}
                isHighlighted={storyOrPrompt.id === highlightedStoryId}
                isReturnHighlight={storyOrPrompt.id === returnHighlightId}
                colorScheme={colorScheme}
                isDarkTheme={isDarkTheme}
                onOpenOverlay={onOpenOverlay}
                birthYear={birthYear}
                useV2Features={useV2Features}
              />
            );
          })}
        </div>
      </section>
    );
  },
);
