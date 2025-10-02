"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Pause,
  Pencil,
  Sparkles,
  MessageCircle,
  Plus,
  Share2,
} from "lucide-react";
import { useRecordModal } from "@/hooks/use-record-modal";
import RecordModal from "@/components/RecordModal";
import FloatingInsightCard from "@/components/FloatingInsightCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "@/hooks/use-mobile";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import { groupStoriesByDecade, getAgeRangeForDecade, getDecadeDisplayName, normalizeYear, formatYear } from "@/lib/utils";

const logoUrl = "/hw_logo_icon.png";

// Book layout configuration - single place to adjust text splitting
const BOOK_LAYOUT_CONFIG = {
  leftPageMaxLines: 7, // Limit to 7-8 lines on left page below photo
};

interface Story {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  transcription?: string;
  durationSeconds?: number;
  wisdomClipUrl?: string;
  wisdomClipText?: string;
  storyYear: number;
  storyDate?: string;
  lifeAge?: number;
  photoUrl?: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  photos?: Array<{
    id: string;
    url: string;
    transform?: { zoom: number; position: { x: number; y: number } };
    caption?: string;
    isHero?: boolean;
  }>;
  emotions?: string[];
  pivotalCategory?: string;
  includeInBook?: boolean;
  formattedContent?: {
    formattedText?: string;
    pages?: string[];
    questions?: Array<{ text: string }>;
  };
  createdAt: string;
}

// Normalize photo URL to handle storage paths
const normalizePhotoUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return url;
};

const getSortedPhotos = (story: Story) => {
  if (story.photos && story.photos.length > 0) {
    const sorted = [...story.photos].sort((a, b) => {
      if (a.isHero) return -1;
      if (b.isHero) return 1;
      return 0;
    }).map(photo => ({
      ...photo,
      url: normalizePhotoUrl(photo.url)
    }));
    return sorted;
  }
  if (story.photoUrl) {
    return [
      {
        id: "legacy",
        url: normalizePhotoUrl(story.photoUrl),
        transform: story.photoTransform,
      },
    ];
  }
  return [];
};

