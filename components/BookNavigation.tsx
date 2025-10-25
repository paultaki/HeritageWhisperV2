"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { BookPage } from "@/lib/bookPagination";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DecadeSection {
  decade: string;
  title: string;
  startPage: number;
  stories: Array<{
    title: string;
    pageNumber: number;
    year: string;
  }>;
}

interface BookStructure {
  decades: DecadeSection[];
  totalPages: number;
}

interface BookNavigationProps {
  pages: BookPage[];
  currentPage: number;
  totalPages: number;
  onNavigateToPage: (pageNumber: number) => void;
  isMobile: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build navigation structure from book pages
 */
function buildBookStructure(pages: BookPage[]): BookStructure {
  const decades: DecadeSection[] = [];
  const decadeMap = new Map<string, DecadeSection>();

  pages.forEach((page) => {
    // Find decade markers
    if (page.type === "decade-marker" && page.decade) {
      if (!decadeMap.has(page.decade)) {
        decadeMap.set(page.decade, {
          decade: page.decade,
          title: page.decadeTitle || page.decade,
          startPage: page.pageNumber,
          stories: [],
        });
      }
    }

    // Find story starts
    if (
      (page.type === "story-start" || page.type === "story-complete") &&
      page.title &&
      page.year
    ) {
      const decade = `${Math.floor(parseInt(page.year) / 10) * 10}s`;
      const decadeSection = decadeMap.get(decade);
      if (decadeSection) {
        // Avoid duplicates
        const exists = decadeSection.stories.some(
          (s) => s.title === page.title && s.pageNumber === page.pageNumber,
        );
        if (!exists) {
          decadeSection.stories.push({
            title: page.title,
            pageNumber: page.pageNumber,
            year: page.year,
          });
        }
      }
    }
  });

  // Convert to array and sort by decade
  const sortedDecades = Array.from(decadeMap.values()).sort((a, b) => {
    const aYear = parseInt(a.decade);
    const bYear = parseInt(b.decade);
    return aYear - bYear;
  });

  return {
    decades: sortedDecades,
    totalPages: pages.length,
  };
}

// ============================================================================
// DESKTOP TOC SIDEBAR COMPONENT
// ============================================================================

interface DesktopTOCSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookStructure: BookStructure;
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
  isFullscreen: boolean;
}

