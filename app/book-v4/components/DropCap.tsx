"use client";

import React, { type ReactNode } from "react";

type DropCapProps = {
  children: ReactNode;
  className?: string;
  useModernSyntax?: boolean;
};

/**
 * Drop Cap Typography Component
 *
 * Renders the first paragraph with a decorative drop cap (large initial letter).
 * Uses CSS ::first-letter pseudo-element with float fallback.
 *
 * Features:
 * - Float-based fallback for all browsers
 * - CSS initial-letter for modern browsers (Safari, Chrome 110+)
 * - Sepia/Gold accent color from CSS variables
 * - Screen reader friendly (content is still readable)
 *
 * Usage:
 * <DropCap>
 *   The story begins on a warm summer day...
 * </DropCap>
 */
export default function DropCap({
  children,
  className = "",
  useModernSyntax = false
}: DropCapProps) {
  const baseClass = useModernSyntax ? "book-drop-cap-modern" : "book-drop-cap";

  return (
    <p className={`${baseClass} book-story-text ${className}`}>
      {children}
    </p>
  );
}

/**
 * StoryText Component
 *
 * Standard body text component with enhanced line-height (1.85)
 * and premium typography settings from book-v4.css.
 */
export function StoryText({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`book-story-text ${className}`}>
      {children}
    </p>
  );
}

/**
 * DateLabel Component
 *
 * Styled date display with small-caps and letter-spacing
 * for a premium print aesthetic.
 */
export function DateLabel({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`book-date-label ${className}`}>
      {children}
    </span>
  );
}
