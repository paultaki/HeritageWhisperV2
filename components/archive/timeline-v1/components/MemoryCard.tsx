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
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Pause, Volume2, Plus, ImagePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { normalizeYear, formatYear } from "@/lib/utils";
import { getTopTraits } from "@/utils/getTopTraits";
import PlayPauseButton from "@/components/ui/PlayPauseButton";
import { audioManager } from "@/lib/audioManager";
import type { MemoryCardProps } from "@/types/timeline";
import { formatStoryDate, formatStoryDateForMetadata, formatV2TimelineDate } from "@/lib/dateFormatting";
import { type Story } from "@/lib/supabase";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";
import { PlayPillButton } from "@/components/timeline/PlayPillButton";

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
    customActionLabel,
    onCustomAction,
  }: MemoryCardProps & { customActionLabel?: string; onCustomAction?: (story: Story) => void }) {
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
      const hasAudio = story.audioUrl && story.audioUrl.trim() !== "";
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
                    <Volume2 className="w-6 h-6 text-stone-600" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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

              {/* Right: Action button (Standard Read/Play only) */}
              {!customActionLabel && (
                <div className="flex-shrink-0">
                  {hasAudio ? (
                    <PlayPillButton
                      isPlaying={isPlaying}
                      progress={progress}
                      onClick={handlePlayAudio}
                    />
                  ) : (
                    <button
                      className="w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold flex items-center justify-center md:gap-1.5 transition-colors"
                      aria-label="Read story"
                    >
                      <span className="hidden md:inline">Read</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
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
              {hasAudio ? "Tap to listen to this story" : "Tap to read this story"}
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
          style={{ position: "relative", overflow: "hidden", margin: 0, padding: 0 }}
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

          {/* Original photo count badge (non-V2) - z-20 to stay above photo */}
          {!useV2Features && photoCount > 1 && (
            <div className="absolute bottom-3 left-3 z-20 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
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
                  <PlayPillButton
                    isPlaying={isPlaying}
                    progress={progress}
                    onClick={handlePlayAudio}
                  />
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
      prevProps.useV2Features === nextProps.useV2Features
    );
  },
);
