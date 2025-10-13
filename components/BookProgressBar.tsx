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
}: BookProgressBarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  const progress = (currentPage / totalPages) * 100;
  const bookStructure = buildBookStructure(pages);

  console.log('[BookProgressBar] Rendering, currentPage:', currentPage, 'totalPages:', totalPages, 'progress:', progress);

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

  return (
    <div 
      id="book-progress-bar-debug"
      className="bg-red-500 border-black"
      style={{ 
        display: 'block',
        position: 'fixed',
        bottom: '80px',
        left: '0',
        right: '0',
        height: '56px',
        borderTop: '4px solid black',
        zIndex: 99999,
        backgroundColor: '#ef4444'
      }}
    >
      <div className="relative px-6 py-4 max-w-7xl mx-auto">
        {/* Progress bar */}
        <div
          className="progress-bar-container relative h-3 bg-gray-300 rounded-full cursor-pointer overflow-visible group transition-all duration-200 hover:h-4"
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
      </div>
    </div>
  );
}
