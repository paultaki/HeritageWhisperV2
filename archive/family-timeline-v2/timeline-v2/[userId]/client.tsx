'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FamilyGuard } from '@/components/FamilyGuard';
import FamilyNav from '@/components/FamilyNav';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { Card } from '@/components/ui/card';
import { Loader2, Home, BookOpen, HelpCircle, Pause, Volume2, Clock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { groupStoriesByDecade, type Story } from '@/lib/supabase';
import { normalizeYear, formatYear } from '@/lib/utils';
import { MemoryOverlay } from '@/components/MemoryOverlay';
import Image from 'next/image';
import { formatStoryDate, formatStoryDateForMetadata } from '@/lib/dateFormatting';
import { apiRequest } from '@/lib/queryClient';

const logoUrl = "/final logo/logo-new.svg";

// Audio Manager for coordinating playback across cards
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentCardId: string | null = null;
  private listeners: Map<string, (playing: boolean, audioElement?: HTMLAudioElement | null) => void> = new Map();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  register(cardId: string, callback: (playing: boolean, audioElement?: HTMLAudioElement | null) => void) {
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

  requestPlay(cardId: string) {
    if (this.currentCardId && this.currentCardId !== cardId) {
      const oldCallback = this.listeners.get(this.currentCardId);
      if (oldCallback) {
        oldCallback(false, null);
      }
    }
    this.currentCardId = cardId;
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

// Timeline Card Component (matching TimelineDesktop style)
interface TimelineCardProps {
  story: Story;
  position: "left" | "right";
  index: number;
  birthYear: number;
  userId: string;
  onOpenOverlay?: (story: Story) => void;
}

function TimelineCard({ story, position, index, birthYear, userId, onOpenOverlay }: TimelineCardProps) {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenTrackedRef = useRef<boolean>(false);
  const listenTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Log story listened activity after 5 seconds of playback
  const logStoryListened = async () => {
    if (listenTrackedRef.current) {
      console.log('[Timeline] Activity already tracked for this story session');
      return; // Already logged this session
    }
    
    console.log('[Timeline] Logging story_listened activity:', {
      storytellerId: userId,
      storyId: story.id,
      title: story.title,
    });
    
    listenTrackedRef.current = true;
    
    try {
      const response = await apiRequest('POST', '/api/activity', {
        eventType: 'story_listened',
        storytellerId: userId,
        storyId: story.id,
        metadata: {
          duration_seconds: duration,
          title: story.title,
        },
      });
      console.log('[Timeline] ✅ Story listened activity logged successfully');
    } catch (error) {
      console.error('[Timeline] ❌ Failed to log story_listened activity:', error);
      listenTrackedRef.current = false; // Reset so it can retry
    }
  };

  // Get display photo
  const getDisplayPhoto = () => {
    if (story.photos && story.photos.length > 0) {
      const heroPhoto = story.photos.find((p: any) => p.isHero && p.url);
      if (heroPhoto) return heroPhoto;
      const firstValidPhoto = story.photos.find((p: any) => p.url);
      if (firstValidPhoto) return firstValidPhoto;
    }
    // Check both photoUrl and heroPhotoUrl (API uses heroPhotoUrl)
    const photoUrl = (story as any).photoUrl || (story as any).heroPhotoUrl;
    if (photoUrl) {
      return { url: photoUrl, transform: (story as any).photoTransform };
    }
    return null;
  };

  const displayPhoto = getDisplayPhoto();
  const photoCount = story.photos?.length || ((story as any).photoUrl || (story as any).heroPhotoUrl ? 1 : 0);

  // Calculate display age
  const normalizedStoryYear = normalizeYear(story.storyYear);
  const computedAge =
    typeof normalizedStoryYear === "number" && typeof birthYear === "number"
      ? normalizedStoryYear - birthYear
      : null;
  const displayLifeAge = (() => {
    if (typeof (story as any).lifeAge === "number") {
      if (computedAge !== null && (story as any).lifeAge < 0 && normalizedStoryYear !== null && normalizedStoryYear >= birthYear) {
        return computedAge;
      }
      return (story as any).lifeAge;
    }
    return computedAge;
  })();

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Intersection Observer for scroll animation
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
        threshold: 0.05,
        rootMargin: "200px 0px 200px 0px",
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
              
              // Start timer to log activity after 5 seconds of playback
              if (listenTimerRef.current) {
                clearTimeout(listenTimerRef.current);
              }
              listenTimerRef.current = setTimeout(() => {
                logStoryListened();
              }, 5000);
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

  useEffect(() => {
    const handleAudioStateChange = (
      playing: boolean,
      audioElement?: HTMLAudioElement | null,
    ) => {
      if (!playing) {
        // Clear listen tracking timer when audio stops
        if (listenTimerRef.current) {
          clearTimeout(listenTimerRef.current);
          listenTimerRef.current = null;
        }
        
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
      // Clear timer on unmount
      if (listenTimerRef.current) {
        clearTimeout(listenTimerRef.current);
        listenTimerRef.current = null;
      }
      
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

  // Reset listen tracking when story changes
  useEffect(() => {
    listenTrackedRef.current = false;
    if (listenTimerRef.current) {
      clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  }, [story.id]);

  const handleCardClick = () => {
    if (onOpenOverlay) {
      onOpenOverlay(story);
    } else {
      // Navigate to family book view
      router.push(`/family/book/${userId}?storyId=${story.id}`);
    }
  };

  // Render card content (matching TimelineDesktop mobile style)
  const renderCardContent = () => {
    if (displayPhoto?.url) {
      return (
        <div
          className={`bg-white rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={handleCardClick}
          style={{
            boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.18), 0 3px 7px -1px rgba(0, 0, 0, 0.12)',
            border: '1.5px solid var(--color-timeline-card-border)',
          }}
        >
          {/* Photo Section */}
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            {(displayPhoto as any).transform ? (
              <img
                src={displayPhoto.url}
                alt={story.title}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${(displayPhoto as any).transform.zoom}) translate(${(displayPhoto as any).transform.position.x}%, ${(displayPhoto as any).transform.position.y}%)`,
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

            {/* Audio button */}
            {story.audioUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio(e);
                }}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                className="absolute right-4 bottom-4 hover:scale-105 transition-transform z-10"
              >
                <svg className="w-11 h-11 -rotate-90">
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
                    stroke="rgba(139,107,122,0.15)"
                    strokeWidth="2"
                  />
                  {isPlaying && (
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="rgba(139,107,122,0.5)"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
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

          {/* Title and metadata */}
          <div className="px-4 py-3 bg-white relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-0.5 truncate">
                  {story.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    {formatStoryDateForMetadata((story as any).storyDate, story.storyYear)}
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
          </div>
        </div>
      );
    }

    // No photo - render placeholder
    return (
      <div
        className={`bg-white rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={handleCardClick}
        style={{
          boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.18), 0 3px 7px -1px rgba(0, 0, 0, 0.12)',
          border: '1.5px solid var(--color-timeline-card-border)',
        }}
      >
        {/* Placeholder */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center"
          >
            <div className="text-center p-6">
              <div className="text-5xl opacity-10">📝</div>
            </div>
          </div>

          {/* Audio button */}
          {story.audioUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio(e);
              }}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              className="absolute right-4 bottom-4 hover:scale-105 transition-transform z-10"
            >
              <svg className="w-11 h-11 -rotate-90">
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
                  stroke="rgba(139,107,122,0.15)"
                  strokeWidth="2"
                />
                {isPlaying && (
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="rgba(139,107,122,0.5)"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
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

        {/* Title and metadata */}
        <div className="px-4 py-3 bg-white relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-0.5 truncate">
                {story.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  {formatStoryDateForMetadata((story as any).storyDate, story.storyYear)}
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
      {/* Left side content (desktop) */}
      <div className={`flex-1 flex ${position === "left" ? "justify-end" : ""} hidden lg:flex`} style={{ pointerEvents: 'none', paddingRight: position === "left" ? "109px" : "0" }}>
        {position === "left" && (
          <div className="w-full max-w-md timeline-card-container" style={{ pointerEvents: 'auto' }}>
            {renderCardContent()}
          </div>
        )}
      </div>

      {/* Year marker */}
      <div
        className="z-10 flex-shrink-0 timeline-dot transition-all duration-500"
        style={{
          transform: position === "left" ? "translateX(-54px)" : "translateX(54px)",
          marginBottom: '-40px',
        }}
      >
        <div
          className="py-0 px-1 font-serif whitespace-nowrap transition-all duration-200 hover:opacity-100"
          style={{
            backgroundColor: 'var(--color-timeline-badge-bg)',
            border: `1px solid var(--color-timeline-border-badge)`,
            color: 'var(--color-timeline-badge-text)',
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.3px',
            opacity: 0.95,
            boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.09)',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            top: '-19px',
          }}
        >
          <span style={{ position: 'relative', top: '-2px' }}>
            {formatStoryDate((story as any).storyDate, story.storyYear, "year-only")}
          </span>
        </div>
      </div>

      {/* Right side content (desktop) */}
      <div className={`flex-1 flex ${position === "right" ? "justify-start" : ""} hidden lg:flex`} style={{ pointerEvents: 'none', paddingLeft: position === "right" ? "109px" : "0" }}>
        {position === "right" && (
          <div className="w-full max-w-md timeline-card-container" style={{ pointerEvents: 'auto' }}>
            {renderCardContent()}
          </div>
        )}
      </div>

      {/* Mobile Card */}
      <div className="lg:hidden w-full" style={{ pointerEvents: 'auto' }}>
        {renderCardContent()}
      </div>
    </div>
  );
}

interface FamilyTimelineV2ClientProps {
  userId: string;
}

export default function FamilyTimelineV2Client({ userId }: FamilyTimelineV2ClientProps) {
  const router = useRouter();
  const { session, updateFirstAccess } = useFamilyAuth();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const progressLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.firstAccess) {
      updateFirstAccess();
    }
  }, [session, updateFirstAccess]);

  // Fetch stories using family session (HttpOnly cookie sent automatically)
  const { data: storiesData, isLoading } = useQuery({
    queryKey: ['/api/family/stories', userId],
    queryFn: async () => {
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(`/api/family/stories/${userId}`, {
        credentials: 'include', // Send HttpOnly cookie
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      return response.json();
    },
    enabled: !!session,
  });

  const allStories = storiesData?.stories || [];
  const stories = allStories.filter((s: any) => s.includeInTimeline === true);
  const storytellerBirthYear = storiesData?.storyteller?.birthYear || 1950;
  const storytellerFirstName = storiesData?.storyteller?.firstName || 'Family Member';

  // Group stories by decade
  const storiesByDecade = groupStoriesByDecade(stories, storytellerBirthYear);
  const sortedStories = [...stories].sort((a: any, b: any) => {
    return (normalizeYear(a.storyYear) ?? 0) - (normalizeYear(b.storyYear) ?? 0);
  });

  // Calculate progress line height based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!progressLineRef.current) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      progressLineRef.current.style.height = `${scrollPercent}%`;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenOverlay = (story: Story) => {
    setSelectedStory(story);
    setOverlayOpen(true);
  };

  return (
    <FamilyGuard userId={userId}>
      <div className="hw-page pb-24" style={{ background: 'var(--color-page)' }}>
        {/* Top Header Bar */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Image
                  src={logoUrl}
                  alt="Heritage Whisper"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">
                    {storytellerFirstName}'s Stories
                  </h1>
                  <p className="text-xs text-gray-500">
                    {session?.permissionLevel === 'contributor' ? 'Contributor access' : 'View-only access'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <FamilyNav
          activeKey="timeline"
          userId={userId}
          storytellerName={session?.storytellerName || storytellerFirstName}
          permissionLevel={session?.permissionLevel}
        />

        {/* Timeline Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          )}

          {!isLoading && stories.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-600">No stories have been shared yet.</p>
            </Card>
          )}

          {!isLoading && stories.length > 0 && (
            <div className="relative">
              {/* Vertical timeline spine */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5 hidden lg:block"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-timeline-card-border) 0%, var(--color-timeline-spine-mid) 50%, var(--color-timeline-card-border) 100%)',
                  opacity: 0.3,
                }}
              />

              {/* Progress line */}
              <div
                ref={progressLineRef}
                className="absolute left-1/2 top-0 w-1 -ml-0.5 transition-all duration-200 hidden lg:block"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-timeline-card-border) 0%, var(--color-timeline-spine-mid) 50%, var(--color-timeline-card-border) 100%)',
                  opacity: 0.8,
                  height: '0%',
                }}
              />

              {/* Timeline cards */}
              <div className="space-y-8">
                {sortedStories.map((story: any, index: number) => (
                  <TimelineCard
                    key={story.id}
                    story={story}
                    position={index % 2 === 0 ? "left" : "right"}
                    index={index}
                    birthYear={storytellerBirthYear}
                    userId={userId}
                    onOpenOverlay={handleOpenOverlay}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Memory Overlay */}
        {selectedStory && (
          <MemoryOverlay
            isOpen={overlayOpen}
            onClose={() => {
              setOverlayOpen(false);
              setSelectedStory(null);
            }}
            story={selectedStory}
            stories={sortedStories}
            onNavigate={(storyId: string) => {
              const newStory = sortedStories.find(s => s.id === storyId);
              if (newStory) setSelectedStory(newStory);
            }}
          />
        )}
      </div>
    </FamilyGuard>
  );
}
