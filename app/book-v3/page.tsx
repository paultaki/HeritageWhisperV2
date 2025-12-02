"use client";

// Prevent static generation for this user-specific page
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Volume2, Pause, Loader2, Clock3, Pencil, Type } from "lucide-react";
import { BookPage } from "./components/BookPage";
import DarkBookProgressBar from "./components/DarkBookProgressBar";
import { BookPage as BookPageType } from "@/lib/bookPagination";
import { ScrollIndicator } from "@/components/ScrollIndicators";
import MobileBookViewV2 from "../book-new/components/MobileBookViewV2";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import "./book-v3.css";

// Import handwriting font
import { Caveat } from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

// Story interface matching your API structure
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
  chapterId?: string;
  chapterOrderIndex?: number;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
}

function BookV3PageContent() {
  const { user } = useAuth();
  const { activeContext, isLoading: isContextLoading } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own';
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract storyId from URL for deep linking (e.g., from timeline or returning from edit)
  const urlStoryId = searchParams?.get('storyId') || undefined;

  // Initialize state from sessionStorage for session persistence
  const [isBookOpen, setIsBookOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('book-v3-is-open') === 'true';
    }
    return false;
  });
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('book-v3-spread-index');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [currentMobilePage, setCurrentMobilePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('book-v3-mobile-page');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState(18); // Default text size in pixels (senior-first)

  // Load font size from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('bookViewFontSize');
    if (savedFontSize) {
      const parsed = parseInt(savedFontSize, 10);
      if (!isNaN(parsed) && parsed >= 14 && parsed <= 28) {
        setFontSize(parsed);
      }
    }
  }, []);

  // Save font size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bookViewFontSize', fontSize.toString());
  }, [fontSize]);

  // Persist book state to sessionStorage for navigation memory
  useEffect(() => {
    sessionStorage.setItem('book-v3-is-open', isBookOpen.toString());
  }, [isBookOpen]);

  useEffect(() => {
    sessionStorage.setItem('book-v3-spread-index', currentSpreadIndex.toString());
  }, [currentSpreadIndex]);

  useEffect(() => {
    sessionStorage.setItem('book-v3-mobile-page', currentMobilePage.toString());
  }, [currentMobilePage]);

  const flowLeftRef = useRef<HTMLDivElement>(null);
  const flowRightRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Announce page changes to screen readers
  const announcePageChange = (spreadIndex: number) => {
    if (liveRegionRef.current && spreadIndex >= 0) {
      const pageNum = spreadIndex * 2 + 1; // Convert to page number
      liveRegionRef.current.textContent = `Page ${pageNum}`;

      // Focus on the heading of the current page for keyboard users
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

  // Fetch stories - with storyteller_id support for family sharing
  // Always default to user.id if no active context (prevents query from being disabled)
  const storytellerId = activeContext?.storytellerId || user?.id;
  const queryEnabled = !isContextLoading && ((!!user && !!user.id) || !!activeContext);

  // Debug logging
  console.log('[Book V3] Query setup:', {
    user: user?.id,
    activeContext,
    storytellerId,
    isContextLoading,
    queryEnabled
  });

  const { data, isLoading, isFetching } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories", storytellerId],
    queryFn: async () => {
      console.log('[Book V3] Fetching stories for storytellerId:', storytellerId);

      // Build URL with storyteller_id if viewing someone else's stories
      const url = storytellerId
        ? `${getApiUrl("/api/stories")}?storyteller_id=${storytellerId}`
        : getApiUrl("/api/stories");

      console.log('[Book V3] Fetch URL:', url);

      // Use apiRequest which handles authentication (JWT or family session token)
      const res = await apiRequest("GET", url);
      const result = await res.json();

      console.log('[Book V3] Fetched stories:', result?.stories?.length || 0);
      return result;
    },
    enabled: queryEnabled, // Wait for context to load, then enable for users OR viewers
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const stories = data?.stories || [];

  // Filter stories that should be included in book (must be explicitly true)
  const bookStories = stories.filter((s) => {
    // Must be explicitly marked for book inclusion
    if (s.includeInBook !== true) {
      return false;
    }

    // Must have a year (can't sort without it)
    if (!s.storyYear) {
      return false;
    }

    // Must have transcription (nothing to display without it)
    if (!s.transcription) {
      return false;
    }

    return true;
  });

  // Sort by year
  const sortedStories = useMemo(() =>
    [...bookStories].sort((a, b) => a.storyYear - b.storyYear),
    [bookStories]
  );

  // Group stories by decade
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

  // Enriched stories with chapter titles for TOC
  const enrichedStories = useMemo(() => {
    return sortedStories.map(story => {
      const chapter = chapters.find(c => c.id === story.chapterId);
      return {
        ...story,
        chapterTitle: chapter ? chapter.title : undefined
      };
    });
  }, [sortedStories, chapters]);

  // Group stories by chapter
  const chapterGroups = useMemo(() => {
    if (viewMode !== 'chapters' || chapters.length === 0) return [];

    const groups: { chapter: { id: string, title: string }, stories: Story[] }[] = [];

    // Sort chapters by orderIndex
    const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);

    sortedChapters.forEach(chapter => {
      const chapterStories = sortedStories.filter(s => s.chapterId === chapter.id);
      // Sort by chapterOrderIndex
      chapterStories.sort((a, b) => (a.chapterOrderIndex || 0) - (b.chapterOrderIndex || 0));

      if (chapterStories.length > 0) {
        groups.push({ chapter, stories: chapterStories });
      }
    });

    // Handle stories without chapters
    const orphanedStories = sortedStories.filter(s => !s.chapterId);
    if (orphanedStories.length > 0) {
      groups.push({ chapter: { id: 'uncategorized', title: "Uncategorized" }, stories: orphanedStories });
    }

    return groups;
  }, [sortedStories, chapters, viewMode]);

  // Create spreads - intro, TOC (2 pages), decade/chapter pages, then story pairs
  const spreads = useMemo(() => {
    const result: Array<{
      left?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | { type: 'decade'; decade: string; title: string; count: number };
      right?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | { type: 'decade'; decade: string; title: string; count: number };
      type: 'intro' | 'toc' | 'decade' | 'stories';
    }> = [];

    // First spread: endpaper left, intro right
    result.push({
      left: 'endpaper',
      right: 'intro',
      type: 'intro'
    });

    // Second spread: table of contents across both pages
    result.push({
      left: 'toc-left',
      right: 'toc-right',
      type: 'toc'
    });

    // Choose groups based on viewMode
    const groupsToRender = viewMode === 'chapters' ? chapterGroups : decadeGroups;

    // Add group pages and stories
    groupsToRender.forEach((group) => {
      // Handle different group structures
      let title: string;
      let id: string;
      let stories: Story[];

      if (Array.isArray(group)) {
        // Decade group: [string, Story[]]
        id = group[0];
        stories = group[1];
        const decadeYear = id.replace('s', '');
        title = `The ${decadeYear}s`;
      } else {
        // Chapter group: { chapter: { id, title }, stories: Story[] }
        id = group.chapter.id;
        title = group.chapter.title;
        stories = group.stories;
      }

      const groupPage = {
        type: 'decade' as const, // Reuse decade type for styling
        decade: id,
        title: title,
        count: stories.length,
        isChapter: viewMode === 'chapters' // NEW: Pass flag to distinguish chapters from decades
      };

      // Check if we need to add marker on left or right
      const lastSpread = result[result.length - 1];
      const needsNewSpread = !lastSpread || (lastSpread.left && lastSpread.right);

      if (needsNewSpread) {
        // Create new spread with marker on left
        result.push({
          left: groupPage,
          right: stories[0],
          type: 'stories'
        });

        // Add remaining story spreads
        for (let i = 1; i < stories.length; i += 2) {
          result.push({
            left: stories[i],
            right: stories[i + 1],
            type: 'stories'
          });
        }
      } else {
        // Fill the empty right slot with marker
        lastSpread.right = groupPage;
        lastSpread.type = 'decade';

        // Add all story spreads for this group
        for (let i = 0; i < stories.length; i += 2) {
          result.push({
            left: stories[i],
            right: stories[i + 1],
            type: 'stories'
          });
        }
      }
    });

    return result;
  }, [decadeGroups, chapterGroups, viewMode]);

  // Create book pages array for progress bar
  const bookPages: BookPageType[] = useMemo(() => {
    const pages: BookPageType[] = [];
    let pageNum = 1;

    spreads.forEach((spread) => {
      // Left page
      if (spread.left) {
        let pageType: 'intro' | 'table-of-contents' | 'decade-marker' | 'story-start' = 'intro';
        if (typeof spread.left === 'string') {
          if (spread.left === 'intro' || spread.left === 'endpaper') pageType = 'intro';
          else if (spread.left === 'toc-left' || spread.left === 'toc-right') pageType = 'table-of-contents';
        } else if ('type' in spread.left) {
          pageType = 'decade-marker';
        } else {
          pageType = 'story-start';
        }

        const leftPage: BookPageType = {
          pageNumber: pageNum++,
          type: pageType,
          isLeftPage: true,
          isRightPage: false,
          decade: typeof spread.left === 'object' && 'decade' in spread.left ? spread.left.decade : undefined,
          decadeTitle: typeof spread.left === 'object' && 'title' in spread.left ? spread.left.title : undefined,
          year: typeof spread.left === 'object' && 'storyYear' in spread.left ? spread.left.storyYear.toString() : undefined,
          isChapter: typeof spread.left === 'object' && 'isChapter' in spread.left ? Boolean(spread.left.isChapter) : undefined,
        };
        pages.push(leftPage);
      }

      // Right page
      if (spread.right) {
        let pageType: 'intro' | 'table-of-contents' | 'decade-marker' | 'story-start' = 'intro';
        if (typeof spread.right === 'string') {
          if (spread.right === 'intro' || spread.right === 'endpaper') pageType = 'intro';
          else if (spread.right === 'toc-left' || spread.right === 'toc-right') pageType = 'table-of-contents';
        } else if ('type' in spread.right) {
          pageType = 'decade-marker';
        } else {
          pageType = 'story-start';
        }

        const rightPage: BookPageType = {
          pageNumber: pageNum++,
          type: pageType,
          isLeftPage: false,
          isRightPage: true,
          decade: typeof spread.right === 'object' && 'decade' in spread.right ? spread.right.decade : undefined,
          decadeTitle: typeof spread.right === 'object' && 'title' in spread.right ? spread.right.title : undefined,
          year: typeof spread.right === 'object' && 'storyYear' in spread.right ? spread.right.storyYear.toString() : undefined,
          isChapter: typeof spread.right === 'object' && 'isChapter' in spread.right ? Boolean(spread.right.isChapter) : undefined,
        };
        pages.push(rightPage);
      }
    });

    return pages;
  }, [spreads]);

  // Create mobile pages array (intro + TOC + all stories)
  const mobilePages = useMemo(() => {
    const pages: Array<{ type: 'intro' | 'toc' | 'story'; story?: Story; index: number }> = [];

    // Add intro page
    pages.push({ type: 'intro', index: 0 });

    // Add TOC page
    pages.push({ type: 'toc', index: 1 });

    // Add all story pages
    sortedStories.forEach((story, idx) => {
      pages.push({ type: 'story', story, index: idx + 2 });
    });

    return pages;
  }, [sortedStories]);

  // Validate restored indexes don't exceed available pages (in case content changed)
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

  // Navigate to specific page from progress bar
  const handleNavigateToPage = useCallback((pageIndex: number) => {
    const spreadIndex = Math.floor(pageIndex / 2);
    setCurrentSpreadIndex(Math.min(Math.max(0, spreadIndex), spreads.length - 1));
  }, [spreads.length]);

  // Navigate spreads
  const goToPrevSpread = useCallback(() => {
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  }, [currentSpreadIndex]);

  const goToNextSpread = useCallback(() => {
    if (currentSpreadIndex < spreads.length - 1) {
      setCurrentSpreadIndex(currentSpreadIndex + 1);
    }
  }, [currentSpreadIndex, spreads.length]);

  // Get current story ID for smart navigation
  const getCurrentStoryId = useCallback(() => {
    const spread = spreads[currentSpreadIndex];
    if (!spread) return undefined;

    // Check left page first
    if (spread.left && typeof spread.left === 'object' && 'id' in spread.left) {
      return spread.left.id;
    }
    // Check right page
    if (spread.right && typeof spread.right === 'object' && 'id' in spread.right) {
      return spread.right.id;
    }
    return undefined;
  }, [spreads, currentSpreadIndex]);

  // Handle Timeline navigation with smart routing
  const handleTimelineClick = useCallback(() => {
    const currentStoryId = getCurrentStoryId();
    if (currentStoryId) {
      const context = {
        memoryId: currentStoryId,
        scrollPosition: 0,
        timestamp: Date.now(),
        returnPath: '/timeline',
      };
      sessionStorage.setItem('timeline-navigation-context', JSON.stringify(context));
    }

    router.push('/timeline');
  }, [getCurrentStoryId, router]);

  // Update sessionStorage whenever current story changes (for GlassNav smart routing)
  useEffect(() => {
    const storyId = getCurrentStoryId();
    if (storyId) {
      sessionStorage.setItem('current-book-story-id', storyId);
    } else {
      sessionStorage.removeItem('current-book-story-id');
    }
  }, [getCurrentStoryId]);

  // Reset scroll position and stop audio when spread changes
  useEffect(() => {
    if (flowLeftRef.current) {
      flowLeftRef.current.scrollTop = 0;
    }
    if (flowRightRef.current) {
      flowRightRef.current.scrollTop = 0;
    }

    // Stop all audio elements when navigating
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, [currentSpreadIndex]);

  // Keyboard navigation (Arrow keys + Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

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

  // Track which storyId we've already navigated to (prevents duplicate navigation)
  const [navigatedStoryId, setNavigatedStoryId] = useState<string | null>(null);

  // Navigate to story from URL parameter (from timeline or returning from edit)
  useEffect(() => {
    // Skip if no storyId in URL or data not loaded yet
    if (!urlStoryId || sortedStories.length === 0 || spreads.length === 0) return;

    // Skip if we've already navigated to this exact storyId
    if (navigatedStoryId === urlStoryId) return;

    // Find the story index
    const storyIndex = sortedStories.findIndex(s => s.id === urlStoryId);

    if (storyIndex !== -1) {
      // Desktop: Find which spread contains this story
      let targetSpreadIndex = 0;

      for (let i = 0; i < spreads.length; i++) {
        const spread = spreads[i];

        // Check left page
        if (spread.left && typeof spread.left !== 'string' && !('type' in spread.left)) {
          if ((spread.left as Story).id === urlStoryId) {
            targetSpreadIndex = i;
            break;
          }
        }

        // Check right page
        if (spread.right && typeof spread.right !== 'string' && !('type' in spread.right)) {
          if ((spread.right as Story).id === urlStoryId) {
            targetSpreadIndex = i;
            break;
          }
        }
      }

      setCurrentSpreadIndex(targetSpreadIndex);

      // Mobile: Navigate to story page (intro + toc + stories)
      setCurrentMobilePage(storyIndex + 2);

      // Open the book automatically when navigating from URL
      setIsBookOpen(true);

      // Mark this storyId as navigated to prevent re-navigation
      setNavigatedStoryId(urlStoryId);

      // Clean up URL
      window.history.replaceState({}, '', '/book-v3');
    }
  }, [urlStoryId, sortedStories, spreads, navigatedStoryId]);

  // Loading state - show spinner while fetching data OR waiting for user
  if (isLoading || isFetching || !data) {
    return (
      <div className="book-v3-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-stone-400">Loading your stories...</p>
        </div>
      </div>
    );
  }

  // No stories state (only show if we have data and it's truly empty)
  if (data && sortedStories.length === 0) {
    return (
      <div className="book-v3-page flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-stone-200 mb-4">
            Your Book is Empty
          </h2>
          <p className="text-stone-400 mb-6">
            Start creating memories to see them appear here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-md transition-all"
          >
            Create Your First Memory
          </button>
        </div>
      </div>
    );
  }

  const currentSpread = spreads[currentSpreadIndex] || { left: undefined, right: undefined, type: 'stories' as const };

  // Navigate to a story from TOC
  const handleNavigateToStory = (storyId: string) => {
    // For mobile: find the story's index in mobilePages
    const mobileStoryIndex = mobilePages.findIndex((page) => {
      return page.type === 'story' && page.story?.id === storyId;
    });

    if (mobileStoryIndex !== -1) {
      setCurrentMobilePage(mobileStoryIndex);
    }

    // For desktop: find which spread contains this story by ID
    for (let i = 0; i < spreads.length; i++) {
      const spread = spreads[i];

      // Check if the story is on the left page
      if (spread.left && typeof spread.left !== 'string' && !('type' in spread.left) && spread.left.id === storyId) {
        setCurrentSpreadIndex(i);
        return;
      }

      // Check if the story is on the right page
      if (spread.right && typeof spread.right !== 'string' && !('type' in spread.right) && spread.right.id === storyId) {
        setCurrentSpreadIndex(i);
        return;
      }
    }
  };

  // Render closed book cover state
  if (!isBookOpen) {
    return (
      <>
        {/* Mobile & Tablet: Full-screen mobile view - Always rendered on mobile */}
        <div className="lg:hidden">
          <MobileBookViewV2
            initialStoryId={urlStoryId}
            caveatFont={caveat.className}
          />
        </div>

        {/* Desktop: Closed book cover */}
        <div className="hidden lg:block book-v3-page overflow-hidden antialiased selection:bg-amber-500/30 selection:text-amber-100 text-stone-200">
          {/* Progress bar and controls - shown even on cover */}
          <div className="hidden md:block">
            <DarkBookProgressBar
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

          {/* Closed book cover - centered */}
          <div className="flex items-center justify-center" style={{ height: "100dvh" }}>
            <ClosedBookCover
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
      {/* Mobile & Tablet: Full-screen mobile view */}
      <div className="lg:hidden">
        <MobileBookViewV2
          initialStoryId={urlStoryId}
          caveatFont={caveat.className}
        />
      </div>

      {/* Desktop: Book view with dual-page spread */}
      <div className="hidden lg:block book-v3-page overflow-hidden antialiased selection:bg-amber-500/30 selection:text-amber-100 text-stone-200">
        {/* ARIA live region for page announcements */}
        <div
          id="sr-live"
          ref={liveRegionRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        ></div>

        {/* Dark Book Progress Bar - hidden on mobile */}
        <div className="hidden md:block">
          <DarkBookProgressBar
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

          {/* Desktop: Dual-page spread */}
          <div className="relative mx-auto hidden lg:flex items-center justify-center" style={{ height: "calc(100dvh - 110px)" }}>
            {/* Clickable Navigation Zones - Left margin for previous */}
            <button
              onClick={goToPrevSpread}
              disabled={currentSpreadIndex === 0}
              className="absolute left-0 bottom-0 z-40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-0"
              style={{
                top: "60px",
                width: "40px",
                background: "transparent"
              }}
              aria-label="Previous page"
              onMouseEnter={(e) => {
                if (currentSpreadIndex > 0) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            />

            {/* Clickable Navigation Zones - Right margin for next */}
            <button
              onClick={goToNextSpread}
              disabled={currentSpreadIndex >= spreads.length - 1}
              className="absolute right-0 bottom-0 z-40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-0"
              style={{
                top: "60px",
                width: "40px",
                background: "transparent"
              }}
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

            {/* Book container with fixed aspect ratio: 11" x 8.5" (dual-page spread) */}
            <div
              className="relative [perspective:2000px]"
              style={{
                width: "min(95vw, calc((100dvh - 160px) * 1.294))",
                aspectRatio: "11 / 8.5",
                maxWidth: "1600px"
              }}
            >
              {/* Ambient shadow/vignette */}
              <div className="pointer-events-none absolute -inset-8 rounded-2xl bg-[radial-gradient(1000px_400px_at_50%_30%,rgba(180,130,80,0.06)_0%,rgba(180,130,80,0.03)_35%,transparent_70%)]"></div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"></div>

              {/* Outer book cover/border - wider on left/right */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-[20px]"
                style={{
                  top: "-15px",
                  bottom: "-15px",
                  left: "-30px",
                  right: "-30px",
                  background: "linear-gradient(180deg, #3d2e1f 0%, #2a1f14 100%)",
                  boxShadow: "0 15px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)"
                }}
              ></div>

              {/* Right page - RENDERED FIRST so it's on top in case of overlap */}
              <BookPage
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
              />

              {/* Left page */}
              <BookPage
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
              />

              {/* Refined spine with book binding curve effect */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 md:w-14 lg:w-16">
                <div className="absolute inset-y-6 left-0 w-1/2 bg-gradient-to-r from-black/40 via-black/15 to-transparent opacity-30"></div>
                <div className="absolute inset-y-6 right-0 w-1/2 bg-gradient-to-l from-black/40 via-black/15 to-transparent opacity-30"></div>
                <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-px bg-amber-900/40 opacity-70"></div>
                <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-0.5 opacity-25 shadow-[inset_1px_0_0_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,245,230,0.35)]"></div>
              </div>

              {/* Left margin click indicator - Previous page */}
              {currentSpreadIndex > 0 && (
                <button
                  onClick={() => setCurrentSpreadIndex(currentSpreadIndex - 1)}
                  className="group absolute bottom-0 w-14 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300"
                  style={{ zIndex: 9999, left: '-50px', top: '60px' }}
                  aria-label="Previous page"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-100/90 shadow-xl border border-stone-300 group-hover:bg-white group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </div>
                </button>
              )}

              {/* Right margin click indicator - Next page */}
              {currentSpreadIndex < spreads.length - 1 && (
                <button
                  onClick={() => setCurrentSpreadIndex(currentSpreadIndex + 1)}
                  className="group absolute bottom-0 w-14 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-300"
                  style={{ zIndex: 9999, right: '-50px', top: '60px' }}
                  aria-label="Next page"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-100/90 shadow-xl border border-stone-300 group-hover:bg-white group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </div>
                </button>
              )}

              {/* Ground shadow */}
              <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-16 w-[80%] rounded-[100%] blur-2xl bg-black/60"></div>
            </div>
          </div>

          {/* TOC Drawer - Above Bottom Nav */}
          {showToc && (
            <div className="fixed bottom-[100px] md:bottom-24 left-1/2 -translate-x-1/2 z-40 w-[580px] max-w-[calc(100vw-3rem)]">
              <div className="rounded-2xl bg-[#fdfbf7] text-stone-900 shadow-2xl ring-1 ring-black/5">
                {/* Header */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold tracking-tight font-serif">Table of Contents</h2>
                    <button
                      onClick={() => setShowToc(false)}
                      className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center shadow-sm hover:bg-stone-200 transition active:scale-95"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] space-y-6 overflow-y-auto overscroll-contain px-6 pb-6">
                  {viewMode === 'chapters' && chapterGroups.length > 0 ? (
                    // Chapter view - grouped by chapters
                    <>
                      {chapterGroups.map((group) => (
                        <section key={group.chapter.id} className="space-y-3">
                          {/* Group header */}
                          <h3 className="text-sm font-semibold tracking-tight text-stone-800 uppercase">
                            {group.chapter.title}
                          </h3>

                          {/* Stories in this group */}
                          <div className="divide-y divide-stone-100 overflow-hidden rounded-xl bg-white ring-1 ring-stone-100">
                            {group.stories.map((story) => (
                              <button
                                key={story.id}
                                onClick={() => {
                                  handleNavigateToStory(story.id);
                                  setShowToc(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 active:bg-stone-100"
                              >
                                {/* Story thumbnail */}
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-stone-200 bg-stone-100 flex items-center justify-center">
                                  {story.photoUrl ? (
                                    <img
                                      src={story.photoUrl}
                                      alt={story.title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                    </svg>
                                  )}
                                </div>

                                {/* Story info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-stone-900 truncate font-serif">
                                    {story.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                                    <span>{story.storyYear}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </>
                  ) : (
                    // Chronological view - grouped by decades
                    <>
                      {decadeGroups.map(([decade, stories]) => (
                        <section key={decade} className="space-y-3">
                          {/* Group header */}
                          <h3 className="text-sm font-semibold tracking-tight text-stone-800">
                            {decade}
                          </h3>

                          {/* Stories in this group */}
                          <div className="divide-y divide-stone-100 overflow-hidden rounded-xl bg-white ring-1 ring-stone-100">
                            {stories.map((story) => (
                              <button
                                key={story.id}
                                onClick={() => {
                                  handleNavigateToStory(story.id);
                                  setShowToc(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 active:bg-stone-100"
                              >
                                {/* Story thumbnail */}
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-stone-200 bg-stone-100 flex items-center justify-center">
                                  {story.photoUrl ? (
                                    <img
                                      src={story.photoUrl}
                                      alt={story.title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                    </svg>
                                  )}
                                </div>

                                {/* Story info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-stone-900 truncate font-serif">
                                    {story.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                                    <span>{story.storyYear}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// Closed Book Cover Component - Premium Heirloom Style
function ClosedBookCover({
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
      {/* Ambient shadow - no border, just glow */}
      <div className="pointer-events-none absolute -inset-12 bg-[radial-gradient(600px_300px_at_50%_60%,rgba(0,0,0,0.4)_0%,transparent_70%)]"></div>

      {/* Book cover with spine */}
      <div className="relative w-full h-full">
        {/* Book spine (left edge) */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-l-lg pointer-events-none"
          style={{
            width: '32px',
            background: "linear-gradient(90deg, #2a1f14 0%, #3d2e1f 50%, #4a3828 100%)",
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.6), inset 2px 0 4px rgba(0,0,0,0.3)",
            borderRight: '1px solid rgba(0,0,0,0.4)',
          }}
        >
          {/* Spine ridges */}
          <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5 bg-black/20"></div>
          <div className="absolute inset-y-8 left-1/3 w-px bg-black/15"></div>
          <div className="absolute inset-y-8 right-1/3 w-px bg-black/15"></div>
        </div>

        {/* Main cover button */}
        <button
          onClick={onOpen}
          className="relative w-full h-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
          style={{
            borderRadius: '0 12px 12px 0',
            background: "linear-gradient(145deg, #5a4430 0%, #3d2e1f 50%, #2a1f14 100%)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(180,150,100,0.12), inset 0 -1px 0 rgba(0,0,0,0.5), inset -3px 0 10px rgba(0,0,0,0.4)"
          }}
          aria-label="Open book"
        >
          {/* Leather grain texture */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leather'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='1' /%3E%3CfeColorMatrix type='saturate' values='0.1'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23leather)' opacity='0.6'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          ></div>

          {/* Subtle highlight along edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              background: "radial-gradient(ellipse at 20% 20%, rgba(180,150,100,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(180,150,100,0.12) 0%, transparent 50%)",
            }}
          ></div>

          {/* Vignette for depth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
            }}
          ></div>

          {/* Book crease shadow (where the book opens) */}
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none"
            style={{
              width: '24px',
              background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)",
            }}
          ></div>

          {/* Embossed border frame (like real book covers) */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '48px',
              left: '48px',
              right: '48px',
              bottom: '48px',
              border: '2px solid rgba(0,0,0,0.3)',
              borderRadius: '8px',
              boxShadow: 'inset 0 1px 0 rgba(180,150,100,0.12), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          ></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 tracking-tight"
              style={{
                fontFamily: "Crimson Text, Georgia, serif",
                color: "#d4b896",
                textShadow: "0 3px 6px rgba(0,0,0,0.9), 0 -1px 2px rgba(255,255,255,0.08)",
                fontWeight: 600,
              }}
            >
              {userName}&apos;s<br />Story
            </h1>

            <div className="w-32 h-0.5 mb-6" style={{ background: "linear-gradient(90deg, transparent, #d4b896, transparent)" }}></div>

            <p className="text-xl md:text-2xl font-medium" style={{ color: "#c4a87a", textShadow: "0 2px 4px rgba(0,0,0,0.7)" }}>
              {storyCount} {storyCount === 1 ? 'memory' : 'memories'}
            </p>

            <div className="mt-12 px-5 py-2 rounded-full border" style={{
              backgroundColor: "rgba(212, 184, 150, 0.08)",
              borderColor: "rgba(212, 184, 150, 0.25)"
            }}>
              <p className="text-sm font-medium" style={{ color: "#d4b896" }}>
                Tap to open
              </p>
            </div>
          </div>

          {/* Decorative embossed corner accents inside the border */}
          <div className="absolute top-14 left-14 w-8 h-8 border-l border-t rounded-tl" style={{ borderColor: "rgba(212, 184, 150, 0.2)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute top-14 right-14 w-8 h-8 border-r border-t rounded-tr" style={{ borderColor: "rgba(212, 184, 150, 0.2)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute bottom-14 left-14 w-8 h-8 border-l border-b rounded-bl" style={{ borderColor: "rgba(212, 184, 150, 0.2)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute bottom-14 right-14 w-8 h-8 border-r border-b rounded-br" style={{ borderColor: "rgba(212, 184, 150, 0.2)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
        </button>
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function BookV3Page() {
  return (
    <Suspense fallback={
      <div className="book-v3-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-stone-400">Loading your stories...</p>
        </div>
      </div>
    }>
      <BookV3PageContent />
    </Suspense>
  );
}

