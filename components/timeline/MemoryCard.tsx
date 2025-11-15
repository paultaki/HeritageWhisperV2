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

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Pause, Volume2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { normalizeYear, formatYear } from "@/lib/utils";
import { getTopTraits } from "@/utils/getTopTraits";
import PlayPauseButton from "@/components/ui/PlayPauseButton";
import { audioManager } from "@/lib/audioManager";
import type { MemoryCardProps } from "@/types/timeline";
import { formatStoryDate, formatStoryDateForMetadata, formatV2TimelineDate } from "@/lib/dateFormatting";

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
  }: MemoryCardProps) {
    const router = useRouter();

    // ==================================================================================
    // Audio Playback State
    // ==================================================================================

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
      null,
    );
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(story.durationSeconds || 0);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ==================================================================================
    // V2: Photo Carousel State
    // ==================================================================================

    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

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
    // Audio Manager Integration
    // ==================================================================================

    useEffect(() => {
      // Register this card with the audio manager
      const handleAudioStateChange = (
        playing: boolean,
        audioElement?: HTMLAudioElement | null,
      ) => {
        if (!playing) {
          // Stop any playing audio for this card
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
          }
          // Reset all state
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
          setCurrentAudio(null);
          setIsLoading(false);
        }
      };

      audioManager.register(story.id, handleAudioStateChange);

      return () => {
        audioManager.unregister(story.id);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
      };
    }, [story.id]);

    // Update audioRef whenever currentAudio changes
    useEffect(() => {
      audioRef.current = currentAudio;
    }, [currentAudio]);

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
    // Audio Playback Handlers
    // ==================================================================================

    const formatDuration = (seconds?: number) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handlePlayAudio = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (hasError) {
        // Reset error state and retry
        setHasError(false);
        setIsLoading(true);
      }

      if (isPlaying && currentAudio) {
        currentAudio.pause();
        setIsPlaying(false);
        setCurrentAudio(null);
        audioRef.current = null;
        setProgress(0);
        setCurrentTime(0);
        audioManager.stop(story.id);
      } else if (story.audioUrl && story.audioUrl.trim() !== "") {
        setIsLoading(true);
        setHasError(false);

        // Server already provides signed URLs, use them directly
        const audio = new Audio(story.audioUrl);
        // For Supabase signed URLs, explicitly set to anonymous to prevent CORS issues
        audio.crossOrigin = "anonymous";

        // First notify the audio manager to stop other audio
        audioManager.requestPlay(story.id);

        // Now set our audio reference
        setCurrentAudio(audio);
        audioRef.current = audio;

        audio.addEventListener("loadstart", () => {
          setIsLoading(true);
        });

        audio.addEventListener("canplay", () => {
          setIsLoading(false);
          setDuration(audio.duration);
        });

        audio.addEventListener("timeupdate", () => {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
          setCurrentTime(audio.currentTime);
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          audioRef.current = null;
          setProgress(0);
          setCurrentTime(0);
          audioManager.stop(story.id);
        });

        audio.addEventListener("error", (error) => {
          console.error("Audio playback error:", error);
          setIsPlaying(false);
          setIsLoading(false);
          setHasError(true);
          setCurrentAudio(null);
          audioRef.current = null;
          setProgress(0);
          setCurrentTime(0);
          audioManager.stop(story.id);
        });

        // Play the audio with a small delay to ensure other audio has stopped
        setTimeout(() => {
          if (audioRef.current === audio) {
            audio
              .play()
              .then(() => {
                // Confirm with AudioManager that we're now playing
                audioManager.confirmPlaying(story.id, audio);
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch((error) => {
                console.error("Error playing audio:", error);
                setIsPlaying(false);
                setIsLoading(false);
                setHasError(true);
                setCurrentAudio(null);
                audioRef.current = null;
                setProgress(0);
                audioManager.stop(story.id);
              });
          }
        }, 50); // Small delay to ensure cleanup
      }
    };

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentAudio || !progressBarRef.current) return;

      e.stopPropagation();
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickRatio = clickX / rect.width;
      const newTime = clickRatio * currentAudio.duration;

      currentAudio.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress((newTime / currentAudio.duration) * 100);
    };

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

        // Navigate to book view for all stories
        router.push(`/book?storyId=${story.id}`);
      }
    };

    // ==================================================================================
    // V2: Photo Carousel Handlers
    // ==================================================================================

    const handlePrevPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPhotoIndex((prev) => (prev === 0 ? photoCount - 1 : prev - 1));
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPhotoIndex((prev) => (prev === photoCount - 1 ? 0 : prev + 1));
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
    // Render: Cards WITHOUT Photos
    // ==================================================================================

    // Render format for memories without photos - with 4:3 aspect ratio placeholder
    if (!displayPhoto || !displayPhoto.url) {
      return (
        <div
          ref={cardRef}
          className={`hw-card cursor-pointer ${
            isHighlighted
              ? "ring-2 ring-heritage-orange shadow-xl shadow-heritage-orange/20 scale-[1.01]"
              : isReturnHighlight
                ? "return-highlight-animation"
                : ""
          } ${isVisible ? "hw-card-visible" : "hw-card-hidden"}`}
          style={{ "--title-offset": "180px", border: "1.5px solid #B89B8D" } as React.CSSProperties}
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

          {/* 4:3 aspect ratio placeholder - matches photo cards */}
          <div className="relative w-full aspect-[4/3] mb-3 rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100"
              style={{
                backgroundColor: isDarkTheme ? "#2a2a2a" : "#f9fafb",
                backgroundImage: `linear-gradient(135deg, ${isDarkTheme ? "#2a2a2a" : "#f9fafb"} 0%, ${isDarkTheme ? "#1f1f1f" : "#f3f4f6"} 50%, ${isDarkTheme ? "#2a2a2a" : "#f9fafb"} 100%)`,
              }}
            >
              {/* Optional subtle icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl opacity-10">📝</div>
              </div>
            </div>
          </div>

          <div className="hw-card-body relative">
            {useV2Features && story.audioUrl ? (
              // V2: Horizontal layout with title+metadata on left, audio button on right
              <div className="flex gap-6 items-start">
                {/* Left column: Text content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="hw-card-title line-clamp-1"
                    data-testid={`story-title-${story.id}`}
                  >
                    {story.title}
                  </h3>
                  <div className="hw-meta">
                    <span className="text-sm font-medium text-gray-700">
                      {formatV2TimelineDate(story.storyDate, story.storyYear, birthYear)}
                    </span>
                  </div>
                </div>

                {/* Right column: Audio button with progress indicator */}
                <div className="flex-shrink-0">
                  <PlayPauseButton
                    isPlaying={isPlaying}
                    isLoading={isLoading}
                    progress={progress}
                    onClick={handlePlayAudio}
                    size={48}
                    className="text-white shadow-md"
                  />
                </div>
              </div>
            ) : (
              // Original layout for non-V2
              <div className="flex items-center gap-3">
                {/* Book-style circular audio button with progress ring */}
                {story.audioUrl && (
                  <button
                    onClick={handlePlayAudio}
                    className="relative flex-shrink-0 hover:scale-105 transition-transform"
                    data-testid={`button-play-${story.id}`}
                    aria-label={
                      isPlaying
                        ? "Pause audio"
                        : hasError
                          ? "Retry playing audio"
                          : "Play audio"
                    }
                  >
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40" style={{ display: 'block' }}>
                      {/* Background ring - TESTING: Made very visible */}
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="red"
                        strokeWidth="3"
                      />
                      {/* Progress ring - TESTING: Always visible with solid color */}
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="blue"
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 16}`}
                        strokeDashoffset={isPlaying ? `${2 * Math.PI * 16 * (1 - progress / 100)}` : `${2 * Math.PI * 16}`}
                        strokeLinecap="round"
                        style={{
                          opacity: 1,
                          transition: 'all 0.1s linear'
                        }}
                      />
                    </svg>
                    {/* Icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                      ) : hasError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : isPlaying ? (
                        <Pause className="w-4 h-4 text-neutral-600 fill-neutral-600" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-neutral-600" />
                      )}
                    </div>
                  </button>
                )}

                {/* Title and metadata */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="hw-card-title line-clamp-1"
                    data-testid={`story-title-${story.id}`}
                  >
                    {story.title}
                  </h3>
                  <div className="hw-meta">
                    {useV2Features ? (
                      // V2: "Age 7 • Summer 1962" format
                      <span className="text-sm font-medium text-gray-700">
                        {formatV2TimelineDate(story.storyDate, story.storyYear, birthYear)}
                      </span>
                    ) : (
                      // Original format
                      <>
                        <span>
                          {formatStoryDateForMetadata(story.storyDate, story.storyYear)}
                        </span>
                        <span className="divider"></span>
                        <span>
                          {story.lifeAge !== null &&
                            story.lifeAge !== undefined &&
                            story.lifeAge > 0 &&
                            `Age ${story.lifeAge}`}
                          {story.lifeAge !== null &&
                            story.lifeAge !== undefined &&
                            story.lifeAge === 0 &&
                            `Birth`}
                          {story.lifeAge !== null &&
                            story.lifeAge !== undefined &&
                            story.lifeAge < 0 &&
                            `Before birth`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
        className={`hw-card cursor-pointer ${
          isHighlighted
            ? "ring-2 ring-heritage-orange shadow-xl shadow-heritage-orange/20 scale-[1.01]"
            : isReturnHighlight
              ? "return-highlight-animation"
              : ""
        } ${isVisible ? "hw-card-visible" : "hw-card-hidden"}`}
        style={{ "--title-offset": titleOffset, border: "1.5px solid #B89B8D" } as React.CSSProperties}
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
          style={{ position: "relative", overflow: "hidden" }}
          onTouchStart={useV2Features && photoCount > 1 ? handleTouchStart : undefined}
          onTouchMove={useV2Features && photoCount > 1 ? handleTouchMove : undefined}
          onTouchEnd={useV2Features && photoCount > 1 ? handleTouchEnd : undefined}
        >
          {/* Get current photo for V2 carousel or fallback to displayPhoto */}
          {(() => {
            const currentPhoto = useV2Features && story.photos && story.photos.length > 0
              ? story.photos[currentPhotoIndex]
              : null;

            const photoUrl = currentPhoto
              ? getPhotoDisplayUrl(currentPhoto)
              : displayPhoto.url;

            const photoTransform = currentPhoto?.transform || displayPhoto.transform;

            return (
              <img
                src={photoUrl}
                alt={story.title}
                className="hw-card-media"
                style={
                  photoTransform
                    ? {
                        transform: `scale(${photoTransform.zoom}) translate(${photoTransform.position.x}%, ${photoTransform.position.y}%)`,
                        transformOrigin: "center center",
                        objectFit: "cover",
                      }
                    : undefined
                }
              />
            );
          })()}

          {/* V2: Photo carousel navigation */}
          {useV2Features && photoCount > 1 && (
            <>
              {/* Photo counter badge */}
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                {currentPhotoIndex + 1} of {photoCount}
              </div>

              {/* Navigation arrows */}
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {Array.from({ length: photoCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentPhotoIndex
                        ? "bg-white w-4"
                        : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Original photo count badge (non-V2) */}
          {!useV2Features && photoCount > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
              {photoCount} photos
            </div>
          )}

          {/* Book-style audio button overlay on photo (hidden in V2) */}
          {story.audioUrl && !useV2Features && (
            <button
              onClick={handlePlayAudio}
              className="absolute right-4 bottom-4 hover:scale-105 transition-transform"
              data-testid={`button-play-${story.id}`}
              aria-label={
                isPlaying
                  ? "Pause audio"
                  : hasError
                    ? "Retry playing audio"
                    : "Play audio"
              }
            >
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                {/* Background ring */}
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="white"
                  fillOpacity="0.9"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="rgba(139,107,122,0.2)"
                  strokeWidth="3"
                />
                {/* Progress ring - Always render, but only visible when playing */}
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#8b6b7a"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{
                    opacity: isPlaying ? 1 : 0,
                    transition: 'stroke-dashoffset 0.3s ease, opacity 0.2s ease'
                  }}
                />
              </svg>
              {/* Icon in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                ) : hasError ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 text-neutral-600 fill-neutral-600" />
                ) : (
                  <Volume2 className="w-5 h-5 text-neutral-600" />
                )}
              </div>
            </button>
          )}
        </div>

        <div className="hw-card-body relative">
          {useV2Features && story.audioUrl ? (
            // V2: Horizontal layout with title+metadata on left, audio button on right
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

              {/* Right column: Audio button with progress indicator */}
              <div className="flex-shrink-0">
                <PlayPauseButton
                  isPlaying={isPlaying}
                  isLoading={isLoading}
                  progress={progress}
                  onClick={handlePlayAudio}
                  size={48}
                  className="text-white shadow-md"
                />
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
        </div>
      </div>
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
      prevProps.useV2Features === nextProps.useV2Features
    );
  },
);
