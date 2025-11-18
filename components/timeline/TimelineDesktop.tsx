"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useFamilyAuth } from "@/hooks/use-family-auth";
import { apiRequest } from "@/lib/queryClient";
import { groupStoriesByDecade, type Story } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import {
  generateGhostPrompts,
  mergeGhostPromptsWithStories,
  type GhostPrompt,
} from "@/lib/ghostPrompts";
import {
  generateNewUserGhostPrompts,
  shouldShowNewUserGhosts,
} from "@/lib/newUserGhostPrompts";
import { GhostPromptCard } from "@/components/GhostPromptCard";
import { NextStoryCard } from "@/components/NextStoryCard";
import { PaywallPromptCard } from "@/components/PaywallPromptCard";
import { MemoryOverlay } from "@/components/MemoryOverlay";
import {
  Play,
  Plus,
  Square,
  Calendar,
  Loader2,
  AlertCircle,
  Pause,
  X,
  Clock,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { normalizeYear, formatYear } from "@/lib/utils";
import StoryTraits from "@/components/StoryTraits";
import { getTopTraits } from "@/utils/getTopTraits";
import { useAccountContext } from "@/hooks/use-account-context";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { DesktopPageHeader } from "@/components/PageHeader";
import { formatStoryDate, formatStoryDateForMetadata } from "@/lib/dateFormatting";
import { TimelineEnd } from "@/components/timeline/TimelineEnd";
import { STARTER_TEMPLATES, type StarterMemoryTemplate } from "@/lib/starterTemplates";
import { StarterMemoryCard } from "@/components/timeline/StarterMemoryCard";
import PlayPauseButton from "@/components/ui/PlayPauseButton";

const logoUrl = "/final logo/logo-new.svg";

// Timeline item helper type
type TimelineItem = {
  id: string;
  type?: string;
  year?: number;
  title?: string;
  subtitle?: string;
  stories?: Array<any>;
  storyCount?: number;
  traits?: Array<{ name: string }>;
};

// V3: Subtle Decade Label Component - Museum Style
interface DecadeLabelProps {
  decade: string;
  isDark?: boolean;
}

function DecadeLabel({ decade, isDark = false }: DecadeLabelProps) {
  const decadeNum = decade.replace("s", "");

  return (
    <div 
      className="relative flex items-center justify-center md:-mt-[50px]"
      style={{
        height: '60px',
        marginBottom: '20px',
      }}
    >
      {/* Subtle decade label positioned to the right of the timeline */}
      <div
        className="absolute z-0"
        style={{
          left: '50%',
          transform: 'translateX(62px)', // Position to right of timeline line
          opacity: isDark ? 0.4 : 0.45,
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.5px',
            color: isDark ? '#b0b3b8' : '#6b7280',
            textTransform: 'uppercase',
          }}
        >
          {decadeNum}
        </span>
      </div>
    </div>
  );
}

// Global audio manager to ensure only one audio plays at a time
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentCardId: string | null = null;
  private listeners: Map<
    string,
    (playing: boolean, audioElement?: HTMLAudioElement | null) => void
  > = new Map();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  register(
    cardId: string,
    callback: (
      playing: boolean,
      audioElement?: HTMLAudioElement | null,
    ) => void,
  ) {
    this.listeners.set(cardId, callback);
  }

  unregister(cardId: string) {
    if (this.currentCardId === cardId && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentCardId = null;
    }
    this.listeners.delete(cardId);
  }

  requestPlay(cardId: string): void {
    if (this.currentAudio && this.currentCardId !== cardId) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.error("Error pausing audio:", e);
      }
    }

    this.currentAudio = null;
    this.currentCardId = null;

    this.listeners.forEach((callback, id) => {
      if (id !== cardId) {
        callback(false, null);
      }
    });
  }

  confirmPlaying(cardId: string, audio: HTMLAudioElement) {
    this.currentAudio = audio;
    this.currentCardId = cardId;
  }

  stop(cardId: string) {
    if (this.currentCardId === cardId) {
      this.currentAudio = null;
      this.currentCardId = null;
    }
  }
}

const audioManager = AudioManager.getInstance();

interface CenteredMemoryCardProps {
  story: Story;
  position: "left" | "right";
  index: number;
  isDark?: boolean;
  showDecadeMarker?: boolean;
  decadeLabel?: string;
  birthYear: number;
  onOpenOverlay?: (story: Story) => void;
  useV2Features?: boolean;
}

