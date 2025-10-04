"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { groupStoriesByDecade, type Story } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";
import { useRecordModal } from "@/hooks/use-record-modal";
import RecordModal from "@/components/RecordModal";
import { generateGhostPrompts, mergeGhostPromptsWithStories, type GhostPrompt } from "@/lib/ghostPrompts";
import { GhostPromptCard } from "@/components/GhostPromptCard";
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
import { useState, useEffect, useRef } from "react";
import { normalizeYear, formatYear } from "@/lib/utils";
import StoryTraits from "@/components/StoryTraits";
import { getTopTraits } from "@/utils/getTopTraits";
import { Palette } from "lucide-react";

const logoUrl = "/HW_logo_mic_clean.png";

// Color scheme options for testing
type ColorScheme = 'original' | 'white' | 'inverted' | 'soft' | 'cool' | 'dark';

const colorSchemes = {
  original: {
    name: 'Original',
    page: 'bg-heritage-warm-bg',
    card: 'bg-white',
    header: 'bg-white/95',
    text: 'text-foreground',
    timelineLine: 'from-heritage-orange to-heritage-coral'
  },
  white: {
    name: 'Clean White',
    page: 'bg-white',
    card: 'bg-white border border-gray-200',
    header: 'bg-white/95',
    text: 'text-foreground',
    timelineLine: 'from-gray-300 to-gray-400'
  },
  inverted: {
    name: 'Inverted',
    page: 'bg-white',
    card: 'bg-heritage-warm-bg',
    header: 'bg-heritage-warm-bg/95',
    text: 'text-foreground',
    timelineLine: 'from-heritage-orange to-heritage-coral'
  },
  soft: {
    name: 'Soft Gray',
    page: 'bg-gray-50',
    card: 'bg-white',
    header: 'bg-gray-50/95',
    text: 'text-foreground',
    timelineLine: 'from-gray-400 to-gray-500'
  },
  cool: {
    name: 'Cool Blue',
    page: 'bg-slate-50',
    card: 'bg-white',
    header: 'bg-slate-50/95',
    text: 'text-foreground',
    timelineLine: 'from-blue-400 to-blue-500'
  },
  dark: {
    name: 'Dark Mode',
    page: 'bg-gray-900',
    card: 'bg-gray-800 text-white',
    header: 'bg-gray-900/95',
    text: 'text-white',
    timelineLine: 'from-gray-600 to-gray-700'
  }
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
  colorScheme = 'original',
}: {
  story: Story;
  isHighlighted?: boolean;
  isReturnHighlight?: boolean;
  colorScheme?: ColorScheme;
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
  const progressBarRef = useRef<HTMLDivElement>(null);

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
    const isBirthYearStory = story.title?.toLowerCase().includes('born') || story.title?.toLowerCase().includes('birth');
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
      colorScheme === 'inverted' ? '#FFF8F3' :
      colorScheme === 'dark' ? '#1A1A1A' : // Much darker card background
      '#FFFFFF',
    color: colorScheme === 'dark' ? '#E5E5E5' : undefined,
    border: colorScheme === 'white' || colorScheme === 'soft' || colorScheme === 'cool' ? '1px solid #E5E7EB' :
            colorScheme === 'dark' ? '1px solid #2A2A2A' : undefined
  };

  // Render compact format for memories without photos
  if (!displayPhoto || !displayPhoto.url) {
    return (
      <div
        style={cardStyle}
        className={`memory-card cursor-pointer transition-all duration-200 rounded-lg shadow-lg shadow-heritage-orange/10 hover:shadow-xl hover:shadow-heritage-orange/15 p-4 ${
          isHighlighted
            ? "ring-2 ring-heritage-orange shadow-xl shadow-heritage-orange/20 scale-[1.01]"
            : isReturnHighlight
              ? "return-highlight-animation"
              : ""
        }`}
        onClick={handleCardClick}
        data-testid={`memory-card-${story.id}`}
      >
        <div className="flex items-center gap-3">
          {/* Audio play button */}
          {story.audioUrl && (
            <button
              onClick={handlePlayAudio}
              className={`w-10 h-10 bg-white rounded-full shadow-md shadow-heritage-orange/10 flex items-center justify-center transition-all flex-shrink-0 ${
                hasError ? "bg-red-100 hover:bg-red-200" : "hover:bg-heritage-orange/10"
              } ${isLoading ? "animate-pulse" : ""}`}
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
                <Loader2 className="w-4 h-4 text-heritage-orange animate-spin" />
              ) : hasError ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 text-heritage-orange" />
              ) : (
                <Play className="w-4 h-4 text-heritage-orange ml-0.5" />
              )}
            </button>
          )}

          {/* Title and year */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold text-gray-900 line-clamp-1"
              data-testid={`story-title-${story.id}`}
            >
              {story.title}
            </h3>
            <p className="text-base text-gray-500">
              {story.storyDate
                ? new Date(story.storyDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })
                : formatYear(story.storyYear)}
              {story.lifeAge !== null && story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal format with photo
  return (
    <div
      style={cardStyle}
      className={`memory-card cursor-pointer transition-all duration-200 rounded-lg shadow-lg shadow-heritage-orange/10 hover:shadow-xl hover:shadow-heritage-orange/15 p-4 ${
        isHighlighted
          ? "ring-2 ring-heritage-orange shadow-xl shadow-heritage-orange/20 scale-[1.01]"
          : isReturnHighlight
            ? "return-highlight-animation"
            : ""
      }`}
      onClick={handleCardClick}
      data-testid={`memory-card-${story.id}`}
    >
      {/* Image container with audio overlay */}
      <div className="retro-tv relative aspect-[3/2] mb-3 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={displayPhoto.url}
          alt={story.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="retro-tv__screen object-cover"
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
            className={`absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center transition-all ${
              hasError ? "bg-red-100 hover:bg-red-200" : "hover:bg-white"
            } ${isLoading ? "animate-pulse" : ""}`}
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
              <Loader2 className="w-4 h-4 text-[#D4853A] animate-spin" />
            ) : hasError ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 text-[#D4853A]" />
            ) : (
              <Play className="w-4 h-4 text-[#D4853A] ml-0.5" />
            )}
          </button>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-lg font-semibold text-gray-900 line-clamp-2 mb-0.5"
        data-testid={`story-title-${story.id}`}
      >
        {story.title}
      </h3>

      {/* Metadata */}
      <p className="text-base text-gray-500 mb-2">
        {story.storyDate
          ? new Date(story.storyDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
            })
          : formatYear(story.storyYear)}
        {story.lifeAge !== null && story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
      </p>

      {/* Trait signal */}
      {top.length ? <StoryTraits traits={top} /> : null}
    </div>
  );
}

