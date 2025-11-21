/**
 * StoryPhotoWithBlurExtend Component
 *
 * A reusable image component that handles portrait-oriented photos by adding
 * a subtle blurred background extension to eliminate white bars.
 *
 * Portrait Detection:
 * - Determines portrait orientation when height/width > 1.15
 * - Falls back to standard object-cover for landscape images
 *
 * Intended Use:
 * - Timeline story cards
 * - Book view story photos
 * - Memory Box thumbnails and cards
 *
 * NOT intended for:
 * - Recording UIs
 * - Small avatars or icons
 * - Circular images
 */

"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface StoryPhotoWithBlurExtendProps {
  src: string;
  alt: string;
  aspectRatio?: number; // default 16/10
  priority?: boolean;
  className?: string; // extra classes for outer wrapper
  imgClassName?: string; // extra classes for foreground image
  width?: number; // optional intrinsic dimensions for portrait detection
  height?: number; // optional intrinsic dimensions for portrait detection
  transform?: {
    // zoom/pan support for user-customized photos
    zoom: number;
    position: { x: number; y: number };
  };
  sizes?: string; // responsive image sizes for Next.js Image optimization
}

export function StoryPhotoWithBlurExtend({
  src,
  alt,
  aspectRatio,
  priority = false,
  className,
  imgClassName,
  width,
  height,
  transform,
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
}: StoryPhotoWithBlurExtendProps) {
  // Default aspect ratio is 16:10 (standard for story cards)
  const ratio = aspectRatio ?? 16 / 10;

  /**
   * Portrait Detection:
   * - Uses provided width/height when available
   * - Threshold: height/width > 1.15 triggers blur-extend
   * - Falls back to false if dimensions unavailable
   */
  const isPortrait = width && height ? height / width > 1.15 : false;

  /**
   * Transform Logic:
   * - For PORTRAIT images: IGNORE transforms (show original with blur-extend)
   * - For LANDSCAPE images: APPLY transforms (zoom/pan as intended)
   *
   * Rationale: Portrait photos with zoom/pan transforms were "cropped" to fit
   * landscape frames. Ignoring transforms lets blur-extend show the full portrait.
   */
  const shouldApplyTransform = !isPortrait && transform;

  // Build transform style for foreground image (only for landscape)
  const transformStyle = shouldApplyTransform
    ? {
        transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
        transformOrigin: "center center",
      }
    : undefined;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[var(--color-page,#faf8f5)]",
        // Use Tailwind aspect ratio utility for common 16:10 case
        ratio === 16 / 10 ? "aspect-[16/10]" : "",
        className
      )}
      style={ratio !== 16 / 10 ? { aspectRatio: ratio } : undefined}
    >
      {isPortrait ? (
        <>
          {/*
            Background Layer: Blurred extension
            - Fills entire container with scaled, blurred version
            - Static (no transforms applied)
            - scale-110 ensures blur extends beyond edges
            - opacity-70 for subtle, non-distracting effect
          */}
          <Image
            src={src}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            aria-hidden="true"
            className="object-cover scale-110 blur-xl opacity-70"
          />

          {/*
            Foreground Layer: Centered portrait
            - Receives zoom/pan transforms (if provided)
            - object-contain preserves aspect ratio
            - Centered with flexbox
          */}
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={src}
              alt={alt}
              style={transformStyle}
              className={cn(
                "h-full w-auto max-h-full max-w-full object-contain rounded-2xl shadow-md",
                shouldApplyTransform ? "will-change-transform" : "",
                imgClassName
              )}
            />
          </div>
        </>
      ) : (
        /*
          Non-Portrait Fallback: Standard fill behavior
          - Uses Next.js Image component for optimization
          - object-cover fills container
          - Applies transforms if provided
        */
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={transformStyle}
          className={cn(
            "object-cover",
            shouldApplyTransform ? "will-change-transform" : "",
            imgClassName
          )}
        />
      )}
    </div>
  );
}