function DesktopTOCSidebar({
  isOpen,
  onClose,
  bookStructure,
  currentPage,
  onNavigateToPage,
  isFullscreen,
}: DesktopTOCSidebarProps) {
  const [expandedDecades, setExpandedDecades] = useState<Set<string>>(
    new Set(),
  );
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-expand current decade
  useEffect(() => {
    const currentDecade = bookStructure.decades.find((d) =>
      d.stories.some((s) => s.pageNumber === currentPage),
    );
    if (currentDecade) {
      setExpandedDecades((prev) => new Set(prev).add(currentDecade.decade));
    }
  }, [currentPage, bookStructure]);

  const toggleDecade = (decade: string) => {
    setExpandedDecades((prev) => {
      const next = new Set(prev);
      if (next.has(decade)) {
        next.delete(decade);
      } else {
        next.add(decade);
      }
      return next;
    });
  };

  const handleNavigate = (pageNumber: number) => {
    onNavigateToPage(pageNumber - 1); // Convert to 0-indexed
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          style={{
            left: isFullscreen ? '0' : '112px', // Don't cover the navbar
          }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with attached orange close tab */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 bottom-0 w-80 bg-white shadow-2xl z-50 transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          left: isFullscreen ? '0' : '112px', // 112px = 7rem = w-28 (sidebar width)
        }}
        role="navigation"
        aria-label="Table of contents"
      >
        {/* Orange close tab attached to right edge - only show when open */}
        {isOpen && (
          <button
            onClick={onClose}
            className="absolute -right-12 top-1/2 -translate-y-1/2 w-12 h-24 bg-amber-600 hover:bg-amber-700 rounded-r-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center border border-l-0 border-amber-700"
            aria-label="Close table of contents"
            data-toc-state="open"
            data-icon="x"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-serif font-semibold text-gray-800">
            Table of Contents
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-[calc(100vh-73px)] px-4 py-4">
          {bookStructure.decades.map((decade) => {
            const isExpanded = expandedDecades.has(decade.decade);
            const isCurrentDecade = decade.stories.some(
              (s) => s.pageNumber === currentPage,
            );

            return (
              <div key={decade.decade} className="mb-4">
                {/* Decade header */}
                <button
                  onClick={() => toggleDecade(decade.decade)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isCurrentDecade
                      ? "bg-amber-50 text-amber-900"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold">
                      {decade.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({decade.stories.length})
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Story list */}
                {isExpanded && (
                  <div className="mt-1 ml-3 space-y-1">
                    {decade.stories.map((story, idx) => {
                      const isCurrent = story.pageNumber === currentPage;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleNavigate(story.pageNumber)}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            isCurrent
                              ? "bg-amber-100 text-amber-900 font-medium"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex justify-between items-baseline">
                            <span className="flex-1 pr-2">{story.title}</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              p.{story.pageNumber}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// DESKTOP PROGRESS BAR COMPONENT
// ============================================================================

interface DesktopProgressBarProps {
  currentPage: number;
  totalPages: number;
  bookStructure: BookStructure;
  onNavigateToPage: (pageNumber: number) => void;
}

function DesktopProgressBar({
  currentPage,
  totalPages,
  bookStructure,
  onNavigateToPage,
}: DesktopProgressBarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  const progress = (currentPage / totalPages) * 100;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const targetPage = Math.floor(percentage * totalPages);
    onNavigateToPage(Math.max(0, Math.min(totalPages - 1, targetPage)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverPosition(x);
  };

  const getHoverPage = () => {
    const rect = document
      .querySelector(".progress-bar-container")
      ?.getBoundingClientRect();
    if (!rect) return 1;
    const percentage = hoverPosition / rect.width;
    return Math.floor(percentage * totalPages) + 1;
  };

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (hasPrevious) {
      // currentPage is 1-indexed, convert to 0-indexed and go back 2 pages (for spread)
      onNavigateToPage(currentPage - 1 - 2);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      // currentPage is 1-indexed, convert to 0-indexed and go forward 2 pages (for spread)
      onNavigateToPage(currentPage - 1 + 2);
    }
  };

  return (
    <div className="book-progress-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="relative px-6 py-3 max-w-7xl mx-auto flex items-center gap-4">
        {/* Previous button - Classic physical button style for seniors */}
        <button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 min-w-[80px] rounded transition-all font-semibold text-xs uppercase tracking-wide ${
            hasPrevious
              ? "bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 hover:from-gray-100 hover:via-gray-150 hover:to-gray-250 text-gray-800 border-t-2 border-l-2 border-r border-b border-t-gray-300 border-l-gray-300 border-r-gray-500 border-b-gray-600 active:border-t-gray-500 active:border-l-gray-500 active:border-r-gray-300 active:border-b-gray-300"
              : "bg-gradient-to-b from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
          }`}
          style={hasPrevious ? {
            boxShadow: "0 3px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
          } : {
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5 -mb-1" />
          <span className="text-[10px]">PREV</span>
        </button>

        {/* Progress bar */}
        <div
          className="progress-bar-container relative h-2 bg-gray-200 rounded-full cursor-pointer overflow-visible group transition-all duration-200 hover:h-3 flex-1"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          role="slider"
          aria-label="Book progress"
          aria-valuemin={1}
          aria-valuemax={totalPages}
          aria-valuenow={currentPage}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />

          {/* Decade markers */}
          {bookStructure.decades.map((decade) => {
            // Clamp marker position to max 98% to keep within progress bar bounds
            const rawPosition = (decade.startPage / totalPages) * 100;
            const markerPosition = Math.min(rawPosition, 98);
            
            // Only show markers that are within valid range
            if (decade.startPage > totalPages) {
              console.warn(`[BookNavigation] Decade marker out of range: ${decade.title} at page ${decade.startPage} (total: ${totalPages})`);
              return null;
            }
            
            return (
              <div
                key={decade.decade}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-700 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-150 transition-transform"
                style={{ left: `${markerPosition}%` }}
                title={decade.title}
              />
            );
          })}

          {/* Hover tooltip */}
          {isHovering && (
            <div
              className="absolute bottom-full mb-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                left: `${hoverPosition}px`,
                transform: "translateX(-50%)",
              }}
            >
              Page {getHoverPage()} of {totalPages}
            </div>
          )}
        </div>

        {/* Next button - Classic physical button style for seniors */}
        <button
          onClick={handleNextPage}
          disabled={!hasNext}
          className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 min-w-[80px] rounded transition-all font-semibold text-xs uppercase tracking-wide ${
            hasNext
              ? "bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 hover:from-gray-100 hover:via-gray-150 hover:to-gray-250 text-gray-800 border-t-2 border-l-2 border-r border-b border-t-gray-300 border-l-gray-300 border-r-gray-500 border-b-gray-600 active:border-t-gray-500 active:border-l-gray-500 active:border-r-gray-300 active:border-b-gray-300"
              : "bg-gradient-to-b from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
          }`}
          style={hasNext ? {
            boxShadow: "0 3px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
          } : {
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5 -mb-1" />
          <span className="text-[10px]">NEXT</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MOBILE BOTTOM SHEET COMPONENT
// ============================================================================

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookStructure: BookStructure;
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
}

function MobileBottomSheet({
  isOpen,
  onClose,
  bookStructure,
  currentPage,
  onNavigateToPage,
}: MobileBottomSheetProps) {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Touch handlers for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentY > 100) {
      // Swipe down threshold
      onClose();
    }
    setCurrentY(0);
  };

  const handleNavigate = (pageNumber: number) => {
    onNavigateToPage(pageNumber - 1); // Convert to 0-indexed
    onClose();
    setSelectedDecade(null);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[150] transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[160] transition-transform duration-300 ease-out"
        style={{
          height: "70vh",
          transform: isOpen ? `translateY(${currentY}px)` : "translateY(100%)",
        }}
        role="dialog"
        aria-label="Navigation menu"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-gray-800">
            Jump to...
          </h2>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(70vh-80px)] px-6 py-6">
          {!selectedDecade ? (
            // Decade grid
            <div className="grid grid-cols-2 gap-4">
              {bookStructure.decades.map((decade) => {
                const isCurrentDecade = decade.stories.some(
                  (s) => s.pageNumber === currentPage,
                );
                return (
                  <button
                    key={decade.decade}
                    onClick={() => setSelectedDecade(decade.decade)}
                    className={`p-5 rounded-xl border-2 transition-all active:scale-95 min-h-[100px] flex flex-col items-center justify-center ${
                      isCurrentDecade
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-base font-serif font-semibold text-gray-800 text-center">
                      {decade.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {decade.stories.length} {decade.stories.length === 1 ? 'story' : 'stories'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Story list
            <div>
              <button
                onClick={() => setSelectedDecade(null)}
                className="flex items-center gap-2 text-base text-gray-600 mb-6 active:text-gray-900 py-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to decades
              </button>

              <div className="space-y-3">
                {bookStructure.decades
                  .find((d) => d.decade === selectedDecade)
                  ?.stories.map((story, idx) => {
                    const isCurrent = story.pageNumber === currentPage;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleNavigate(story.pageNumber)}
                        className={`w-full text-left p-5 rounded-xl transition-all active:scale-98 ${
                          isCurrent
                            ? "bg-amber-100 border-2 border-amber-500"
                            : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-baseline gap-3">
                          <span className="font-medium text-gray-800 flex-1 text-base leading-snug">
                            {story.title}
                          </span>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            p.{story.pageNumber}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MOBILE NAVIGATION BAR COMPONENT
// ============================================================================

interface MobileNavBarProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onOpenMenu: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

function MobileNavBar({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onOpenMenu,
  hasPrevious,
  hasNext,
}: MobileNavBarProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-area-bottom shadow-lg"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Previous button - Classic physical button style */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`w-[68px] flex flex-col items-center justify-center gap-0.5 py-2 rounded transition-all font-semibold text-[9px] uppercase tracking-wide ${
            hasPrevious
              ? "bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 text-gray-800 border-t-2 border-l-2 border-r border-b border-t-gray-300 border-l-gray-300 border-r-gray-500 border-b-gray-600 active:border-t-gray-500 active:border-l-gray-500 active:border-r-gray-300 active:border-b-gray-300"
              : "bg-gradient-to-b from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
          }`}
          style={hasPrevious ? {
            boxShadow: "0 2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
          } : {
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5 -mb-0.5" />
          <span>PREV</span>
        </button>

        {/* Jump To button - Takes remaining space */}
        <button
          onClick={onOpenMenu}
          className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 border-t-2 border-l-2 border-r border-b border-t-amber-300 border-l-amber-300 border-r-amber-600 border-b-amber-700 text-amber-900 font-semibold text-xs uppercase tracking-wide transition-all active:border-t-amber-600 active:border-l-amber-600 active:border-r-amber-300 active:border-b-amber-300"
          style={{
            boxShadow: "0 2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[11px]">Jump To</span>
        </button>

        {/* Next button - Classic physical button style */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`w-[68px] flex flex-col items-center justify-center gap-0.5 py-2 rounded transition-all font-semibold text-[9px] uppercase tracking-wide ${
            hasNext
              ? "bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 text-gray-800 border-t-2 border-l-2 border-r border-b border-t-gray-300 border-l-gray-300 border-r-gray-500 border-b-gray-600 active:border-t-gray-500 active:border-l-gray-500 active:border-r-gray-300 active:border-b-gray-300"
              : "bg-gradient-to-b from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
          }`}
          style={hasNext ? {
            boxShadow: "0 2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
          } : {
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5 -mb-0.5" />
          <span>NEXT</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN BOOK NAVIGATION COMPONENT
// ============================================================================

export default function BookNavigation({
  pages,
  currentPage,
  totalPages,
  onNavigateToPage,
  isMobile,
}: BookNavigationProps) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const bookStructure = buildBookStructure(pages);

  const hasPrevious = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigateToPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigateToPage(currentPage + 1);
    }
  };

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 for decades
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key) - 1;
        if (index < bookStructure.decades.length) {
          const decade = bookStructure.decades[index];
          onNavigateToPage(decade.startPage - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, bookStructure, onNavigateToPage]);

  return (
    <>
      {/* Desktop ONLY: Progress bar with arrows (TOC is now in BookSidebarPanel) */}
      {!isMobile && (
        <DesktopProgressBar
          currentPage={currentPage + 1}
          totalPages={totalPages}
          bookStructure={bookStructure}
          onNavigateToPage={onNavigateToPage}
        />
      )}

      {/* Mobile: Bottom navigation - Always render but hide on desktop with CSS */}
      <div className={isMobile === false ? "hidden" : "block md:hidden"}>
        <MobileNavBar
          currentPage={currentPage + 1}
          totalPages={totalPages}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onOpenMenu={() => setBottomSheetOpen(true)}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />

        <MobileBottomSheet
          isOpen={bottomSheetOpen}
          onClose={() => setBottomSheetOpen(false)}
          bookStructure={bookStructure}
          currentPage={currentPage + 1}
          onNavigateToPage={onNavigateToPage}
        />
      </div>
    </>
  );
}
