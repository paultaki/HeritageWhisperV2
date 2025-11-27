/**
 * BookContainer - Main orchestrator for Book V2
 * Handles page display, navigation, and responsive layout
 */

"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { usePageNavigation, useSwipeGesture, useReadingPosition } from '../hooks/usePageNavigation';
import { PageContent, PageData, ContentBlock } from './PageContent';
import { ChapterDivider } from './DecorativeHeader';

// Story interface matching API
interface Story {
  id: string;
  title: string;
  transcription?: string;
  storyYear: number;
  storyDate?: string;
  lifeAge?: number;
  audioUrl?: string;
  wisdomClipText?: string;
  photos?: Array<{
    id: string;
    url: string;
    transform?: { zoom: number; position: { x: number; y: number } };
    isHero?: boolean;
  }>;
  includeInBook?: boolean;
}

interface BookContainerProps {
  stories: Story[];
  isLoading?: boolean;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isOwnAccount?: boolean;
}

// Animation variants
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0.5,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0.5,
  }),
};

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function BookContainer({
  stories,
  isLoading,
  fontSize,
  onFontSizeChange,
  isOwnAccount,
}: BookContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Filter and sort stories for book
  const bookStories = useMemo(() => {
    return stories
      .filter(s => s.includeInBook !== false && s.transcription)
      .sort((a, b) => a.storyYear - b.storyYear);
  }, [stories]);

  // Convert stories to pages
  const pages = useMemo(() => {
    return storiesToPages(bookStories);
  }, [bookStories]);

  // Navigation
  const navigation = usePageNavigation({
    totalPages: pages.length,
    onPageChange: (page) => {
      // Announce to screen readers
      if (liveRegionRef.current) {
        const currentStory = pages[page]?.storyId
          ? bookStories.find(s => s.id === pages[page].storyId)
          : null;
        liveRegionRef.current.textContent = `Page ${page + 1} of ${pages.length}${
          currentStory ? `. ${currentStory.title}` : ''
        }`;
      }
    },
  });

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeGesture(navigation.handleSwipe);

  // Reading position persistence
  useReadingPosition(pages, navigation.currentPage, navigation.goToPage);

  // Loading state
  if (isLoading) {
    return (
      <div className="book-v2-container">
        <div className="book-v2-loading">
          <div className="book-v2-loading-spinner" />
          <p className="mt-4 text-white/70">Loading your book...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (bookStories.length === 0) {
    return (
      <div className="book-v2-container">
        <div className="book-v2-empty">
          <BookOpen className="w-16 h-16 text-white/30 mb-4" />
          <h2>Your Book Is Waiting</h2>
          <p>
            {isOwnAccount
              ? "Record your first memory to start building your keepsake book."
              : "No stories have been shared yet."}
          </p>
        </div>
      </div>
    );
  }

  const variants = prefersReducedMotion ? fadeVariants : pageVariants;
  const currentPage = pages[navigation.currentPage];

  return (
    <div
      ref={containerRef}
      className="book-v2-container"
      onKeyDown={navigation.handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Memory Book"
      {...swipeHandlers}
    >
      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Progress indicator */}
      <div className="book-v2-progress">
        Page {navigation.currentPage + 1} of {pages.length}
      </div>

      {/* Pages */}
      <div className="book-v2-pages">
        {isMobile ? (
          // Mobile: Single page
          <AnimatePresence mode="wait" custom={navigation.direction}>
            <motion.div
              key={navigation.currentPage}
              custom={navigation.direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="book-v2-page"
            >
              <PageContent
                page={currentPage}
                fontSize={fontSize}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          // Desktop: Dual-page spread
          <div className="book-v2-spread">
            <AnimatePresence mode="wait" custom={navigation.direction}>
              <motion.div
                key={`spread-${navigation.currentSpread}`}
                custom={navigation.direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="flex gap-1"
              >
                {/* Left page */}
                <div className="book-v2-page book-v2-page--left">
                  {pages[navigation.currentSpread * 2] && (
                    <PageContent
                      page={pages[navigation.currentSpread * 2]}
                      fontSize={fontSize}
                    />
                  )}
                </div>

                {/* Right page */}
                <div className="book-v2-page book-v2-page--right">
                  {pages[navigation.currentSpread * 2 + 1] && (
                    <PageContent
                      page={pages[navigation.currentSpread * 2 + 1]}
                      fontSize={fontSize}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <nav className="book-v2-nav" aria-label="Page navigation">
        <button
          className="book-v2-nav-button"
          onClick={navigation.goPrev}
          disabled={!navigation.canGoPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          className="book-v2-nav-button"
          onClick={navigation.goNext}
          disabled={!navigation.canGoNext}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}

/**
 * Convert stories to page data
 * This is a simplified version - the full version would use bookPagination.ts
 */
function storiesToPages(stories: Story[]): PageData[] {
  const pages: PageData[] = [];
  let pageNumber = 1;

  // Group stories by decade
  const decades = new Map<string, Story[]>();
  for (const story of stories) {
    const decade = `${Math.floor(story.storyYear / 10) * 10}s`;
    if (!decades.has(decade)) {
      decades.set(decade, []);
    }
    decades.get(decade)!.push(story);
  }

  // Create pages for each decade
  for (const [decade, decadeStories] of decades) {
    // Decade marker page
    pages.push({
      type: 'decade-marker',
      pageNumber: pageNumber++,
      blocks: [],
      isLeftPage: pageNumber % 2 === 0,
      isRightPage: pageNumber % 2 === 1,
    });

    // Story pages
    for (const story of decadeStories) {
      const blocks: ContentBlock[] = [];

      // Title
      blocks.push({ type: 'title', content: story.title });

      // Metadata
      blocks.push({
        type: 'metadata',
        year: story.storyYear,
        age: story.lifeAge,
        date: story.storyDate,
      });

      // Photos
      if (story.photos?.length) {
        blocks.push({ type: 'photo', photos: story.photos });
      }

      // Audio
      if (story.audioUrl) {
        blocks.push({ type: 'audio', audioUrl: story.audioUrl });
      }

      // Paragraphs
      const paragraphs = (story.transcription || '').split('\n\n').filter(p => p.trim());
      for (const para of paragraphs) {
        blocks.push({ type: 'paragraph', content: para.trim() });
      }

      // Wisdom clip
      if (story.wisdomClipText) {
        blocks.push({ type: 'wisdomClip', content: story.wisdomClipText });
      }

      pages.push({
        type: 'story-complete',
        pageNumber: pageNumber++,
        storyId: story.id,
        blocks,
        isLeftPage: pageNumber % 2 === 0,
        isRightPage: pageNumber % 2 === 1,
      });
    }
  }

  return pages;
}
