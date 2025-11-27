/**
 * Page Navigation Hook for Book V2
 * Handles keyboard, swipe, and click navigation
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UsePageNavigationOptions {
  totalPages: number;
  onPageChange?: (page: number) => void;
}

interface UsePageNavigationReturn {
  currentPage: number;
  currentSpread: number;
  direction: number;
  goNext: () => void;
  goPrev: () => void;
  goToPage: (page: number) => void;
  goToSpread: (spread: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSwipe: (direction: 'left' | 'right') => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePageNavigation({
  totalPages,
  onPageChange,
}: UsePageNavigationOptions): UsePageNavigationReturn {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);

  // Track the last page for direction calculation
  const lastPageRef = useRef(0);

  const goToPage = useCallback((page: number) => {
    const clampedPage = Math.max(0, Math.min(totalPages - 1, page));
    setDirection(clampedPage > lastPageRef.current ? 1 : -1);
    lastPageRef.current = clampedPage;
    setCurrentPage(clampedPage);
    onPageChange?.(clampedPage);
  }, [totalPages, onPageChange]);

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToSpread = useCallback((spread: number) => {
    goToPage(spread * 2);
  }, [goToPage]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        goNext();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        goPrev();
        break;
      case 'Home':
        e.preventDefault();
        goToPage(0);
        break;
      case 'End':
        e.preventDefault();
        goToPage(totalPages - 1);
        break;
    }
  }, [goNext, goPrev, goToPage, totalPages]);

  // Swipe gesture handling
  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'left') {
      goNext();
    } else {
      goPrev();
    }
  }, [goNext, goPrev]);

  return {
    currentPage,
    currentSpread: Math.floor(currentPage / 2),
    direction,
    goNext,
    goPrev,
    goToPage,
    goToSpread,
    handleKeyDown,
    handleSwipe,
    canGoNext: currentPage < totalPages - 1,
    canGoPrev: currentPage > 0,
  };
}

/**
 * Hook for touch/swipe gesture detection
 */
export function useSwipeGesture(
  onSwipe: (direction: 'left' | 'right') => void
) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onSwipe('right'); // Swipe right = go prev
      } else {
        onSwipe('left'); // Swipe left = go next
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [onSwipe]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Hook for reading position persistence
 */
export function useReadingPosition(
  pages: Array<{ storyId?: string }>,
  currentPage: number,
  goToPage: (page: number) => void
) {
  const STORAGE_KEY = 'book-v2-reading-position';
  const hasRestoredRef = useRef(false);

  // Save position on page change
  useEffect(() => {
    if (pages.length === 0 || !hasRestoredRef.current) return;

    const currentStoryId = pages[currentPage]?.storyId;
    if (currentStoryId) {
      const position = {
        storyId: currentStoryId,
        pageIndex: currentPage,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [currentPage, pages]);

  // Restore position on mount
  useEffect(() => {
    if (pages.length === 0 || hasRestoredRef.current) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { storyId, pageIndex } = JSON.parse(saved);

        // Find the page with this story
        const foundIndex = pages.findIndex(p => p.storyId === storyId);
        if (foundIndex !== -1) {
          goToPage(foundIndex);
        } else if (pageIndex < pages.length) {
          // Fallback to saved page index
          goToPage(pageIndex);
        }
      }
    } catch (e) {
      console.error('Failed to restore reading position:', e);
    }

    hasRestoredRef.current = true;
  }, [pages, goToPage]);
}
