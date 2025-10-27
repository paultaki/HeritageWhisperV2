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

interface BookProgressBarProps {
  pages: BookPage[];
  currentPage: number;
  totalPages: number;
  onNavigateToPage: (pageNumber: number) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenDecadeSelector?: () => void; // Mobile only
}

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

export default function BookProgressBar({
  pages,
  currentPage,
  totalPages,
  onNavigateToPage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onOpenDecadeSelector,
}: BookProgressBarProps) {
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
      className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm"
      style={{ 
        zIndex: 50,
        height: '56px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center gap-2 md:gap-0 py-2 md:py-0">
        {/* Top on mobile / Left on desktop: Progress bar area */}
        <div className="flex-1 md:mr-4 w-full md:max-w-[calc(100%-220px)]">
          <div className="relative">
            {/* Progress bar */}
            <div
              className="progress-bar-container relative w-full h-2 cursor-pointer overflow-visible group"
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
              {/* Background bar that scales on hover */}
              <div
                className="absolute inset-0 bg-gray-200 rounded-full transition-transform duration-200"
                style={{
                  transform: isHovering ? 'scaleY(2)' : 'scaleY(1)',
                }}
              />
              
              {/* Progress fill - scales with background */}
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-200"
                style={{ 
                  width: `${progress}%`,
                  transform: isHovering ? 'scaleY(2)' : 'scaleY(1)',
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
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-700 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-150 transition-transform"
                    style={{ left: `${markerPosition}%` }}
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
                    className="absolute top-full mt-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      left: `${hoverPosition}px`,
                      transform: "translateX(-50%)",
                      zIndex: 100,
                    }}
                  >
                    Page {pageNum} of {totalPages}
                    {year && <span className="text-amber-300"> • {year}</span>}
                  </div>
                );
              })()}
            </div>

            {/* Decade date markers below progress bar - Timeline style (desktop only) */}
            <div className="relative h-7 mt-1.5 hidden md:block">
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
                      style={{ left: `${markerPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      {/* Connector line - shorter */}
                      <div
                        style={{
                          width: '1.5px',
                          height: '10px',
                          background: 'linear-gradient(to bottom, rgba(196, 167, 183, 0.5), rgba(196, 167, 183, 0.3))',
                          margin: '0 auto 3px',
                        }}
                      />
                      {/* Date box - Timeline style, very compact */}
                      <button
                        onClick={() => handleDecadeClick(decade.startPage)}
                        className="decade-date-box hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: '#F9E5E8',
                          border: '1px solid rgba(139, 107, 122, 0.2)',
                          color: '#8B6B7A',
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          boxShadow: '0 1px 3px rgba(139, 107, 122, 0.08)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          lineHeight: '1.1',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={`Jump to ${decade.title}`}
                      >
                        {decade.decade}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right: Zoom controls (desktop only) */}
        <div className="hidden md:flex items-center justify-end gap-2 flex-shrink-0">
          {/* Zoom controls - desktop only */}
          <div className="flex items-center gap-1 bg-white/95 rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={onZoomOut}
              className="w-9 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700 font-bold text-lg"
              aria-label="Zoom out"
            >
              −
            </button>
            <div className="w-12 text-center text-xs text-gray-600 font-medium">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button
              onClick={onZoomIn}
              className="w-9 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700 font-bold text-lg"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
