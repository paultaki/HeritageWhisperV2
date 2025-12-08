"use client";

import { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
import { supabase } from "@/lib/supabase";
import { Story } from "@/shared/schema";
import { BookStory, MobileBookViewV2Props, MobileBookPage } from "./types";
import BookPageRenderer from "./BookPageRenderer";
import BookTopBar from "./BookTopBar";
import NavigationArrows from "./NavigationArrows";
import BookTableOfContents from "./BookTableOfContents";

export default function MobileBookViewV2({
  initialStoryId,
  caveatFont,
  autoplay = false,
}: MobileBookViewV2Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { activeContext, isLoading: isContextLoading } = useAccountContext();
  const pagerRef = useRef<HTMLDivElement>(null);

  // Use same fallback logic as parent BookV4PageContent
  const storytellerId = activeContext?.storytellerId || user?.id;
  const queryEnabled = !isContextLoading && ((!!user && !!user.id) || !!activeContext);

  console.log('[MobileBookViewV2] Render - storytellerId:', storytellerId, 'queryEnabled:', queryEnabled, 'initialStoryId:', initialStoryId);

  // State - initialize from sessionStorage for position persistence
  // BUT if initialStoryId is provided, we'll override this once bookPages are ready
  const [currentIndex, setCurrentIndex] = useState(() => {
    // If we have an initialStoryId, start at 0 and let the navigation effect handle it
    // This prevents briefly showing the wrong page from sessionStorage
    if (initialStoryId) {
      return 0;
    }
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('book-mobile-page');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
    return 0;
  });
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chronological' | 'chapters'>('chronological');
  // Autoplay state - tracks if we should autoplay and which story
  const [shouldAutoplay, setShouldAutoplay] = useState(autoplay && !!initialStoryId);
  // Track if we've handled the initial navigation to prevent re-running
  const [initialNavigationDone, setInitialNavigationDone] = useState(false);
  // Track which storyId we last navigated to
  const [lastNavigatedStoryId, setLastNavigatedStoryId] = useState<string | null>(null);
  // Track if we've done the initial scroll to prevent re-scrolling
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Fetch stories
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `/api/stories?storyteller_id=${storytellerId}`
        : "/api/stories";

      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: queryEnabled,
  });

  // Fetch chapters
  const { data: chaptersData } = useQuery<{ chapters: any[], orphanedStories: any[] }>({
    queryKey: ["/api/chapters", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `/api/chapters?storyteller_id=${storytellerId}`
        : "/api/chapters";

      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: queryEnabled,
  });

  // Reset view mode if no chapters
  useEffect(() => {
    if (chaptersData?.chapters && chaptersData.chapters.length === 0 && viewMode === 'chapters') {
      setViewMode('chronological');
    }
  }, [chaptersData, viewMode]);

  // Filter and sort stories for book view
  const bookStories = useMemo<BookStory[]>(() => {
    if (!data?.stories) return [];

    return data.stories
      .filter(
        (s): s is BookStory =>
          s.includeInBook === true &&
          !!s.storyYear &&
          !!s.transcription
      )
      .sort((a, b) => {
        // Sort by year, then by date if available
        if (a.storyYear !== b.storyYear) {
          return a.storyYear - b.storyYear;
        }
        if (a.storyDate && b.storyDate) {
          return new Date(a.storyDate).getTime() - new Date(b.storyDate).getTime();
        }
        return 0;
      });
  }, [data?.stories]);

  // Helper function to group stories by decade
  const groupStoriesByDecade = useCallback((stories: BookStory[]) => {
    const groups = new Map<string, BookStory[]>();
    stories.forEach((story) => {
      const decade = `${Math.floor(story.storyYear / 10) * 10}s`;
      if (!groups.has(decade)) {
        groups.set(decade, []);
      }
      groups.get(decade)!.push(story);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  // Helper function to group stories by chapter
  const groupStoriesByChapter = useCallback((stories: BookStory[]) => {
    if (!chaptersData?.chapters) return [];

    const groups: Array<[string, BookStory[], string]> = []; // [id, stories, title]

    // 1. Map existing chapters
    chaptersData.chapters.forEach((chapter: any) => {
      const chapterStories = stories.filter(s => s.chapterId === chapter.id);
      // Sort by chapterOrderIndex
      chapterStories.sort((a, b) => (a.chapterOrderIndex || 0) - (b.chapterOrderIndex || 0));

      if (chapterStories.length > 0) {
        groups.push([chapter.id, chapterStories, chapter.title]);
      }
    });

    // 2. Handle orphaned stories (Uncategorized)
    // We can use the orphanedStories from API or filter locally. 
    // Since bookStories is already filtered for book inclusion, let's filter locally to be safe.
    const orphanedStories = stories.filter(s => !s.chapterId);
    if (orphanedStories.length > 0) {
      groups.push(['uncategorized', orphanedStories, 'Uncategorized Stories']);
    }

    return groups;
  }, [chaptersData]);

  // Generate pages array with mixed content types (cover, intro, TOC, decade/chapter markers, stories)
  const bookPages = useMemo<MobileBookPage[]>(() => {
    if (!bookStories.length) return [];

    const pages: MobileBookPage[] = [];

    // 1. Cover page
    pages.push({
      type: "cover",
      userName: activeContext?.storytellerName?.split(" ")[0] || "Your",
      storyCount: bookStories.length,
    });

    // 2. Intro page
    pages.push({ type: "intro" });

    // 3. Table of contents
    pages.push({ type: "toc", stories: bookStories });

    if (viewMode === 'chronological') {
      // 4. Group by decade and add decade markers + stories
      const decadeGroups = groupStoriesByDecade(bookStories);

      decadeGroups.forEach(([decade, stories]) => {
        // Add decade intro page
        pages.push({
          type: "decade",
          decade,
          title: `The ${decade}`,
          count: stories.length,
        });

        // Add story pages
        stories.forEach((story) => {
          pages.push({ type: "story", story });
        });
      });
    } else {
      // 4. Group by chapter
      const chapterGroups = groupStoriesByChapter(bookStories);

      chapterGroups.forEach(([chapterId, stories, title]) => {
        // Add chapter intro page (reusing decade type for now or add new type if needed)
        // Using 'decade' type allows reusing the styling
        pages.push({
          type: "decade",
          decade: chapterId,
          title: title,
          count: stories.length,
          isChapter: true, // Mark as chapter page so DecadeIntroPage renders correctly
        });

        // Add story pages
        stories.forEach((story) => {
          pages.push({ type: "story", story });
        });
      });
    }

    return pages;
  }, [bookStories, activeContext?.storytellerName, groupStoriesByDecade, groupStoriesByChapter, viewMode]);

  // Get user initials
  const userInitials = useMemo(() => {
    const name = activeContext?.storytellerName || "User";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [activeContext?.storytellerName]);

  // Book title (first name only)
  const bookTitle = useMemo(() => {
    const fullName = activeContext?.storytellerName || "Your";
    const firstName = fullName.split(" ")[0];
    return `${firstName}'s Story`;
  }, [activeContext?.storytellerName]);

  // Scroll to specific page index
  const scrollToIndex = useCallback((index: number) => {
    if (!pagerRef.current) return;
    const width = pagerRef.current.clientWidth;
    pagerRef.current.scrollTo({
      left: index * width,
      behavior: "smooth",
    });
  }, []);

  // Handle scroll events to update current index
  // Note: We need to avoid updating during initial navigation setup
  const handleScroll = useCallback(() => {
    if (!pagerRef.current) return;
    // Don't update currentIndex during initial scroll setup - it can cause race conditions
    if (!initialScrollDone) {
      console.log('[MobileBookView DEBUG] handleScroll ignored - initial scroll not done');
      return;
    }
    const width = pagerRef.current.clientWidth || 1;
    const newIndex = Math.round(pagerRef.current.scrollLeft / width);
    console.log('[MobileBookView DEBUG] handleScroll updating:', { newIndex, scrollLeft: pagerRef.current.scrollLeft, width });
    setCurrentIndex(newIndex);
  }, [initialScrollDone]);

  // Navigate to previous/next page
  const handlePrevious = useCallback(() => {
    scrollToIndex(Math.max(0, currentIndex - 1));
  }, [currentIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    scrollToIndex(Math.min(bookPages.length - 1, currentIndex + 1));
  }, [currentIndex, bookPages.length, scrollToIndex]);

  // Navigation state
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < bookPages.length - 1;

  // Handle story selection from TOC
  const handleStorySelect = useCallback(
    (storyId: string) => {
      // Find the page index that contains this story
      const pageIndex = bookPages.findIndex(
        (page) => page.type === "story" && page.story.id === storyId
      );
      if (pageIndex >= 0) {
        setIsTocOpen(false);
        setTimeout(() => scrollToIndex(pageIndex), 100);
      }
    },
    [bookPages, scrollToIndex]
  );

  // Update sessionStorage whenever current story changes (for GlassNav smart routing)
  // Also persist page index for navigation memory
  useEffect(() => {
    // Persist page index for return navigation
    sessionStorage.setItem('book-mobile-page', currentIndex.toString());

    const currentPage = bookPages[currentIndex];
    if (currentPage && currentPage.type === "story") {
      const storyId = currentPage.story.id;
      sessionStorage.setItem('current-book-story-id', storyId);
      console.log('[MobileBookView] Updated current story ID in storage:', storyId);
    } else {
      sessionStorage.removeItem('current-book-story-id');
      console.log('[MobileBookView] Cleared current story ID (on non-story page)');
    }
  }, [bookPages, currentIndex]);

  // Navigate to timeline with smart routing
  const handleTimelineClick = useCallback(() => {
    console.log('[MobileBookView] Timeline clicked. currentIndex:', currentIndex);
    console.log('[MobileBookView] bookPages length:', bookPages.length);

    const currentPage = bookPages[currentIndex];
    console.log('[MobileBookView] Current page type:', currentPage?.type);

    // If we're on a story page, store navigation context for timeline to scroll to it
    if (currentPage && currentPage.type === "story") {
      const context = {
        memoryId: currentPage.story.id,
        scrollPosition: 0, // Start at top, will scroll to card
        timestamp: Date.now(),
        returnPath: '/timeline', // Required by timeline navigation logic
      };
      console.log('[MobileBookView] Setting sessionStorage context:', context);
      sessionStorage.setItem('timeline-navigation-context', JSON.stringify(context));
      console.log('[MobileBookView] SessionStorage set. Verifying:', sessionStorage.getItem('timeline-navigation-context'));
    } else {
      console.log('[MobileBookView] Not on story page - skipping sessionStorage');
    }

    router.push("/timeline");
  }, [bookPages, currentIndex, router]);

  // Navigate to edit (only works on story pages)
  const handleEditClick = useCallback(() => {
    const currentPage = bookPages[currentIndex];
    if (currentPage && currentPage.type === "story") {
      router.push(`/review/book-style?edit=${currentPage.story.id}&returnPath=${encodeURIComponent(`/book?storyId=${currentPage.story.id}`)}`);
    }
  }, [bookPages, currentIndex, router]);

  // Fix for Chrome iOS URL bar at TOP position - force viewport recalculation
  useEffect(() => {
    // Detect if we're on Chrome iOS with URL bar at top
    const isChromeiOS = /CriOS/.test(navigator.userAgent);

    if (isChromeiOS) {
      // Force viewport recalculation by triggering a reflow
      // This fixes the visualViewport.offsetTop not resetting to 0
      const forceReflow = () => {
        // Read visualViewport to force Chrome to recalculate
        const vh = window.visualViewport?.height || window.innerHeight;
        const offsetTop = window.visualViewport?.offsetTop || 0;

        // If offsetTop is not 0, we need to compensate
        if (offsetTop !== 0) {
          console.log('[BookView] Chrome iOS viewport offset detected:', offsetTop);
          // Scroll window to force reset
          window.scrollTo(0, 0);
        }
      };

      // Run immediately and after layout settles
      forceReflow();
      requestAnimationFrame(() => {
        requestAnimationFrame(forceReflow);
      });
    }
  }, []);

  // Reset navigation state when initialStoryId changes (new navigation from Timeline)
  useEffect(() => {
    if (initialStoryId && initialStoryId !== lastNavigatedStoryId) {
      setInitialNavigationDone(false);
      setInitialScrollDone(false);
    }
  }, [initialStoryId, lastNavigatedStoryId]);

  // Compute target page index when we have initialStoryId and bookPages
  // This runs synchronously during render, so we can use it to set the correct initial position
  const targetPageIndex = useMemo(() => {
    if (!initialStoryId || bookPages.length === 0) return null;
    const pageIndex = bookPages.findIndex(
      (page) => page.type === "story" && page.story.id === initialStoryId
    );

    // DEBUG: Log the search
    console.log('[MobileBookView DEBUG] Finding story:', {
      initialStoryId,
      bookPagesCount: bookPages.length,
      foundIndex: pageIndex,
      // Show page structure for debugging
      pageTypes: bookPages.map((p, i) => ({
        index: i,
        type: p.type,
        storyId: p.type === 'story' ? p.story.id : undefined,
        title: p.type === 'story' ? p.story.title?.substring(0, 20) : p.type === 'decade' ? p.title : undefined
      }))
    });

    return pageIndex >= 0 ? pageIndex : null;
  }, [initialStoryId, bookPages]);

  // When we find the target page and haven't navigated yet, set currentIndex directly
  // This runs as a layout effect to happen before the browser paints
  useLayoutEffect(() => {
    if (targetPageIndex !== null && !initialNavigationDone) {
      console.log('[MobileBookView DEBUG] Setting currentIndex:', {
        targetPageIndex,
        initialNavigationDone,
        initialStoryId
      });
      setCurrentIndex(targetPageIndex);
      setInitialNavigationDone(true);
      setLastNavigatedStoryId(initialStoryId!);
    }
  }, [targetPageIndex, initialNavigationDone, initialStoryId]);

  // Scroll to correct position when pager mounts and currentIndex is set
  // This must be a layout effect to run before the browser paints
  useLayoutEffect(() => {
    if (!pagerRef.current) return;
    if (initialScrollDone) return;
    if (currentIndex === 0) {
      // If we're supposed to be at page 0, no scroll needed
      console.log('[MobileBookView DEBUG] At page 0, no scroll needed');
      setInitialScrollDone(true);
      return;
    }

    const width = pagerRef.current.clientWidth;
    const targetScrollLeft = currentIndex * width;

    console.log('[MobileBookView DEBUG] Scrolling:', {
      currentIndex,
      pagerWidth: width,
      targetScrollLeft,
      currentScrollLeft: pagerRef.current.scrollLeft
    });

    if (width > 0) {
      // Set scroll position without animation to prevent visual jump
      pagerRef.current.style.scrollBehavior = 'auto';
      pagerRef.current.scrollLeft = targetScrollLeft;

      // Verify scroll was set
      console.log('[MobileBookView DEBUG] After scroll:', {
        actualScrollLeft: pagerRef.current.scrollLeft,
        expected: targetScrollLeft
      });

      // Restore smooth scrolling for future navigations
      requestAnimationFrame(() => {
        if (pagerRef.current) {
          pagerRef.current.style.scrollBehavior = '';
          // Final verification
          console.log('[MobileBookView DEBUG] After RAF:', {
            finalScrollLeft: pagerRef.current.scrollLeft,
            finalPage: Math.round(pagerRef.current.scrollLeft / width)
          });
        }
      });
      setInitialScrollDone(true);
    }
  }, [currentIndex, initialScrollDone]);

  // For non-initialStoryId cases, restore saved position
  useEffect(() => {
    if (bookPages.length === 0) return;
    if (initialNavigationDone) return;
    if (initialStoryId) return; // Handled by useLayoutEffect above

    // Restore saved position (with bounds check)
    if (currentIndex > 0 && currentIndex < bookPages.length) {
      setInitialNavigationDone(true);
      setTimeout(() => scrollToIndex(currentIndex), 100);
    } else {
      setInitialNavigationDone(true);
    }
  }, [bookPages.length, initialNavigationDone, initialStoryId, currentIndex, scrollToIndex]);

  // Loading state - wait for both context and data to load
  // On first load, isContextLoading is true while activeContext is null
  // Once context loads, the query enables and isLoading becomes true while fetching
  // Also wait if we have initialStoryId but haven't navigated to it yet
  const isWaitingForNavigation = initialStoryId && !initialNavigationDone && bookPages.length > 0 && targetPageIndex !== null;

  if (isContextLoading || isLoading || (!data && storytellerId) || isWaitingForNavigation) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#8B7355]/30 border-t-[#8B7355]"></div>
          <p className="text-sm text-white/60">Loading your story...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (bookPages.length === 0) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-neutral-950 px-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-white">No Stories Yet</h2>
          <p className="mb-6 text-sm text-white/60">
            Add stories to your timeline and include them in your book to see them here.
          </p>
          <button
            onClick={() => router.push("/timeline")}
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-white/90"
          >
            Go to Timeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen select-none overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900"></div>

      {/* Top gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-black/40 to-transparent"></div>

      {/* Top bar */}
      <BookTopBar
        bookTitle={bookTitle}
        userInitials={userInitials}
        onTimelineClick={handleTimelineClick}
        onEditClick={handleEditClick}
        onTocClick={() => setIsTocOpen(true)}
        viewMode={chaptersData?.chapters && chaptersData.chapters.length > 0 ? viewMode : undefined}
        onViewModeChange={chaptersData?.chapters && chaptersData.chapters.length > 0 ? setViewMode : undefined}
        showEditButton={bookPages[currentIndex]?.type === "story"}
      />

      {/* Horizontal pager */}
      <div
        ref={pagerRef}
        onScroll={handleScroll}
        className="relative z-10 flex h-[100dvh] w-screen snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{
          scrollSnapType: "x mandatory",
          touchAction: "pan-x pan-y", // Allow both horizontal swipe and vertical scroll within pages
        }}
      >
        {bookPages.map((page, index) => {
          // Find first story page index for priority loading
          const firstStoryIndex = bookPages.findIndex(p => p.type === "story");
          const isPriority = page.type === "story" && index === firstStoryIndex;
          // Autoplay only for the target story page when active
          const isAutoplayPage = shouldAutoplay && page.type === "story" && page.story.id === initialStoryId && index === currentIndex;

          return (
            <BookPageRenderer
              key={index}
              page={page}
              isActive={index === currentIndex}
              caveatFont={caveatFont}
              pageNumber={index + 1}
              isPriority={isPriority}
              onStorySelect={handleStorySelect}
              autoplay={isAutoplayPage}
              onAutoplayConsumed={() => setShouldAutoplay(false)}
            />
          );
        })}
      </div>

      {/* Navigation arrows */}
      <NavigationArrows
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      {/* Table of contents - pass only story pages */}
      <BookTableOfContents
        stories={bookStories}
        chapters={chaptersData?.chapters || []}
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        onStorySelect={handleStorySelect}
        onTocPageNavigate={() => {
          // Find the TOC page index and navigate to it
          const tocIndex = bookPages.findIndex(page => page.type === 'toc');
          if (tocIndex >= 0) {
            scrollToIndex(tocIndex);
          }
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Safe area bottom spacer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[calc(env(safe-area-inset-bottom)+68px)]"></div>
    </div>
  );
}
