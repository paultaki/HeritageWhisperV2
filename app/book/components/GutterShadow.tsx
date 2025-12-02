"use client";

import React from "react";

type GutterShadowProps = {
  side: "left" | "right";
  className?: string;
};

/**
 * Gutter Shadow
 *
 * Creates a spine/binding shadow effect on the inner edge of book pages.
 * Simulates the curve and shadow where pages meet the spine.
 *
 * Usage:
 * - Left side: Place on left page, shadow fades from left edge
 * - Right side: Place on right page, shadow fades from right edge
 */
export default function GutterShadow({
  side,
  className = ""
}: GutterShadowProps) {
  const shadowClass = side === "left"
    ? "book-gutter-shadow-left"
    : "book-gutter-shadow-right";

  return (
    <div
      className={`${shadowClass} ${className}`}
      aria-hidden="true"
    />
  );
}
