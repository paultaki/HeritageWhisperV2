"use client";

import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { BookPage } from "@/lib/bookPagination";

interface DecadeSection {
  decade: string;
  title: string;
  startPage: number;
  isChapter?: boolean; // True if this is a chapter marker (not a chronological decade)
}

interface BookStructure {
  decades: DecadeSection[];
  totalPages: number;
}

interface DarkBookProgressBarProps {
  pages: BookPage[];
  currentPage: number;
  totalPages: number;
  onNavigateToPage: (pageNumber: number) => void;
  onTocClick: () => void;
  viewMode?: 'chronological' | 'chapters';
  onViewModeChange?: (mode: 'chronological' | 'chapters') => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

/**
 * Build navigation structure from book pages
 */
function buildBookStructure(pages: BookPage[]): BookStructure {
  const decadeMap = new Map<string, DecadeSection>();

  pages.forEach((page) => {
    // Find decade markers
    if (page.type === "decade-marker" && page.decade) {
      if (!decadeMap.has(page.decade)) {
        decadeMap.set(page.decade, {
          decade: page.decade,
          title: page.decadeTitle || page.decade,
          startPage: page.pageNumber,
          isChapter: page.isChapter || false, // Capture isChapter flag from page
        });
      }
    }
  });

  // Convert to array and sort by decade
  const sortedDecades = Array.from(decadeMap.values()).sort((a, b) => {
    // Try to parse as years first (for chronological view)
    const aYear = parseInt(a.decade);
    const bYear = parseInt(b.decade);

    if (!isNaN(aYear) && !isNaN(bYear)) {
      return aYear - bYear;
    }

    // Fallback to string comparison (for chapter view)
    // Ideally we should use the original order index, but we don't have it here easily.
    // Since pages are already sorted by the main page logic, we can sort by startPage.
    return a.startPage - b.startPage;
  });

  return {
    decades: sortedDecades,
    totalPages: pages.length,
  };
}

export default function DarkBookProgressBar({
  pages,
  currentPage,
  totalPages,
  onNavigateToPage,
  onTocClick,
  fontSize,
  onFontSizeChange,
  viewMode,
  onViewModeChange,
}: DarkBookProgressBarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  const progress = (currentPage / totalPages) * 100;
  const bookStructure = buildBookStructure(pages);

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

  const handleDecadeClick = (pageNumber: number) => {
    onNavigateToPage(pageNumber - 1); // Convert to 0-indexed
  };

  const getHoverPage = () => {
    const rect = document
      .querySelector(".progress-bar-container")
      ?.getBoundingClientRect();
    if (!rect) return 1;
    const percentage = hoverPosition / rect.width;
    return Math.floor(percentage * totalPages) + 1;
  };

  const getHoverPageInfo = () => {
    const pageNum = getHoverPage();
    const page = pages[pageNum - 1]; // Convert to 0-indexed

    if (!page) {
      return { pageNum, year: null };
    }

    return {
      pageNum,
      year: page.year || null,
    };
  };

  return (
    <div
      className="fixed top-0 left-0 right-0"
      style={{
        zIndex: 50,
        height: '40px',
        background: 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center gap-2 md:gap-0 pt-[14px] md:pt-2 py-1 md:py-0">
        {/* TOC button - Left side on desktop */}
        <button
          onClick={onTocClick}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors text-white mr-3 flex-shrink-0"
          aria-label="Table of Contents"
          title="Table of Contents"
        >
          <BookOpen className="h-4 w-4" />
        </button>

        {/* Top on mobile / Left on desktop: Progress bar area */}
        <div className="flex-1 w-full max-w-[calc(100%-90px)] md:max-w-[calc(100%-240px)]">
          <div className="relative">
            {/* Progress bar */}
            <div
              className="progress-bar-container relative w-full h-3 md:h-3 cursor-pointer overflow-visible group"
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
              {/* Background bar */}
              <div
                className="absolute inset-0 bg-white/10 rounded-full"
              />

              {/* Progress fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
                }}
              />

              {/* Decade markers (dots) */}
              {bookStructure.decades.map((decade) => {
                // Clamp marker position to max 98% to keep within progress bar bounds
                const rawPosition = (decade.startPage / totalPages) * 100;
                const markerPosition = Math.min(rawPosition, 98);

                // Only show markers that are within valid range
                if (decade.startPage > totalPages) {
                  return null;
                }

                return (
                  <div
                    key={decade.decade}
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-white/80 shadow-sm cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${markerPosition}%`,
                      backgroundColor: 'rgba(99, 102, 241, 0.9)',
                    }}
                    title={decade.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDecadeClick(decade.startPage);
                    }}
                  />
                );
              })}

              {/* Hover tooltip */}
              {isHovering && (() => {
                const { pageNum, year } = getHoverPageInfo();
                return (
                  <div
                    className="absolute top-full mt-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      left: `${hoverPosition}px`,
                      transform: "translateX(-50%)",
                      zIndex: 100,
                    }}
                  >
                    Page {pageNum} of {totalPages}
                    {year && <span className="text-indigo-600"> • {year}</span>}
                  </div>
                );
              })()}
            </div>

            {/* Decade date markers below progress bar - Timeline style (desktop only) */}
            <div className="relative h-5 mt-0 hidden md:block">
              {(() => {
                // Collision detection: filter decades to prevent overlap
                const MIN_SPACING = 70; // Minimum pixels between decade markers
                const visibleDecades: DecadeSection[] = [];
                let lastPosition = -MIN_SPACING;

                bookStructure.decades.forEach((decade) => {
                  if (decade.startPage > totalPages) return;

                  const rawPosition = (decade.startPage / totalPages) * 100;
                  const markerPosition = Math.min(rawPosition, 98);

                  // Get container width to calculate pixel position
                  const containerWidth = document.querySelector('.progress-bar-container')?.clientWidth || 1000;
                  const pixelPosition = (markerPosition / 100) * containerWidth;

                  // Only show if it doesn't overlap with previous
                  if (pixelPosition - lastPosition >= MIN_SPACING) {
                    visibleDecades.push(decade);
                    lastPosition = pixelPosition;
                  }
                });

                return visibleDecades.map((decade, index) => {
                  const rawPosition = (decade.startPage / totalPages) * 100;
                  const markerPosition = Math.min(rawPosition, 98);

                  // Check if this is a year (chronological) or chapter
                  // Check if this is a chapter marker or a decade marker
                  const isChapter = decade.isChapter;
                  const isNumeric = !isNaN(parseInt(decade.decade.replace('s', '')));

                  // For chapters, display abbreviated format; for decades, show year
                  const displayText = isChapter
                    ? `Ch. ${index + 1}` // Chapters: "Ch. 1", "Ch. 2", etc.
                    : isNumeric
                    ? decade.decade.replace('s', '') // Years: "1950", "1960", etc.
                    : decade.decade; // Fallback to raw decade value

                  // Full text for tooltip
                  const fullTitle = decade.title;

                  return (
                    <div
                      key={`label-${decade.decade}`}
                      className="absolute"
                      style={{ left: `calc(${markerPosition}% + 3px)`, transform: 'translateX(-50%)' }}
                    >
                      {/* Connector line */}
                      <div
                        style={{
                          width: '1px',
                          height: '6px',
                          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                          margin: '0 auto 0px',
                        }}
                      />
                      {/* Date box - Dark theme */}
                      <button
                        onClick={() => handleDecadeClick(decade.startPage)}
                        className="decade-date-box hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          lineHeight: '1',
                          height: '18px',
                          minHeight: '18px',
                          maxHeight: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          margin: 0,
                        }}
                        aria-label={`Jump to ${fullTitle}`}
                        title={!isNumeric ? fullTitle : undefined}
                      >
                        {displayText}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right: Controls - View Mode, TOC and Text Size */}
        <div className="hidden md:flex items-center justify-end gap-1.5 flex-shrink-0">
          {/* View Mode Toggle - HIDDEN: Not ready for launch */}
          {/* TODO: Re-enable when chapters feature is ready
          {viewMode && onViewModeChange && (
            <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/20 mr-1.5">
              <button
                onClick={() => onViewModeChange('chronological')}
                className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${viewMode === 'chronological'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                Time
              </button>
              <button
                onClick={() => onViewModeChange('chapters')}
                className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${viewMode === 'chapters'
                  ? 'bg-[#d4af87] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                Chapters
              </button>
            </div>
          )}
          */}

          {/* Decrease text size - Small A */}
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors text-white font-semibold"
            aria-label="Decrease text size"
            title="Smaller text"
            disabled={fontSize <= 14}
          >
            <span style={{ fontSize: '11px' }}>A</span>
          </button>

          {/* Increase text size - Large A */}
          <button
            onClick={() => onFontSizeChange(Math.min(26, fontSize + 2))}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors text-white font-semibold"
            aria-label="Increase text size"
            title="Larger text"
            disabled={fontSize >= 26}
          >
            <span style={{ fontSize: '15px' }}>A</span>
          </button>
        </div>
      </div>
    </div>
  );
}

