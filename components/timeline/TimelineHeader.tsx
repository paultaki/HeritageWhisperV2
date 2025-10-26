/**
 * TimelineHeader Component
 *
 * Page header for the timeline view with logo and navigation.
 *
 * Features:
 * - Heritage Whisper logo
 * - Timeline title with calendar icon
 * - Sticky positioning
 * - Theme-aware styling
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 1480-1518
 */

"use client";

import React from "react";
import Image from "next/image";
import { Calendar } from "lucide-react";
import type { TimelineHeaderProps } from "@/types/timeline";

/**
 * Color scheme configuration mapping
 */
const colorSchemeStyles = {
  original: "rgba(255, 255, 255, 0.95)",
  inverted: "rgba(255, 248, 243, 0.95)",
  soft: "rgba(249, 250, 251, 0.95)",
  cool: "rgba(248, 250, 252, 0.95)",
  dark: "rgba(15, 15, 15, 0.95)",
  retro: "rgba(245, 230, 211, 0.95)",
  white: "rgba(255, 255, 255, 0.95)",
};

/**
 * TimelineHeader - Sticky page header
 */
export function TimelineHeader({
  isDark,
  currentColorScheme,
}: TimelineHeaderProps) {
  // Determine background color based on theme and color scheme
  const backgroundColor = isDark
    ? "#252728"
    : colorSchemeStyles[currentColorScheme] || colorSchemeStyles.original;

  // Determine border color
  const borderColor = isDark
    ? "#3b3d3f"
    : currentColorScheme === "dark"
      ? "#1f2937"
      : "#e5e7eb";

  // Determine text color
  const textColor = isDark
    ? "#b0b3b8"
    : currentColorScheme === "retro"
      ? "#6B4E42"
      : undefined;

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-sm p-3 ${isDark ? "" : currentColorScheme === "dark" ? "border-b border-gray-800" : "border-b border-gray-100"}`}
      style={{
        backgroundColor,
        borderBottom: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo Icon hw.svg"
              alt="Heritage Whisper"
              width={64}
              height={64}
              className="h-16 w-auto"
            />
            <Calendar
              className="w-8 h-8"
              style={{ color: isDark ? "#b0b3b8" : "#1f0f08" }}
            />
            <h1
              className="text-2xl font-bold"
              style={{ color: isDark ? "#b0b3b8" : undefined }}
            >
              Timeline
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
