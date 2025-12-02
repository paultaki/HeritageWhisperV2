"use client";

import React from "react";

type PaperTextureProps = {
  variant?: "default" | "subtle" | "mobile";
  className?: string;
};

/**
 * Paper Texture Overlay
 *
 * Creates an authentic paper grain effect using SVG feTurbulence noise.
 * Applies a multiply blend mode over the page background.
 *
 * Variants:
 * - default: opacity 0.035 (desktop)
 * - subtle: opacity 0.025 (lighter effect)
 * - mobile: opacity 0.02 (performance-friendly)
 */
export default function PaperTexture({
  variant = "default",
  className = ""
}: PaperTextureProps) {
  const variantClass = variant === "subtle"
    ? "book-paper-texture--subtle"
    : variant === "mobile"
    ? "book-paper-texture--mobile"
    : "";

  return (
    <div
      className={`book-paper-texture ${variantClass} ${className}`}
      aria-hidden="true"
    />
  );
}
