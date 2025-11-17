"use client";

import React, { useState } from "react";
import { BookPage } from "@/lib/bookPagination";

interface DecadeSection {
  decade: string;
  title: string;
  startPage: number;
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
        });
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

export default function DarkBookProgressBar({
  pages,
  currentPage,
  totalPages,
  onNavigateToPage,
  onTocClick,
  fontSize,
  onFontSizeChange,
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
        height: '56px',
        background: 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center gap-2 md:gap-0 pt-[20px] md:pt-0 py-2 md:py-0">
        {/* Top on mobile / Left on desktop: Progress bar area */}
        <div className="flex-1 md:mr-4 w-full max-w-[calc(100%-90px)] md:max-w-[calc(100%-220px)]">
          <div className="relative">
            {/* Progress bar */}
            <div
              className="progress-bar-container relative w-full h-4 md:h-4 cursor-pointer overflow-visible group"
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
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white/80 shadow-sm cursor-pointer hover:scale-150 transition-transform"
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
            <div className="relative h-7 mt-0 hidden md:block">
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

                return visibleDecades.map((decade) => {
                  const rawPosition = (decade.startPage / totalPages) * 100;
                  const markerPosition = Math.min(rawPosition, 98);

                  return (
                    <div
                      key={`label-${decade.decade}`}
                      className="absolute"
                      style={{ left: `calc(${markerPosition}% + 3px)`, transform: 'translateX(-50%)' }}
                    >
                      {/* Connector line */}
                      <div
                        style={{
                          width: '1.5px',
                          height: '10px',
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
                          fontSize: '15px',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '4px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          lineHeight: '1',
                          height: '24px',
                          minHeight: '24px',
                          maxHeight: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          margin: 0,
                        }}
                        aria-label={`Jump to ${decade.title}`}
                      >
                        {decade.decade.replace('s', '')}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right: Controls - TOC and Text Size */}
        <div className="hidden md:flex items-center justify-end gap-2 flex-shrink-0">
          {/* TOC button - Book icon */}
          <button
            onClick={onTocClick}
            className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors text-white"
            aria-label="Table of Contents"
            title="Table of Contents"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </button>

          {/* Decrease text size - Small A */}
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors text-white font-semibold"
            aria-label="Decrease text size"
            title="Smaller text"
            disabled={fontSize <= 14}
          >
            <span style={{ fontSize: '14px' }}>A</span>
          </button>

          {/* Increase text size - Large A */}
          <button
            onClick={() => onFontSizeChange(Math.min(26, fontSize + 2))}
            className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors text-white font-semibold"
            aria-label="Increase text size"
            title="Larger text"
            disabled={fontSize >= 26}
          >
            <span style={{ fontSize: '20px' }}>A</span>
          </button>
        </div>
      </div>
    </div>
  );
}

