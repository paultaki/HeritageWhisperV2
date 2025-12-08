"use client";

// Prevent static generation for this user-specific page
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { BookPageV4 } from "./components/BookPageV4";
import DarkBookProgressBarV4 from "./components/DarkBookProgressBarV4";
import { BookPage as BookPageType } from "@/lib/bookPagination";

// Lazy load mobile book view to reduce initial bundle for desktop users (~30-50KB savings)
const MobileBookViewV2 = lazy(() => import("../book-new/components/MobileBookViewV2"));

// Import premium book CSS
import "./book.css";

// Import handwriting font
import { Caveat } from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

// Story interface
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
    displayUrl?: string;
    masterUrl?: string;
    transform?: { zoom: number; position: { x: number; y: number } };
    caption?: string;
    isHero?: boolean;
    width?: number;
    height?: number;
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
  chapterId?: string;
  chapterOrderIndex?: number;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
}

/**
 * Book V4 - Premium Skeuomorphic Book View
 *
 * Enhanced version with:
 * - Cream paper background (#F5F1E8)
 * - Paper texture overlay (SVG noise)
 * - Gutter shadow (spine depth)
 * - Page stack lines (outer edges)
 * - Drop caps on first paragraph
 * - Premium typography (1.85 line-height)
 * - Photo frames with rotation/shadow
 * - Waveform audio player
 * - Hover-only edit button
 * - Dual theme support (sepia/gold)
 */
