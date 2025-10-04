"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRecordModal } from "@/hooks/use-record-modal";
import RecordModal from "@/components/RecordModal";
import FloatingInsightCard from "@/components/FloatingInsightCard";
import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "@/hooks/use-mobile";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import {
  paginateBook,
  getPageSpreads,
  type Story as PaginationStory,
  type BookPage,
  type DecadeGroup,
  MEASUREMENTS,
} from "@/lib/bookPagination";

const logoUrl = "/HW_logo_mic_clean.png";

// Map the existing Story interface to our pagination Story type
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

// Convert Story to PaginationStory
const convertToPaginationStory = (story: Story): PaginationStory => {
  const photos = story.photos?.map(p => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    isHero: p.isHero,
  })) || (story.photoUrl ? [{
    id: "legacy",
    url: story.photoUrl,
    isHero: true,
  }] : []);

  return {
    id: story.id,
    title: story.title,
    content: story.transcription || "",
    year: story.storyYear.toString(),
    date: story.storyDate,
    audioUrl: story.audioUrl || undefined,
    photos,
    lessonLearned: story.wisdomClipText || undefined,
  };
};

// Photo carousel component
const PhotoCarousel = ({ photos }: { photos: PaginationStory['photos'] }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentPhotoIndex];
  const hasMultiplePhotos = photos.length > 1;

  return (
    <div className="relative mb-4">
      <img
        src={currentPhoto.url}
        alt="Memory"
        className="w-full h-full object-cover rounded-lg"
        style={{ maxHeight: `${MEASUREMENTS.PHOTO_AREA}px` }}
      />
      {hasMultiplePhotos && (
        <>
          {/* Side navigation arrows */}
          <button
            onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
            disabled={currentPhotoIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
            disabled={currentPhotoIndex === photos.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentPhotoIndex
                    ? "bg-white scale-110"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to photo ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Single page renderer
const BookPageRenderer = ({ page }: { page: BookPage }) => {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playbackProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const toggleAudio = () => {
    if (!page.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(page.audioUrl);
      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      });
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      });
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Render decade marker
  if (page.type === 'decade-marker') {
    return (
      <article className={`page ${page.isLeftPage ? 'page--left' : 'page--right'}`}>
        <DecadeIntroPage
          decade={page.decade || ''}
          title={page.decadeTitle || ''}
          storiesCount={page.storiesInDecade || 0}
        />
        <div className="page-number">{page.pageNumber}</div>
      </article>
    );
  }

  // Render story pages
  return (
    <article className={`page ${page.isLeftPage ? 'page--left' : 'page--right'}`}>
      <div className="running-header">
        <span className={page.isLeftPage ? "header-left" : "header-right"}>
          {page.isLeftPage ? "Heritage Whisper" : "Family Memories"}
        </span>
      </div>

      <div className="page-content">
        {/* Photos - only on first page of story */}
        {(page.type === 'story-start' || page.type === 'story-complete') && page.photos && (
          <PhotoCarousel photos={page.photos} />
        )}

        {/* Title and date - only on first page */}
        {(page.type === 'story-start' || page.type === 'story-complete') && (
          <div className="memory-header">
            <h2 className="memory-title">{page.title}</h2>
            <div className="memory-year">
              {page.year}
              {page.date && ` • ${page.date}`}
            </div>
          </div>
        )}

        {/* Audio player - only on first page */}
        {(page.type === 'story-start' || page.type === 'story-complete') && page.audioUrl && (
          <div className="audio-wrapper">
            <div className="audio-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAudio}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4 text-primary ml-0.5" />
                  )}
                </button>
                <div className="flex-1 audio-progress-container">
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

        {/* Story text */}
        {page.text && (
          <div className="memory-body">
            <div className="prose prose-lg max-w-none">
              {page.text.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0 leading-relaxed text-justify">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Lesson learned - only on last page */}
        {(page.type === 'story-end' || page.type === 'story-complete') && page.lessonLearned && (
          <div className="wisdom mt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="wisdom-label text-amber-700 font-semibold">Lesson Learned</span>
            </div>
            <blockquote className="text-lg italic text-gray-800 leading-relaxed mx-auto border-l-4 border-amber-400 pl-4">
              "{page.lessonLearned}"
            </blockquote>
          </div>
        )}
      </div>

      <div className="page-number">{page.pageNumber}</div>
    </article>
  );
};

export default function BookViewNew() {
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [currentMobilePage, setCurrentMobilePage] = useState(0);
  const { isOpen, open, close } = useRecordModal();

  // Get storyId from URL parameters
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const storyIdFromUrl = searchParams.get('storyId');

  // Fetch stories - API returns { stories: [...] }
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  const stories = data?.stories || [];

  // Convert to book data structure
  const { pages, spreads, storyPageIndex } = useMemo(() => {
    if (!stories || stories.length === 0) {
      return { pages: [], spreads: [], storyPageIndex: -1 };
    }

    // Group stories by decade
    const decadeMap = new Map<string, Story[]>();

    stories.forEach((story) => {
      const year = parseInt(story.storyYear?.toString() || '0');
      if (year > 0) {
        const decadeKey = `${Math.floor(year / 10) * 10}s`;
        if (!decadeMap.has(decadeKey)) {
          decadeMap.set(decadeKey, []);
        }
        decadeMap.get(decadeKey)!.push(story);
      }
    });

    // Convert to DecadeGroup array
    const decadeGroups: DecadeGroup[] = Array.from(decadeMap.entries())
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([decade, storyList]) => ({
        decade,
        title: `The ${decade}`,
        stories: storyList
          .sort((a, b) => (a.storyYear || 0) - (b.storyYear || 0)) // Sort stories within decade chronologically
          .map(convertToPaginationStory),
      }));

    // Paginate the entire book
    const bookPages = paginateBook(decadeGroups);
    const bookSpreads = getPageSpreads(bookPages);

    // Find the page index for the story if storyId is provided
    let pageIndex = -1;
    if (storyIdFromUrl) {
      pageIndex = bookPages.findIndex(page => page.storyId === storyIdFromUrl);
    }

    return {
      pages: bookPages,
      spreads: bookSpreads,
      storyPageIndex: pageIndex,
    };
  }, [stories, storyIdFromUrl]);

  // Navigate to story page when storyId is found
  useEffect(() => {
    if (storyPageIndex >= 0) {
      if (isMobile) {
        setCurrentMobilePage(storyPageIndex);
      } else {
        // For desktop, find the spread that contains this page
        const spreadIndex = Math.floor(storyPageIndex / 2);
        setCurrentSpreadIndex(spreadIndex);
      }
    }
  }, [storyPageIndex, isMobile]);

  // Navigation
  const totalSpreads = spreads.length;
  const totalPages = pages.length;

  const goToPrevious = () => {
    if (isMobile) {
      setCurrentMobilePage(prev => Math.max(0, prev - 1));
    } else {
      setCurrentSpreadIndex(prev => Math.max(0, prev - 1));
    }
  };

  const goToNext = () => {
    if (isMobile) {
      setCurrentMobilePage(prev => Math.min(totalPages - 1, prev + 1));
    } else {
      setCurrentSpreadIndex(prev => Math.min(totalSpreads - 1, prev + 1));
    }
  };

  // Swipe handling for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    trackMouse: false,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, totalPages, totalSpreads]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Stories Yet</h2>
          <p className="text-muted-foreground mb-6">Start recording your first memory to see it here.</p>
          <Button onClick={open} className="gap-2">
            <Plus className="w-4 h-4" />
            Record Your First Story
          </Button>
        </div>
        <RecordModal isOpen={isOpen} onClose={close} />
      </div>
    );
  }

  return (
    <div className="book-view min-h-screen bg-background">
      {/* Header */}
      <div className="book-header">
        <img src={logoUrl} alt="Heritage Whisper" className="h-10 w-auto" />
        {/* Edit button - only show if current page has a story */}
        {(() => {
          const currentPage = isMobile ? pages[currentMobilePage] : spreads[currentSpreadIndex]?.[0];
          const storyId = currentPage?.storyId;
          return storyId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/review/book-style?id=${storyId}`)}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          ) : null;
        })()}
      </div>

      {/* Fixed Navigation Arrows - Outside of book container */}
      {!isMobile && currentSpreadIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border border-gray-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700 group-hover:text-coral-600 transition-colors" />
        </button>
      )}

      {!isMobile && currentSpreadIndex < totalSpreads - 1 && (
        <button
          onClick={goToNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border border-gray-200"
          aria-label="Next page"
        >
          <ChevronRight className="w-7 h-7 text-gray-700 group-hover:text-coral-600 transition-colors" />
        </button>
      )}

      {/* Book Content */}
      <div className="book-container relative" {...swipeHandlers}>

        <div className="book-spread">
          {isMobile ? (
            // Mobile: Single page view
            <BookPageRenderer page={pages[currentMobilePage]} />
          ) : (
            // Desktop: Two-page spread
            <>
              {spreads[currentSpreadIndex] && (
                <>
                  <BookPageRenderer page={spreads[currentSpreadIndex][0]} />
                  {spreads[currentSpreadIndex][1] && (
                    <BookPageRenderer page={spreads[currentSpreadIndex][1]} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="book-navigation">
        <Button
          variant="ghost"
          onClick={goToPrevious}
          disabled={isMobile ? currentMobilePage === 0 : currentSpreadIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </Button>

        <div className="page-indicator">
          {isMobile
            ? `Page ${currentMobilePage + 1} of ${totalPages}`
            : `Pages ${currentSpreadIndex * 2 + 1}-${Math.min(
                currentSpreadIndex * 2 + 2,
                totalPages
              )} of ${totalPages}`
          }
        </div>

        <Button
          variant="ghost"
          onClick={goToNext}
          disabled={
            isMobile
              ? currentMobilePage === totalPages - 1
              : currentSpreadIndex === totalSpreads - 1
          }
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Record Modal */}
      <RecordModal isOpen={isOpen} onClose={close} />
    </div>
  );
}