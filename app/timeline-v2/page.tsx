"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { groupStoriesByDecade, type Story } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";
import { useRecordModal } from "@/hooks/use-record-modal";
import RecordModal from "@/components/RecordModal";
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
  Clock,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { normalizeYear, formatYear } from "@/lib/utils";
import StoryTraits from "@/components/StoryTraits";
import { getTopTraits } from "@/utils/getTopTraits";

const logoUrl = "/HW_logo_mic_clean.png";

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
}

function CenteredMemoryCard({ story, position, index }: CenteredMemoryCardProps) {
  const router = useRouter();
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
        threshold: 0.2,
        rootMargin: "300px 0px 300px 0px", // Load images 300px before they enter viewport
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
    const navigationContext = {
      memoryId: story.id,
      scrollPosition: window.scrollY,
      timestamp: Date.now(),
      returnPath: "/timeline-v2",
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
  };

  // Render function for card content to avoid component definition issues
  const renderCardContent = () => {
    console.log("[Timeline-v2] Rendering card for:", story.title, "Photo URL:", displayPhoto?.url);
    
    // If there's a photo, render without white container
    if (displayPhoto?.url) {
      return (
        <div
          className="cursor-pointer"
          onClick={handleCardClick}
        >
          <div className={`relative rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="relative w-full h-48 lg:h-64">
              <Image
                src={displayPhoto.url}
                alt={story.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                className="object-cover transition-transform duration-500 hover:scale-105"
                loading={index < 4 ? "eager" : "lazy"}
                priority={index < 2}
                style={
                  displayPhoto.transform
                    ? {
                        transform: `scale(${displayPhoto.transform.zoom}) translate(${displayPhoto.transform.position.x / displayPhoto.transform.zoom}px, ${displayPhoto.transform.position.y / displayPhoto.transform.zoom}px)`,
                        transformOrigin: "center center",
                      }
                    : undefined
                }
                onError={(e) => console.error("[Timeline-v2] Image failed to load:", displayPhoto.url)}
                onLoad={() => console.log("[Timeline-v2] Image loaded successfully:", displayPhoto.url)}
              />
            </div>
            
            {/* Memory Footer Overlay with Play Button */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 lg:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-1 truncate pr-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm text-white/90">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                      {story.storyDate
                        ? new Date(story.storyDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })
                        : formatYear(story.storyYear)}
                    </span>
                    {story.lifeAge !== null && story.lifeAge !== undefined && (
                      <>
                        <span className="text-white/70">•</span>
                        <span>
                          {story.lifeAge > 0 && `Age ${story.lifeAge}`}
                          {story.lifeAge === 0 && `Birth`}
                          {story.lifeAge < 0 && `Before birth`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Play Button Overlaid on Photo */}
                {story.audioUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio(e);
                    }}
                    className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 lg:w-5 h-4 lg:h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-4 lg:w-5 h-4 lg:h-5" />
                    ) : (
                      <Play className="w-4 lg:w-5 h-4 lg:h-5 ml-0.5" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Progress Bar (shown when playing) */}
              {story.audioUrl && (isPlaying || progress > 0) && (
                <div className="mt-2">
                  <div
                    ref={progressBarRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProgressBarClick(e);
                    }}
                    className="h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                  >
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/80 mt-1">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Traits below photo */}
          {story.traits && story.traits.length > 0 && (
            <div className="mt-3">
              <StoryTraits traits={story.traits} />
            </div>
          )}
        </div>
      );
    }
    
    // No photo - render white card (existing design)
    return (
      <div
        className="bg-white/90 backdrop-blur border border-gray-200/60 rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="mb-6">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
            {story.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {story.storyDate
                ? new Date(story.storyDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })
                : formatYear(story.storyYear)}
            </span>
            {story.lifeAge !== null && story.lifeAge !== undefined && (
              <>
                <span className="text-gray-400">•</span>
                <span>
                  {story.lifeAge > 0 && `Age ${story.lifeAge}`}
                  {story.lifeAge === 0 && `Birth`}
                  {story.lifeAge < 0 && `Before birth`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Audio Player */}
        {story.audioUrl && (
          <div className="mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio(e);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 lg:w-5 h-4 lg:h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 lg:w-5 h-4 lg:h-5" />
              ) : (
                <Play className="w-4 lg:w-5 h-4 lg:h-5 ml-0.5" />
              )}
              <span className="text-sm font-medium">
                {isPlaying ? "Pause" : "Listen"}
              </span>
            </button>

            {/* Progress Bar */}
            {(isPlaying || progress > 0) && (
              <div className="mt-3">
                <div
                  ref={progressBarRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressBarClick(e);
                  }}
                  className="h-1.5 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
                >
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traits */}
        {story.traits && story.traits.length > 0 && (
          <StoryTraits traits={story.traits} />
        )}
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`timeline-step flex flex-col lg:flex-row items-center gap-6 lg:gap-4 transition-all duration-800 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{
        transitionDelay: `${index * 150}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Left side content (for left-positioned cards) - Desktop only */}
      <div className={`flex-1 flex ${position === "left" ? "justify-end lg:pr-6" : ""} hidden lg:flex`}>
        {position === "left" && (
          <div className="max-w-md w-full">
            {renderCardContent()}
          </div>
        )}
      </div>

      {/* Center date bubble */}
      <div
        className={`z-20 flex-shrink-0 timeline-dot transition-all duration-800 ${
          isVisible ? "opacity-100 scale-100" : "opacity-50 scale-80"
        }`}
        style={{
          transitionDelay: `${index * 150 + 200}ms`,
          transform: position === "left" 
            ? (isVisible ? "translateX(-12px)" : "translateX(-12px) scale(0.8)")
            : (isVisible ? "translateX(12px)" : "translateX(12px) scale(0.8)"),
        }}
      >
        <div className="px-4 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full whitespace-nowrap shadow-lg">
          {story.storyDate
            ? new Date(story.storyDate).getFullYear()
            : formatYear(story.storyYear)}
        </div>
      </div>

      {/* Right side content (for right-positioned cards) - Desktop only */}
      <div className={`flex-1 flex ${position === "right" ? "justify-start lg:pl-6" : ""} hidden lg:flex`}>
        {position === "right" && (
          <div className="max-w-md w-full">
            {renderCardContent()}
          </div>
        )}
      </div>

      {/* Mobile Card (shown on all small screens) */}
      <div className="lg:hidden w-full">
        {renderCardContent()}
      </div>
    </div>
  );
}

export default function TimelineV2Page() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const recordModal = useRecordModal();
  const queryClient = useQueryClient();
  const progressLineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [returnHighlightId, setReturnHighlightId] = useState<string | null>(null);

  const {
    data: storiesData,
    isLoading: isStoriesLoading,
    error: storiesError,
  } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const res = await apiRequest("GET", getApiUrl("/api/stories"));
      return res.json();
    },
    enabled: !!user,
  });

  // Restore scroll position when returning from book view
  useEffect(() => {
    // Check for return navigation context from BookView
    const contextStr = sessionStorage.getItem("timeline-navigation-context");
    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000; // 5 minutes expiry

        if (!isExpired && context.returnPath === "/timeline-v2") {
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

  const allStories = (storiesData as any)?.stories || [];
  const stories = allStories.filter((s: any) => s.includeInTimeline === true);

  // Sort stories chronologically
  const sortedStories = [...stories].sort((a: any, b: any) => {
    const yearA = normalizeYear(a.storyYear);
    const yearB = normalizeYear(b.storyYear);
    return yearA - yearB;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-7 h-7 text-gray-800" />
              <h1 className="text-2xl font-bold text-gray-900">Timeline V2</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-light tracking-tight text-gray-900 mb-6">
            {user?.name ? `${user.name}'s Journey` : "Life's Journey"}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">
            A timeline of memories, moments, and milestones that shaped your life.
          </p>
        </div>

        {/* Timeline Container */}
        <div ref={timelineContainerRef} className="relative">
          {/* Centered Progress Line */}
          <div className="absolute left-1/2 transform -translate-x-0.5 w-1 h-full bg-gray-200 hidden lg:block rounded-full overflow-hidden">
            <div
              ref={progressLineRef}
              className="w-full rounded-full transition-all duration-300 ease-out"
              style={{
                height: "0%",
                background: "linear-gradient(to bottom, #f97316, #ea580c)",
                boxShadow: "0 0 10px rgba(249, 115, 22, 0.3)",
              }}
            />
          </div>

          {/* Timeline Steps */}
          <div className="flex flex-col gap-2 md:gap-0">
            {sortedStories.map((story: Story, index: number) => (
              <div 
                key={story.id} 
                className="md:-mt-[50px] first:md:mt-0"
                data-memory-id={story.id}
                style={{
                  transition: returnHighlightId === story.id ? 'background-color 0.3s' : 'none',
                  backgroundColor: returnHighlightId === story.id ? 'rgba(251, 146, 60, 0.1)' : 'transparent',
                  borderRadius: returnHighlightId === story.id ? '1rem' : '0',
                  padding: returnHighlightId === story.id ? '1rem' : '0',
                }}
              >
                <CenteredMemoryCard
                  story={story}
                  position={index % 2 === 0 ? "left" : "right"}
                  index={index}
                />
              </div>
            ))}

            {sortedStories.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-6">No memories yet. Start recording your first story!</p>
                <Button
                  onClick={() => recordModal.openModal()}
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

      {/* Record Modal */}
      <RecordModal
        isOpen={recordModal.isOpen}
        onClose={recordModal.closeModal}
        onSave={recordModal.handleSave}
        initialPrompt={recordModal.initialData?.prompt}
        initialTitle={recordModal.initialData?.title}
        initialYear={recordModal.initialData?.year}
      />

      {/* Custom Styles */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .timeline-step {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
          .timeline-dot {
            transform: scale(1) !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
