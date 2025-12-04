/**
 * StoryPhotoWithBlurExtend Component
 *
 * A reusable image component that displays photos with a subtle blurred background.
 * Always uses object-fit: contain to show the full image without cropping.
 *
 * Key Features:
 * - Always uses "contain" - never crops the image
 * - All photos: show full image with blur filling any empty space
 * - Works for portrait, landscape, and ultra-wide images alike
 * - Respects user's zoom/pan transform settings
 * - Blur background provides elegant fill for any aspect ratio mismatch
 * - Matches editor preview exactly (WYSIWYG)
 * - Supports high-res masterUrl for book view (2400px) vs displayUrl (550px) for thumbnails
 *
 * Intended Use:
 * - Timeline story cards (use src/displayUrl)
 * - Book view story photos (use masterUrl for crisp display)
 * - Memory Box thumbnails and cards
 */

"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface StoryPhotoWithBlurExtendProps {
  src: string; // Primary source (displayUrl - 550px for thumbnails/blur)
  alt: string;
  masterUrl?: string; // High-res source (2400px) for book view - used as foreground when provided
  aspectRatio?: number; // default 4/3
  priority?: boolean;
  quality?: number; // Image quality: 75 (default), 90 (book view)
  useRawImg?: boolean; // If true, use raw img tag for foreground (bypasses Next.js optimization)
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
  masterUrl,
  aspectRatio,
  priority = false,
  quality = 75,
  useRawImg = false,
  className,
  imgClassName,
  width,
  height,
  transform,
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
}: StoryPhotoWithBlurExtendProps) {
  // Default aspect ratio is 4:3 (standard for story cards)
  const ratio = aspectRatio ?? 4 / 3;

  // Use masterUrl (2400px) for foreground if available, otherwise fall back to src (550px)
  // This ensures crisp photos in book view while keeping thumbnails efficient
  const foregroundSrc = masterUrl || src;

  /**
   * Transform Style:
   * - Apply user's zoom/pan transform if provided
   * - Always use "contain" to show full image without cropping
   * - Blur background fills any empty space (no white bars)
   * - This ensures WYSIWYG: editor preview = display view
   */
  const transformStyle = transform
    ? {
        transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
        transformOrigin: "center center",
        objectFit: "contain" as const,
        objectPosition: "center center",
      }
    : {
        objectFit: "contain" as const,
        objectPosition: "center center",
      };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[var(--color-page,#faf8f5)]",
        className
      )}
      // Always use inline aspectRatio to ensure dimensions are available
      // before Next.js Image calculates layout (fixes hydration race condition)
      style={{ aspectRatio: ratio }}
    >
      {/*
        Background Layer: Blurred extension
        - ALWAYS rendered for all images (provides elegant background fill)
        - Fills entire container with scaled, blurred version
        - Static (no transforms applied to blur layer)
        - scale-110 ensures blur extends beyond edges
        - opacity-70 for subtle, non-distracting effect
        - z-0 to ensure it stays behind foreground
        - Uses src (displayUrl - 550px) since blur doesn't need high-res
      */}
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        quality={75} // Low quality for blur background (not visible anyway)
        aria-hidden="true"
        className="object-cover scale-110 blur-xl opacity-70 z-0"
      />

      {/*
        Foreground Layer: Main image with user's zoom/pan
        - Always uses "contain" to show full image without cropping
        - Blur background fills any empty space (sides, top/bottom)
        - Transform is applied via inline styles (matches MultiPhotoUploader)
        - z-10 to ensure it appears above blur background
        - When useRawImg is true or masterUrl is provided, use raw img tag to bypass Next.js optimization
        - This matches the lightbox behavior for consistent quality
      */}
      {(useRawImg || masterUrl) ? (
        // Use raw img tag to bypass Next.js optimization entirely
        // This matches the lightbox behavior and guarantees full quality
        <img
          src={masterUrl || src}
          alt={alt}
          style={{
            ...transformStyle,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          className={cn(
            "z-10",
            transform && "will-change-transform",
            imgClassName
          )}
        />
      ) : (
        // Use Next.js Image for optimized thumbnails (timeline, etc.)
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          style={transformStyle}
          className={cn(
            "z-10",
            transform && "will-change-transform",
            imgClassName
          )}
        />
      )}
    </div>
  );
}
