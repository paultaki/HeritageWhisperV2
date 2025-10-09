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
import { useViewportConfig } from "./components/ViewportManager";
import {
  paginateBook,
  getPageSpreads,
  type Story as PaginationStory,
  type BookPage,
  type DecadeGroup,
  MEASUREMENTS,
} from "@/lib/bookPagination";

const logoUrl = "/HW_logo_mic_clean.png";

// Dynamic pagination constants
const LINE_GUARD = 2;                 // px safety margin
const HERO_MIN_TOP = 0;               // minimum top margin for hero (matches side margins)
const HERO_MAX_TOP = 37;              // maximum top margin if space is available
const MIN_MOVE_UNIT = 12;             // don't chase tiny adjustments

// Helper: Get element height including margins
function outerHeightWithMargins(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  const mt = parseFloat(cs.marginTop) || 0;
  const mb = parseFloat(cs.marginBottom) || 0;
  return r.height + mt + mb;
}

// Helper: Get page content container
function pageContent(el: HTMLElement | null): HTMLElement | null {
  return el?.querySelector<HTMLElement>(".book-page-content") || el;
}

// Audio Manager for single playback
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentId: string | null = null;
  private listeners: Map<string, (playing: boolean, time: number) => void> = new Map();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  register(id: string, callback: (playing: boolean, time: number) => void) {
    this.listeners.set(id, callback);
  }

  unregister(id: string) {
    if (this.currentId === id && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentId = null;
    }
    this.listeners.delete(id);
  }

  async play(id: string, audioUrl: string): Promise<void> {
    if (this.currentAudio && this.currentId !== id) {
      this.currentAudio.pause();
      this.notifyListeners(this.currentId!, false, 0);
    }

    if (this.currentId === id && this.currentAudio) {
      if (this.currentAudio.paused) {
        await this.currentAudio.play();
        this.notifyListeners(id, true, this.currentAudio.currentTime);
      } else {
        this.currentAudio.pause();
        this.notifyListeners(id, false, this.currentAudio.currentTime);
      }
    } else {
      this.currentAudio = new Audio(audioUrl);
      this.currentId = id;

      this.currentAudio.addEventListener('ended', () => {
        this.notifyListeners(id, false, 0);
        this.currentAudio = null;
        this.currentId = null;
      });

      this.currentAudio.addEventListener('timeupdate', () => {
        if (this.currentAudio) {
          this.notifyListeners(id, true, this.currentAudio.currentTime);
        }
      });

      this.currentAudio.addEventListener('loadedmetadata', () => {
        if (this.currentAudio) {
          this.notifyListeners(id, false, 0);
        }
      });

      await this.currentAudio.play();
      this.notifyListeners(id, true, 0);
    }
  }

  stopAll() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      if (this.currentId) {
        this.notifyListeners(this.currentId, false, 0);
      }
      this.currentAudio = null;
      this.currentId = null;
    }
  }

  private notifyListeners(id: string, playing: boolean, time: number) {
    const callback = this.listeners.get(id);
    if (callback) callback(playing, time);
  }

  getDuration(id: string): number {
    if (this.currentId === id && this.currentAudio) {
      return this.currentAudio.duration || 0;
    }
    return 0;
  }
}

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

// Lesson Learned callout component
const LessonCallout = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <aside className="lesson-callout">
      <div className="title">Lesson Learned</div>
      <div>{text}</div>
    </aside>
  );
};