function BookV4PageContent() {
  const { user } = useAuth();
  const { activeContext, isLoading: isContextLoading } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own';
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlStoryId = searchParams?.get('storyId') || undefined;
  const urlAutoplay = searchParams?.get('autoplay') === '1';

  // State initialization from sessionStorage
  const [isBookOpen, setIsBookOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('book-is-open') === 'true';
    }
    return false;
  });
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('book-spread-index');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [currentMobilePage, setCurrentMobilePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('book-mobile-page');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  // Font size persistence
  useEffect(() => {
    const savedFontSize = localStorage.getItem('bookV4FontSize');
    if (savedFontSize) {
      const parsed = parseInt(savedFontSize, 10);
      if (!isNaN(parsed) && parsed >= 14 && parsed <= 28) {
        setFontSize(parsed);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bookV4FontSize', fontSize.toString());
  }, [fontSize]);

  // Session storage persistence
  useEffect(() => {
    sessionStorage.setItem('book-is-open', isBookOpen.toString());
  }, [isBookOpen]);

  useEffect(() => {
    sessionStorage.setItem('book-spread-index', currentSpreadIndex.toString());
  }, [currentSpreadIndex]);

  useEffect(() => {
    sessionStorage.setItem('book-mobile-page', currentMobilePage.toString());
  }, [currentMobilePage]);

  const flowLeftRef = useRef<HTMLDivElement>(null);
  const flowRightRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Screen reader announcements
  const announcePageChange = (spreadIndex: number) => {
    if (liveRegionRef.current && spreadIndex >= 0) {
      const pageNum = spreadIndex * 2 + 1;
      liveRegionRef.current.textContent = `Page ${pageNum}`;

      setTimeout(() => {
        const leftHeading = document.querySelector(`#page-${spreadIndex}-left h2`) as HTMLElement;
        const rightHeading = document.querySelector(`#page-${spreadIndex}-right h2`) as HTMLElement;
        const heading = leftHeading || rightHeading;

        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }
      }, 100);
    }
  };

  // Data fetching
  const storytellerId = activeContext?.storytellerId || user?.id;
  const queryEnabled = !isContextLoading && ((!!user && !!user.id) || !!activeContext);

  const { data, isLoading, isFetching } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `${getApiUrl("/api/stories")}?storyteller_id=${storytellerId}`
        : getApiUrl("/api/stories");

      const res = await apiRequest("GET", url);
      return await res.json();
    },
    enabled: queryEnabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const stories = data?.stories || [];

  // Filter and sort stories
  const bookStories = stories.filter((s) => {
    if (s.includeInBook !== true) return false;
    if (!s.storyYear) return false;
    if (!s.transcription) return false;
    return true;
  });

  const sortedStories = useMemo(() =>
    [...bookStories].sort((a, b) => a.storyYear - b.storyYear),
    [bookStories]
  );

  // Group by decade
  const decadeGroups = useMemo(() => {
    const groups = new Map<string, Story[]>();

    sortedStories.forEach((story) => {
      const year = story.storyYear;
      const decade = `${Math.floor(year / 10) * 10}s`;

      if (!groups.has(decade)) {
        groups.set(decade, []);
      }
      groups.get(decade)!.push(story);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [sortedStories]);

  const [viewMode, setViewMode] = useState<'chronological' | 'chapters'>('chronological');

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["chapters", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `${getApiUrl("/api/chapters")}?storyteller_id=${storytellerId}`
        : getApiUrl("/api/chapters");
      const res = await apiRequest("GET", url);
      return res.json().then((d: any) => d.chapters);
    },
    enabled: !!user,
  });

  // Enriched stories with chapter titles
  const enrichedStories = useMemo(() => {
    return sortedStories.map(story => {
      const chapter = chapters.find(c => c.id === story.chapterId);
      return {
        ...story,
        chapterTitle: chapter ? chapter.title : undefined
      };
    });
  }, [sortedStories, chapters]);

  // Group by chapters
  const chapterGroups = useMemo(() => {
    if (viewMode !== 'chapters' || chapters.length === 0) return [];

    const groups: { chapter: { id: string, title: string }, stories: Story[] }[] = [];
    const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);

    sortedChapters.forEach(chapter => {
      const chapterStories = sortedStories.filter(s => s.chapterId === chapter.id);
      chapterStories.sort((a, b) => (a.chapterOrderIndex || 0) - (b.chapterOrderIndex || 0));

      if (chapterStories.length > 0) {
        groups.push({ chapter, stories: chapterStories });
      }
    });

    const orphanedStories = sortedStories.filter(s => !s.chapterId);
    if (orphanedStories.length > 0) {
      groups.push({ chapter: { id: 'uncategorized', title: "Uncategorized" }, stories: orphanedStories });
    }

    return groups;
  }, [sortedStories, chapters, viewMode]);

  // Create spreads
  const spreads = useMemo(() => {
    const result: Array<{
      left?: Story | 'intro' | 'endpaper' | 'blank-endpaper' | 'toc-left' | 'toc-right' | 'add-story' | { type: 'decade'; decade: string; title: string; count: number; isChapter?: boolean };
      right?: Story | 'intro' | 'endpaper' | 'blank-endpaper' | 'toc-left' | 'toc-right' | 'add-story' | { type: 'decade'; decade: string; title: string; count: number; isChapter?: boolean };
      type: 'intro' | 'toc' | 'decade' | 'stories' | 'add-story';
    }> = [];

    result.push({ left: 'endpaper', right: 'intro', type: 'intro' });
    result.push({ left: 'toc-left', right: 'toc-right', type: 'toc' });

    const groupsToRender = viewMode === 'chapters' ? chapterGroups : decadeGroups;

    groupsToRender.forEach((group) => {
      let title: string;
      let id: string;
      let stories: Story[];

      if (Array.isArray(group)) {
        id = group[0];
        stories = group[1];
        const decadeYear = id.replace('s', '');
        title = `The ${decadeYear}s`;
      } else {
        id = group.chapter.id;
        title = group.chapter.title;
        stories = group.stories;
      }

      const groupPage = {
        type: 'decade' as const,
        decade: id,
        title: title,
        count: stories.length,
        isChapter: viewMode === 'chapters'
      };

      const lastSpread = result[result.length - 1];
      const needsNewSpread = !lastSpread || (lastSpread.left && lastSpread.right);

      if (needsNewSpread) {
        result.push({ left: groupPage, right: stories[0], type: 'stories' });

        for (let i = 1; i < stories.length; i += 2) {
          result.push({ left: stories[i], right: stories[i + 1], type: 'stories' });
        }
      } else {
        lastSpread.right = groupPage;
        lastSpread.type = 'decade';

        for (let i = 0; i < stories.length; i += 2) {
          result.push({ left: stories[i], right: stories[i + 1], type: 'stories' });
        }
      }
    });

    // Add the "add new story" page at the end (only for own account)
    if (sortedStories.length > 0) {
      // Check if the last spread has an empty right side
      const lastSpread = result[result.length - 1];
      if (lastSpread && !lastSpread.right) {
        // Add to the right side of existing spread
        lastSpread.right = 'add-story';
      } else {
        // Create a new spread with add-story on left, blank endpaper on right
        result.push({ left: 'add-story', right: 'blank-endpaper', type: 'add-story' });
      }
    }

    return result;
  }, [decadeGroups, chapterGroups, viewMode, sortedStories.length]);

  // Create book pages for progress bar
  const bookPages: BookPageType[] = useMemo(() => {
    const pages: BookPageType[] = [];
    let pageNum = 1;

    spreads.forEach((spread) => {
      if (spread.left) {
        let pageType: 'intro' | 'table-of-contents' | 'decade-marker' | 'story-start' = 'intro';
        if (typeof spread.left === 'string') {
          if (spread.left === 'intro' || spread.left === 'endpaper' || spread.left === 'blank-endpaper') pageType = 'intro';
          else if (spread.left === 'toc-left' || spread.left === 'toc-right') pageType = 'table-of-contents';
        } else if ('type' in spread.left) {
          pageType = 'decade-marker';
        } else {
          pageType = 'story-start';
        }

        pages.push({
          pageNumber: pageNum++,
          type: pageType,
          isLeftPage: true,
          isRightPage: false,
          decade: typeof spread.left === 'object' && 'decade' in spread.left ? spread.left.decade : undefined,
          decadeTitle: typeof spread.left === 'object' && 'title' in spread.left ? spread.left.title : undefined,
          year: typeof spread.left === 'object' && 'storyYear' in spread.left ? spread.left.storyYear.toString() : undefined,
          isChapter: typeof spread.left === 'object' && 'isChapter' in spread.left ? Boolean(spread.left.isChapter) : undefined,
        });
      }

      if (spread.right) {
        let pageType: 'intro' | 'table-of-contents' | 'decade-marker' | 'story-start' = 'intro';
        if (typeof spread.right === 'string') {
          if (spread.right === 'intro' || spread.right === 'endpaper' || spread.right === 'blank-endpaper') pageType = 'intro';
          else if (spread.right === 'toc-left' || spread.right === 'toc-right') pageType = 'table-of-contents';
        } else if ('type' in spread.right) {
          pageType = 'decade-marker';
        } else {
          pageType = 'story-start';
        }

        pages.push({
          pageNumber: pageNum++,
          type: pageType,
          isLeftPage: false,
          isRightPage: true,
          decade: typeof spread.right === 'object' && 'decade' in spread.right ? spread.right.decade : undefined,
          decadeTitle: typeof spread.right === 'object' && 'title' in spread.right ? spread.right.title : undefined,
          year: typeof spread.right === 'object' && 'storyYear' in spread.right ? spread.right.storyYear.toString() : undefined,
          isChapter: typeof spread.right === 'object' && 'isChapter' in spread.right ? Boolean(spread.right.isChapter) : undefined,
        });
      }
    });

    return pages;
  }, [spreads]);

  // Mobile pages array
  const mobilePages = useMemo(() => {
    const pages: Array<{ type: 'intro' | 'toc' | 'story'; story?: Story; index: number }> = [];
    pages.push({ type: 'intro', index: 0 });
    pages.push({ type: 'toc', index: 1 });
    sortedStories.forEach((story, idx) => {
      pages.push({ type: 'story', story, index: idx + 2 });
    });
    return pages;
  }, [sortedStories]);

  // Validate restored indexes
  useEffect(() => {
    if (spreads.length > 0 && currentSpreadIndex >= spreads.length) {
      setCurrentSpreadIndex(Math.max(0, spreads.length - 1));
    }
  }, [spreads.length, currentSpreadIndex]);

  useEffect(() => {
    if (mobilePages.length > 0 && currentMobilePage >= mobilePages.length) {
      setCurrentMobilePage(Math.max(0, mobilePages.length - 1));
    }
  }, [mobilePages.length, currentMobilePage]);

  // Navigation handlers
  const handleNavigateToPage = useCallback((pageIndex: number) => {
    const spreadIndex = Math.floor(pageIndex / 2);
    setCurrentSpreadIndex(Math.min(Math.max(0, spreadIndex), spreads.length - 1));
  }, [spreads.length]);

  const goToPrevSpread = useCallback(() => {
    if (currentSpreadIndex === 0) {
      // On first page, go back to cover
      setIsBookOpen(false);
    } else {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  }, [currentSpreadIndex]);

  const goToNextSpread = useCallback(() => {
    if (currentSpreadIndex < spreads.length - 1) {
      setCurrentSpreadIndex(currentSpreadIndex + 1);
    }
  }, [currentSpreadIndex, spreads.length]);

  // Get current story ID
  const getCurrentStoryId = useCallback(() => {
    const spread = spreads[currentSpreadIndex];
    if (!spread) return undefined;

    if (spread.left && typeof spread.left === 'object' && 'id' in spread.left) {
      return spread.left.id;
    }
    if (spread.right && typeof spread.right === 'object' && 'id' in spread.right) {
      return spread.right.id;
    }
    return undefined;
  }, [spreads, currentSpreadIndex]);

  // Update session storage with current story
  useEffect(() => {
    const storyId = getCurrentStoryId();
    if (storyId) {
      sessionStorage.setItem('current-book-story-id', storyId);
    } else {
      sessionStorage.removeItem('current-book-story-id');
    }
  }, [getCurrentStoryId]);

  // Reset scroll on spread change
  useEffect(() => {
    if (flowLeftRef.current) flowLeftRef.current.scrollTop = 0;
    if (flowRightRef.current) flowRightRef.current.scrollTop = 0;

    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, [currentSpreadIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevSpread();
        announcePageChange(currentSpreadIndex - 1);
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNextSpread();
        announcePageChange(currentSpreadIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpreadIndex, spreads.length, goToPrevSpread, goToNextSpread]);

  // Preload images for adjacent spreads (reduces perceived navigation delay)
  useEffect(() => {
    if (!isBookOpen || spreads.length === 0) return;
    
    // Ensure currentSpreadIndex is valid
    if (currentSpreadIndex < 0 || currentSpreadIndex >= spreads.length) return;

    // Helper to extract photo URLs from a spread page
    const getPhotoUrls = (page: typeof spreads[0]['left'] | typeof spreads[0]['right']): string[] => {
      if (!page || typeof page === 'string' || 'type' in page) return [];
      const story = page as Story;
      if (!story.photos || story.photos.length === 0) return [];
      
      // Prefer masterUrl for high-res, fall back to displayUrl/url
      return story.photos
        .map(p => p.masterUrl || p.displayUrl || p.url)
        .filter((url): url is string => !!url);
    };

    // Collect URLs from adjacent spreads
    const urlsToPreload: string[] = [];
    
    // Next spread
    if (currentSpreadIndex < spreads.length - 1) {
      const nextSpread = spreads[currentSpreadIndex + 1];
      if (nextSpread) {
        urlsToPreload.push(...getPhotoUrls(nextSpread.left));
        urlsToPreload.push(...getPhotoUrls(nextSpread.right));
      }
    }
    
    // Previous spread (for back navigation)
    if (currentSpreadIndex > 0) {
      const prevSpread = spreads[currentSpreadIndex - 1];
      if (prevSpread) {
        urlsToPreload.push(...getPhotoUrls(prevSpread.left));
        urlsToPreload.push(...getPhotoUrls(prevSpread.right));
      }
    }

    // Preload images using Image constructor (browser will cache them)
    urlsToPreload.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [currentSpreadIndex, spreads, isBookOpen]);

  // URL parameter navigation
  const [navigatedStoryId, setNavigatedStoryId] = useState<string | null>(null);
  // Autoplay state - tracks which story should autoplay (cleared after first render)
  const [autoplayStoryId, setAutoplayStoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!urlStoryId || sortedStories.length === 0 || spreads.length === 0) return;
    if (navigatedStoryId === urlStoryId) return;

    const storyIndex = sortedStories.findIndex(s => s.id === urlStoryId);

    if (storyIndex !== -1) {
      let targetSpreadIndex = 0;

      for (let i = 0; i < spreads.length; i++) {
        const spread = spreads[i];

        if (spread.left && typeof spread.left !== 'string' && !('type' in spread.left)) {
          if ((spread.left as Story).id === urlStoryId) {
            targetSpreadIndex = i;
            break;
          }
        }

        if (spread.right && typeof spread.right !== 'string' && !('type' in spread.right)) {
          if ((spread.right as Story).id === urlStoryId) {
            targetSpreadIndex = i;
            break;
          }
        }
      }

      setCurrentSpreadIndex(targetSpreadIndex);
      setCurrentMobilePage(storyIndex + 2);
      setIsBookOpen(true);
      setNavigatedStoryId(urlStoryId);
      // Set autoplay if requested - will be consumed by BookPageV4
      if (urlAutoplay) {
        setAutoplayStoryId(urlStoryId);
      }
      window.history.replaceState({}, '', '/book');
    }
  }, [urlStoryId, urlAutoplay, sortedStories, spreads, navigatedStoryId]);

  // Loading state
  if (isLoading || isFetching || !data) {
    return (
      <div className="hw-page bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your stories...</p>
        </div>
      </div>
    );
  }

  // No stories state
  if (data && sortedStories.length === 0) {
    return (
      <div className="hw-page bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Book is Empty</h2>
          <p className="text-slate-300 mb-6">Start creating memories to see them appear here.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all"
          >
            Create Your First Memory
          </button>
        </div>
      </div>
    );
  }

  const currentSpread = spreads[currentSpreadIndex] || { left: undefined, right: undefined, type: 'stories' as const };

  // Navigate to story from TOC
  const handleNavigateToStory = (storyId: string) => {
    const mobileStoryIndex = mobilePages.findIndex((page) => {
      return page.type === 'story' && page.story?.id === storyId;
    });

    if (mobileStoryIndex !== -1) {
      setCurrentMobilePage(mobileStoryIndex);
    }

    for (let i = 0; i < spreads.length; i++) {
      const spread = spreads[i];

      if (spread.left && typeof spread.left !== 'string' && !('type' in spread.left) && spread.left.id === storyId) {
        setCurrentSpreadIndex(i);
        return;
      }

      if (spread.right && typeof spread.right !== 'string' && !('type' in spread.right) && spread.right.id === storyId) {
        setCurrentSpreadIndex(i);
        return;
      }
    }
  };

  // Mobile loading fallback for lazy-loaded component
  const MobileLoadingFallback = (
    <div className="flex h-[100dvh] w-screen items-center justify-center bg-neutral-950">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#8B7355]/30 border-t-[#8B7355] mx-auto"></div>
        <p className="text-sm text-white/60">Loading your story...</p>
      </div>
    </div>
  );

  // Closed book cover
  if (!isBookOpen) {
    return (
      <>
        <div className="lg:hidden">
          <Suspense fallback={MobileLoadingFallback}>
            <MobileBookViewV2
              initialStoryId={urlStoryId}
              caveatFont={caveat.className}
              autoplay={urlAutoplay}
            />
          </Suspense>
        </div>

        <div className="hidden lg:block hw-page-full overflow-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-100 text-slate-200 bg-[#0b0d12]">
          <div className="hidden md:block">
            <DarkBookProgressBarV4
              pages={bookPages}
              currentPage={0}
              totalPages={bookPages.length}
              onNavigateToPage={(pageIndex) => {
                setIsBookOpen(true);
                handleNavigateToPage(pageIndex);
              }}
              onTocClick={() => {
                setIsBookOpen(true);
                setShowToc(true);
              }}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          <div className="flex items-center justify-center" style={{ height: "100dvh" }}>
            <ClosedBookCoverV4
              userName={user?.name || "Your"}
              storyCount={sortedStories.length}
              onOpen={() => setIsBookOpen(true)}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile view */}
      <div className="lg:hidden">
        <Suspense fallback={MobileLoadingFallback}>
          <MobileBookViewV2
            initialStoryId={urlStoryId}
            caveatFont={caveat.className}
            autoplay={urlAutoplay}
          />
        </Suspense>
      </div>

      {/* Desktop: Book view */}
      <div className="hidden lg:block hw-page-full overflow-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-100 text-slate-200 bg-[#0b0d12]">
        {/* ARIA live region */}
        <div
          id="sr-live"
          ref={liveRegionRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        ></div>

        {/* Progress bar */}
        <div className="hidden md:block">
          <DarkBookProgressBarV4
            pages={bookPages}
            currentPage={currentSpreadIndex * 2}
            totalPages={bookPages.length}
            onNavigateToPage={handleNavigateToPage}
            onTocClick={() => setShowToc(!showToc)}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        <div className="md:py-2 max-w-[1800px] mr-auto ml-auto pr-4 pb-12 pl-4" style={{ paddingTop: '52px' }}>
          {/* Dual-page spread */}
          <div className="relative mx-auto hidden lg:flex items-center justify-center" style={{ height: "calc(100dvh - 110px)" }}>
            {/* Navigation zones */}
            <button
              onClick={goToPrevSpread}
              className="absolute left-0 bottom-0 z-40 transition-all duration-200"
              style={{ top: "60px", width: "40px", background: "transparent" }}
              aria-label={currentSpreadIndex === 0 ? "Return to book cover" : "Previous page"}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.cursor = "pointer";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            />

            <button
              onClick={goToNextSpread}
              disabled={currentSpreadIndex >= spreads.length - 1}
              className="absolute right-0 bottom-0 z-40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-0"
              style={{ top: "60px", width: "40px", background: "transparent" }}
              aria-label="Next page"
              onMouseEnter={(e) => {
                if (currentSpreadIndex < spreads.length - 1) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            />

            {/* Book container */}
            <div
              className="relative [perspective:2000px]"
              style={{
                width: "min(95vw, calc((100dvh - 160px) * 1.294))",
                aspectRatio: "11 / 8.5",
                maxWidth: "1600px"
              }}
            >
              {/* Ambient shadow */}
              <div className="pointer-events-none absolute -inset-8 rounded-2xl bg-[radial-gradient(1000px_400px_at_50%_30%,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0.04)_35%,transparent_70%)]"></div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"></div>

              {/* Outer book cover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-[20px]"
                style={{
                  top: "-15px",
                  bottom: "-15px",
                  left: "-30px",
                  right: "-30px",
                  background: "linear-gradient(180deg, #2e1f14 0%, #1f150d 100%)",
                  boxShadow: "0 15px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)"
                }}
              ></div>

              {/* Right page */}
              <BookPageV4
                story={currentSpread.right}
                pageNum={currentSpreadIndex * 2 + 2}
                onScroll={() => { }}
                ref={flowRightRef}
                position="right"
                allStories={enrichedStories}
                onNavigateToStory={handleNavigateToStory}
                fontSize={fontSize}
                isOwnAccount={isOwnAccount}
                viewMode={viewMode}
                isPriority={currentSpreadIndex === 0}
                autoplay={autoplayStoryId !== null && currentSpread.right && typeof currentSpread.right !== 'string' && !('type' in currentSpread.right) && (currentSpread.right as Story).id === autoplayStoryId}
                onAutoplayConsumed={() => setAutoplayStoryId(null)}
              />

              {/* Left page */}
              <BookPageV4
                story={currentSpread.left}
                pageNum={currentSpreadIndex * 2 + 1}
                onScroll={() => { }}
                ref={flowLeftRef}
                position="left"
                allStories={enrichedStories}
                onNavigateToStory={handleNavigateToStory}
                fontSize={fontSize}
                isOwnAccount={isOwnAccount}
                viewMode={viewMode}
                isPriority={currentSpreadIndex === 0}
                autoplay={autoplayStoryId !== null && currentSpread.left && typeof currentSpread.left !== 'string' && !('type' in currentSpread.left) && (currentSpread.left as Story).id === autoplayStoryId}
                onAutoplayConsumed={() => setAutoplayStoryId(null)}
              />

              {/* Spine */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 md:w-14 lg:w-16">
                <div className="absolute inset-y-6 left-0 w-1/2 bg-gradient-to-r from-black/30 via-black/10 to-transparent opacity-20"></div>
                <div className="absolute inset-y-6 right-0 w-1/2 bg-gradient-to-l from-black/30 via-black/10 to-transparent opacity-20"></div>
                <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-px bg-white/70 opacity-60"></div>
                <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-0.5 opacity-20 shadow-[inset_1px_0_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.45)]"></div>
              </div>

              {/* Navigation arrows */}
              <button
                onClick={goToPrevSpread}
                className="group absolute bottom-0 w-14 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300"
                style={{ zIndex: 9999, left: '-50px', top: '60px' }}
                aria-label={currentSpreadIndex === 0 ? "Return to book cover" : "Previous page"}
                title={currentSpreadIndex === 0 ? "Back to cover" : "Previous page"}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-xl border border-neutral-300 group-hover:bg-white group-hover:scale-110 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </div>
              </button>

              {currentSpreadIndex < spreads.length - 1 && (
                <button
                  onClick={() => setCurrentSpreadIndex(currentSpreadIndex + 1)}
                  className="group absolute bottom-0 w-14 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300"
                  style={{ zIndex: 9999, right: '-50px', top: '60px' }}
                  aria-label="Next page"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-xl border border-neutral-300 group-hover:bg-white group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </div>
                </button>
              )}

              {/* Ground shadow */}
              <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-16 w-[80%] rounded-[100%] blur-2xl bg-black/60"></div>
            </div>
          </div>

          {/* TOC Drawer */}
          {showToc && (
            <div className="fixed bottom-[100px] md:bottom-24 left-1/2 -translate-x-1/2 z-40 w-[580px] max-w-[calc(100vw-3rem)]">
              <div className="rounded-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        setCurrentSpreadIndex(1); // Navigate to TOC pages (spread index 1)
                        setShowToc(false);
                      }}
                      className="text-lg font-semibold tracking-tight hover:text-[#8B7355] transition-colors text-left"
                    >
                      Table of Contents →
                    </button>
                    <button
                      onClick={() => setShowToc(false)}
                      className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center shadow-sm hover:bg-neutral-200 transition active:scale-95"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="max-h-[60vh] space-y-6 overflow-y-auto overscroll-contain px-6 pb-6">
                  {decadeGroups.map(([decade, stories]) => (
                    <section key={decade} className="space-y-3">
                      <h3 className="text-sm font-semibold tracking-tight text-neutral-800">{decade}</h3>
                      <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-100">
                        {stories.map((story) => (
                          <button
                            key={story.id}
                            onClick={() => {
                              handleNavigateToStory(story.id);
                              setShowToc(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
                          >
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-neutral-200 bg-neutral-100 flex items-center justify-center">
                              {story.photoUrl ? (
                                <img src={story.photoUrl} alt={story.title} className="h-full w-full object-cover" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-neutral-900 truncate">{story.title}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                                <span>{story.storyYear}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Closed Book Cover V4 - Premium version with sepia accent colors
 */
function ClosedBookCoverV4({
  userName,
  storyCount,
  onOpen
}: {
  userName: string;
  storyCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="relative mx-auto" style={{
      width: "min(95vw, calc((100dvh - 180px) * 0.647))",
      aspectRatio: "5.5 / 8.5",
      maxWidth: "800px"
    }}>
      <div className="pointer-events-none absolute -inset-12 bg-[radial-gradient(600px_300px_at_50%_60%,rgba(0,0,0,0.4)_0%,transparent_70%)]"></div>

      <div className="relative w-full h-full">
        {/* Book spine */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-l-lg pointer-events-none"
          style={{
            width: '32px',
            background: "linear-gradient(90deg, #1a0f08 0%, #2d1f12 50%, #3a2818 100%)",
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.6), inset 2px 0 4px rgba(0,0,0,0.3)",
            borderRight: '1px solid rgba(0,0,0,0.4)',
          }}
        >
          <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5 bg-black/20"></div>
          <div className="absolute inset-y-8 left-1/3 w-px bg-black/15"></div>
          <div className="absolute inset-y-8 right-1/3 w-px bg-black/15"></div>
        </div>

        {/* Cover button */}
        <button
          onClick={onOpen}
          className="relative w-full h-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
          style={{
            borderRadius: '0 12px 12px 0',
            background: "linear-gradient(145deg, #4a3420 0%, #2d1f12 50%, #1a0f08 100%)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(139,111,71,0.15), inset 0 -1px 0 rgba(0,0,0,0.5), inset -3px 0 10px rgba(0,0,0,0.4)"
          }}
          aria-label="Open book"
        >
          {/* Leather texture */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leather'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='1' /%3E%3CfeColorMatrix type='saturate' values='0.1'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23leather)' opacity='0.6'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          ></div>

          {/* Highlights */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              background: "radial-gradient(ellipse at 20% 20%, rgba(139,111,71,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,111,71,0.15) 0%, transparent 50%)",
            }}
          ></div>

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
            }}
          ></div>

          {/* Crease shadow */}
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none"
            style={{
              width: '24px',
              background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)",
            }}
          ></div>

          {/* Embossed frame */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '48px',
              left: '48px',
              right: '48px',
              bottom: '48px',
              border: '2px solid rgba(0,0,0,0.3)',
              borderRadius: '8px',
              boxShadow: 'inset 0 1px 0 rgba(139,111,71,0.15), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          ></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 tracking-tight"
              style={{
                fontFamily: "Crimson Text, serif",
                color: "var(--book-accent, #8B7355)",
                textShadow: "0 3px 6px rgba(0,0,0,0.9), 0 -1px 2px rgba(255,255,255,0.1)",
                fontWeight: 600,
              }}
            >
              {userName}&apos;s<br />Story
            </h1>

            <div className="w-32 h-0.5 mb-6" style={{ background: "linear-gradient(90deg, transparent, var(--book-accent, #8B7355), transparent)" }}></div>

            <p className="text-xl md:text-2xl font-medium" style={{ color: "var(--book-accent-light, rgba(139, 115, 85, 0.8))", textShadow: "0 2px 4px rgba(0,0,0,0.7)" }}>
              {storyCount} {storyCount === 1 ? 'memory' : 'memories'}
            </p>

            <div className="mt-12 px-5 py-2 rounded-full border" style={{
              backgroundColor: "rgba(139, 115, 85, 0.08)",
              borderColor: "rgba(139, 115, 85, 0.25)"
            }}>
              <p className="text-sm font-medium" style={{ color: "var(--book-accent, #8B7355)" }}>
                Tap to open
              </p>
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-14 left-14 w-8 h-8 border-l border-t rounded-tl" style={{ borderColor: "rgba(139, 115, 85, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute top-14 right-14 w-8 h-8 border-r border-t rounded-tr" style={{ borderColor: "rgba(139, 115, 85, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute bottom-14 left-14 w-8 h-8 border-l border-b rounded-bl" style={{ borderColor: "rgba(139, 115, 85, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute bottom-14 right-14 w-8 h-8 border-r border-b rounded-br" style={{ borderColor: "rgba(139, 115, 85, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
        </button>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function BookV4Page() {
  return (
    <Suspense fallback={
      <div className="hw-page bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    }>
      <BookV4PageContent />
    </Suspense>
  );
}
