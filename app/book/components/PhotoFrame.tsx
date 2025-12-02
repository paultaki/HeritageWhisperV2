"use client";

import React, { type ReactNode, useMemo } from "react";

type PhotoRotation = "none" | "slight-left" | "slight-right" | "left" | "right";

type PhotoFrameProps = {
  children: ReactNode;
  rotation?: PhotoRotation;
  storyId?: string; // Used to generate deterministic rotation
  className?: string;
  showShadow?: boolean;
};

/**
 * Photo Frame Component
 *
 * Wraps photos with premium styling:
 * - Subtle rotation (-0.8 to +0.8 degrees) for a natural, casual look
 * - Multi-layer lifted shadow for depth
 * - Rounded corners (12px)
 *
 * Rotation modes:
 * - none: No rotation
 * - slight-left: -0.6 degrees
 * - slight-right: +0.6 degrees
 * - left: -0.8 degrees
 * - right: +0.8 degrees
 * - Auto (via storyId): Deterministic rotation based on story ID hash
 */
export default function PhotoFrame({
  children,
  rotation,
  storyId,
  className = "",
  showShadow = true
}: PhotoFrameProps) {
  // Calculate deterministic rotation from story ID
  const calculatedRotation = useMemo(() => {
    if (rotation) return rotation;
    if (!storyId) return "none";

    // Simple hash from story ID to get consistent rotation
    let hash = 0;
    for (let i = 0; i < storyId.length; i++) {
      const char = storyId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Map hash to rotation variants
    const rotations: PhotoRotation[] = ["slight-left", "slight-right", "left", "right"];
    const index = Math.abs(hash) % rotations.length;
    return rotations[index];
  }, [rotation, storyId]);

  const dataRotation = calculatedRotation !== "none" ? calculatedRotation : undefined;

  return (
    <div
      className={`book-photo-frame ${className}`}
      data-rotation={dataRotation}
    >
      {/* Shadow layer */}
      {showShadow && (
        <div className="book-photo-frame--shadow" aria-hidden="true" />
      )}
      {/* Photo content */}
      {children}
    </div>
  );
}

/**
 * Mobile-optimized Photo Frame
 *
 * Simplified version for mobile with:
 * - Reduced rotation (±0.5 deg max)
 * - Lighter shadow for performance
 */
export function MobilePhotoFrame({
  children,
  storyId,
  className = ""
}: {
  children: ReactNode;
  storyId?: string;
  className?: string;
}) {
  // Calculate subtle rotation for mobile
  const rotation = useMemo(() => {
    if (!storyId) return "none";

    let hash = 0;
    for (let i = 0; i < storyId.length; i++) {
      const char = storyId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    // Only use slight rotations for mobile
    return Math.abs(hash) % 2 === 0 ? "slight-left" : "slight-right";
  }, [storyId]) as PhotoRotation;

  return (
    <PhotoFrame
      rotation={rotation}
      className={className}
      showShadow={false} // Simplified shadow for mobile
    >
      {children}
    </PhotoFrame>
  );
}
