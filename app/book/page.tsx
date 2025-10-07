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
import BookNav, { type BookNavEntry } from "@/components/ui/BookNav";
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
    age: story.lifeAge,
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
        className="w-full object-cover rounded-lg memory-photo"
      />
      {hasMultiplePhotos && (
        <>
          {/* Navigation arrows with cleaner design */}
          {currentPhotoIndex > 0 && (
            <button
              onClick={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {currentPhotoIndex < photos.length - 1 && (
            <button
              onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Photo counter */}
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-white text-sm font-medium">
              {currentPhotoIndex + 1} / {photos.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Single page renderer
const BookPageRenderer = ({
  page,
  onNavigateToPage
}: {
  page: BookPage;
  onNavigateToPage?: (pageNumber: number) => void;
}) => {
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

  // Render intro page
  if (page.type === 'intro') {
    return (
      <article className={`page ${page.isLeftPage ? 'page--left' : 'page--right'}`}>
        <div className="page-content px-8 py-16 flex flex-col items-center justify-center text-center h-full">
          <div className="space-y-8">
            <h1 className="text-5xl font-serif text-gray-800 mb-4" style={{ fontFamily: 'Crimson Text, serif' }}>
              Family Memories
            </h1>
            <div className="w-24 h-1 bg-coral-600 mx-auto"></div>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto italic">
              A collection of cherished moments, stories, and lessons from a life well-lived.
            </p>
            <p className="text-base text-gray-500 mt-8">
              These pages hold the precious memories that shaped our family's journey.
            </p>
          </div>
        </div>
        <div className="page-number">{page.pageNumber}</div>
      </article>
    );
  }

  // Render table of contents
  if (page.type === 'table-of-contents') {
    return (
      <article className={`page ${page.isLeftPage ? 'page--left' : 'page--right'}`}>
        <div className="page-content px-8 py-12">
          <h1 className="text-4xl font-serif text-center mb-8 text-gray-800">Table of Contents</h1>
          <div className="space-y-6">
            {page.tocEntries?.map((entry) => (
              <div key={entry.decade} className="space-y-2">
                <h2 className="text-xl font-serif font-semibold text-gray-700 border-b border-gray-300 pb-1">
                  {entry.decadeTitle}
                </h2>
                <div className="space-y-1 pl-4">
                  {entry.stories.map((story, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigateToPage && onNavigateToPage(story.pageNumber - 1)}
                      className="flex justify-between items-baseline text-sm w-full hover:bg-gray-50 px-2 py-1 rounded transition-colors cursor-pointer text-left"
                    >
                      <span className="text-gray-700 flex-1 pr-2 hover:text-coral-600">{story.title}</span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {story.year} • p.{story.pageNumber}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="page-number">{page.pageNumber}</div>
      </article>
    );
  }

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
        {/* Edit button for this story */}
        {(page.type === 'story-start' || page.type === 'story-complete') && page.storyId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/review/book-style?id=${page.storyId}`)}
            className="gap-1 text-xs px-2 py-1 h-auto"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </Button>
        )}
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
              {page.age !== null && page.age !== undefined && page.age > 0 && ` • Age ${page.age}`}
              {page.age !== null && page.age !== undefined && page.age === 0 && ` • Birth`}
              {page.age !== null && page.age !== undefined && page.age < 0 && ` • Before birth`}
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

  // Convert to book data structure and build navigation
  const { pages, spreads, storyPageIndex, navEntries } = useMemo(() => {
    if (!stories || stories.length === 0) {
      return { pages: [], spreads: [], storyPageIndex: -1, navEntries: [] };
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

    // Build navigation entries: TOC + decade markers
    const navigationEntries: BookNavEntry[] = [];

    // Add TOC as first entry
    const tocPageIndex = bookPages.findIndex(p => p.type === 'table-of-contents');
    if (tocPageIndex >= 0) {
      navigationEntries.push({
        id: 'toc',
        label: 'TOC',
        pageNumber: tocPageIndex,
        isTOC: true,
      });
    }

    // Add decade markers
    bookPages.forEach((page, idx) => {
      if (page.type === 'decade-marker' && page.decade) {
        const label = page.decade === 'birth-year'
          ? (page.decadeTitle?.split(' ')[0] || 'Birth')
          : page.decade.replace('decade-', '').replace('s', '');
        navigationEntries.push({
          id: page.decade,
          label: label,
          pageNumber: idx,
        });
      }
    });

    return {
      pages: bookPages,
      spreads: bookSpreads,
      storyPageIndex: pageIndex,
      navEntries: navigationEntries,
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

  const navigateToPage = (pageIndex: number) => {
    if (isMobile) {
      setCurrentMobilePage(Math.min(Math.max(0, pageIndex), totalPages - 1));
    } else {
      const spreadIndex = Math.floor(pageIndex / 2);
      setCurrentSpreadIndex(Math.min(Math.max(0, spreadIndex), totalSpreads - 1));
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
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-coral-500" />
          <h1 className="text-2xl font-bold">Book</h1>
        </div>
      </div>

      {/* Fixed Navigation Arrows - Outside of book container */}
      {/* Desktop arrows */}
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

      {/* Mobile arrows */}
      {isMobile && currentMobilePage > 0 && (
        <button
          onClick={goToPrevious}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg active:scale-95 transition-all flex items-center justify-center border border-gray-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {isMobile && currentMobilePage < totalPages - 1 && (
        <button
          onClick={goToNext}
          className="fixed right-2 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg active:scale-95 transition-all flex items-center justify-center border border-gray-200"
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* Book Navigation */}
      {navEntries.length > 0 && (
        <BookNav
          entries={navEntries}
          currentPage={isMobile ? currentMobilePage : currentSpreadIndex * 2}
          onNavigate={navigateToPage}
        />
      )}

      {/* Book Content */}
      <div className="book-container relative" {...swipeHandlers}>

        <div className="book-spread">
          {isMobile ? (
            // Mobile: Single page view
            <BookPageRenderer page={pages[currentMobilePage]} onNavigateToPage={navigateToPage} />
          ) : (
            // Desktop: Two-page spread
            <>
              {spreads[currentSpreadIndex] && (
                <>
                  <BookPageRenderer page={spreads[currentSpreadIndex][0]} onNavigateToPage={navigateToPage} />
                  {spreads[currentSpreadIndex][1] && (
                    <BookPageRenderer page={spreads[currentSpreadIndex][1]} onNavigateToPage={navigateToPage} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Simplified Bottom Bar - Just Page Number */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 z-30 md:bottom-0 md:left-20 md:z-40">
        <div className="flex items-center justify-center w-full px-4 py-2 md:max-w-7xl md:mx-auto">
          <div className="text-sm md:text-base text-muted-foreground font-medium">
            Page {isMobile ? currentMobilePage + 1 : currentSpreadIndex * 2 + 1} of {totalPages}
          </div>
        </div>
      </div>

      {/* Record Modal */}
      <RecordModal isOpen={isOpen} onClose={close} />
    </div>
  );
}