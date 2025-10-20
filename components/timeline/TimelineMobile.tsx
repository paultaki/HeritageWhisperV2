"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import DecadeNav, { type DecadeEntry } from "@/components/ui/DecadeNav";
import {
  Play,
  Plus,
  Square,
  Share2,
  Calendar,
  Loader2,
  AlertCircle,
  Pause,
  X,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useMemo } from "react";
import { normalizeYear, formatYear } from "@/lib/utils";
import StoryTraits from "@/components/StoryTraits";
import { getTopTraits } from "@/utils/getTopTraits";
import { Palette } from "lucide-react";

const logoUrl = "/HW_logo_mic_clean.png";

// Color scheme options for testing
type ColorScheme =
  | "original"
  | "white"
  | "inverted"
  | "soft"
  | "cool"
  | "dark"
  | "retro";

const colorSchemes = {
  original: {
    name: "Original",
    page: "bg-heritage-warm-bg",
    card: "bg-white",
    header: "bg-white/95",
    text: "text-foreground",
    timelineLine: "from-heritage-orange to-heritage-coral",
  },
  white: {
    name: "Clean White",
    page: "bg-white",
    card: "bg-white border border-gray-200",
    header: "bg-white/95",
    text: "text-foreground",
    timelineLine: "from-gray-300 to-gray-400",
  },
  inverted: {
    name: "Inverted",
    page: "bg-white",
    card: "bg-heritage-warm-bg",
    header: "bg-heritage-warm-bg/95",
    text: "text-foreground",
    timelineLine: "from-heritage-orange to-heritage-coral",
  },
  soft: {
    name: "Soft Gray",
    page: "bg-gray-50",
    card: "bg-white",
    header: "bg-gray-50/95",
    text: "text-foreground",
    timelineLine: "from-gray-400 to-gray-500",
  },
  cool: {
    name: "Cool Blue",
    page: "bg-slate-50",
    card: "bg-white",
    header: "bg-slate-50/95",
    text: "text-foreground",
    timelineLine: "from-blue-400 to-blue-500",
  },
  dark: {
    name: "Dark Mode",
    page: "bg-gray-900",
    card: "bg-gray-800 text-white",
    header: "bg-gray-900/95",
    text: "text-white",
    timelineLine: "from-gray-600 to-gray-700",
  },
  retro: {
    name: "Retro Radio",
    page: "bg-[#F5E6D3]",
    card: "bg-white",
    header: "bg-[#F5E6D3]/95",
    text: "text-[#6B4E42]",
    timelineLine: "from-[#D4654F] to-[#5BB5B0]",
  },
};

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
    // First, pause and reset any currently playing audio
    if (this.currentAudio && this.currentCardId !== cardId) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.error("Error pausing audio:", e);
      }
    }

    // Clear current references
    this.currentAudio = null;
    this.currentCardId = null;

    // Stop all other playing audio by notifying ALL other cards
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

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

