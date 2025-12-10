/**
 * MemoryCard Component
 *
 * Individual story card with photo, audio playback, and metadata display.
 *
 * Features:
 * - Photo display with hero image selection
 * - Audio playback with progress bar
 * - Scroll-triggered card animation (fade + slide)
 * - Age calculation and display
 * - Multi-photo badge
 * - Story provenance on hover
 * - Click to navigate (book view or overlay)
 *
 * Performance:
 * - React.memo with custom comparison
 * - IntersectionObserver for card scroll animation
 * - AudioManager integration for single playback
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 273-888
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, ImagePlus, Headphones, FileText } from "lucide-react";
import { normalizeYear, formatYear } from "@/lib/utils";
import { getTopTraits } from "@/utils/getTopTraits";
import type { MemoryCardProps } from "@/types/timeline";
import { formatStoryDate, formatStoryDateForMetadata, formatV2TimelineDate } from "@/lib/dateFormatting";
import { type Story } from "@/lib/supabase";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";
import { StoryPillButton } from "@/components/timeline/StoryPillButton";

/**
 * MemoryCard - Story card component with audio playback
 *
 * Memoized to prevent unnecessary re-renders when parent updates
 */
export const MemoryCard = React.memo(
  function MemoryCard({
    story,
    isHighlighted = false,
    isReturnHighlight = false,
    colorScheme = "original",
    isDarkTheme = false,
    birthYear,
    onOpenOverlay,
    useV2Features = false,
    isViewerMode = false,
    customActionLabel,
    onCustomAction,
  }: MemoryCardProps & { customActionLabel?: string; onCustomAction?: (story: Story) => void }) {
    const router = useRouter();

    // ==================================================================================
    // V2: Photo Carousel State
    // ==================================================================================

    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Sort photos with hero first, then rest in original order
    const sortedPhotos = useMemo(() => {
      if (!story.photos || story.photos.length === 0) {
        if (story.photoUrl) {
          return [{ url: story.photoUrl, transform: story.photoTransform, isHero: true }];
        }
        return [];
      }
      const heroPhoto = story.photos.find((p) => p.isHero && p.url);
      const otherPhotos = story.photos.filter((p) => p.url && (!p.isHero || p !== heroPhoto));
      return heroPhoto ? [heroPhoto, ...otherPhotos] : otherPhotos;
    }, [story.photos, story.photoUrl, story.photoTransform]);

    // ==================================================================================
    // Card Scroll Animation State
    // ==================================================================================

    const [isVisible, setIsVisible] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Check for prefers-reduced-motion preference
    useEffect(() => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    // IntersectionObserver for card scroll animation trigger
    useEffect(() => {
      if (prefersReducedMotion) {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
            }
          });
        },
        {
          threshold: 0.2,
          rootMargin: "100px 0px",
        },
      );

      if (cardRef.current) {
        observer.observe(cardRef.current);
      }

      return () => {
        const currentCard = cardRef.current;
        if (currentCard) {
          observer.unobserve(currentCard);
        }
      };
    }, [prefersReducedMotion]);

    // ==================================================================================
    // Photo Display Logic
    // ==================================================================================

    // Get top trait for display
    const top = getTopTraits(story, 1, 0.6);

    // Helper: Get display URL from photo (handles dual WebP + backward compatibility)
    const getPhotoDisplayUrl = (photo: any): string | undefined => {
      // Prefer displayUrl (new dual WebP system)
      if (photo.displayUrl) return photo.displayUrl;
      // Fall back to url for backward compatibility
      if (photo.url) return photo.url;
      return undefined;
    };

    // Get the display photo - hero photo if exists, otherwise first photo, otherwise legacy photoUrl
    const getDisplayPhoto = () => {
      if (story.photos && story.photos.length > 0) {
        // Check for hero photo with valid display URL
        const heroPhoto = story.photos.find(
          (p) => p.isHero && getPhotoDisplayUrl(p)
        );
        if (heroPhoto) return { ...heroPhoto, url: getPhotoDisplayUrl(heroPhoto) };

        // Find first photo with valid display URL
        const firstValidPhoto = story.photos.find((p) => getPhotoDisplayUrl(p));
        if (firstValidPhoto) return { ...firstValidPhoto, url: getPhotoDisplayUrl(firstValidPhoto) };
      }
      if (story.photoUrl) {
        return { url: story.photoUrl, transform: story.photoTransform };
      }
      return null;
    };

    const displayPhoto = getDisplayPhoto();
    const photoCount = story.photos?.length || (story.photoUrl ? 1 : 0);

    // ==================================================================================
    // Navigation Handler
    // ==================================================================================

    const handleCardClick = () => {
      // If overlay handler is provided, use it instead of navigation
      if (onOpenOverlay) {
        onOpenOverlay(story);
      } else {
        // Fallback to original navigation behavior
        const navigationContext = {
          memoryId: story.id,
          scrollPosition: window.scrollY,
          timestamp: Date.now(),
          returnPath: "/timeline",
        };
        sessionStorage.setItem(
          "timeline-navigation-context",
          JSON.stringify(navigationContext),
        );

        // Navigate to book view - let user control playback themselves
        router.push(`/book?storyId=${story.id}`);
      }
    };

    // ==================================================================================
    // V2: Photo Carousel Handlers
    // ==================================================================================

    const handlePrevPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPhotoIndex((prev) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1));
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPhotoIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStart || !touchEnd) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe && currentPhotoIndex < photoCount - 1) {
        handleNextPhoto(e as any);
      }
      if (isRightSwipe && currentPhotoIndex > 0) {
        handlePrevPhoto(e as any);
      }

      setTouchStart(0);
      setTouchEnd(0);
    };

    // ==================================================================================
    // Render: Cards WITHOUT Photos (Pill-Style Layout)
    // ==================================================================================

    // Compact pill layout for memories without photos
    if (!displayPhoto || !displayPhoto.url) {
      const hasAudio = !!(story.audioUrl && story.audioUrl.trim() !== "");
      const hasText = story.transcription;

      return (
        <div
          ref={cardRef}
          className={`hw-card cursor-pointer ${isHighlighted
            ? "ring-2 ring-heritage-orange shadow-xl shadow-heritage-orange/20 scale-[1.01]"
            : isReturnHighlight
              ? "return-highlight-animation"
              : ""
            } ${isVisible ? "hw-card-visible" : "hw-card-hidden"}`}
          style={{
            "--title-offset": "22px",
            border: "1.5px solid var(--color-timeline-card-border)",
            background: "white",
            maxWidth: "100%",
            width: "100%"
          } as React.CSSProperties}
          onClick={handleCardClick}
          data-testid={`memory-card-${story.id}`}
        >
          {/* Year badge */}
          <span
            className="hw-year"
            style={
              isDarkTheme
                ? {
                  backgroundColor: "#252728F2",
                  border: "1px solid #3b3d3f",
                  color: "#b0b3b8",
                }
                : undefined
            }
          >
            {formatStoryDate(story.storyDate, story.storyYear, "year-only")}
          </span>

          {/* Compact pill layout - no photo placeholder */}
          <div className="px-3 py-4 md:px-5 md:py-5 max-w-full overflow-hidden">
            <div className="flex items-center gap-2 md:gap-3 w-full min-w-0">
              {/* Left: Icon badge */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                  {hasAudio ? (
                    <Headphones className="w-6 h-6 text-stone-600" />
                  ) : (
                    <FileText className="w-6 h-6 text-stone-600" />
                  )}
                </div>
                <span className="text-xs text-stone-500 font-medium">
                  {hasAudio ? "Voice" : "Written"}
                </span>
              </div>

              {/* Middle: Title + metadata + snippet */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="text-[19px] tracking-tight font-semibold text-[var(--hw-text-primary)] mb-1 truncate w-full">
                  {story.title}
                </h3>

                <div className="text-[15px] text-stone-500 mb-2">
                  {useV2Features ? (
                    <span>{formatV2TimelineDate(story.storyDate, story.storyYear, birthYear)}</span>
                  ) : (
                    <>
                      <span>{formatStoryDateForMetadata(story.storyDate, story.storyYear)}</span>
                      <span className="mx-1.5">•</span>
                      <span>
                        {(() => {
                          const y = normalizeYear(story.storyYear);
                          const by = normalizeYear(birthYear);
                          const computed = typeof y === "number" && typeof by === "number" ? y - by : null;
                          const age = typeof story.lifeAge === "number" ? story.lifeAge : computed;
                          return age !== null && age !== undefined
                            ? age > 0 ? `Age ${age}` : age === 0 ? "Birthday" : "Before birth"
                            : "";
                        })()}
                      </span>
                    </>
                  )}
                </div>

                {/* Snippet - first line of transcription or story text */}
                {hasText && (
                  <p className="text-sm text-stone-600 truncate italic w-full">
                    {(story.transcription || "").substring(0, 100)}...
                  </p>
                )}
              </div>

              {/* Right: Story type indicator (Open story / Read story) */}
              {!customActionLabel && (
                <div className="flex-shrink-0">
                  <StoryPillButton hasAudio={hasAudio} />
                </div>
              )}
            </div>

            {/* Bottom: Custom Action Button (Full width/Centered for prompts) */}
            {customActionLabel && (
              <div className="mt-4 flex justify-center w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomAction?.(story);
                  }}
                  className="w-full md:w-auto px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <span>{customActionLabel}</span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}


            {/* Helper text */}
            <p className="text-xs text-stone-400 mt-3 text-center">
              {hasAudio
                ? "Tap to open this story"
                : "Tap to read this story"}
            </p>
          </div>
        </div >
      );
    }

    // ==================================================================================
    // Render: Cards WITH Photos
    // ==================================================================================

    // Calculate title offset based on photo aspect ratio
    const titleOffset = displayPhoto && displayPhoto.url ? "180px" : "22px";

    return (
      <div
        ref={cardRef}
        className={`hw-card cursor-pointer ${isHighlighted
          ? "ring-2 ring-heritage-orange shadow-xl shadow-heritage-orange/20 scale-[1.01]"
          : isReturnHighlight
            ? "return-highlight-animation"
            : ""
          } ${isVisible ? "hw-card-visible" : "hw-card-hidden"}`}
        style={{ "--title-offset": titleOffset, border: "1.5px solid var(--color-timeline-card-border)" } as React.CSSProperties}
        onClick={handleCardClick}
        data-testid={`memory-card-${story.id}`}
      >
        {/* Year badge */}
        <span
          className="hw-year"
          style={
            isDarkTheme
              ? {
                backgroundColor: "#252728F2",
                border: "1px solid #3b3d3f",
                color: "#b0b3b8",
              }
              : undefined
          }
        >
          {formatStoryDate(story.storyDate, story.storyYear, "year-only")}
        </span>

        {/* Image container with audio overlay */}
        <div
          className="w-full block"
          style={{ position: "relative", margin: 0, padding: 0 }}
          onTouchStart={useV2Features && photoCount > 1 ? handleTouchStart : undefined}
          onTouchMove={useV2Features && photoCount > 1 ? handleTouchMove : undefined}
          onTouchEnd={useV2Features && photoCount > 1 ? handleTouchEnd : undefined}
        >
          {/* Get current photo for V2 carousel or fallback to displayPhoto */}
          {(() => {
            // Check if this is a ghost story (starter template)
            const isGhostStory = !!(story as any).templateId || (story as any).userId === 'ghost-user';

            // For ghost stories, show placeholder instead of photo
            if (isGhostStory) {
              return (
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 flex flex-col items-center justify-center text-center hw-card-media">
                  <div className="w-16 h-16 rounded-full bg-stone-300/50 flex items-center justify-center mb-2">
                    <ImagePlus className="w-9 h-9 text-stone-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg text-stone-500 font-semibold">Add your photo</p>
                </div>
              );
            }

            const currentPhoto = useV2Features && sortedPhotos.length > 0
              ? sortedPhotos[currentPhotoIndex]
              : null;

            const photoUrl = currentPhoto
              ? getPhotoDisplayUrl(currentPhoto)
              : displayPhoto.url;

            const photoTransform = currentPhoto?.transform || displayPhoto.transform;

            const activePhoto = currentPhoto || displayPhoto;

            return (
              <StoryPhotoWithBlurExtend
                src={photoUrl || ""}
                alt={story.title}
                width={(activePhoto as any).width}
                height={(activePhoto as any).height}
                transform={photoTransform}
                aspectRatio={4 / 3}
                className="hw-card-media"
              />
            );
          })()}

          {/* V2: Photo carousel navigation */}
          {useV2Features && photoCount > 1 && (
            <>
              {/* Photo counter badge - z-20 to stay above photo */}
              <div className="absolute top-3 right-3 z-20 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                {currentPhotoIndex + 1} of {photoCount}
              </div>

              {/* Navigation arrows */}
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all z-20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all z-20"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {Array.from({ length: photoCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentPhotoIndex
                      ? "bg-white w-4"
                      : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Metadata badge (top-left) - shows audio indicator and photo count */}
          {(() => {
            const hasAudio = !!(story.audioUrl && story.audioUrl.trim() !== "");
            const hasMultiplePhotos = photoCount > 1;

            // Build badge content
            const parts: string[] = [];
            if (hasAudio) parts.push("🎧 Audio");
            if (hasMultiplePhotos && !useV2Features) parts.push(`${photoCount} photos`);

            if (parts.length === 0) return null;

            return (
              <div className="absolute top-3 left-3 z-30 bg-black/75 text-white px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                {parts.join(" • ")}
              </div>
            );
          })()}

        </div>

        <div className="hw-card-body relative">
          {useV2Features ? (
            // V2: Horizontal layout with title+metadata on left, story indicator on right
            <div className="flex gap-6 items-start">
              {/* Left column: Text content */}
              <div className="flex-1 min-w-0">
                <h3 className="hw-card-title" data-testid={`story-title-${story.id}`}>
                  {story.title}
                </h3>
                <div className="hw-meta">
                  <span className="text-sm font-medium text-gray-700">
                    {formatV2TimelineDate(story.storyDate, story.storyYear, birthYear)}
                  </span>
                </div>
              </div>

              {/* Right column: Story type indicator (Open story / Read story) */}
              <div className="flex-shrink-0">
                {customActionLabel ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomAction?.(story);
                    }}
                    className="px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>{customActionLabel}</span>
                    <Plus className="w-4 h-4" />
                  </button>
                ) : (
                  <StoryPillButton hasAudio={!!(story.audioUrl && story.audioUrl.trim() !== "")} />
                )}
              </div>
            </div>
          ) : (
            // Original layout for non-V2 or cards without audio
            <>
              <h3 className="hw-card-title" data-testid={`story-title-${story.id}`}>
                {story.title}
              </h3>

              <div className="hw-meta">
                {useV2Features ? (
                  // V2: "Age 7 • Summer 1962" format
                  <span className="text-sm font-medium text-gray-700">
                    {formatV2TimelineDate(story.storyDate, story.storyYear, birthYear)}
                  </span>
                ) : (
                  // Original: "Jun 1985 • Age 7" format
                  <>
                    <span>
                      {formatStoryDateForMetadata(story.storyDate, story.storyYear)}
                    </span>
                    <span className="divider"></span>
                    <span>
                      {(() => {
                        const y = normalizeYear(story.storyYear);
                        const by = normalizeYear(birthYear);
                        const computed =
                          typeof y === "number" && typeof by === "number"
                            ? y - by
                            : null;
                        const age =
                          typeof story.lifeAge === "number"
                            ? story.lifeAge < 0 &&
                              computed !== null &&
                              y !== null &&
                              by !== null &&
                              y >= by
                              ? computed
                              : story.lifeAge
                            : computed;
                        return age !== null && age !== undefined
                          ? age > 0
                            ? `Age ${age}`
                            : age === 0
                              ? "Birthday"
                              : "Before birth"
                          : "";
                      })()}
                    </span>
                    {(top?.length ?? 0) > 0 && (
                      <>
                        <span className="divider"></span>
                        <span>{(top?.[0] as any)?.name}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div >
      </div >
    );
  },
  // Custom comparison function for React.memo
  (prevProps, nextProps) => {
    return (
      prevProps.story.id === nextProps.story.id &&
      prevProps.isHighlighted === nextProps.isHighlighted &&
      prevProps.isReturnHighlight === nextProps.isReturnHighlight &&
      prevProps.isDarkTheme === nextProps.isDarkTheme &&
      prevProps.colorScheme === nextProps.colorScheme &&
      prevProps.birthYear === nextProps.birthYear &&
      prevProps.useV2Features === nextProps.useV2Features &&
      prevProps.isViewerMode === nextProps.isViewerMode
    );
  },
);
