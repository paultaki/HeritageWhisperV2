"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
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
  BookOpen,
  Clock,
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

const logoUrl = "/Logo Icon hw.svg";

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
          transform: 'translateX(calc(-50% - 205px))', // Position to right of timeline line
          opacity: isDark ? 0.4 : 0.45,
        }}
      >
        <span
          style={{
            fontSize: '11px',
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
}

function CenteredMemoryCard({ story, position, index, isDark = false, showDecadeMarker = false, decadeLabel, birthYear, onOpenOverlay }: CenteredMemoryCardProps) {
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

      const isBirthYearStory =
        story.title?.toLowerCase().includes("born") ||
        story.title?.toLowerCase().includes("birth");
      if (isBirthYearStory) {
        router.push(`/review?edit=${story.id}`);
      } else {
        router.push(`/book?storyId=${story.id}`);
      }
    }
  };

  // Render function for card content - mobile style with white card below photo
  const renderCardContent = () => {
    // If there's a photo, render with white card below (mobile style)
    if (displayPhoto?.url) {
      return (
        <div
          className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={handleCardClick}
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

            {/* Audio play button overlaid on photo */}
            {story.audioUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio(e);
                }}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                className="absolute right-4 bottom-4 w-11 h-11 rounded-full bg-gray-500/40 backdrop-blur-sm hover:bg-gray-500/60 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 z-10"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="13" fill="white" fillOpacity="0.9" />
                    {isPlaying ? (
                      <g>
                        <rect x="11" y="9" width="2.8" height="10" rx="0.6" fill="#fb923c" />
                        <rect x="14.8" y="9" width="2.8" height="10" rx="0.6" fill="#fb923c" />
                      </g>
                    ) : (
                      <polygon points="11,9 11,19 19,14" fill="#fb923c" />
                    )}
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* White Card Section Below Photo */}
          <div className="p-4 bg-white">
            {/* Progress Bar (when playing) */}
            {story.audioUrl && (isPlaying || progress > 0) && (
              <div className="mb-3">
                <div
                  ref={progressBarRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressBarClick(e);
                  }}
                  className="h-1.5 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {story.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {story.storyDate
                  ? new Date(story.storyDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })
                  : formatYear(story.storyYear)}
              </span>
              {displayLifeAge !== null && displayLifeAge !== undefined && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>
                    {displayLifeAge > 0 && `Age ${displayLifeAge}`}
                    {displayLifeAge === 0 && `Birthday`}
                    {displayLifeAge < 0 && `Before birth`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // No photo - render card with placeholder matching photo cards
    return (
      <div
        className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={handleCardClick}
      >
        {/* Placeholder Section - 16:10 aspect ratio to match mobile */}
        <div className="relative w-full aspect-[16/10] overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center"
            style={{
              backgroundColor: isDark ? '#2a2a2a' : '#f9fafb',
              backgroundImage: `linear-gradient(135deg, ${isDark ? '#2a2a2a' : '#f9fafb'} 0%, ${isDark ? '#1f1f1f' : '#f3f4f6'} 50%, ${isDark ? '#2a2a2a' : '#f9fafb'} 100%)`
            }}
          >
            <div className="text-center p-6">
              <div className="text-5xl opacity-10">📝</div>
            </div>
          </div>

          {/* Audio play button overlaid on placeholder */}
          {story.audioUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio(e);
              }}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              className="absolute right-4 bottom-4 w-11 h-11 rounded-full bg-gray-500/40 backdrop-blur-sm hover:bg-gray-500/60 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 z-10"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              ) : (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" fill="white" fillOpacity="0.9" />
                  {isPlaying ? (
                    <g>
                      <rect x="11" y="9" width="2.8" height="10" rx="0.6" fill="#fb923c" />
                      <rect x="14.8" y="9" width="2.8" height="10" rx="0.6" fill="#fb923c" />
                    </g>
                  ) : (
                    <polygon points="11,9 11,19 19,14" fill="#fb923c" />
                  )}
                </svg>
              )}
            </button>
          )}
        </div>

        {/* White Card Section Below Placeholder */}
        <div className="p-4 bg-white">
          {/* Progress Bar (when playing) */}
          {story.audioUrl && (isPlaying || progress > 0) && (
            <div className="mb-3">
              <div
                ref={progressBarRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProgressBarClick(e);
                }}
                className="h-1.5 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {story.title}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {story.storyDate
                ? new Date(story.storyDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })
                : formatYear(story.storyYear)}
            </span>
            {displayLifeAge !== null && displayLifeAge !== undefined && (
              <>
                <span className="text-gray-300">•</span>
                <span>
                  {displayLifeAge > 0 && `Age ${displayLifeAge}`}
                  {displayLifeAge === 0 && `Birthday`}
                  {displayLifeAge < 0 && `Before birth`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`timeline-step flex flex-col lg:flex-row items-center gap-6 lg:gap-4 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: 'none',
      }}
    >
      {/* Left side content (for left-positioned cards) - Desktop only */}
      <div className={`flex-1 flex ${position === "left" ? "justify-end lg:pr-6" : ""} hidden lg:flex`} style={{ pointerEvents: 'none' }}>
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
          transform: position === "left" ? "translateX(-12px)" : "translateX(12px)",
        }}
      >
        <div
          className="py-0.5 px-2.5 font-serif whitespace-nowrap transition-all duration-200 hover:opacity-100"
          style={{
            backgroundColor: '#F9E5E8',
            border: `1px solid rgba(139, 107, 122, 0.2)`,
            color: '#8B6B7A',
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '0.3px',
            opacity: 0.95,
            boxShadow: isDark
              ? '0 2px 4px rgba(0, 0, 0, 0.2)'
              : '0 2px 6px rgba(139, 107, 122, 0.12)',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            top: '-2px',
          }}
        >
          {story.storyDate
            ? new Date(story.storyDate).getFullYear()
            : formatYear(story.storyYear)}
        </div>
      </div>

      {/* Right side content (for right-positioned cards) - Desktop only */}
      <div className={`flex-1 flex ${position === "right" ? "justify-start lg:pl-6" : ""} hidden lg:flex`} style={{ pointerEvents: 'none' }}>
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

export function TimelineDesktop() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
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
  const { activeContext } = useAccountContext();
  const storytellerId = activeContext?.storytellerId || user?.id;

  const {
    data: storiesData,
    isLoading: isStoriesLoading,
    error: storiesError,
  } = useQuery({
    queryKey: ["stories", storytellerId], // Include storytellerId in query key
    queryFn: async () => {
      const url = storytellerId
        ? `${getApiUrl("/api/stories")}?storyteller_id=${storytellerId}`
        : getApiUrl("/api/stories");
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user && !!storytellerId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes even when unmounted
    placeholderData: keepPreviousData, // Keep showing old data while refetching to prevent flash
  });

  // Restore scroll position when returning from book view
  useEffect(() => {
    // Check for return navigation context from BookView
    const contextStr = sessionStorage.getItem("timeline-navigation-context");
    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000; // 5 minutes expiry

        if (!isExpired && (context.returnPath === "/timeline-v2" || context.returnPath === "/timeline")) {
          // Set the return highlight
          setReturnHighlightId(context.memoryId);

          // Restore scroll position after a brief delay to ensure DOM is ready
          setTimeout(() => {
            window.scrollTo({
              top: context.scrollPosition,
              behavior: "instant",
            });

            // Then apply smooth scroll to the specific card for visual feedback
            const memoryCard = document.querySelector(
              `[data-memory-id="${context.memoryId}"]`,
            );
            if (memoryCard) {
              memoryCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 100);

          // Clear the context after using it
          sessionStorage.removeItem("timeline-navigation-context");

          // Remove highlight after animation
          setTimeout(() => {
            setReturnHighlightId(null);
          }, 3000);
        } else if (isExpired) {
          // Clear expired context
          sessionStorage.removeItem("timeline-navigation-context");
        }
      } catch (e) {
        console.error("Failed to parse navigation context:", e);
        sessionStorage.removeItem("timeline-navigation-context");
      }
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
      const stickyTop = 55; // Sticky position from top (aligned with header)
      const collisionThreshold = 163 as number; // Increased to make markers travel closer before collision (38px more)

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

        // This bubble is stuck at the top (CSS sticky)
        if (distanceFromTop <= stickyTop) {
          bubble.classList.add('is-sticky');
          
          // Check if next bubble is approaching (within collision threshold)
          if (nextBubbleDistance <= stickyTop + collisionThreshold) {
            // Next bubble is approaching - fade OUT this one
            const rawProgress = collisionThreshold !== 0 
              ? 1 - ((nextBubbleDistance - stickyTop) / collisionThreshold)
              : 1; // Instant fade if threshold is exactly 0
            // Clamp fadeProgress between 0 and 1 to prevent crazy values
            const fadeProgress = Math.max(0, Math.min(1, rawProgress));
            
            // Keep bubble visible until next one is VERY close (allow negative for overlap)
            const proximityToNext = nextBubbleDistance - stickyTop;
            const shouldBeVisible = proximityToNext > -28; // Start fading when 28px past sticky (overlapping)
            
            if (shouldBeVisible) {
              bubble.style.opacity = `${Math.max(0.2, 1 - fadeProgress)}`; // Min 20% opacity while approaching
              bubble.style.transform = `${translateX} scale(${Math.max(0.8, 1 - (fadeProgress * 0.2))})`; // Scale to 80%
            } else {
              // Next bubble has overlapped by more than 28px - NOW fade quickly
              const finalFade = Math.max(0, (proximityToNext + 38) / 10); // Fade over final 10px of overlap
              bubble.style.opacity = `${finalFade * 0.2}`; // Fade from 20% to 0%
              bubble.style.transform = `${translateX} scale(${0.8 * finalFade})`; // Scale from 80% to 0%
            }
          } else {
            // No collision - stay bright and full size
            bubble.style.opacity = '1';
            // Preserve translateX
            bubble.style.transform = `${translateX} scale(1)`;
          }
        } else {
          // Bubble is below sticky position - normal state
          bubble.classList.remove('is-sticky');
          bubble.style.opacity = '1';
          // Preserve translateX
          bubble.style.transform = `${translateX} scale(1)`;
        }
      });
    };

    window.addEventListener("scroll", handleBubbleScroll, { passive: true });
    handleBubbleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleBubbleScroll);
  }, [storiesData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isLoading && !user) {
    router.push("/auth/login");
    return null;
  }

  // Show loading state while fetching stories data
  if (isStoriesLoading && !storiesData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: isDark ? '#1c1c1d' : '#FFF8F3' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: isDark ? '#b0b3b8' : '#F59E0B' }}></div>
        <p className="text-lg" style={{ color: isDark ? '#b0b3b8' : '#6B4E42' }}>Loading your timeline...</p>
      </div>
    );
  }

  const allStories = (storiesData as any)?.stories || [];
  const stories = allStories.filter((s: any) => s.includeInTimeline === true);

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
    <div className={`min-h-screen ${isDark ? 'dark-theme' : ''}`} style={{ backgroundColor: isDark ? '#1c1c1d' : '#FFF8F3' }}>
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
        <div className="text-center mb-[114px]" style={{ transform: 'translateX(-225px)' }}>
          <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-6" style={{ color: isDark ? '#b0b3b8' : '#111827' }}>
            {activeContext?.storytellerName ? `${activeContext.storytellerName}'s Journey` : "Life's Journey"}
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-center" style={{ color: isDark ? '#8a8d92' : '#4b5563' }}>
            A timeline of memories, moments, and milestones that shaped {activeContext?.type === 'viewing' ? 'their' : 'your'} life.
          </p>
        </div>

        {/* Timeline Container */}
        <div ref={timelineContainerRef} className="relative">
          {/* V3: Subtle vertical timeline ruler - soft mauve for premium feel */}
          <div
            className="absolute left-1/2 md:w-[2.5px] w-[3px] rounded-full overflow-hidden pointer-events-none"
            style={{
              backgroundColor: isDark ? 'rgba(176, 179, 184, 0.25)' : 'rgba(196, 167, 183, 0.35)',
              transform: 'translateX(calc(-50% - 225px))',
              top: '0',
              bottom: '0',
              height: '100%',
              opacity: 0.8,
            }}
          >
            <div
              ref={progressLineRef}
              className="w-full rounded-full transition-all duration-300 ease-out"
              style={{
                height: "0%",
                background: isDark ? 'rgba(176, 179, 184, 0.4)' : 'rgba(196, 167, 183, 0.55)',
                boxShadow: 'none',
              }}
            />
          </div>

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
                      
                      return (
                        <div
                          key={story.id}
                          className={isVeryFirstStory ? "md:mt-0" : "md:-mt-[108px]"}
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
                            birthYear={user?.birthYear || normalizeYear(user?.birthYear as any) || 0}
                            onOpenOverlay={(story) => {
                              setSelectedStory(story);
                              setOverlayOpen(true);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            {sortedStories.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-6">No memories yet. Start recording your first story!</p>
                <Button
                  onClick={() => modeSelection.openModal()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Memory
                </Button>
              </div>
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
            transform: translateX(-225px) translateY(0);
          }

          .timeline-step.translate-y-8 {
            transform: translateX(-225px) translateY(2rem);
          }

          .decade-banner {
            transform: translateX(-225px);
          }
          /* Sticky date bubbles */
          .timeline-dot {
            position: sticky;
            top: 55px;
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
            width: 20px;
            height: 2.5px;
            background: linear-gradient(
              to right,
              rgba(196, 167, 183, 0.3),
              rgba(196, 167, 183, 0.5)
            );
            border-radius: 1px;
            opacity: 1;
            pointer-events: none;
            transition: all 150ms ease-out;
            z-index: 1;
          }

          /* Left-positioned cards - connector goes to the right */
          .timeline-step .justify-end .timeline-card-container::after {
            right: -26px;
            background: linear-gradient(
              to right,
              rgba(196, 167, 183, 0.5),
              rgba(196, 167, 183, 0.3)
            );
          }

          /* Right-positioned cards - connector goes to the left */
          .timeline-step .justify-start .timeline-card-container::after {
            left: -26px;
            background: linear-gradient(
              to left,
              rgba(196, 167, 183, 0.5),
              rgba(196, 167, 183, 0.3)
            );
          }

          /* Hover effect - extend and brighten */
          .timeline-step:hover .timeline-card-container::after {
            width: 26px;
            background: linear-gradient(
              to right,
              rgba(196, 167, 183, 0.7),
              rgba(196, 167, 183, 0.5)
            );
          }

          .timeline-step:hover .justify-end .timeline-card-container::after {
            background: linear-gradient(
              to right,
              rgba(196, 167, 183, 0.7),
              rgba(196, 167, 183, 0.5)
            );
          }

          .timeline-step:hover .justify-start .timeline-card-container::after {
            background: linear-gradient(
              to left,
              rgba(196, 167, 183, 0.7),
              rgba(196, 167, 183, 0.5)
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
