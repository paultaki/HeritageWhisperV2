'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookWrapProps {
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
  spreadMode?: boolean; // Navigate by spreads (2 pages at a time)
  viewMode?: 'single' | 'spread'; // View mode for spine hint
  scrollToPageRef?: React.MutableRefObject<((pageIndex: number) => void) | null>; // Expose scroll function to parent
}

/**
 * BookWrap - Scrollable container for pages with premium navigation
 *
 * Features:
 * - Scroll-snap pagination
 * - Arrow key navigation (←/→)
 * - Page Up/Down navigation
 * - Visual arrow buttons (64px tap targets)
 * - Premium spine hint in single-page mode
 * - Accessible focus management
 * - Spread mode: Navigate by two-page spreads
 * - Smooth transitions with reduced-motion support
 */
export default function BookWrap({
  children,
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  spreadMode = false,
  viewMode = 'single',
  scrollToPageRef,
}: BookWrapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Scroll to specific page or spread
  const scrollToPage = useCallback((pageIndex: number) => {
    if (!wrapRef.current) return;

    // In spread mode, scroll to the spread container
    const selector = spreadMode ? '.spread' : '.page';
    const elements = wrapRef.current.querySelectorAll(selector);

    // In spread mode, each spread contains 2 pages
    const targetIndex = spreadMode ? Math.floor(pageIndex / 2) : pageIndex;

    if (elements[targetIndex]) {
      elements[targetIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      onPageChange(pageIndex);
    }
  }, [onPageChange, spreadMode]);

  // Navigate to previous page/spread
  const goToPrevious = useCallback(() => {
    if (currentPage > 0) {
      const step = spreadMode ? 2 : 1;
      const newPage = Math.max(0, currentPage - step);
      scrollToPage(newPage);
    }
  }, [currentPage, scrollToPage, spreadMode]);

  // Navigate to next page/spread
  const goToNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      const step = spreadMode ? 2 : 1;
      const newPage = Math.min(totalPages - 1, currentPage + step);
      scrollToPage(newPage);
    }
  }, [currentPage, totalPages, scrollToPage, spreadMode]);

  // Expose scrollToPage function to parent component
  useEffect(() => {
    if (scrollToPageRef) {
      scrollToPageRef.current = scrollToPage;
    }
  }, [scrollToPageRef, scrollToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // Spacebar
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          scrollToPage(0);
          break;
        case 'End':
          e.preventDefault();
          scrollToPage(totalPages - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, scrollToPage, totalPages]);

  // Track scroll position to update current page
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const handleScroll = () => {
      const selector = spreadMode ? '.spread' : '.page';
      const elements = wrap.querySelectorAll(selector);

      // Find which element is most visible
      let maxVisibleHeight = 0;
      let mostVisibleIndex = currentPage;

      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();

        // Calculate visible height of this element
        const visibleTop = Math.max(rect.top, wrapRect.top);
        const visibleBottom = Math.min(rect.bottom, wrapRect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          // In spread mode, convert spread index to page index (first page of spread)
          mostVisibleIndex = spreadMode ? index * 2 : index;
        }
      });

      if (mostVisibleIndex !== currentPage) {
        onPageChange(mostVisibleIndex);
      }
    };

    wrap.addEventListener('scroll', handleScroll, { passive: true });
    return () => wrap.removeEventListener('scroll', handleScroll);
  }, [currentPage, onPageChange, spreadMode]);

  return (
    <div className="relative">
      {/* Navigation Arrows - 64px touch targets */}
      {currentPage > 0 && (
        <button
          onClick={goToPrevious}
          className="nav-arrow fixed left-8 top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border border-gray-200 no-print"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700 group-hover:text-coral-600 transition-colors" />
        </button>
      )}

      {currentPage < totalPages - 1 && (
        <button
          onClick={goToNext}
          className="nav-arrow fixed right-8 top-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border border-gray-200 no-print"
          aria-label="Next page"
        >
          <ChevronRight className="w-7 h-7 text-gray-700 group-hover:text-coral-600 transition-colors" />
        </button>
      )}

      {/* Scrollable page container with optional spine hint */}
      <div
        ref={wrapRef}
        className={`book-wrap ${className}`}
        role="document"
        tabIndex={0}
        aria-label={`Book viewer, page ${currentPage + 1} of ${totalPages}`}
      >
        {/* Spine hint for single-page mode - creates premium depth */}
        {viewMode === 'single' && (
          <div className="spine-hint no-print" aria-hidden="true" />
        )}

        {children}
      </div>

      {/* Keyboard hints - subtle and premium */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg text-xs font-medium text-gray-600 no-print hidden md:block border border-gray-200/50">
        Use ← → or Page Up/Down • Page {currentPage + 1} of {totalPages}
      </div>
    </div>
  );
}