function CenteredMemoryCard({ story, position, index, isDark = false, showDecadeMarker = false, decadeLabel, birthYear, onOpenOverlay, useV2Features = false }: CenteredMemoryCardProps) {
  const router = useRouter();

  // Narrow story type for traits access
  const s = story as Story & { traits?: Array<{ name: string }> };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(story.durationSeconds || 0);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get display photo
  const getDisplayPhoto = () => {
    if (story.photos && story.photos.length > 0) {
      const heroPhoto = story.photos.find((p) => p.isHero && p.url);
      if (heroPhoto) return heroPhoto;
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

  // Derive a safe display age to avoid bad or missing metadata
  const normalizedStoryYear = normalizeYear(story.storyYear);
  const computedAge =
    typeof normalizedStoryYear === "number" && typeof birthYear === "number"
      ? normalizedStoryYear - birthYear
      : null;
  const displayLifeAge = (() => {
    if (typeof story.lifeAge === "number") {
      // If metadata says pre-birth but the year is on/after birth year, trust computed
      if (computedAge !== null && story.lifeAge < 0 && normalizedStoryYear !== null && normalizedStoryYear >= birthYear) {
        return computedAge;
      }
      return story.lifeAge;
    }
    return computedAge;
  })();

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

  // Intersection Observer for scroll animation (respects reduced motion)
  // Images load immediately (eager), but we only reveal them with animation when scrolling
  useEffect(() => {
    // Skip animations if user prefers reduced motion
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
        threshold: 0.05, // Trigger very early
        rootMargin: "200px 0px 200px 0px", // Start revealing 200px before viewport (faster)
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [prefersReducedMotion]);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasError) {
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

      const audio = new Audio(story.audioUrl);
      audio.crossOrigin = "anonymous";

      audioManager.requestPlay(story.id);

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

      setTimeout(() => {
        if (audioRef.current === audio) {
          audio
            .play()
            .then(() => {
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
      }, 50);
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

  useEffect(() => {
    const handleAudioStateChange = (
      playing: boolean,
      audioElement?: HTMLAudioElement | null,
    ) => {
      if (!playing) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
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

  useEffect(() => {
    audioRef.current = currentAudio;
  }, [currentAudio]);

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

      // Always navigate to book view - user can edit from there if needed
      router.push(`/book?storyId=${story.id}`);
    }
  };

  // Render function for card content - mobile style with white card below photo
  const renderCardContent = () => {
    // If there's a photo, render with white card below (mobile style)
    if (displayPhoto?.url) {
      return (
        <div
          className={`bg-white rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={handleCardClick}
          style={{
            boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.18), 0 3px 7px -1px rgba(0, 0, 0, 0.12)',
            border: '1.5px solid var(--color-border-card)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 20px -3px rgba(0, 0, 0, 0.2), 0 4px 9px -1px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(0, 0, 0, 0.35), 0 6px 14px -2px rgba(0, 0, 0, 0.25)';
          }}
        >
          {/* Photo Section - 16:10 aspect ratio to match mobile, rounded top corners only */}
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            {displayPhoto.transform ? (
              <img
                src={displayPhoto.url}
                alt={story.title}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${displayPhoto.transform.zoom}) translate(${displayPhoto.transform.position.x}%, ${displayPhoto.transform.position.y}%)`,
                  transformOrigin: "center center",
                }}
                onError={(e) => console.error("[Timeline] Image failed to load:", displayPhoto.url)}
              />
            ) : (
              <Image
                src={displayPhoto.url}
                alt={story.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                className={`object-cover ${isVisible && !prefersReducedMotion ? 'ken-burns-effect' : ''}`}
                loading="eager"
                priority={index < 8}
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                onError={(e) => console.error("[Timeline] Image failed to load:", displayPhoto.url)}
              />
            )}

            {/* Photo count badge */}
            {photoCount > 1 && (
              <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                {photoCount} photos
              </div>
            )}

            {/* Book-style audio button overlaid on photo (hidden in V2) */}
            {story.audioUrl && !useV2Features && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio(e);
                }}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                className="absolute right-4 bottom-4 hover:scale-105 transition-transform z-10"
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
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-neutral-600 fill-neutral-600" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-neutral-600" />
                  )}
                </div>
              </button>
            )}
          </div>

          {/* White Card Section Below Photo - Compact horizontal layout */}
          <div className="px-4 py-3 bg-white relative">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Title and metadata stacked */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[19px] tracking-tight font-semibold text-stone-900 mb-0.5 truncate">
                  {story.title}
                </h3>
                <div className="flex items-center gap-2 text-[15px] text-stone-500">
                  <span>
                    {formatStoryDateForMetadata(story.storyDate, story.storyYear)}
                  </span>
                  {displayLifeAge !== null && displayLifeAge !== undefined && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span>
                        {displayLifeAge > 0 && `Age ${displayLifeAge}`}
                        {displayLifeAge === 0 && `Birthday`}
                        {displayLifeAge < 0 && `Before birth`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: V2 audio button with progress indicator */}
              {useV2Features && story.audioUrl && (
                <PlayPauseButton
                  isPlaying={isPlaying}
                  isLoading={isLoading}
                  progress={progress}
                  onClick={handlePlayAudio}
                  size={48}
                  className="text-white shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    // No photo - render compact pill-style card
    const hasAudio = story.audioUrl && story.audioUrl.trim() !== "";
    const hasText = story.transcription || story.storyText;

    return (
      <div
        className={`bg-white rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={handleCardClick}
        style={{
          boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.18), 0 3px 7px -1px rgba(0, 0, 0, 0.12)',
          border: '1.5px solid var(--color-border-card)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 20px -3px rgba(0, 0, 0, 0.2), 0 4px 9px -1px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(0, 0, 0, 0.18), 0 3px 7px -1px rgba(0, 0, 0, 0.12)';
        }}
      >
        {/* Compact pill layout - no photo placeholder */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
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
            <div className="flex-1 min-w-0">
              <h3 className="text-[19px] tracking-tight font-semibold text-stone-900 mb-1 truncate">
                {story.title}
              </h3>

              <div className="text-[15px] text-stone-500 mb-2">
                <span>{formatStoryDateForMetadata(story.storyDate, story.storyYear)}</span>
                {displayLifeAge !== null && displayLifeAge !== undefined && (
                  <>
                    <span className="mx-1.5">•</span>
                    <span>
                      {displayLifeAge > 0 && `Age ${displayLifeAge}`}
                      {displayLifeAge === 0 && `Birthday`}
                      {displayLifeAge < 0 && `Before birth`}
                    </span>
                  </>
                )}
              </div>

              {/* Snippet - first line of transcription or story text */}
              {hasText && (
                <p className="text-sm text-stone-600 truncate italic">
                  {(story.transcription || story.storyText || "").substring(0, 100)}...
                </p>
              )}
            </div>

            {/* Right: Action button */}
            <div className="flex-shrink-0">
              {hasAudio ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio(e);
                  }}
                  className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105"
                  aria-label={isPlaying ? "Pause audio" : hasError ? "Retry playing audio" : "Play audio"}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : hasError ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                  aria-label="Read story"
                >
                  <span>Read</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs text-stone-400 mt-3 text-center">
            {hasAudio ? "Tap to listen to this story" : "Tap to read this story"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`timeline-step flex flex-col lg:flex-row items-center gap-6 lg:gap-0 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: 'none',
      }}
    >
      {/* Left side content (for left-positioned cards) - Desktop only */}
      <div className={`flex-1 flex ${position === "left" ? "justify-end" : ""} hidden lg:flex`} style={{ pointerEvents: 'none', paddingRight: position === "left" ? "109px" : "0" }}>
        {position === "left" && (
          <div className="w-full max-w-md timeline-card-container" style={{ pointerEvents: 'auto' }}>
            {renderCardContent()}
          </div>
        )}
      </div>

      {/* V3: Year marker - more visible now as primary date indicator */}
      <div
        className="z-10 flex-shrink-0 timeline-dot transition-all duration-500"
        style={{
          transform: position === "left" ? "translateX(-54px)" : "translateX(54px)",
          marginBottom: '-40px',  // Pulls next badge closer to eliminate gap
        }}
      >
        <div
          className="py-0 px-1 font-serif whitespace-nowrap transition-all duration-200 hover:opacity-100"
          style={{
            backgroundColor: 'var(--color-surface-badge)',
            border: `1px solid var(--color-border-badge)`,
            color: 'var(--color-text-badge)',
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.3px',
            opacity: 0.95,
            boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.09)',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            top: '-19px',  // Align with connector lines
          }}
        >
          <span style={{ position: 'relative', top: '-2px' }}>
            {formatStoryDate(story.storyDate, story.storyYear, "year-only")}
          </span>
        </div>
      </div>

      {/* Right side content (for right-positioned cards) - Desktop only */}
      <div className={`flex-1 flex ${position === "right" ? "justify-start" : ""} hidden lg:flex`} style={{ pointerEvents: 'none', paddingLeft: position === "right" ? "109px" : "0" }}>
        {position === "right" && (
          <div className="w-full max-w-md timeline-card-container" style={{ pointerEvents: 'auto' }}>
            {renderCardContent()}
          </div>
        )}
      </div>

      {/* Mobile Card (shown on all small screens) */}
      <div className="lg:hidden w-full" style={{ pointerEvents: 'auto' }}>
        {renderCardContent()}
      </div>
    </div>
  );
}

export function TimelineDesktop({ useV2Features = false }: { useV2Features?: boolean } = {}) {
  const router = useRouter();
  const { user, isLoading, logout, session } = useAuth();
  const { session: familySession } = useFamilyAuth();
  const { toast } = useToast();
  const modeSelection = useModeSelection();
  const queryClient = useQueryClient();
  const progressLineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [returnHighlightId, setReturnHighlightId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // V3: Get active storyteller context for family sharing
  const { activeContext, isLoading: isAccountContextLoading } = useAccountContext();
  const storytellerId = activeContext?.storytellerId || user?.id;
  const isViewingOwnAccount = activeContext?.type === 'own';

  // Dual authentication: Use JWT for owners, sessionToken for viewers
  const authToken = session?.access_token || familySession?.sessionToken;
  const authHeaders = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : familySession?.sessionToken
      ? { Authorization: `Bearer ${familySession.sessionToken}` }
      : {};

  const {
    data: storiesData,
    isLoading: isStoriesLoading,
    error: storiesError,
  } = useQuery({
    queryKey: ["stories", storytellerId, authToken], // Include auth token in query key
    queryFn: async () => {
      const url = storytellerId
        ? `${getApiUrl("/api/stories")}?storyteller_id=${storytellerId}`
        : getApiUrl("/api/stories");
      const res = await fetch(url, {
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch stories: ${res.status}`);
      }

      return res.json();
    },
    enabled: !!authToken && !!storytellerId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes even when unmounted
    placeholderData: keepPreviousData, // Keep showing old data while refetching to prevent flash
  });

  // Restore scroll position when returning from book view
  useEffect(() => {
    const stories = (storiesData as any)?.stories || [];

    console.log('[Timeline Navigation Debug] Effect triggered', {
      hasStoriesData: !!storiesData,
      storiesCount: stories.length
    });

    // Only process if we have stories loaded
    if (!storiesData || stories.length === 0) {
      console.log('[Timeline Navigation Debug] Skipping - no stories loaded yet');
      return;
    }

    // Check for return navigation context from BookView
    const contextStr = sessionStorage.getItem("timeline-navigation-context");
    console.log('[Timeline Navigation Debug] SessionStorage context:', contextStr);

    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        console.log('[Timeline Navigation Debug] Parsed context:', context);

        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000; // 5 minutes expiry
        console.log('[Timeline Navigation Debug] Is expired?', isExpired);

        if (!isExpired && (context.returnPath === "/timeline-v2" || context.returnPath === "/timeline")) {
          console.log('[Timeline Navigation Debug] Context valid, setting up scroll to:', context.memoryId);

          // Set the return highlight
          setReturnHighlightId(context.memoryId);

          // Restore scroll position after a brief delay to ensure DOM is ready
          setTimeout(() => {
            console.log('[Timeline Navigation Debug] Executing scroll after timeout');

            window.scrollTo({
              top: context.scrollPosition,
              behavior: "instant",
            });

            // Then apply smooth scroll to the specific card for visual feedback
            const memoryCard = document.querySelector(
              `[data-memory-id="${context.memoryId}"]`,
            );
            console.log('[Timeline Navigation Debug] Found memory card?', !!memoryCard, memoryCard);

            if (memoryCard) {
              console.log('[Timeline Navigation Debug] Scrolling to card');
              memoryCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              // Only clear sessionStorage if we successfully found and scrolled to the card
              sessionStorage.removeItem("timeline-navigation-context");
              console.log('[Timeline Navigation Debug] SessionStorage cleared after successful scroll');
            } else {
              console.log('[Timeline Navigation Debug] Story card not found yet, will retry on next render');
              // Check if any cards with data-memory-id exist
              const allCards = document.querySelectorAll('[data-memory-id]');
              console.log('[Timeline Navigation Debug] Total cards with data-memory-id:', allCards.length);
              if (allCards.length > 0) {
                console.log('[Timeline Navigation Debug] Sample IDs:', Array.from(allCards).slice(0, 3).map(c => c.getAttribute('data-memory-id')));
              }
            }
          }, 300); // Increased timeout to give DOM more time to render

          // Remove highlight after animation
          setTimeout(() => {
            setReturnHighlightId(null);
          }, 3000);
        } else if (isExpired) {
          console.log('[Timeline Navigation Debug] Context expired, clearing');
          // Clear expired context
          sessionStorage.removeItem("timeline-navigation-context");
        }
      } catch (e) {
        console.error("Failed to parse navigation context:", e);
        sessionStorage.removeItem("timeline-navigation-context");
      }
    } else {
      console.log('[Timeline Navigation Debug] No sessionStorage context found');
    }
  }, [storiesData]);

  // Animate progress line on scroll
  useEffect(() => {
    if (!timelineContainerRef.current || !progressLineRef.current) return;

    const handleScroll = () => {
      if (!timelineContainerRef.current || !progressLineRef.current) return;

      const container = timelineContainerRef.current;
      const progressLine = progressLineRef.current;

      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerHeight = containerRect.height;
      const windowHeight = window.innerHeight;

      // Calculate how far the viewport bottom has scrolled into the timeline
      // When containerTop is positive (timeline below viewport), progress should be minimal
      // When containerTop is negative (timeline scrolled up), progress grows
      // When bottom of viewport reaches bottom of timeline, progress should be 100%
      const distanceIntoTimeline = windowHeight - containerTop;
      const scrollProgress = Math.max(
        0,
        Math.min(1, distanceIntoTimeline / containerHeight)
      );

      progressLine.style.height = `${scrollProgress * 100}%`;
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [storiesData]);

  // Date bubble collision animation on scroll
  useEffect(() => {
    if (!storiesData) return;

    const handleBubbleScroll = () => {
      const stickyTop = 80; // Header height 62px + 18px clearance
      const collisionThreshold = 10 as number; // Very small threshold - stay visible longer

      // Query all timeline-dot elements
      const bubbles = Array.from(document.querySelectorAll('.timeline-dot'));
      
      bubbles.forEach((bubble, index) => {
        if (!(bubble instanceof HTMLElement)) return;

        const rect = bubble.getBoundingClientRect();
        const distanceFromTop = rect.top;
        
        // Check if there's a bubble below this one
        const nextBubble = bubbles[index + 1];
        let nextBubbleDistance = Infinity;
        if (nextBubble instanceof HTMLElement) {
          const nextRect = nextBubble.getBoundingClientRect();
          nextBubbleDistance = nextRect.top;
        }

        // Get the base translateX from inline styles (left cards: -12px, right cards: +12px)
        const baseTransform = bubble.style.transform || '';
        const translateXMatch = baseTransform.match(/translateX\(([^)]+)\)/);
        const translateX = translateXMatch ? translateXMatch[0] : '';

        // This bubble is at or above sticky position
        if (distanceFromTop <= stickyTop) {
          bubble.classList.add('is-sticky');
          
          // Check if next bubble is approaching
          const proximityToNext = nextBubbleDistance - stickyTop;

          // Fade logic - stay visible until next bubble is very close
          if (proximityToNext > 0) {
            // Stay FULLY visible until next bubble touches sticky position
            bubble.style.opacity = '1';
            bubble.style.transform = `${translateX} scale(1)`;
          } else if (proximityToNext > -38) {
            // Fade out over the last 38px of overlap (holds until badges nearly touch)
            const overlapProgress = Math.abs(proximityToNext) / 38;
            bubble.style.opacity = `${Math.max(0, 1 - overlapProgress)}`;
            bubble.style.transform = `${translateX} scale(${Math.max(0.9, 1 - (overlapProgress * 0.1))})`;
          } else {
            // Fully faded when deep overlap
            bubble.style.opacity = '0';
            bubble.style.transform = `${translateX} scale(0.9)`;
          }
        } else {
          // Bubble is below sticky position - normal state
          bubble.classList.remove('is-sticky');
          bubble.style.opacity = '1';
          bubble.style.transform = `${translateX} scale(1)`;
        }
      });
    };

    window.addEventListener("scroll", handleBubbleScroll, { passive: true });
    handleBubbleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleBubbleScroll);
  }, [storiesData]);

  // Redirect if no user (useEffect to avoid setState during render) - allow family viewers
  useEffect(() => {
    // Wait for both auth and account context to load before redirecting
    if (!isLoading && !isAccountContextLoading && !user && !activeContext) {
      router.push("/auth/login");
    }
  }, [isLoading, isAccountContextLoading, user, activeContext, router]);

  // Single unified loading state - centered with timeline spine
  // Wait for account context to load, then check for user or activeContext
  if (isLoading || isAccountContextLoading || (!user && !activeContext) || (isStoriesLoading && !storiesData)) {

    return (
      <div className="hw-page flex flex-col items-center justify-center gap-4" style={{ backgroundColor: isDark ? '#1c1c1d' : '#fafaf9' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: isDark ? '#b0b3b8' : '#F59E0B' }}></div>
        <p className="text-lg" style={{ color: isDark ? '#b0b3b8' : '#6B4E42' }}>Loading your timeline...</p>
      </div>
    );
  }

  const allStories = (storiesData as any)?.stories || [];
  const stories = allStories.filter((s: any) => s.includeInTimeline === true);

  // V3: Extract storyteller metadata for family sharing (birth year for age calculations)
  const storytellerData = (storiesData as any)?.storyteller || null;
  const birthYear = storytellerData?.birthYear || user?.birthYear || 0;

  // Sort stories chronologically
  const sortedStories = [...stories].sort((a: any, b: any) => {
    const yearA = normalizeYear(a.storyYear);
    const yearB = normalizeYear(b.storyYear);
    return (yearA ?? 0) - (yearB ?? 0);
  });

  // Group stories by decade for dividers
  const storiesByDecade = new Map<string, Story[]>();
  sortedStories.forEach((story: Story) => {
    const year = normalizeYear(story.storyYear);
    const decade = Math.floor((year ?? 0) / 10) * 10;
    const decadeKey = `${decade}s`;
    if (!storiesByDecade.has(decadeKey)) {
      storiesByDecade.set(decadeKey, []);
    }
    storiesByDecade.get(decadeKey)?.push(story);
  });

  return (
    <div className={`hw-page ${isDark ? 'dark-theme' : ''}`} style={{ backgroundColor: isDark ? '#1c1c1d' : '#fafaf9' }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DesktopPageHeader
          icon={Calendar}
          title="Timeline"
          subtitle="A timeline of memories, moments, and milestones"
          showAccountSwitcher={true}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-[114px] pb-12 md:pt-[114px] md:pb-20">
        {/* Title Section */}
        <div className="text-center mb-[114px]">
          <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-6" style={{ color: isDark ? '#b0b3b8' : '#111827' }}>
            {activeContext?.storytellerName ? `${activeContext.storytellerName}'s Journey` : "Life's Journey"}
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-center" style={{ color: isDark ? '#8a8d92' : '#4b5563' }}>
            A timeline of memories, moments, and milestones that shaped {activeContext?.type === 'viewing' ? 'their' : 'your'} life.
          </p>
        </div>

        {/* Timeline Container */}
        <div ref={timelineContainerRef} className="relative">
          {/* V3: Subtle vertical timeline ruler - warm gray for definition */}
          <div
            className="absolute left-1/2 md:w-[3.5px] w-[4px] rounded-full overflow-hidden pointer-events-none"
            style={{
              backgroundColor: isDark ? 'rgba(176, 179, 184, 0.25)' : '#DCDAD8', // 12% darker for visibility
              transform: 'translateX(-50%)',
              top: '0',
              bottom: '500px',
              opacity: 0.8,
              boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.18), 0 3px 7px -1px rgba(0, 0, 0, 0.12)',
            }}
          />

          {/* Timeline Steps */}
          <div className="flex flex-col gap-2 md:gap-0">
            {Array.from(storiesByDecade.entries())
              .sort(([decadeA], [decadeB]) => {
                const yearA = parseInt(decadeA.replace('s', ''));
                const yearB = parseInt(decadeB.replace('s', ''));
                return yearA - yearB;
              })
              .map(([decade, decadeStories], decadeIndex) => {
                // Check if the first story falls on the decade year
                const decadeYear = parseInt(decade.replace('s', ''));
                const firstStoryYear = decadeStories[0] ? normalizeYear(decadeStories[0].storyYear) : null;
                const firstStoryIsOnDecade = firstStoryYear === decadeYear;
                const decadeLabel = decade.replace('s', '') + 's';
                // Skip decade banner entirely for the first decade
                const isFirstDecade = decadeIndex === 0;
                
                return (
                  <div key={decade}>
                    {/* V3: Decade labels removed per user request */}
                    
                    {/* Stories in this decade */}
                    {decadeStories.map((story: Story, storyIndex: number) => {
                      // Calculate global index for alternating left/right positioning
                      const globalIndex = sortedStories.findIndex(s => s.id === story.id);
                      // V3: No decade markers on cards anymore
                      const showDecadeMarker = false;

                      // Only the very first story (first decade, first story) gets no negative margin
                      const isVeryFirstStory = decadeIndex === 0 && storyIndex === 0;

                      // Check if current story has a photo
                      const hasPhoto = (story.photos && story.photos.length > 0 && story.photos.some((p: any) => p.url)) || story.photoUrl;

                      // Check if previous story has a photo
                      const prevStory = storyIndex > 0 ? decadeStories[storyIndex - 1] : null;
                      const prevHasPhoto = prevStory
                        ? (prevStory.photos && prevStory.photos.length > 0 && prevStory.photos.some((p: any) => p.url)) || prevStory.photoUrl
                        : true; // Default to true for first card

                      // Adjust negative margin based on current AND previous card type
                      let negativeMargin = "md:-mt-[121px]"; // Default for photo after photo
                      if (!hasPhoto) {
                        // Current card is pill (no photo)
                        negativeMargin = "md:-mt-[40px]";
                      } else if (!prevHasPhoto) {
                        // Current card is photo, but previous was pill - use less aggressive margin
                        negativeMargin = "md:-mt-[40px]";
                      }

                      return (
                        <div
                          key={story.id}
                          className={isVeryFirstStory ? "md:mt-0" : negativeMargin}
                          data-memory-id={story.id}
                          style={{
                            transition: returnHighlightId === story.id ? 'background-color 0.3s' : 'none',
                            backgroundColor: returnHighlightId === story.id ? (isDark ? 'rgba(176, 179, 184, 0.08)' : 'rgba(251, 146, 60, 0.1)') : 'transparent',
                            borderRadius: returnHighlightId === story.id ? '1rem' : '0',
                            padding: returnHighlightId === story.id ? '1rem' : '0',
                          }}
                        >
                          <CenteredMemoryCard
                            story={story}
                            position={globalIndex % 2 === 0 ? "left" : "right"}
                            index={globalIndex}
                            isDark={isDark}
                            showDecadeMarker={showDecadeMarker}
                            decadeLabel={showDecadeMarker ? decadeLabel : undefined}
                            birthYear={birthYear}
                            useV2Features={useV2Features}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            {sortedStories.length === 0 && (
              <div className="py-12 space-y-8">
                {activeContext?.type === 'own' || activeContext?.permissionLevel === 'contributor' ? (
                  // Viewing own account or contributor - show premium starter cards
                  <>
                    {/* Intro text */}
                    <p className="text-center text-lg text-stone-600 max-w-2xl mx-auto">
                      {activeContext?.type === 'own'
                        ? "Let's start your story. Choose a moment below or tap Create First Memory."
                        : `Let's start ${activeContext.storytellerName}'s story. Choose a moment below or tap Record Story.`
                      }
                    </p>

                    {/* Starter Cards - Responsive Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
                      {STARTER_TEMPLATES.map((template) => (
                        <StarterMemoryCard
                          key={template.id}
                          template={template}
                          onStart={(template) => {
                            // Store template in sessionStorage for /recording page to read
                            sessionStorage.setItem('starterTemplate', JSON.stringify({
                              id: template.id,
                              title: template.title,
                            }));

                            // Navigate to recording page (same as nav bar "Record" button)
                            router.push('/recording');
                          }}
                        />
                      ))}
                    </div>

                    {/* Helper text */}
                    <p className="text-center text-sm text-stone-400 max-w-xl mx-auto">
                      These are just suggestions. Once you save your first memory, your real timeline will appear here.
                    </p>

                    {/* Original "Create First Memory" button - kept as fallback */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => router.push('/recording')}
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50">
                        <Plus className="w-5 h-5 mr-2" />
                        {activeContext?.type === 'own' ? 'Create First Memory' : 'Record Story'}
                      </Button>
                    </div>
                  </>
                ) : (
                  // Viewing family member as viewer - read-only
                  <p className="text-gray-500 text-lg text-center">
                    No stories have been shared yet.
                  </p>
                )}
              </div>
            )}

            {/* Timeline End - Terminal node + CTA */}
            {sortedStories.length > 0 && (
              <TimelineEnd
                isDark={isDark}
                hasCurrentYearContent={sortedStories.some(
                  (s) => new Date(s.createdAt).getFullYear() === new Date().getFullYear()
                )}
                onAddMemory={() => router.push("/review/book-style?new=true")}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
      />

      {/* Quick Story Recorder */}
      <QuickStoryRecorder
        isOpen={modeSelection.quickRecorderOpen}
        onClose={modeSelection.closeQuickRecorder}
      />

      {/* Memory Overlay */}
      {selectedStory && (
        <MemoryOverlay
          story={selectedStory}
          stories={sortedStories}
          isOpen={overlayOpen}
          originPath="/timeline"
          onClose={() => {
            setOverlayOpen(false);
            setSelectedStory(null);
          }}
          onNavigate={(storyId) => {
            const story = sortedStories.find(s => s.id === storyId);
            if (story) {
              setSelectedStory(story);
            }
          }}
        />
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        /* Connector lines from cards to timeline center */
        .timeline-step {
          position: relative;
        }

        /* Connector line - horizontal stub from card to center timeline */
        @media (min-width: 768px) {
          /* Shift timeline cards and decade banners 225px left on desktop/tablet */
          .timeline-step.translate-y-0 {
            transform: translateY(0);
          }

          .timeline-step.translate-y-8 {
            transform: translateY(2rem);
          }

          .decade-banner {
            transform: none;
          }
          /* Sticky date bubbles */
          .timeline-dot {
            position: sticky;
            top: 80px;
            z-index: 30;
            /* No transitions - scroll handler provides smooth updates */
          }
        
          .timeline-card-container {
            position: relative;
          }

          .timeline-card-container::after {
            content: "";
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 78px;
            height: 3.5px;
            background: linear-gradient(
              to right,
              rgba(220, 218, 216, 0.3),
              rgba(220, 218, 216, 0.8)
            );
            border-radius: 1px;
            opacity: 1;
            pointer-events: none;
            transition: all 150ms ease-out;
            z-index: 1;
            box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.1);
          }

          /* Left-positioned cards - connector goes to the right (dark at card, light at spine) */
          .timeline-step .justify-end .timeline-card-container::after {
            right: -78px;
            background: linear-gradient(
              to right,
              rgba(220, 218, 216, 0.4) 0%,
              rgba(220, 218, 216, 0.6) 70%,
              rgba(220, 218, 216, 0.8) 100%
            );
          }

          /* Right-positioned cards - connector goes to the left (dark at card, light at spine) */
          .timeline-step .justify-start .timeline-card-container::after {
            left: -78px;
            background: linear-gradient(
              to right,
              rgba(220, 218, 216, 0.8) 0%,
              rgba(220, 218, 216, 0.6) 30%,
              rgba(220, 218, 216, 0.4) 100%
            );
          }

          /* Hover effect - brighten */
          .timeline-step:hover .timeline-card-container::after {
            background: linear-gradient(
              to right,
              rgba(220, 218, 216, 0.5),
              rgba(220, 218, 216, 0.9)
            );
          }

          .timeline-step:hover .justify-end .timeline-card-container::after {
            background: linear-gradient(
              to right,
              rgba(220, 218, 216, 0.9),
              rgba(220, 218, 216, 0.5)
            );
          }

          .timeline-step:hover .justify-start .timeline-card-container::after {
            background: linear-gradient(
              to left,
              rgba(220, 218, 216, 0.9),
              rgba(220, 218, 216, 0.5)
            );
          }
        }
        
        @media (max-width: 767px) {
          .timeline-step {
            opacity: 1 !important;
            transform: translateX(0) translateY(0) !important;
          }
          .decade-banner {
            transform: translateX(0) !important;
          }
          .timeline-dot {
            transform: scale(1) !important;
            opacity: 1 !important;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .timeline-card-container::after {
            transition: none !important;
          }
        }

        /* Dark theme connector line overrides - keep subtle gray for dark mode */
        .dark-theme .timeline-card-container::after {
          background: linear-gradient(
            to right,
            rgba(59, 61, 63, 0.5),
            rgba(59, 61, 63, 0.8)
          ) !important;
        }
        .dark-theme .timeline-step .justify-end .timeline-card-container::after {
          background: linear-gradient(
            to right,
            rgba(59, 61, 63, 0.8),
            rgba(59, 61, 63, 0.5)
          ) !important;
        }
        .dark-theme .timeline-step .justify-start .timeline-card-container::after {
          background: linear-gradient(
            to left,
            rgba(59, 61, 63, 0.8),
            rgba(59, 61, 63, 0.5)
          ) !important;
        }
        .dark-theme .timeline-step:hover .timeline-card-container::after,
        .dark-theme .timeline-step:hover .justify-end .timeline-card-container::after,
        .dark-theme .timeline-step:hover .justify-start .timeline-card-container::after {
          background: linear-gradient(
            to right,
            rgba(176, 179, 184, 0.8),
            rgba(176, 179, 184, 0.5)
          ) !important;
        }
      `}</style>
    </div>
  );
}
