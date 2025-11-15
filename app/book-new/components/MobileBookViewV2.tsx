"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAccountContext } from "@/hooks/use-account-context";
import { supabase } from "@/lib/supabase";
import { Story } from "@/shared/schema";
import { BookStory, MobileBookViewV2Props } from "./types";
import BookPageCard from "./BookPageCard";
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

  // Fetch stories
  const storytellerId = activeContext?.storytellerId;
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories", storytellerId],
    queryFn: async () => {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();

      const url = storytellerId
        ? `/api/stories?storyteller_id=${storytellerId}`
        : "/api/stories";

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token if available
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }
      return response.json();
    },
    enabled: !!storytellerId,
  });

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
    scrollToIndex(Math.min(bookStories.length - 1, currentIndex + 1));
  }, [currentIndex, bookStories.length, scrollToIndex]);

  // Navigation state
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < bookStories.length - 1;

  // Handle story selection from TOC
  const handleStorySelect = useCallback(
    (storyId: string) => {
      const index = bookStories.findIndex((s) => s.id === storyId);
      if (index >= 0) {
        setIsTocOpen(false);
        setTimeout(() => scrollToIndex(index), 100);
      }
    },
    [bookStories, scrollToIndex]
  );

  // Update sessionStorage whenever current story changes (for GlassNav smart routing)
  useEffect(() => {
    if (bookStories[currentIndex]) {
      const storyId = bookStories[currentIndex].id;
      sessionStorage.setItem('current-book-story-id', storyId);
      console.log('[MobileBookView] Updated current story ID in storage:', storyId);
    } else {
      sessionStorage.removeItem('current-book-story-id');
      console.log('[MobileBookView] Cleared current story ID (no story at current index)');
    }
  }, [bookStories, currentIndex]);

  // Navigate to timeline with smart routing
  const handleTimelineClick = useCallback(() => {
    console.log('[MobileBookView] Timeline clicked. currentIndex:', currentIndex);
    console.log('[MobileBookView] bookStories length:', bookStories.length);
    console.log('[MobileBookView] Current story:', bookStories[currentIndex]);

    // If we have a current story, store navigation context for timeline to scroll to it
    if (bookStories[currentIndex]) {
      const context = {
        memoryId: bookStories[currentIndex].id,
        scrollPosition: 0, // Start at top, will scroll to card
        timestamp: Date.now(),
        returnPath: '/timeline', // Required by timeline navigation logic
      };
      console.log('[MobileBookView] Setting sessionStorage context:', context);
      sessionStorage.setItem('timeline-navigation-context', JSON.stringify(context));
      console.log('[MobileBookView] SessionStorage set. Verifying:', sessionStorage.getItem('timeline-navigation-context'));
    } else {
      console.log('[MobileBookView] No current story - skipping sessionStorage');
    }

    router.push("/timeline");
  }, [bookStories, currentIndex, router]);

  // Navigate to edit
  const handleEditClick = useCallback(() => {
    if (bookStories[currentIndex]) {
      router.push(`/review/book-style?edit=${bookStories[currentIndex].id}&returnPath=${encodeURIComponent('/book')}`);
    }
  }, [bookStories, currentIndex, router]);

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
    if (initialStoryId && bookStories.length > 0) {
      const index = bookStories.findIndex((s) => s.id === initialStoryId);
      if (index >= 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => scrollToIndex(index), 100);
      }
    }
  }, [initialStoryId, bookStories, scrollToIndex]);

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
  if (bookStories.length === 0) {
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
        {bookStories.map((story, index) => (
          <BookPageCard
            key={story.id}
            story={story}
            isActive={index === currentIndex}
            caveatFont={caveatFont}
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

      {/* Table of contents */}
      <BookTableOfContents
        stories={bookStories}
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        onStorySelect={handleStorySelect}
      />

      {/* Safe area bottom spacer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[calc(env(safe-area-inset-bottom)+68px)]"></div>
    </div>
  );
}