// Photo carousel component
const PhotoCarousel = ({ photos }: { photos: PaginationStory['photos'] }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentPhotoIndex];
  const hasMultiplePhotos = photos.length > 1;

  return (
    <div className="relative mb-4 memory-hero">
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
  const audioManager = AudioManager.getInstance();
  const audioId = page.storyId || page.pageNumber.toString();
  const pageContentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const playbackProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Register with audio manager
  useEffect(() => {
    audioManager.register(audioId, (playing, time) => {
      setIsPlaying(playing);
      setCurrentTime(time);
      if (playing) {
        const dur = audioManager.getDuration(audioId);
        if (dur > 0) setDuration(dur);
      }
    });

    // Load duration for this audio
    if (page.audioUrl) {
      const audio = new Audio(page.audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
    }

    return () => {
      audioManager.unregister(audioId);
    };
  }, [audioId, page.audioUrl]);

  // Overflow detection - check if content exceeds page capacity
  useEffect(() => {
    const checkOverflow = () => {
      if (!pageContentRef.current) return;

      const element = pageContentRef.current;
      const isOverflowing = element.scrollHeight > element.clientHeight;

      if (isOverflowing && !hasOverflow) {
        setHasOverflow(true);
        console.warn(`Page ${page.pageNumber} has overflow:`, {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          overflow: element.scrollHeight - element.clientHeight,
          pageType: page.type,
          storyId: page.storyId,
          hasAudio: !!page.audioUrl,
        });
      } else if (!isOverflowing && hasOverflow) {
        setHasOverflow(false);
      }
    };

    // Check overflow after render and when content changes
    const timeoutId = setTimeout(checkOverflow, 100);

    return () => clearTimeout(timeoutId);
  }, [page, hasOverflow]);

  const toggleAudio = async () => {
    if (!page.audioUrl) return;
    await audioManager.play(audioId, page.audioUrl);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render intro page
  if (page.type === 'intro') {
    return (
      <article className={`page ${page.isLeftPage ? 'page--left' : 'page--right'}`}>
        <div
          ref={pageContentRef}
          className="page-content px-8 py-16 flex flex-col items-center justify-center text-center h-full"
        >
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
        <div ref={pageContentRef} className="page-content px-8 py-12">
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
    <article className={`page book-page ${page.isLeftPage ? 'page--left' : 'page--right'}`}>
      <div className="running-header">
        <span className={page.isLeftPage ? "header-left" : "header-right"}>
          {page.isLeftPage ? "Heritage Whisper" : "Family Memories"}
        </span>
        {/* Edit button for this story */}
        {(page.type === 'story-start' || page.type === 'story-complete') && page.storyId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/review/book-style?id=${page.storyId}&returnPath=${encodeURIComponent(`/book?storyId=${page.storyId}`)}`)}
            className="gap-1 text-xs px-2 py-1 h-auto"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </Button>
        )}
      </div>

      <div
        ref={pageContentRef}
        className="page-content book-page-content"
      >
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
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={toggleAudio}
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-all flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  ) : (
                    <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary ml-0.5" />
                  )}
                </button>
                <div className="flex-1 audio-progress-container">
                  <div
                    className="audio-bar"
                    style={{
                      background: "rgba(0,0,0,0.1)",
                      height: "6px",
                      minHeight: "6px",
                      maxHeight: "6px",
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: "999px",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        width: `${playbackProgress}%`,
                        height: "6px",
                        minHeight: "6px",
                        maxHeight: "6px",
                        background: "linear-gradient(90deg, #E85D5D, #FF935F)",
                        position: "absolute",
                        top: "0",
                        left: "0",
                        borderRadius: "3px",
                        zIndex: 1,
                        display: "block",
                        fontSize: "0",
                        lineHeight: "0",
                        padding: "0",
                        margin: "0",
                        boxSizing: "border-box",
                        transition: "width 0.1s linear",
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">{formatTime(currentTime)}</span>
                <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">{formatTime(duration)}</span>
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
          <LessonCallout text={page.lessonLearned} />
        )}
      </div>

      <div className="page-number">{page.pageNumber}</div>
    </article>
  );
};

export default function BookViewNew() {
  const router = useRouter();
  const { user, session } = useAuth();
  const isMobile = useIsMobile();
  const viewportConfig = useViewportConfig(); // Intelligent viewport detection
  const showSpreadView = viewportConfig.mode === 'spread'; // Use viewport config directly
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [currentMobilePage, setCurrentMobilePage] = useState(0);
  const { isOpen, open, close } = useRecordModal();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [isPaginationReady, setIsPaginationReady] = useState(false);

  // Get storyId from URL parameters
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const storyIdFromUrl = searchParams.get('storyId');

  // Fetch stories - API returns { stories: [...] }
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  const stories = data?.stories || [];

  // Wait for fonts to be ready for accurate measurements
  // But don't block initial render - use optimistic pagination
  useEffect(() => {
    async function waitForFonts() {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }

      try {
        // Wait for fonts with timeout fallback
        const fontsPromise = document.fonts.ready;
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1000));

        await Promise.race([fontsPromise, timeoutPromise]);

        // Mark fonts as ready for re-pagination with accurate metrics
        setFontsReady(true);
      } catch (error) {
        console.error('Error waiting for fonts:', error);
        // Mark as ready anyway to not block
        setFontsReady(true);
      }
    }

    waitForFonts();
  }, []); // Run once on mount

  // Convert to book data structure with optimistic rendering
  const { pages, spreads, storyPageIndex } = useMemo(() => {
    if (!stories || stories.length === 0) {
      return { pages: [], spreads: [], storyPageIndex: -1 };
    }

    // Group stories by decade (only stories marked for book)
    const decadeMap = new Map<string, Story[]>();

    stories
      .filter(story => story.includeInBook === true)
      .forEach((story) => {
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

    // Paginate the entire book (optimistically, will re-run when fonts load)
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
  }, [stories, storyIdFromUrl, fontsReady]); // Re-paginate when fonts load

  // Signal that pagination is complete when pages are ready
  useEffect(() => {
    if (pages.length > 0 || (stories && stories.length === 0)) {
      setIsPaginationReady(true);
    }
  }, [pages, stories]);

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

  // Stop audio when page changes
  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.stopAll();
  }, [currentMobilePage, currentSpreadIndex]);

  // Dynamic pagination: Maximize first page usage
  useEffect(() => {
    // Only run for spread view with 2+ pages
    if (isMobile || !showSpreadView || spreads.length === 0) return;
    if (currentSpreadIndex >= spreads.length) return;

    const spread = spreads[currentSpreadIndex];
    if (!spread || !spread[1]) return; // Need 2 pages

    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      const bookStage = document.querySelector('.book-stage');
      if (!bookStage) return;

      const pageElements = bookStage.querySelectorAll<HTMLElement>('.book-page');
      if (pageElements.length < 2) return;

      const page1 = pageElements[0];
      const page2 = pageElements[1];
      const c1 = pageContent(page1);
      const c2 = pageContent(page2);
      if (!c1 || !c2) return;

      // 1) Adjust hero top margin if needed (starts at 0, can go up to 37px for balance)
      const hero = page1.querySelector<HTMLElement>('.memory-hero');
      if (hero) {
        const fits = () => {
          const h = c1.scrollHeight - c1.clientHeight;
          return h <= LINE_GUARD;
        };

        // Start at minimum (0) for maximum content space
        page1.style.setProperty("--hero-top", `${HERO_MIN_TOP}px`);

        // If we have excess headroom, we can add some top margin for visual balance
        const headroom = c1.clientHeight - c1.scrollHeight;
        if (headroom > HERO_MAX_TOP) {
          // Can afford to add some margin for visual breathing room
          page1.style.setProperty("--hero-top", `${HERO_MAX_TOP}px`);
        } else if (headroom > MIN_MOVE_UNIT) {
          // Add partial margin based on available space
          const margin = Math.floor(headroom / 2); // Use half the headroom
          page1.style.setProperty("--hero-top", `${Math.min(margin, HERO_MAX_TOP)}px`);
        }
      }

      // 2) Pull blocks back from page 2 while there's headroom on page 1
      const getHeadroom = () => c1.clientHeight - c1.scrollHeight;

      // Find next movable block
      const movable = () =>
        Array.from(c2.children).find((n) => n instanceof HTMLElement) as HTMLElement | undefined;

      let guard = 64; // prevent runaway loops
      while (getHeadroom() > LINE_GUARD && guard-- > 0) {
        const next = movable();
        if (!next) break;
        const need = outerHeightWithMargins(next);
        if (need <= getHeadroom() - LINE_GUARD) {
          c1.appendChild(next);
        } else {
          break;
        }
      }

      // 3) Ensure callouts and elements never split visually
      bookStage.querySelectorAll<HTMLElement>('.lesson-callout, p, figure, img, audio')
        .forEach(el => {
          el.style.breakInside = "avoid";
          el.style.pageBreakInside = "avoid";
        });
    });
  }, [currentSpreadIndex, spreads, isMobile, showSpreadView, pages]);

  // Export PDF functions
  const exportPDF = async (format: '2up' | 'trim') => {
    if (!user || !session?.access_token) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bookId: 'default' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heritage-book-${format}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  // Show loading state while fetching stories OR pagination is not ready yet
  if (isLoading || !isPaginationReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {isLoading ? 'Loading your stories...' : 'Preparing your book...'}
          </p>
          {!fontsReady && !isLoading && (
            <p className="mt-2 text-sm text-muted-foreground/70">Loading fonts...</p>
          )}
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
          <BookOpen className="w-8 h-8" style={{ color: '#1f0f08' }} />
          <h1 className="text-2xl font-bold">Book</h1>
        </div>

        {/* Export PDF Button */}
        <div className="relative export-menu-container">
          <Button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting || stories.length === 0}
            variant="outline"
            className="gap-2"
            aria-label={isExporting ? 'Exporting PDF' : 'Export PDF'}
          >
            <Share2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </span>
          </Button>

          {/* Export Menu Dropdown */}
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50">
              <button
                onClick={() => exportPDF('2up')}
                className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="font-semibold text-sm">2-Up (Home Print)</div>
                <div className="text-xs text-gray-500 mt-1">
                  Two 5.5×8.5" pages on Letter landscape
                </div>
              </button>
              <button
                onClick={() => exportPDF('trim')}
                className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-50 transition-colors mt-1"
              >
                <div className="font-semibold text-sm">Trim PDF (POD)</div>
                <div className="text-xs text-gray-500 mt-1">
                  Individual 5.5×8.5" pages for professional printing
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Navigation Arrows - Premium 64px touch targets */}
      {/* Spread view arrows */}
      {showSpreadView && currentSpreadIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="nav-arrow nav-arrow--prev fixed top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border border-gray-200"
          aria-label="Previous spread"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700 group-hover:text-coral-600 transition-colors" />
        </button>
      )}

      {showSpreadView && currentSpreadIndex < totalSpreads - 1 && (
        <button
          onClick={goToNext}
          className="nav-arrow fixed right-8 top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border border-gray-200"
          aria-label="Next spread"
        >
          <ChevronRight className="w-7 h-7 text-gray-700 group-hover:text-coral-600 transition-colors" />
        </button>
      )}

      {/* Single page arrows */}
      {!showSpreadView && currentMobilePage > 0 && (
        <button
          onClick={goToPrevious}
          className="nav-arrow nav-arrow--prev fixed top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white/95 hover:bg-gray-50 shadow-xl active:scale-95 transition-all flex items-center justify-center border border-gray-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700" />
        </button>
      )}

      {!showSpreadView && currentMobilePage < totalPages - 1 && (
        <button
          onClick={goToNext}
          className="nav-arrow fixed right-8 top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white/95 hover:bg-gray-50 shadow-xl active:scale-95 transition-all flex items-center justify-center border border-gray-200"
          aria-label="Next page"
        >
          <ChevronRight className="w-7 h-7 text-gray-700" />
        </button>
      )}

      {/* Book Content - Always centered */}
      <div className="book-container relative" {...swipeHandlers}>
        {/* Spine hint for single-page mode - behind everything */}
        {!showSpreadView && (
          <div className="spine-hint" aria-hidden="true" />
        )}

        {/* Book stage - explicit width for centering */}
        <div
          className="book-stage mx-auto relative"
          style={{
            width: `${viewportConfig.scaledWidth}px`,
            transition: 'width 140ms ease-out',
          }}
        >
          <div
            className={`book-spread ${!showSpreadView ? 'single-mode' : 'spread-mode'}`}
            style={{
              transform: viewportConfig.scale !== 1.0 ? `scale(${viewportConfig.scale})` : undefined,
              transformOrigin: 'top center',
              transition: 'transform 140ms ease-out',
            }}
          >
            {!showSpreadView ? (
              // Single page view - centered by explicit width
              <BookPageRenderer page={pages[currentMobilePage]} onNavigateToPage={navigateToPage} />
            ) : (
              // Spread view - two pages side-by-side
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
      </div>

      {/* Simplified Bottom Bar - Just Page Number */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 z-30 md:bottom-0 md:left-28 md:z-40">
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