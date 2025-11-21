/**
 * StoryPhotoWithBlurExtend Component
 *
 * A reusable image component that displays photos with a subtle blurred background.
 * The background is always present but only visible when the image doesn't perfectly
 * fill the 16:10 aspect ratio container.
 *
 * Key Features:
 * - Always uses object-fit: cover to fill the frame (no letterboxing)
 * - Respects user's zoom/pan transform settings
 * - Blur background provides elegant fill for any aspect ratio mismatch
 * - Matches editor preview exactly
 *
 * Intended Use:
 * - Timeline story cards
 * - Book view story photos
 * - Memory Box thumbnails and cards
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
   * Transform Style:
   * - ALWAYS use object-fit: cover to fill the frame (matches editor preview)
   * - Apply user's zoom/pan transform if provided
   * - This ensures WYSIWYG: editor preview = display view
   */
  const transformStyle = transform
    ? {
        transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
        transformOrigin: "center center",
        objectFit: "cover" as const,
        objectPosition: "center center",
      }
    : {
        objectFit: "cover" as const,
        objectPosition: "center center",
      };

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
      {/*
        Background Layer: Blurred extension
        - ALWAYS rendered for all images (provides elegant background fill)
        - Fills entire container with scaled, blurred version
        - Static (no transforms applied to blur layer)
        - scale-110 ensures blur extends beyond edges
        - opacity-70 for subtle, non-distracting effect
        - z-0 to ensure it stays behind foreground
      */}
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        aria-hidden="true"
        className="object-cover scale-110 blur-xl opacity-70 z-0"
      />

      {/*
        Foreground Layer: Main image with user's zoom/pan
        - Uses object-fit: cover to fill frame (matches editor preview)
        - Transform is applied via inline styles (matches MultiPhotoUploader)
        - z-10 to ensure it appears above blur background
      */}
      <img
        src={src}
        alt={alt}
        style={transformStyle}
        className={cn(
          "absolute inset-0 w-full h-full z-10",
          transform && "will-change-transform",
          imgClassName
        )}
      />
    </div>
  );
}