function PaywallModal({ isOpen, onClose, onSubscribe }: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full shadow-2xl shadow-heritage-orange/20 border border-heritage-coral/10">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              You've Created 3 Beautiful Memories
            </h2>
            <p className="text-xl text-muted-foreground">
              Subscribe to preserve unlimited stories
            </p>
          </div>

          <div className="bg-primary/10 p-6 rounded-xl mb-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">$149</div>
            <div className="text-muted-foreground">per year</div>
          </div>

          <div className="space-y-3 mb-8">
            {[
              "Unlimited recordings",
              "Full transcriptions",
              "Annual memory book",
              "Share with 5 family members",
              "Download everything",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onSubscribe}
              className="w-full py-4 text-xl font-semibold bg-[var(--primary-coral)] hover:bg-[hsl(0,77%,58%)] text-white rounded-3xl shadow-md hover:shadow-lg transition-all"
              data-testid="button-subscribe"
            >
              Preserve My Legacy
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full py-3 text-muted-foreground hover:text-foreground rounded-3xl transition-all"
              data-testid="button-close-paywall"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MemoryCard({
  story,
  isHighlighted = false,
  isReturnHighlight = false,
  colorScheme = "original",
  isDarkTheme = false,
  birthYear,
}: {
  story: Story;
  isHighlighted?: boolean;
  isReturnHighlight?: boolean;
  colorScheme?: ColorScheme;
  isDarkTheme?: boolean;
  birthYear: number;
}) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null,
  );
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(story.durationSeconds || 0);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
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

  // Intersection Observer for Ken Burns effect trigger
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
      }
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

  // Store the audio ref to access it in callbacks
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Register this card with the audio manager
    const handleAudioStateChange = (
      playing: boolean,
      audioElement?: HTMLAudioElement | null,
    ) => {
      if (!playing) {
        // Stop any playing audio for this card
        // Use the ref which always has the latest value
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
  }, [story.id]); // Only depend on story.id to avoid stale closures

  // Update audioRef whenever currentAudio changes
  useEffect(() => {
    audioRef.current = currentAudio;
  }, [currentAudio]);

  const handleCardClick = () => {
    // Store navigation context in sessionStorage
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

    // Check if this is "The Year I was Born" story - if so, go to edit instead of book view
    const isBirthYearStory =
      story.title?.toLowerCase().includes("born") ||
      story.title?.toLowerCase().includes("birth");
    if (isBirthYearStory) {
      // Navigate directly to edit/review page for birth year story
      router.push(`/review?edit=${story.id}`);
    } else {
      // Navigate to book view for regular stories
      router.push(`/book?storyId=${story.id}`);
    }
  };

  // Get color scheme
  const scheme = colorSchemes[colorScheme];

  // Card styles based on color scheme
  const cardStyle = {
    backgroundColor:
      colorScheme === "inverted"
        ? "#FFF8F3"
        : colorScheme === "dark"
          ? "#1A1A1A" // Much darker card background
          : "#FFFFFF",
    color: colorScheme === "dark" ? "#E5E5E5" : undefined,
    border:
      colorScheme === "white" ||
      colorScheme === "soft" ||
      colorScheme === "cool"
        ? "1px solid #E5E7EB"
        : colorScheme === "dark"
          ? "1px solid #2A2A2A"
          : colorScheme === "retro"
            ? "1px solid #5BB5B0"
            : undefined,
  };

  // Render compact format for memories without photos
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
        style={{ "--title-offset": "22px" } as React.CSSProperties}
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

  // Calculate title offset based on 16:10 aspect ratio image
  const titleOffset = displayPhoto && displayPhoto.url ? "180px" : "22px";

  // Normal format with photo
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
      style={{ "--title-offset": titleOffset } as React.CSSProperties}
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
      <div style={{ position: "relative" }}>
        <img
          src={displayPhoto.url}
          alt={story.title}
          className={`hw-card-media ${
            isVisible && !prefersReducedMotion ? 'ken-burns-effect' : ''
          }`}
          style={
            displayPhoto.transform
              ? {
                  transform: `scale(${displayPhoto.transform.zoom}) translate(${displayPhoto.transform.position.x / displayPhoto.transform.zoom}px, ${displayPhoto.transform.position.y / displayPhoto.transform.zoom}px)`,
                  transformOrigin: "center center",
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
                typeof y === "number" && typeof by === "number" ? y - by : null;
              const age =
                typeof story.lifeAge === "number"
                  ? (story.lifeAge < 0 && computed !== null && y >= by
                      ? computed
                      : story.lifeAge)
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
          <span>
            {(() => {
              const y = normalizeYear(story.storyYear);
              const by = normalizeYear(birthYear);
              const computed =
                typeof y === "number" && typeof by === "number" ? y - by : null;
              const age =
                typeof story.lifeAge === "number"
                  ? (story.lifeAge < 0 && computed !== null && y >= by
                      ? computed
                      : story.lifeAge)
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
          {top.length > 0 && (
            <>
              <span className="divider"></span>
              <span>{top[0].name}</span>
            </>
          )}
        </div>
      </div>

      {/* Provenance on hover */}
      <div className="hw-card-provenance">
        Recorded with Heritage Whisper
        {story.createdAt &&
          ` · Created ${new Date(story.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
        {story.updatedAt &&
          story.updatedAt !== story.createdAt &&
          ` · Last edited ${new Date(story.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
      </div>
    </div>
  );
}

export function TimelineMobile() {
  const { user, session, logout, isLoading } = useAuth();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeDecade, setActiveDecade] = useState<string | null>(null);
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(
    null,
  );
  const [returnHighlightId, setReturnHighlightId] = useState<string | null>(
    null,
  );
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [currentColorScheme, setCurrentColorScheme] =
    useState<ColorScheme>("original");
  const [showColorPalette, setShowColorPalette] = useState(false);
  const { toast } = useToast();
  const modeSelection = useModeSelection();
  const decadeRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const { data: storiesData, refetch: refetchStories, isLoading: isLoadingStories } = useQuery({
    queryKey: ["/api/stories"],
    enabled: !!user && !!session,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes even when unmounted
    refetchOnWindowFocus: true, // Refetch when window regains focus
    placeholderData: keepPreviousData, // Keep showing old data while refetching to prevent flash
  });

  // Sync with global dark theme
  useEffect(() => {
    const updateFromDom = () => {
      const dark = document.documentElement.classList.contains('dark-theme') || document.body.classList.contains('dark-theme');
      setIsDark(dark);
    };
    updateFromDom();
    const handler = () => updateFromDom();
    window.addEventListener('hw-theme-change', handler);
    return () => window.removeEventListener('hw-theme-change', handler);
  }, []);

  // Refetch stories when user and session are available (e.g., after login)
  useEffect(() => {
    if (user && session) {
      refetchStories();
    }
  }, [user, session, refetchStories]);

  // Keyboard shortcuts for color scheme switching
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if cmd/ctrl is held
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            setCurrentColorScheme("original");
            toast({ title: "Color scheme: Original" });
            break;
          case "2":
            e.preventDefault();
            setCurrentColorScheme("white");
            toast({ title: "Color scheme: Clean White" });
            break;
          case "3":
            e.preventDefault();
            setCurrentColorScheme("inverted");
            toast({ title: "Color scheme: Inverted" });
            break;
          case "4":
            e.preventDefault();
            setCurrentColorScheme("soft");
            toast({ title: "Color scheme: Soft Gray" });
            break;
          case "5":
            e.preventDefault();
            setCurrentColorScheme("cool");
            toast({ title: "Color scheme: Cool Blue" });
            break;
          case "6":
            e.preventDefault();
            setCurrentColorScheme("dark");
            toast({ title: "Color scheme: Dark Mode" });
            break;
          case "7":
            e.preventDefault();
            setCurrentColorScheme("retro");
            toast({ title: "Color scheme: Retro Radio" });
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toast]);

  // Detect highlight parameter from URL and check for return navigation context
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get("highlight");

    // Check for return navigation context from BookView
    const contextStr = sessionStorage.getItem("timeline-navigation-context");
    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000; // 5 minutes expiry

        if (!isExpired && context.returnPath === "/timeline") {
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
              `[data-testid="memory-card-${context.memoryId}"]`,
            ) as HTMLElement;
            if (memoryCard) {
              const rect = memoryCard.getBoundingClientRect();
              const absoluteTop = rect.top + window.pageYOffset;
              const offset = window.innerHeight / 2 - rect.height / 2; // Center the card

              window.scrollTo({
                top: absoluteTop - offset,
                behavior: "smooth",
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

    if (highlightId) {
      setHighlightedStoryId(highlightId);
      // Clean up URL parameter
      urlParams.delete("highlight");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Auto-scroll to highlighted memory when stories load
  useEffect(() => {
    if (highlightedStoryId && storiesData) {
      const stories = (storiesData as any)?.stories || [];
      const highlightedStory = stories.find(
        (story: any) => story.id === highlightedStoryId,
      );

      if (highlightedStory) {
        // Wait for DOM to render, then scroll to the highlighted memory
        const scrollToHighlighted = () => {
          const memoryCard = document.querySelector(
            `[data-testid="memory-card-${highlightedStoryId}"]`,
          ) as HTMLElement;
          if (memoryCard) {
            // Use scrollIntoView with center alignment for better UX
            memoryCard.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });

            // Clear the highlighted story ID after a delay to remove the highlight effect
            setTimeout(() => {
              setHighlightedStoryId(null);
            }, 3000);
          } else {
            // If element not found, retry after a short delay (DOM still rendering)
            setTimeout(scrollToHighlighted, 100);
          }
        };

        // Use requestAnimationFrame for better DOM render detection
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToHighlighted);
        });
      }
    }
  }, [highlightedStoryId, storiesData]);

  const handleLogout = () => {
    logout();
  };

  const checkStoryLimitMutation = useMutation({
    mutationFn: async () => {
      // This will trigger the paywall if limit is reached
      const res = await apiRequest("POST", "/api/stories", {
        title: "Test",
        audioUrl: "test",
        storyYear: new Date().getFullYear(),
      });
      return res.json();
    },
    onError: (error: any) => {
      if (error.message.includes("Story limit reached")) {
        setShowPaywall(true);
      } else {
        modeSelection.openModal();
      }
    },
    onSuccess: () => {
      modeSelection.openModal();
    },
  });

  // Setup IntersectionObserver for scroll tracking - MUST be called before any conditional returns
  useEffect(() => {
    if (!user || !storiesData) return; // Only run when we have data

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const decadeId = entry.target.getAttribute("data-decade-id");
            if (decadeId) {
              setActiveDecade(decadeId);
            }
          }
        });
      },
      {
        rootMargin: "-100px 0px -60% 0px",
        threshold: 0,
      },
    );

    // Observe all decade sections
    Object.values(decadeRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(decadeRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [user, storiesData]);

  // Track decade header visibility for fade animation
  useEffect(() => {
    if (!user || !storiesData) return;

    const updateHeaderClasses = () => {
      const decadeBands = document.querySelectorAll('.hw-decade-band');
      decadeBands.forEach((band) => {
        const section = band.closest('section');
        if (!section) return;
        
        const decadeId = section.getAttribute('data-decade-id');
        const rect = section.getBoundingClientRect();
        const headerHeight = 87; // Height of the sticky header area
        
        // If the section is in the viewport and its top is near/at the sticky position
        const isSticky = rect.top <= headerHeight;
        const isActive = decadeId === activeDecade;
        
        // Apply classes based on state
        band.classList.remove('fading-out', 'current');
        if (isSticky && isActive) {
          band.classList.add('current');
        } else if (isSticky && !isActive) {
          band.classList.add('fading-out');
        }
      });
    };

    // Update on scroll
    window.addEventListener('scroll', updateHeaderClasses, { passive: true });
    // Update immediately
    updateHeaderClasses();

    return () => {
      window.removeEventListener('scroll', updateHeaderClasses);
    };
  }, [user, storiesData, activeDecade]);

  // ALL useMemo hooks must be called before any conditional returns to follow Rules of Hooks
  // ==================================================================================
  
  // Memoize expensive calculations to prevent re-processing on every render
  const allStories = useMemo(() => {
    return (storiesData as any)?.stories || [];
  }, [storiesData]);

  // Filter to only show stories marked for timeline
  const stories = useMemo(() => {
    return allStories.filter((s: any) => s.includeInTimeline === true);
  }, [allStories]);

  // Generate ghost prompts based on user's TOTAL story count (not just timeline)
  const ghostPrompts = useMemo(() => {
    if (!user) return [];
    if (shouldShowNewUserGhosts(allStories.length)) {
      // New user with 0 stories: show onboarding ghost prompts
      return generateNewUserGhostPrompts(user.birthYear);
    } else if (allStories.length < 3) {
      // Existing user with 1-2 stories: show contextual ghost prompts
      return generateGhostPrompts(user.birthYear);
    }
    return [];
  }, [allStories.length, user]);

  const storiesWithGhostPrompts = useMemo(() => {
    return mergeGhostPromptsWithStories(stories, ghostPrompts);
  }, [stories, ghostPrompts]);

  // Group all items (stories + ghost prompts) by decade
  const decadeGroups = useMemo(() => {
    if (!user) return [];
    return groupStoriesByDecade(storiesWithGhostPrompts, user.birthYear);
  }, [storiesWithGhostPrompts, user]);

  // Calculate which decades have content (memoized for performance)
  const cleanBirthYear = useMemo(() => user ? formatYear(user.birthYear) : '', [user]);
  const normalizedBirthYear = useMemo(() => user ? normalizeYear(user.birthYear) : 0, [user]);

  // Filter birth year stories using normalized values
  const birthYearStories = useMemo(() => {
    return stories.filter((s: any) => {
      const normalizedStoryYear = normalizeYear(s.storyYear);
      return normalizedStoryYear === normalizedBirthYear;
    });
  }, [stories, normalizedBirthYear]);

  // Filter pre-birth stories for "TOP" marker
  const prebirthStories = useMemo(() => {
    return stories.filter((s: any) => {
      const normalizedStoryYear = normalizeYear(s.storyYear);
      return normalizedStoryYear < normalizedBirthYear;
    });
  }, [stories, normalizedBirthYear]);

  const decadesWithContent = useMemo(() => {
    return [
      // Add TOP marker for pre-birth stories if they exist
      ...(prebirthStories.length > 0
        ? [{ id: "before-birth", label: "TOP", count: prebirthStories.length }]
        : []),
      { id: "birth-year", label: cleanBirthYear, count: birthYearStories.length },
      ...decadeGroups.map((group) => ({
        id: group.decade,
        label: group.decade.replace("s", ""),
        count: group.stories.length,
      })),
    ].filter((d) => d.count > 0 || d.id === "birth-year"); // Always show birth year
  }, [prebirthStories, cleanBirthYear, birthYearStories, decadeGroups]);

  // Memoize the expensive timeline items calculation
  const { allTimelineItems, decadeEntries } = useMemo(() => {
    if (!user) return { allTimelineItems: [], decadeEntries: [] };
    
    const items = [];
    const currentYear = new Date().getFullYear();
    const currentDecade = Math.floor(currentYear / 10) * 10;

    // Pre-birth stories section - "Before I Was Born"
    if (prebirthStories.length > 0) {
      const earliestPrebirthYear = Math.min(
        ...prebirthStories.map((s: any) => normalizeYear(s.storyYear)),
      );
      items.push({
        type: "decade",
        id: "before-birth",
        year: earliestPrebirthYear,
        title: "Before I Was Born",
        subtitle: "Family History • Stories of those who came before",
        stories: prebirthStories.sort((a: any, b: any) => {
          return normalizeYear(a.storyYear) - normalizeYear(b.storyYear);
        }),
      });
    }

    // Birth year section (always show)
    items.push({
      type: "decade",
      id: "birth-year",
      year: normalizedBirthYear || user.birthYear,
      title: "The Year I was Born",
      subtitle: `${normalizedBirthYear || user.birthYear} • The Beginning`,
      stories: birthYearStories,
    });

    // Add decade groups in chronological order (filtering out pre-birth stories)
    decadeGroups.forEach((group) => {
      // Filter out pre-birth stories from this decade - they're in "Before I Was Born"
      const storiesAfterOrDuringBirth = group.stories.filter((s: any) => {
        const storyYear = normalizeYear(s.storyYear);
        return storyYear >= normalizedBirthYear;
      });

      // Only show this decade if it has stories after/during birth
      if (storiesAfterOrDuringBirth.length > 0) {
        const groupDecadeNum = parseInt(group.decade.replace("s", ""));
        const isCurrentDecade = groupDecadeNum === currentDecade;

        // If this decade contains the birth year, sort it AFTER the birth year section
        const birthDecade = Math.floor((normalizedBirthYear || user.birthYear) / 10) * 10;
        let sortYear = groupDecadeNum; // Default to decade start

        if (groupDecadeNum === birthDecade) {
          // This decade contains the birth year, filter to only stories AFTER birth year
          const storiesAfterBirth = storiesAfterOrDuringBirth.filter((s: any) => {
            const storyYear = normalizeYear(s.storyYear);
            return storyYear > normalizedBirthYear;
          });

          if (storiesAfterBirth.length > 0) {
            // Use the earliest story AFTER birth year for sorting
            const earliestAfterBirth = Math.min(
              ...storiesAfterBirth.map((s: any) => normalizeYear(s.storyYear)),
            );
            sortYear = earliestAfterBirth;
          } else {
            // No stories after birth in this decade - sort right after birth year
            sortYear = normalizedBirthYear + 1;
          }
        }

        items.push({
          type: "decade",
          id: group.decade,
          year: sortYear, // Use earliest story year for birth decade, decade start for others
          title: group.displayName,
          subtitle: `${group.ageRange} • Life Chapter${isCurrentDecade ? " • Current" : ""}`,
          stories: storiesAfterOrDuringBirth,
          storyCount: storiesAfterOrDuringBirth.length,
        });
      }
    });

    // Sort by year
    items.sort((a, b) => a.year - b.year);

    // Build decade entries for navigation
    const entries: DecadeEntry[] = items.map((item) => ({
      id: item.id,
      label:
        item.id === "before-birth"
          ? "TOP"
          : item.id === "birth-year"
            ? formatYear(user.birthYear)
            : item.id.replace("decade-", "").replace("s", ""),
      count: item.stories?.length || 0,
    }));

    return { allTimelineItems: items, decadeEntries: entries };
  }, [stories, decadeGroups, prebirthStories, birthYearStories, normalizedBirthYear, user]);

  // ==================================================================================
  // End of all useMemo hooks - conditional returns can now safely follow
  // ==================================================================================

  // Handle redirect to login page in useEffect (not during render)
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  // Check if auth is still loading - don't redirect until we know auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading while redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading state while fetching stories data
  if (isLoadingStories && !storiesData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: isDark ? '#1c1c1d' : '#FFF8F3' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: isDark ? '#b0b3b8' : '#F59E0B' }}></div>
        <p className="text-lg" style={{ color: isDark ? '#b0b3b8' : '#6B4E42' }}>Loading your timeline...</p>
      </div>
    );
  }

  const handleRecordPrompt = () => {
    // Check if user has reached story limit
    if (!user.isPaid && user.storyCount >= 3) {
      setShowPaywall(true);
    } else {
      modeSelection.openModal();
    }
  };

  const handleSubscribe = () => {
    router.push("/subscribe");
  };

  const handleGhostPromptClick = (prompt: GhostPrompt) => {
    // Check if user has reached story limit
    if (!user.isPaid && user.storyCount >= 3) {
      setShowPaywall(true);
    } else {
      // Open mode selection modal (user will enter title in wizard)
      // TODO: Consider storing ghost prompt data in NavCache for pre-filling
      modeSelection.openModal();
    }
  };

  const handleDecadeClick = (decadeId: string) => {
    // Scroll to the decade section
    const element = decadeRefs.current[decadeId];
    if (element) {
      const headerOffset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Generate share URL for this user's timeline
  const shareUrl = `${window.location.origin}/share/${user.id}`;

  // Get current color scheme
  const scheme = colorSchemes[currentColorScheme];

  // Apply styles directly to ensure they work
  const pageStyle = isDark
    ? { backgroundColor: '#1c1c1d', color: '#b0b3b8' }
    : {
        backgroundColor:
          currentColorScheme === "original"
            ? "#FFF8F3"
            : currentColorScheme === "white"
              ? "#FFFFFF"
              : currentColorScheme === "inverted"
                ? "#FFFFFF"
                : currentColorScheme === "soft"
                  ? "#F9FAFB"
                  : currentColorScheme === "cool"
                    ? "#F8FAFC"
                    : currentColorScheme === "dark"
                      ? "#0F0F0F"
                      : currentColorScheme === "retro"
                        ? "#F5E6D3"
                        : "#FFF8F3",
        color:
          currentColorScheme === "dark"
            ? "#E5E5E5"
            : currentColorScheme === "retro"
              ? "#6B4E42"
              : undefined,
      };

  return (
    <div className={`timeline-page min-h-screen`} style={pageStyle}>
      {/* Header Navigation */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-sm p-3 ${isDark ? '' : (currentColorScheme === "dark" ? "border-b border-gray-800" : "border-b border-gray-100")}`}
        style={{
          backgroundColor: isDark
            ? '#252728'
            : currentColorScheme === "original"
              ? "rgba(255, 255, 255, 0.95)"
              : currentColorScheme === "inverted"
                ? "rgba(255, 248, 243, 0.95)"
                : currentColorScheme === "soft"
                  ? "rgba(249, 250, 251, 0.95)"
                  : currentColorScheme === "cool"
                    ? "rgba(248, 250, 252, 0.95)"
                    : currentColorScheme === "dark"
                      ? "rgba(15, 15, 15, 0.95)"
                      : currentColorScheme === "retro"
                        ? "rgba(245, 230, 211, 0.95)"
                        : "rgba(255, 255, 255, 0.95)",
          borderBottom: `1px solid ${isDark ? '#3b3d3f' : (currentColorScheme === 'dark' ? '#1f2937' : '#e5e7eb')}`,
          color: isDark ? '#b0b3b8' : (currentColorScheme === 'retro' ? '#6B4E42' : undefined),
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8" style={{ color: isDark ? '#b0b3b8' : '#1f0f08' }} />
              <h1 className="text-2xl font-bold" style={{ color: isDark ? '#b0b3b8' : undefined }}>Timeline</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Content with Vertical Timeline Design */}
      <main className="max-w-6xl mx-auto px-3 py-6 pb-20 md:p-6 md:pb-6 md:pr-20">
        {/* Paywall Prompt for Story 3 (if applicable) */}
        {user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active" && (
          <div className="mb-8">
            <PaywallPromptCard
              onSubscribe={() => {
                // TODO: Integrate with Stripe checkout
                toast({
                  title: "Coming soon!",
                  description: "Stripe integration will be added soon.",
                });
              }}
              onDismiss={() => {
                // Dismissed - will be hidden via localStorage
              }}
            />
          </div>
        )}

        {/* AI-Generated Next Story Prompt (show if not at paywall) */}
        {!(user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active") && (
          <div className="mb-8">
            <NextStoryCard
              onRecordClick={(promptId, promptText) => {
                // Open mode selection modal (user will enter title in wizard)
                // TODO: Consider storing prompt data in NavCache for pre-filling
                modeSelection.openModal();
                // We'll pass the promptId through when saving the story
                if (promptId) {
                  sessionStorage.setItem("activePromptId", promptId);
                }
              }}
            />
          </div>
        )}

        <div className="hw-layout">
          <div className="hw-spine" style={isDark ? { backgroundColor: '#ffffff', opacity: 1 } : undefined}>
            {/* All stories sorted chronologically */}
            {allTimelineItems.map((item, index) => (
              <section
                key={item.id}
                id={item.id}
                ref={(el) => (decadeRefs.current[item.id] = el)}
                data-decade-id={item.id}
                className="hw-decade"
                style={isDark ? { borderColor: '#3b3d3f' } : undefined}
              >
                {/* Decade Band - Sticky Header */}
                <div
                  className="hw-decade-band"
                  style={
                    isDark
                      ? {
                          backgroundColor: '#252728',
                          borderBottom: '1px solid #3b3d3f',
                          color: '#b0b3b8',
                        }
                      : undefined
                  }
                >
                  <div className="title" style={isDark ? { color: '#b0b3b8' } : undefined}>{item.title}</div>
                  <div className="meta" style={isDark ? { color: '#8a8d92' } : undefined}>{item.subtitle}</div>
                </div>

                {/* Spacing before first card */}
                <div className="hw-decade-start"></div>

                {/* Stories Grid */}
                <div className="hw-grid">
                  {/* Existing Stories and Ghost Prompts */}
                  {item.stories.map((storyOrPrompt: any) => {
                    // Check if this is a ghost prompt
                    if (storyOrPrompt.isGhost) {
                      return (
                        <GhostPromptCard
                          key={storyOrPrompt.id}
                          prompt={storyOrPrompt}
                          onClick={() =>
                            handleGhostPromptClick(storyOrPrompt)
                          }
                        />
                      );
                    }
                    // Regular story
                    return (
                      <MemoryCard
                        key={storyOrPrompt.id}
                        story={storyOrPrompt}
                        isHighlighted={
                          storyOrPrompt.id === highlightedStoryId
                        }
                        isReturnHighlight={
                          storyOrPrompt.id === returnHighlightId
                        }
                        colorScheme={currentColorScheme}
                        isDarkTheme={isDark}
                        birthYear={user.birthYear}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
            <DecadeNav entries={decadeEntries} />
          </div>
        </div>
      </main>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />

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
    </div>
  );
}
