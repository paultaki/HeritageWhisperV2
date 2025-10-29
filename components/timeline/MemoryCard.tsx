/**
 * MemoryCard Component
 *
 * Individual story card with photo, audio playback, and metadata display.
 *
 * Features:
 * - Photo display with hero image selection
 * - Audio playback with progress bar
 * - Ken Burns effect on images (scroll-triggered)
 * - Age calculation and display
 * - Multi-photo badge
 * - Story provenance on hover
 * - Click to navigate (book view or overlay)
 *
 * Performance:
 * - React.memo with custom comparison
 * - IntersectionObserver for Ken Burns trigger
 * - AudioManager integration for single playback
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 273-888
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { normalizeYear, formatYear } from "@/lib/utils";
import { getTopTraits } from "@/utils/getTopTraits";
import { audioManager } from "@/lib/audioManager";
import type { MemoryCardProps } from "@/types/timeline";

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
    // Ken Burns Effect State
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

    // IntersectionObserver for Ken Burns effect trigger
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

    // Get the display photo - hero photo if exists, otherwise first photo, otherwise legacy photoUrl
    const getDisplayPhoto = () => {
      if (story.photos && story.photos.length > 0) {
        const heroPhoto = story.photos.find((p) => p.isHero && p.url);
        if (heroPhoto) return heroPhoto;
        // Find first photo with valid URL
        const firstValidPhoto = story.photos.find((p) => p.url);
        if (firstValidPhoto) return firstValidPhoto;
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
          }`}
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
            {story.storyDate
              ? new Date(story.storyDate).toLocaleDateString("en-US", {
                  year: "numeric",
                })
              : formatYear(story.storyYear)}
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

          <div className="hw-card-body">
            <div className="flex items-center gap-3">
              {/* Audio play button */}
              {story.audioUrl && (
                <button
                  onClick={handlePlayAudio}
                  className="glass-play-button-mobile"
                  data-testid={`button-play-${story.id}`}
                  aria-label={
                    isPlaying
                      ? "Pause audio"
                      : hasError
                        ? "Retry playing audio"
                        : "Play audio"
                  }
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : hasError ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  )}
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
                  <span>
                    {story.storyDate
                      ? new Date(story.storyDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })
                      : formatYear(story.storyYear)}
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
                </div>
              </div>
            </div>
          </div>

          {/* Provenance on hover */}
          <div className="hw-card-provenance">
            Recorded with Heritage Whisper
            {story.createdAt &&
              ` · Created ${new Date(story.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
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
        }`}
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
          {story.storyDate
            ? new Date(story.storyDate).toLocaleDateString("en-US", {
                year: "numeric",
              })
            : formatYear(story.storyYear)}
        </span>

        {/* Image container with audio overlay */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          <img
            src={displayPhoto.url}
            alt={story.title}
            className={`hw-card-media ${
              !displayPhoto.transform && isVisible && !prefersReducedMotion
                ? "ken-burns-effect"
                : ""
            }`}
            style={
              displayPhoto.transform
                ? {
                    transform: `scale(${displayPhoto.transform.zoom}) translate(${displayPhoto.transform.position.x}%, ${displayPhoto.transform.position.y}%)`,
                    transformOrigin: "center center",
                    objectFit: "cover",
                  }
                : undefined
            }
          />

          {/* Photo count badge */}
          {photoCount > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
              {photoCount} photos
            </div>
          )}

          {/* Audio play button overlay */}
          {story.audioUrl && (
            <button
              onClick={handlePlayAudio}
              className="hw-play"
              data-testid={`button-play-${story.id}`}
              aria-label={
                isPlaying
                  ? "Pause audio"
                  : hasError
                    ? "Retry playing audio"
                    : "Play audio"
              }
            >
              {isLoading ? (
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ fill: "var(--color-accent)" }}
                />
              ) : hasError ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : isPlaying ? (
                <Pause style={{ fill: "var(--color-accent)" }} />
              ) : (
                <Play
                  style={{ fill: "var(--color-accent)", marginLeft: "2px" }}
                />
              )}
            </button>
          )}
        </div>

        <div className="hw-card-body">
          {/* Title */}
          <h3 className="hw-card-title" data-testid={`story-title-${story.id}`}>
            {story.title}
          </h3>

          {/* Metadata */}
          <div className="hw-meta">
            <span>
              {story.storyDate
                ? new Date(story.storyDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })
                : formatYear(story.storyYear)}
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
          </div>
        </div>

        {/* Provenance on hover */}
        <div className="hw-card-provenance">
          Recorded with Heritage Whisper
          {story.createdAt &&
            ` · Created ${new Date(story.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
          {(story as any).updatedAt &&
            (story as any).updatedAt !== story.createdAt &&
            ` · Last edited ${new Date((story as any).updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
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
      prevProps.birthYear === nextProps.birthYear
    );
  },
);
