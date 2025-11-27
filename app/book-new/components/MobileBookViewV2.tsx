"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRouter } from "next/navigation";
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
}: MobileBookViewV2Props) {
  const router = useRouter();
  const { activeContext } = useAccountContext();
  const pagerRef = useRef<HTMLDivElement>(null);

  console.log('[MobileBookViewV2] Render - activeContext:', activeContext);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chronological' | 'chapters'>('chronological');

  // Fetch stories
  const storytellerId = activeContext?.storytellerId;
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories", storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `/api/stories?storyteller_id=${storytellerId}`
        : "/api/stories";

      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: !!storytellerId,
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
    enabled: !!storytellerId,
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
  const handleScroll = useCallback(() => {
    if (!pagerRef.current) return;
    const width = pagerRef.current.clientWidth || 1;
    const newIndex = Math.round(pagerRef.current.scrollLeft / width);
    setCurrentIndex(newIndex);
  }, []);

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
  useEffect(() => {
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

  // Jump to initial story if provided
  useEffect(() => {
    if (initialStoryId && bookPages.length > 0) {
      const pageIndex = bookPages.findIndex(
        (page) => page.type === "story" && page.story.id === initialStoryId
      );
      if (pageIndex >= 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => scrollToIndex(pageIndex), 100);
      }
    }
  }, [initialStoryId, bookPages, scrollToIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
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
          touchAction: "pan-x",
        }}
      >
        {bookPages.map((page, index) => (
          <BookPageRenderer
            key={index}
            page={page}
            isActive={index === currentIndex}
            caveatFont={caveatFont}
            pageNumber={index + 1}
          />
        ))}
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Safe area bottom spacer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[calc(env(safe-area-inset-bottom)+68px)]"></div>
    </div>
  );
}