// Photo carousel component
function PhotoCarousel({
  story,
  photoRef,
}: {
  story: Story;
  photoRef: React.RefObject<HTMLImageElement | HTMLDivElement>;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const isMobile = useIsMobile();
  const photos = getSortedPhotos(story);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (photos.length > 1 && currentPhotoIndex < photos.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (photos.length > 1 && currentPhotoIndex > 0) {
        setCurrentPhotoIndex(currentPhotoIndex - 1);
      }
    },
    trackMouse: false,
  });

  if (photos.length === 0) {
    return (
      <div
        ref={photoRef as React.RefObject<HTMLDivElement>}
        className="memory-photo bg-muted/20 flex items-center justify-center"
      >
        <BookOpen className="w-24 h-24 text-muted-foreground/30" />
      </div>
    );
  }

  if (photos.length === 1) {
    const photo = photos[0];
    return (
      <div className="memory-photo-wrapper" style={{ width: '85%', maxWidth: '400px', margin: '0 auto' }}>
        <div className="relative w-full aspect-[3/2] overflow-hidden" style={{ filter: 'sepia(15%) contrast(95%)' }}>
          <img
            ref={photoRef as React.RefObject<HTMLImageElement>}
            src={photo.url}
            alt={story.title}
            className="absolute w-full h-full object-cover"
            style={
              photo.transform
                ? {
                    transform: `scale(${photo.transform.zoom}) translate(${photo.transform.position.x / photo.transform.zoom}px, ${photo.transform.position.y / photo.transform.zoom}px)`,
                    transformOrigin: "center center",
                  }
                : {}
            }
          />
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative">
        <div {...swipeHandlers} className="memory-photo-container">
          <div className="memory-photo-wrapper" style={{ width: '90%', maxWidth: '300px', margin: '12px auto' }}>
            <div className="relative w-full aspect-[3/2] overflow-hidden" style={{ filter: 'sepia(15%) contrast(95%)' }}>
              <img
                ref={photoRef as React.RefObject<HTMLImageElement>}
                src={photos[currentPhotoIndex].url}
                alt={`${story.title} - Photo ${currentPhotoIndex + 1}`}
                className="absolute w-full h-full object-cover"
                style={
                  photos[currentPhotoIndex].transform
                    ? {
                        transform: `scale(${photos[currentPhotoIndex].transform.zoom}) translate(${photos[currentPhotoIndex].transform.position.x / photos[currentPhotoIndex].transform.zoom}px, ${photos[currentPhotoIndex].transform.position.y / photos[currentPhotoIndex].transform.zoom}px)`,
                        transformOrigin: "center center",
                      }
                    : {}
                }
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPhotoIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPhotoIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-1">
          {currentPhotoIndex + 1} of {photos.length}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={photoRef as React.RefObject<HTMLDivElement>}>
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {photos.map((photo, index) => (
            <CarouselItem key={photo.id || index}>
              <div className="memory-photo-wrapper" style={{ width: '85%', maxWidth: '400px', margin: '0 auto' }}>
                <div className="relative w-full aspect-[3/2] overflow-hidden" style={{ filter: 'sepia(15%) contrast(95%)' }}>
                  <img
                    src={photo.url}
                    alt={`${story.title} - Photo ${index + 1}`}
                    className="absolute w-full h-full object-cover"
                    style={
                      photo.transform
                        ? {
                            transform: `scale(${photo.transform.zoom}) translate(${photo.transform.position.x / photo.transform.zoom}px, ${photo.transform.position.y / photo.transform.zoom}px)`,
                            transformOrigin: "center center",
                          }
                        : {}
                    }
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
      <div className="text-center text-xs text-muted-foreground mt-2">
        Photo gallery ({photos.length} photos)
      </div>
    </div>
  );
}

// Tokenize text into sentences
const tokenizeIntoSentences = (text: string): string[] => {
  const abbreviations = [
    "Dr.", "Mr.", "Mrs.", "Ms.", "Jr.", "Sr.", "St.", "Ave.", "Inc.", "Ltd.", "Co.",
    "Ph.D.", "M.D.", "B.A.", "M.A.", "B.S.", "M.S.",
  ];
  let processedText = text;

  abbreviations.forEach((abbr, index) => {
    processedText = processedText.replace(
      new RegExp(abbr.replace(".", "\\."), "g"),
      `__ABBR${index}__`,
    );
  });

  const sentenceRegex = /([.!?]+\s+|[.!?]+$)/;
  const parts = processedText.split(sentenceRegex);
  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (/^[.!?]+/.test(part)) {
      currentSentence += part;
      if (currentSentence.trim()) {
        sentences.push(currentSentence.trim());
        currentSentence = "";
      }
    } else {
      currentSentence += part;
    }
  }

  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  return sentences.map((sentence) => {
    let restored = sentence;
    abbreviations.forEach((abbr, index) => {
      restored = restored.replace(new RegExp(`__ABBR${index}__`, "g"), abbr);
    });
    return restored;
  });
};

// Dynamic text balancing system with measurement
const useDynamicTextBalancer = (
  text: string | null | undefined,
  story: Story | null,
  audioExpanded: boolean,
  pageContainerRef: React.RefObject<HTMLDivElement>,
  leftPageRef: React.RefObject<HTMLElement>,
  rightPageRef: React.RefObject<HTMLElement>,
  titleDateRef: React.RefObject<HTMLDivElement>,
  photoRef: React.RefObject<HTMLImageElement | HTMLDivElement>,
  audioWrapperRef: React.RefObject<HTMLDivElement>,
  wisdomRef: React.RefObject<HTMLDivElement>,
  emotionRef: React.RefObject<HTMLDivElement>,
  maxLines: number,
): [string, string] => {
  const [splitResult, setSplitResult] = useState<[string, string]>(["", ""]);
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWidthRef = useRef<number>(0);
  const isCalculatingRef = useRef<boolean>(false);
  const splitResultRef = useRef<[string, string]>(["", ""]);

  const calculateSplit = useCallback(() => {
    if (!text || !pageContainerRef.current) {
      setSplitResult(["", ""]);
      return;
    }

    if (isCalculatingRef.current) {
      return;
    }
    isCalculatingRef.current = true;

    if (!measurementRef.current && typeof document !== 'undefined') {
      const measureDiv = document.createElement("div");
      measureDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        top: -9999px;
        left: -9999px;
        width: 600px;
        font-family: var(--font-serif), 'Merriweather', 'Georgia', serif;
        font-size: 1.125rem;
        line-height: 1.8;
        padding: 20px 60px;
        color: hsl(23, 5%, 30%);
      `;
      document.body.appendChild(measureDiv);
      measurementRef.current = measureDiv;
    }

    const sentences = tokenizeIntoSentences(text);

    if (sentences.length === 0) {
      setSplitResult(["", ""]);
      isCalculatingRef.current = false;
      return;
    }

    // Simple split: put about 40% on left page, rest on right
    const splitPoint = Math.max(0, Math.floor(sentences.length * 0.4) - 1);
    const leftText = sentences.slice(0, splitPoint + 1).join(" ").trim();
    const rightText = sentences.slice(splitPoint + 1).join(" ").trim();

    const hasChanged = leftText !== splitResultRef.current[0] || rightText !== splitResultRef.current[1];

    if (hasChanged) {
      splitResultRef.current = [leftText, rightText];
      setSplitResult([leftText, rightText]);
    }

    isCalculatingRef.current = false;
  }, [text, story, audioExpanded, pageContainerRef, leftPageRef, rightPageRef, titleDateRef, photoRef, audioWrapperRef, wisdomRef, emotionRef, maxLines]);

  useEffect(() => {
    splitResultRef.current = ["", ""];
    isCalculatingRef.current = false;
  }, [text]);

  useLayoutEffect(() => {
    calculateSplit();
  }, [calculateSplit]);

  useEffect(() => {
    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      if (measurementRef.current && measurementRef.current.parentNode) {
        measurementRef.current.parentNode.removeChild(measurementRef.current);
      }
    };
  }, [calculateSplit]);

  return splitResult;
};

export default function BookView() {
  const { user, session } = useAuth();
  const router = useRouter();
  const recordModal = useRecordModal();

  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const initialStoryId = urlParams?.get("storyId");

  const [currentPage, setCurrentPage] = useState(0);
  const [initialPageSet, setInitialPageSet] = useState(false);
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasTimelineContext, setHasTimelineContext] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const leftPageRef = useRef<HTMLElement>(null);
  const rightPageRef = useRef<HTMLElement>(null);
  const titleDateRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement | HTMLDivElement>(null);
  const audioWrapperRef = useRef<HTMLDivElement>(null);
  const wisdomRef = useRef<HTMLDivElement>(null);
  const emotionRef = useRef<HTMLDivElement>(null);

  const { data: storiesData, isLoading } = useQuery({
    queryKey: ["/api/stories"],
    enabled: !!user && !!session,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const allStories = (storiesData as any)?.stories || [];
  const stories = React.useMemo(() => {
    if (!Array.isArray(allStories)) return [];
    return allStories.filter((story: Story) => story.includeInBook !== false);
  }, [allStories]);

  type PageType = 'decade-intro' | 'story-left' | 'story-right' | 'story-continuation';

  interface BookPage {
    type: PageType;
    data: any;
    storyIndex?: number;  // Index of the story being displayed
    pageOfStory?: number; // Which page of this story (1st, 2nd, etc)
    decade?: string;
    ageRange?: string;
    storiesInDecade?: number;
    isFirstInDecade?: boolean;
  }

  const bookPages = React.useMemo(() => {
    const pages: BookPage[] = [];

    if (!user || stories.length === 0) return pages;

    const normalizedBirthYear = normalizeYear(user.birthYear);
    const birthYearStories = stories.filter((story: Story) => {
      const normalizedStoryYear = normalizeYear(story.storyYear);
      return normalizedStoryYear === normalizedBirthYear;
    });

    // Helper function to determine if we're on a left or right page
    const isLeftPage = (pageIndex: number) => pageIndex % 2 === 0;

    let globalPageIndex = 0;
    let storyIndex = 0;

    // Process birth year stories
    if (birthYearStories.length > 0) {
      // Add decade intro on left page
      pages.push({
        type: 'decade-intro',
        data: 'birth-year',
        decade: 'birth-year',
        ageRange: `${normalizedBirthYear} • The Beginning`,
        storiesInDecade: birthYearStories.length
      });
      globalPageIndex++;

      // Process each story in birth year
      birthYearStories.forEach((story: Story, idx: number) => {
        // First story of decade starts immediately on right page (if on left) or continues on current page
        if (idx === 0 && isLeftPage(globalPageIndex - 1)) {
          // We're on the right side after decade intro, perfect for first story
          pages.push({
            type: 'story-right',
            data: story,
            storyIndex,
            pageOfStory: 1,
            decade: 'birth-year',
            isFirstInDecade: true
          });
        } else {
          // Continue with normal story flow
          pages.push({
            type: isLeftPage(globalPageIndex) ? 'story-left' : 'story-right',
            data: story,
            storyIndex,
            pageOfStory: 1,
            decade: 'birth-year',
            isFirstInDecade: idx === 0
          });
        }
        globalPageIndex++;
        storyIndex++;
      });
    }

    // Process other decades
    const decadeGroups = groupStoriesByDecade(stories, user.birthYear);

    decadeGroups.forEach(group => {
      const { decade, ageRange, stories: decadeStories } = group;

      // Add decade intro
      pages.push({
        type: 'decade-intro',
        data: decade,
        decade: decade,
        ageRange: ageRange,
        storiesInDecade: decadeStories.length
      });
      globalPageIndex++;

      // Process each story in this decade
      decadeStories.forEach((story: Story, idx: number) => {
        // Stories flow continuously
        if (idx === 0 && isLeftPage(globalPageIndex - 1)) {
          // First story of decade on right page after intro
          pages.push({
            type: 'story-right',
            data: story,
            storyIndex,
            pageOfStory: 1,
            decade,
            isFirstInDecade: true
          });
        } else {
          pages.push({
            type: isLeftPage(globalPageIndex) ? 'story-left' : 'story-right',
            data: story,
            storyIndex,
            pageOfStory: 1,
            decade,
            isFirstInDecade: idx === 0
          });
        }
        globalPageIndex++;
        storyIndex++;
      });
    });

    return pages;
  }, [stories, user]);

  const totalPages = bookPages.length;
  const currentPageData = bookPages[currentPage];
  const currentStory = (currentPageData?.type === 'story-left' || currentPageData?.type === 'story-right' || currentPageData?.type === 'story-continuation') ? currentPageData.data : null;

  const formattedContent = currentStory?.formattedContent;

  const [dynamicLeftText, dynamicRightText] = useDynamicTextBalancer(
    currentStory ? (currentStory?.transcription || formattedContent?.formattedText || '') : null,
    currentStory,
    audioExpanded,
    pageContainerRef,
    leftPageRef,
    rightPageRef,
    titleDateRef,
    photoRef,
    audioWrapperRef,
    wisdomRef,
    emotionRef,
    BOOK_LAYOUT_CONFIG.leftPageMaxLines,
  );

  const leftPageText = dynamicLeftText;
  const rightPageText = dynamicRightText;

  const [aiPrompts, setAiPrompts] = useState<Array<{ icon: React.ReactNode; title: string; text: string }>>([]);

  // Initialize URL params on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(new URLSearchParams(window.location.search));
    }
  }, []);

  useEffect(() => {
    if (!currentStory) {
      setAiPrompts([]);
      return;
    }

    if (formattedContent && formattedContent.questions) {
      const formattedPrompts = formattedContent.questions.map((q: any) => ({
        icon: <MessageCircle className="w-4 h-4" />,
        title: q.text.substring(0, 30) + (q.text.length > 30 ? "..." : ""),
        text: q.text,
      }));
      setAiPrompts(formattedPrompts);
      return;
    }

    setAiPrompts([]);
  }, [currentStory?.id, formattedContent]);

  useEffect(() => {
    if (initialPageSet) return;

    const contextStr = typeof window !== 'undefined' ? sessionStorage.getItem("timeline-navigation-context") : null;
    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000;

        if (!isExpired && context.returnPath === "/timeline") {
          setHasTimelineContext(true);
        }
      } catch (e) {
        // Silently ignore
      }
    }

    if (initialStoryId && bookPages.length > 0) {
      const pageIndex = bookPages.findIndex(
        (page) => (page.type === 'story-left' || page.type === 'story-right' || page.type === 'story-continuation') && page.data?.id === initialStoryId
      );
      if (pageIndex !== -1) {
        setCurrentPage(pageIndex);
        setInitialPageSet(true);
      } else {
        setInitialPageSet(true);
      }

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("storyId");
        const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "");
        window.history.replaceState({}, "", newUrl);
      }
    } else if (bookPages.length > 0) {
      setInitialPageSet(true);
    }
  }, [bookPages, initialStoryId, initialPageSet]);

  const formatDate = (story: Story) => {
    if (story.storyDate) {
      return new Date(story.storyDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return formatYear(story.storyYear);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleAudio = () => {
    if (!currentStory?.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(currentStory.audioUrl);
      audioRef.current.crossOrigin = "anonymous";

      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setAudioExpanded(false);
      });
    }

    if (audioExpanded) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setAudioExpanded(true);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePromptClick = (prompt: { title: string; text: string }) => {
    router.push(`/recording?prompt=${encodeURIComponent(prompt.text)}`);
  };

  const handleBackToTimeline = () => {
    router.push("/timeline");
  };

  const goToPrevious = () => {
    if (currentPage > 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
        setAudioExpanded(false);
        setCurrentTime(0);
      }
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
        setAudioExpanded(false);
        setCurrentTime(0);
      }
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!user) {
    // Only redirect on client side
    if (typeof window !== 'undefined') {
      router.push("/auth/login");
    }
    return null;
  }

  if (isLoading || (initialStoryId && !initialPageSet)) {
    return (
      <div className="min-h-screen book-background flex items-center justify-center md:pl-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Opening memory book...</p>
        </div>
      </div>
    );
  }

  if (totalPages === 0) {
    const shareUrl = typeof window !== 'undefined' ? `${window.location?.origin || ''}/share/${user.id}` : '';

    return (
      <div className="min-h-screen book-background flex flex-col md:pl-20">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  className="w-16 h-16 sm:w-20 sm:h-20 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 -ml-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-heritage-coral bg-transparent border-none p-0"
                  onClick={() => router.push("/")}
                  aria-label="Home"
                >
                  <img
                    src={logoUrl}
                    alt="HeritageWhisper Logo"
                    className="w-full h-full object-contain"
                  />
                </button>
                <div className="min-w-0 hidden sm:block">
                  <h1 className="text-lg font-bold text-foreground truncate">
                    Memory Book
                  </h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.name}&apos;s Life Stories
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  className="bg-heritage-coral hover:bg-heritage-coral/90 text-white px-3 py-2 btn-press transition-all hover:shadow-lg hover:shadow-heritage-coral/20 rounded-3xl"
                  size="sm"
                  onClick={recordModal.openModal}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline ml-1">Memory</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 py-2 btn-press transition-all hover:shadow-md hover:shadow-heritage-orange/20 rounded-3xl border-heritage-coral text-heritage-coral hover:bg-heritage-coral hover:text-white"
                  onClick={() => window.open(shareUrl, "_blank")}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden lg:inline ml-1">Share</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 py-2 btn-press transition-all hover:shadow-md hover:shadow-heritage-orange/20 rounded-3xl border-heritage-coral text-heritage-coral hover:bg-heritage-coral hover:text-white"
                  onClick={handleBackToTimeline}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden lg:inline ml-1">Timeline</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
          <div className="book-container max-w-6xl w-full">
            <div className="book-spread">
              <article className="page page--left hidden md:block">
                <div className="running-header">
                  <span className="header-left">Heritage Whisper</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-muted-foreground/30" />
                </div>
                <div className="page-number">i</div>
              </article>

              <article className="page page--right">
                <div className="running-header">
                  <span className="header-right">Family Memories</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 md:pt-0">
                  <BookOpen className="w-20 h-20 text-muted-foreground/20 mb-6 md:hidden" />
                  <h2 className="text-xl md:text-2xl font-serif text-foreground mb-2 text-center">
                    Your Memory Book is Empty
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-6 text-center">
                    Start recording memories to fill your book
                  </p>
                  <Button
                    onClick={recordModal.openModal}
                    className="bg-[var(--primary-coral)] hover:bg-[hsl(0,77%,58%)] text-white rounded-3xl px-5 py-2.5 md:px-6 md:py-3 transition-all shadow-md hover:shadow-lg text-sm md:text-base"
                  >
                    Record Your First Memory
                  </Button>
                </div>
                <div className="page-number">ii</div>
              </article>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const playbackProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const shareUrl = typeof window !== 'undefined' ? `${window.location?.origin || ''}/share/${user.id}` : '';

  return (
    <div className="min-h-screen book-background flex flex-col pb-20 md:pb-0 md:pl-20">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                className="w-16 h-16 sm:w-20 sm:h-20 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 -ml-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-heritage-coral bg-transparent border-none p-0"
                onClick={() => router.push("/")}
                aria-label="Home"
              >
                <img
                  src={logoUrl}
                  alt="HeritageWhisper Logo"
                  className="w-full h-full object-contain"
                />
              </button>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-lg font-bold text-foreground truncate">
                  Memory Book
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {user.name}&apos;s Life Stories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                className="bg-heritage-coral hover:bg-heritage-coral/90 text-white px-3 py-2 btn-press transition-all hover:shadow-lg hover:shadow-heritage-coral/20 rounded-3xl"
                size="sm"
                onClick={recordModal.openModal}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Memory</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="px-3 py-2 btn-press transition-all hover:shadow-md hover:shadow-heritage-orange/20 rounded-3xl border-heritage-coral text-heritage-coral hover:bg-heritage-coral hover:text-white"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Share</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="px-3 py-2 btn-press transition-all hover:shadow-md hover:shadow-heritage-orange/20 rounded-3xl border-heritage-coral text-heritage-coral hover:bg-heritage-coral hover:text-white"
                onClick={handleBackToTimeline}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Timeline</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <button
        className="nav-arrow nav-arrow--prev"
        onClick={goToPrevious}
        disabled={currentPage === 0}
        aria-label="Previous story"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <button
        className="nav-arrow nav-arrow--next"
        onClick={goToNext}
        disabled={currentPage === totalPages - 1}
        aria-label="Next story"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
        <div className="book-container max-w-6xl w-full" ref={pageContainerRef}>
          {currentStory && (
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                className="glassmorphism backdrop-blur-sm hover:bg-white/20 transition-all rounded-3xl"
                onClick={() => router.push(`/review?edit=${currentStory.id}`)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Story
              </Button>
            </div>
          )}

          <div className="book-spread">
            {currentPageData?.type === 'decade-intro' && (
              <>
                <article className="page page--left">
                  <DecadeIntroPage
                    decade={currentPageData.decade!}
                    ageRange={currentPageData.ageRange!}
                    storiesCount={currentPageData.storiesInDecade!}
                  />
                </article>
                <article className="page page--right">
                  <div className="running-header">
                    <span className="header-right">Family Memories</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {/* Empty right page after decade intro, next story will appear here */}
                  </div>
                  <div className="page-number">{currentPage * 2 + 2}</div>
                </article>
              </>
            )}

            {currentPageData?.type === 'story-left' && currentStory && (
              <>
                <article className="page page--left" ref={leftPageRef}>
                  <div className="running-header">
                    <span className="header-left">Heritage Whisper</span>
                  </div>

                  <PhotoCarousel story={currentStory} photoRef={photoRef} />

                  <div ref={titleDateRef}>
                    <h2 className="memory-title">
                      {currentStory.title}
                    </h2>
                    <div className="memory-year">
                      {formatDate(currentStory)}
                      {currentStory.lifeAge !== null && currentStory.lifeAge !== undefined && ` • Age ${currentStory.lifeAge}`}
                    </div>
                  </div>

                  {currentStory.audioUrl && (
                    <div className="audio-wrapper" ref={audioWrapperRef}>
                      <div className={`audio-wrap ${audioExpanded ? "audio--expanded" : "audio--compact"}`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleAudio}
                            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 text-primary" />
                            ) : (
                              <Play className="w-4 h-4 text-primary" />
                            )}
                          </button>
                          <div className="flex-1" onClick={toggleAudio}>
                            <div
                              className="audio-bar"
                              style={{
                                background: "rgba(0,0,0,0.1)",
                                height: "6px",
                                borderRadius: "999px",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                className="audio-fill"
                                style={{
                                  width: `${playbackProgress}%`,
                                  height: "100%",
                                  background: "linear-gradient(90deg, var(--primary-coral), #FF935F)",
                                  borderRadius: "999px",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="audio-time mt-2">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="memory-body memory-body--left">
                    {currentStory.transcription || 'No transcription available for this memory.'}
                  </p>

                  <div className="page-number">{currentPage * 2 + 1}</div>
                </article>

                {/* Empty right page */}
                <article className="page page--right">
                  <div className="running-header">
                    <span className="header-right">Family Memories</span>
                  </div>
                  <div className="flex-1"></div>
                  <div className="page-number">{currentPage * 2 + 2}</div>
                </article>
              </>
            )}

            {currentPageData?.type === 'story-right' && currentStory && (
              <>
                {/* Check if there's a previous page that's a decade intro */}
                {currentPage > 0 && bookPages[currentPage - 1]?.type === 'decade-intro' ? (
                  /* Previous page already rendered, just show this story on the right */
                  <article className="page page--right" ref={rightPageRef}>
                    <div className="running-header">
                      <span className="header-right">Family Memories</span>
                    </div>

                    <PhotoCarousel story={currentStory} photoRef={photoRef} />

                    <div ref={titleDateRef}>
                      <h2 className="memory-title">
                        {currentStory.title}
                      </h2>
                      <div className="memory-year">
                        {formatDate(currentStory)}
                        {currentStory.lifeAge !== null && currentStory.lifeAge !== undefined && ` • Age ${currentStory.lifeAge}`}
                      </div>
                    </div>

                    {currentStory.audioUrl && (
                      <div className="audio-wrapper" ref={audioWrapperRef}>
                        <div className={`audio-wrap ${audioExpanded ? "audio--expanded" : "audio--compact"}`}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={toggleAudio}
                              className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4 text-primary" />
                              ) : (
                                <Play className="w-4 h-4 text-primary" />
                              )}
                            </button>
                            <div className="flex-1" onClick={toggleAudio}>
                              <div
                                className="audio-bar"
                                style={{
                                  background: "rgba(0,0,0,0.1)",
                                  height: "6px",
                                  borderRadius: "999px",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  className="audio-fill"
                                  style={{
                                    width: `${playbackProgress}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, var(--primary-coral), #FF935F)",
                                    borderRadius: "999px",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="audio-time mt-2">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="memory-body memory-body--right">
                      {currentStory.transcription || 'No transcription available for this memory.'}
                    </p>

                    {(currentStory.wisdomClipText || currentStory.wisdomClipUrl) && (
                      <div className="wisdom" ref={wisdomRef} style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="wisdom-label text-amber-700 font-semibold">Lesson Learned</span>
                        </div>

                        {currentStory.wisdomClipText && (
                          <blockquote className="text-lg italic text-gray-800 leading-relaxed mx-auto" style={{ maxWidth: '90%', paddingLeft: '1rem', borderLeft: '4px solid #fbbf24' }}>
                            &quot;{currentStory.wisdomClipText}&quot;
                          </blockquote>
                        )}
                      </div>
                    )}

                    <div className="page-number">{currentPage * 2 + 2}</div>
                  </article>
                ) : (
                  /* Show normal two-page spread */
                  <>
                    <article className="page page--left">
                      <div className="running-header">
                        <span className="header-left">Heritage Whisper</span>
                      </div>
                      <div className="flex-1"></div>
                      <div className="page-number">{currentPage * 2 + 1}</div>
                    </article>

                    <article className="page page--right" ref={rightPageRef}>
                      <div className="running-header">
                        <span className="header-right">Family Memories</span>
                      </div>

                      <PhotoCarousel story={currentStory} photoRef={photoRef} />

                      <div ref={titleDateRef}>
                        <h2 className="memory-title">
                          {currentStory.title}
                        </h2>
                        <div className="memory-year">
                          {formatDate(currentStory)}
                          {currentStory.lifeAge !== null && currentStory.lifeAge !== undefined && ` • Age ${currentStory.lifeAge}`}
                        </div>
                      </div>

                      {currentStory.audioUrl && (
                        <div className="audio-wrapper" ref={audioWrapperRef}>
                          <div className={`audio-wrap ${audioExpanded ? "audio--expanded" : "audio--compact"}`}>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={toggleAudio}
                                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                              >
                                {isPlaying ? (
                                  <Pause className="w-4 h-4 text-primary" />
                                ) : (
                                  <Play className="w-4 h-4 text-primary" />
                                )}
                              </button>
                              <div className="flex-1" onClick={toggleAudio}>
                                <div
                                  className="audio-bar"
                                  style={{
                                    background: "rgba(0,0,0,0.1)",
                                    height: "6px",
                                    borderRadius: "999px",
                                    position: "relative",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    className="audio-fill"
                                    style={{
                                      width: `${playbackProgress}%`,
                                      height: "100%",
                                      background: "linear-gradient(90deg, var(--primary-coral), #FF935F)",
                                      borderRadius: "999px",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="audio-time mt-2">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="memory-body memory-body--right">
                        {currentStory.transcription || 'No transcription available for this memory.'}
                      </p>

                      {(currentStory.wisdomClipText || currentStory.wisdomClipUrl) && (
                        <div className="wisdom" ref={wisdomRef} style={{ textAlign: 'center', marginTop: '2rem' }}>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="wisdom-label text-amber-700 font-semibold">Lesson Learned</span>
                          </div>

                          {currentStory.wisdomClipText && (
                            <blockquote className="text-lg italic text-gray-800 leading-relaxed mx-auto" style={{ maxWidth: '90%', paddingLeft: '1rem', borderLeft: '4px solid #fbbf24' }}>
                              &quot;{currentStory.wisdomClipText}&quot;
                            </blockquote>
                          )}
                        </div>
                      )}

                      <div className="page-number">{currentPage * 2 + 2}</div>
                    </article>
                  </>
                )}
              </>
            )}
          </div>

          <div className="book-nav">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 0}
            >
              ← Previous
            </button>

            <div className="text-center flex items-center">
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </p>
            </div>

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <RecordModal
        isOpen={recordModal.isOpen}
        onClose={recordModal.closeModal}
        onSave={recordModal.handleSave}
      />

      {currentPageData?.type === 'story' && currentStory && aiPrompts.length > 0 && (
        <FloatingInsightCard
          followUp={aiPrompts[0]}
          storyId={currentStory.id}
          onAnswer={() => {
            handlePromptClick({
              title: aiPrompts[0].text,
              text: aiPrompts[0].text,
            });
          }}
        />
      )}
    </div>
  );
}

// Force dynamic rendering to avoid SSG issues with window.location
export const dynamic = 'force-dynamic';