export default function Timeline() {
  const { user, session, logout, isLoading } = useAuth();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeDecade, setActiveDecade] = useState<string | null>(null);
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(
    null,
  );
  const [returnHighlightId, setReturnHighlightId] = useState<string | null>(
    null,
  );
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [currentColorScheme, setCurrentColorScheme] = useState<ColorScheme>('original');
  const [showColorPalette, setShowColorPalette] = useState(false);
  const { toast } = useToast();
  const recordModal = useRecordModal();
  const decadeRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const { data: storiesData, refetch: refetchStories } = useQuery({
    queryKey: ["/api/stories"],
    enabled: !!user && !!session,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

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
        switch(e.key) {
          case '1':
            e.preventDefault();
            setCurrentColorScheme('original');
            toast({ title: "Color scheme: Original" });
            break;
          case '2':
            e.preventDefault();
            setCurrentColorScheme('white');
            toast({ title: "Color scheme: Clean White" });
            break;
          case '3':
            e.preventDefault();
            setCurrentColorScheme('inverted');
            toast({ title: "Color scheme: Inverted" });
            break;
          case '4':
            e.preventDefault();
            setCurrentColorScheme('soft');
            toast({ title: "Color scheme: Soft Gray" });
            break;
          case '5':
            e.preventDefault();
            setCurrentColorScheme('cool');
            toast({ title: "Color scheme: Cool Blue" });
            break;
          case '6':
            e.preventDefault();
            setCurrentColorScheme('dark');
            toast({ title: "Color scheme: Dark Mode" });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
        recordModal.openModal();
      }
    },
    onSuccess: () => {
      recordModal.openModal();
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

  // Check if auth is still loading - don't redirect until we know auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Only redirect to login if auth has finished loading and there's no user
  if (!isLoading && !user) {
    router.push("/auth/login");
    return null;
  }

  const stories = (storiesData as any)?.stories || [];

  // Generate ghost prompts if user has fewer than 3 stories
  const ghostPrompts = stories.length < 3 ? generateGhostPrompts(user.birthYear) : [];
  const storiesWithGhostPrompts = mergeGhostPromptsWithStories(stories, ghostPrompts);

  // Group all items (stories + ghost prompts) by decade
  const decadeGroups = groupStoriesByDecade(storiesWithGhostPrompts, user.birthYear);

  const handleRecordPrompt = () => {
    // Check if user has reached story limit
    if (!user.isPaid && user.storyCount >= 3) {
      setShowPaywall(true);
    } else {
      recordModal.openModal();
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
      // Open record modal with pre-filled data from ghost prompt
      recordModal.openModal({
        title: prompt.title,
        prompt: prompt.prompt,
        year: prompt.year
      });
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

  // Calculate which decades have content
  // Use centralized year normalization
  const cleanBirthYear = formatYear(user.birthYear);
  const normalizedBirthYear = normalizeYear(user.birthYear);

  // Filter birth year stories using normalized values
  const birthYearStories = stories.filter((s: any) => {
    const normalizedStoryYear = normalizeYear(s.storyYear);
    return normalizedStoryYear === normalizedBirthYear;
  });

  const decadesWithContent = [
    { id: "birth-year", label: cleanBirthYear, count: birthYearStories.length },
    ...decadeGroups.map((group) => ({
      id: group.decade,
      label: group.decade.replace("s", ""),
      count: group.stories.length,
    })),
  ].filter((d) => d.count > 0 || d.id === "birth-year"); // Always show birth year

  // Generate share URL for this user's timeline
  const shareUrl = `${window.location.origin}/share/${user.id}`;

  // Get current color scheme
  const scheme = colorSchemes[currentColorScheme];

  // Apply styles directly to ensure they work
  const pageStyle = {
    backgroundColor:
      currentColorScheme === 'original' ? '#FFF8F3' :
      currentColorScheme === 'white' ? '#FFFFFF' :
      currentColorScheme === 'inverted' ? '#FFFFFF' :
      currentColorScheme === 'soft' ? '#F9FAFB' :
      currentColorScheme === 'cool' ? '#F8FAFC' :
      currentColorScheme === 'dark' ? '#0F0F0F' : '#FFF8F3', // Much darker background
    color: currentColorScheme === 'dark' ? '#E5E5E5' : undefined
  };

  return (
    <div className={`timeline-page min-h-screen md:pl-20`} style={pageStyle}>
      {/* Header Navigation */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-sm p-3 ${
          currentColorScheme === 'dark' ? 'border-b border-gray-800' : 'border-b border-gray-100'
        }`}
        style={{
          backgroundColor:
            currentColorScheme === 'original' ? 'rgba(255, 255, 255, 0.95)' :
            currentColorScheme === 'inverted' ? 'rgba(255, 248, 243, 0.95)' :
            currentColorScheme === 'soft' ? 'rgba(249, 250, 251, 0.95)' :
            currentColorScheme === 'cool' ? 'rgba(248, 250, 252, 0.95)' :
            currentColorScheme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : // Much darker header
            'rgba(255, 255, 255, 0.95)',
          color: currentColorScheme === 'dark' ? '#E5E5E5' : undefined
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            {/* Left side: Logo and Title - more compact */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                className="w-16 h-16 sm:w-20 sm:h-20 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 -ml-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-coral)] bg-transparent border-none p-0"
                onClick={() => router.push("/")}
                aria-label="Home"
                data-testid="button-home-logo"
              >
                <Image
                  src={logoUrl}
                  alt="HeritageWhisper Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </button>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-lg font-bold text-foreground truncate">
                  My Story Timeline
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {user.name}'s Life Journey
                </p>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Decade Bubble Navigation - Desktop */}
      <nav
        className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 flex-col gap-3 z-40"
        aria-label="Decade navigation"
      >
        {decadesWithContent.map((decade) => (
          <button
            key={decade.id}
            onClick={() => handleDecadeClick(decade.id)}
            className={`
              w-14 h-14 rounded-full flex flex-col items-center justify-center
              transition-all duration-300 transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heritage-coral
              ${
                activeDecade === decade.id
                  ? "bg-heritage-coral text-white shadow-lg shadow-heritage-coral/30"
                  : "bg-white text-gray-600 shadow-md shadow-heritage-orange/10 hover:shadow-lg hover:shadow-heritage-coral/20 hover:bg-heritage-coral hover:text-white border border-heritage-coral/10"
              }
            `}
            aria-label={`Go to ${decade.label}, ${decade.count} stories`}
            data-testid={`decade-bubble-${decade.id}`}
          >
            <span className="text-xs font-semibold">{decade.label}</span>
            <span className="text-[10px]">({decade.count})</span>
          </button>
        ))}
      </nav>

      {/* Mobile Floating Action Button with Decade Bubbles */}
      <div className="md:hidden">
        {/* Backdrop - only visible when expanded */}
        {isFabExpanded && (
          <div
            className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
            onClick={() => setIsFabExpanded(false)}
            aria-hidden="true"
          />
        )}

        {/* FAB and Decade Bubbles Container */}
        <div className="fixed bottom-24 right-4 z-50">
          {/* Decade Bubbles - positioned above FAB */}
          <div
            className={`
              absolute bottom-16 right-0 flex flex-col gap-3 items-end
              transition-all duration-300 origin-bottom-right
              ${
                isFabExpanded
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-75 translate-y-4 pointer-events-none"
              }
            `}
          >
            {decadesWithContent.map((decade, index) => (
              <button
                key={decade.id}
                onClick={() => {
                  handleDecadeClick(decade.id);
                  setIsFabExpanded(false);
                }}
                className={`
                  w-14 h-14 rounded-full flex flex-col items-center justify-center
                  bg-white shadow-lg shadow-heritage-orange/15 transform transition-all duration-300 hover:scale-110
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heritage-coral border border-heritage-coral/10
                  ${
                    activeDecade === decade.id
                      ? "ring-2 ring-heritage-coral ring-offset-2 text-heritage-coral font-bold"
                      : "text-gray-700 hover:bg-heritage-orange/5 hover:text-heritage-coral"
                  }
                `}
                style={{
                  transitionDelay: isFabExpanded ? `${index * 50}ms` : "0ms",
                }}
                aria-label={`Go to ${decade.label}, ${decade.count} stories`}
                data-testid={`mobile-decade-bubble-${decade.id}`}
              >
                <span className="text-xs font-semibold">{decade.label}</span>
                <span className="text-[10px]">({decade.count})</span>
              </button>
            ))}
          </div>

          {/* Main FAB Button */}
          <button
            onClick={() => setIsFabExpanded(!isFabExpanded)}
            className={`
              w-14 h-14 rounded-full bg-heritage-coral text-white shadow-lg shadow-heritage-coral/30
              flex items-center justify-center transition-all duration-300 hover:scale-110
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-heritage-coral
              ${isFabExpanded ? "rotate-45" : "rotate-0"}
            `}
            aria-label={
              isFabExpanded ? "Close decade menu" : "Open decade menu"
            }
            aria-expanded={isFabExpanded}
            data-testid="fab-decade-menu"
          >
            {isFabExpanded ? (
              <X className="w-6 h-6" />
            ) : (
              <Calendar className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Timeline Content with Vertical Timeline Design */}
      <main className="max-w-6xl mx-auto px-3 py-6 pb-20 md:p-6 md:pb-6 md:pr-20">
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div
            className="absolute left-2 md:left-6 top-0 bottom-0 w-1"
            style={{
              background:
                currentColorScheme === 'original' || currentColorScheme === 'inverted' ? 'linear-gradient(to bottom, #D4853A, #F08466)' :
                currentColorScheme === 'white' ? 'linear-gradient(to bottom, #D1D5DB, #9CA3AF)' :
                currentColorScheme === 'soft' ? 'linear-gradient(to bottom, #9CA3AF, #6B7280)' :
                currentColorScheme === 'cool' ? 'linear-gradient(to bottom, #60A5FA, #3B82F6)' :
                currentColorScheme === 'dark' ? 'linear-gradient(to bottom, #3A3A3A, #2A2A2A)' : // Darker timeline line
                'linear-gradient(to bottom, #D4853A, #F08466)'
            }}
          ></div>

          <div className="space-y-12 relative">
            {/* All stories sorted chronologically */}
            {(() => {
              // Create chronological timeline
              const allTimelineItems = [];

              // Birth year section
              // Use normalized birth year to handle any corrupted values
              const normalizedBirthYear = normalizeYear(user.birthYear);
              const birthYearStories = stories.filter((story: any) => {
                const normalizedStoryYear = normalizeYear(story.storyYear);
                return normalizedStoryYear === normalizedBirthYear;
              });
              if (birthYearStories.length > 0 || true) {
                // Always show birth year
                allTimelineItems.push({
                  type: "decade",
                  id: "birth-year",
                  year: normalizedBirthYear || user.birthYear,
                  title: "The Year I was Born",
                  subtitle: `${normalizedBirthYear || user.birthYear} • The Beginning`,
                  stories: birthYearStories,
                });
              }

              // Add decade groups in chronological order
              decadeGroups.forEach((group) => {
                if (group.stories.length > 0) {
                  const currentYear = new Date().getFullYear();
                  const currentDecade = Math.floor(currentYear / 10) * 10;
                  const groupDecadeNum = parseInt(
                    group.decade.replace("s", ""),
                  );
                  const isCurrentDecade = groupDecadeNum === currentDecade;

                  // Find the earliest story year in this decade for proper chronological sorting
                  const earliestStoryYear = Math.min(
                    ...group.stories.map((s: any) => normalizeYear(s.storyYear))
                  );

                  allTimelineItems.push({
                    type: "decade",
                    id: group.decade,
                    year: earliestStoryYear, // Use earliest story year instead of decade start
                    title: group.displayName,
                    subtitle: `${group.ageRange} • Life Chapter${isCurrentDecade ? " • Current" : ""}`,
                    stories: group.stories,
                    storyCount: group.stories.length,
                  });
                }
              });

              // Sort by year
              allTimelineItems.sort((a, b) => a.year - b.year);

              return allTimelineItems.map((item, index) => (
                <section
                  key={item.id}
                  ref={(el) => (decadeRefs.current[item.id] = el)}
                  data-decade-id={item.id}
                  className="timeline-section relative"
                >
                  {/* Timeline Node */}
                  <div className="absolute left-[4px] md:left-[20px] w-3 h-3 bg-heritage-coral rounded-full ring-2 ring-white shadow-md z-10"></div>

                  {/* Content */}
                  <div className="ml-8 md:ml-14">
                    {/* Decade Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-gray-400" />
                        <h2 className="text-3xl font-semibold text-gray-900">
                          {item.title}
                          {item.stories && item.stories.length > 0 && (
                            <span className="ml-2 text-xl font-normal text-gray-500">
                              ({item.stories.length}{" "}
                              {item.stories.length === 1 ? "story" : "stories"})
                            </span>
                          )}
                        </h2>
                      </div>
                      <p className="text-base text-muted-foreground ml-9">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Stories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Existing Stories and Ghost Prompts */}
                      {item.stories.map((storyOrPrompt: any) => {
                        // Check if this is a ghost prompt
                        if (storyOrPrompt.isGhost) {
                          return (
                            <GhostPromptCard
                              key={storyOrPrompt.id}
                              prompt={storyOrPrompt}
                              onClick={() => handleGhostPromptClick(storyOrPrompt)}
                            />
                          );
                        }
                        // Regular story
                        return (
                          <MemoryCard
                            key={storyOrPrompt.id}
                            story={storyOrPrompt}
                            isHighlighted={storyOrPrompt.id === highlightedStoryId}
                            isReturnHighlight={storyOrPrompt.id === returnHighlightId}
                            colorScheme={currentColorScheme}
                          />
                        );
                      })}
                    </div>
                  </div>
                </section>
              ));
            })()}
          </div>
        </div>
      </main>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />

      {/* Record Modal */}
      <RecordModal
        isOpen={recordModal.isOpen}
        onClose={recordModal.closeModal}
        onSave={recordModal.handleSave}
        initialTitle={recordModal.initialData?.title}
        initialPrompt={recordModal.initialData?.prompt}
        initialYear={recordModal.initialData?.year}
      />

      {/* Color Scheme Selector - Floating Button */}
      <div className="fixed bottom-20 md:bottom-4 left-4 z-50">
        {/* Color Options - shown when expanded */}
        {showColorPalette && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowColorPalette(false)}
            />
            {/* Color Palette */}
            <div className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl p-4 z-50 space-y-2 min-w-[200px]">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Choose Color Scheme:</h3>
              {Object.entries(colorSchemes).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentColorScheme(key as ColorScheme);
                    setShowColorPalette(false);
                    toast({ title: `Color scheme: ${value.name}` });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-all ${
                    currentColorScheme === key
                      ? 'bg-heritage-coral text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{value.name}</span>
                    {currentColorScheme === key && (
                      <span className="text-xs">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {key === 'original' && 'Cmd/Ctrl + 1'}
                    {key === 'white' && 'Cmd/Ctrl + 2'}
                    {key === 'inverted' && 'Cmd/Ctrl + 3'}
                    {key === 'soft' && 'Cmd/Ctrl + 4'}
                    {key === 'cool' && 'Cmd/Ctrl + 5'}
                    {key === 'dark' && 'Cmd/Ctrl + 6'}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Main Palette Button */}
        <button
          onClick={() => setShowColorPalette(!showColorPalette)}
          className={`w-14 h-14 rounded-full ${
            currentColorScheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'
          } shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center`}
          aria-label="Change color scheme"
          title="Change color scheme (Cmd/Ctrl + 1-6)"
        >
          <Palette className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
