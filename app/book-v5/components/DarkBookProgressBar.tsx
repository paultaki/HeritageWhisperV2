"use client";

import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { BookPage } from "@/lib/bookPagination";

// Brand token colors
const COLORS = {
  page: 'var(--hw-page-bg, #F7F2EC)',
  text: 'var(--hw-text-primary, #1F1F1F)',
  textSecondary: 'var(--hw-text-secondary, #4A4A4A)',
  accent: 'var(--hw-accent-gold, #CBA46A)',
  primary: 'var(--hw-primary, #203954)',
  primarySoft: 'var(--hw-primary-soft, #E0E5ED)',
};

interface DecadeSection {
  decade: string;
  title: string;
  startPage: number;
  isChapter?: boolean;
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
    if (page.type === "decade-marker" && page.decade) {
      if (!decadeMap.has(page.decade)) {
        decadeMap.set(page.decade, {
          decade: page.decade,
          title: page.decadeTitle || page.decade,
          startPage: page.pageNumber,
          isChapter: page.isChapter || false,
        });
      }
    }
  });

  const sortedDecades = Array.from(decadeMap.values()).sort((a, b) => {
    const aYear = parseInt(a.decade);
    const bYear = parseInt(b.decade);

    if (!isNaN(aYear) && !isNaN(bYear)) {
      return aYear - bYear;
    }

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
    onNavigateToPage(pageNumber - 1);
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
    const page = pages[pageNum - 1];

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
        {/* TOC button - using brand primary */}
        <button
          onClick={onTocClick}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full border backdrop-blur-sm transition-colors mr-3 flex-shrink-0"
          style={{
            borderColor: "rgba(32, 57, 84, 0.3)",
            background: "rgba(32, 57, 84, 0.15)",
            color: COLORS.page
          }}
          aria-label="Table of Contents"
          title="Table of Contents"
        >
          <BookOpen className="h-4 w-4" />
        </button>

        {/* Progress bar area */}
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
              {/* Background bar - using brand primary soft */}
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(32, 57, 84, 0.25)" }}
              />

              {/* Progress fill - using brand primary */}
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(135deg, ${COLORS.page} 0%, rgba(247, 242, 236, 0.85) 100%)`,
                }}
              />

              {/* Decade markers */}
              {bookStructure.decades.map((decade) => {
                const rawPosition = (decade.startPage / totalPages) * 100;
                const markerPosition = Math.min(rawPosition, 98);

                if (decade.startPage > totalPages) {
                  return null;
                }

                return (
                  <div
                    key={decade.decade}
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border shadow-sm cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${markerPosition}%`,
                      backgroundColor: COLORS.page,
                      borderColor: COLORS.primary
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
                    className="absolute top-full mt-2 px-3 py-1.5 backdrop-blur-sm text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      left: `${hoverPosition}px`,
                      transform: "translateX(-50%)",
                      zIndex: 100,
                      background: COLORS.page,
                      color: COLORS.text
                    }}
                  >
                    Page {pageNum} of {totalPages}
                    {year && <span style={{ color: COLORS.primary }}> · {year}</span>}
                  </div>
                );
              })()}
            </div>

            {/* Decade date markers below progress bar */}
            <div className="relative h-5 mt-0 hidden md:block">
              {(() => {
                const MIN_SPACING = 70;
                const visibleDecades: DecadeSection[] = [];
                let lastPosition = -MIN_SPACING;

                bookStructure.decades.forEach((decade) => {
                  if (decade.startPage > totalPages) return;

                  const rawPosition = (decade.startPage / totalPages) * 100;
                  const markerPosition = Math.min(rawPosition, 98);

                  const containerWidth = document.querySelector('.progress-bar-container')?.clientWidth || 1000;
                  const pixelPosition = (markerPosition / 100) * containerWidth;

                  if (pixelPosition - lastPosition >= MIN_SPACING) {
                    visibleDecades.push(decade);
                    lastPosition = pixelPosition;
                  }
                });

                return visibleDecades.map((decade, index) => {
                  const rawPosition = (decade.startPage / totalPages) * 100;
                  const markerPosition = Math.min(rawPosition, 98);

                  const isChapter = decade.isChapter;
                  const isNumeric = !isNaN(parseInt(decade.decade.replace('s', '')));

                  const displayText = isChapter
                    ? `Ch. ${index + 1}`
                    : isNumeric
                    ? decade.decade.replace('s', '')
                    : decade.decade;

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
                          background: `linear-gradient(to bottom, rgba(247, 242, 236, 0.5), rgba(247, 242, 236, 0.2))`,
                          margin: '0 auto 0px',
                        }}
                      />
                      {/* Date box - using brand colors */}
                      <button
                        onClick={() => handleDecadeClick(decade.startPage)}
                        className="decade-date-box hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: 'rgba(32, 57, 84, 0.25)',
                          border: '1px solid rgba(32, 57, 84, 0.4)',
                          color: COLORS.page,
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
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

        {/* Right controls - Text Size using brand colors */}
        <div className="hidden md:flex items-center justify-end gap-1.5 flex-shrink-0">
          {/* Decrease text size */}
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            className="flex items-center justify-center w-8 h-8 rounded-full border backdrop-blur-sm transition-colors font-semibold"
            style={{
              borderColor: "rgba(32, 57, 84, 0.3)",
              background: "rgba(32, 57, 84, 0.15)",
              color: COLORS.page
            }}
            aria-label="Decrease text size"
            title="Smaller text"
            disabled={fontSize <= 14}
          >
            <span style={{ fontSize: '11px' }}>A</span>
          </button>

          {/* Increase text size */}
          <button
            onClick={() => onFontSizeChange(Math.min(26, fontSize + 2))}
            className="flex items-center justify-center w-8 h-8 rounded-full border backdrop-blur-sm transition-colors font-semibold"
            style={{
              borderColor: "rgba(32, 57, 84, 0.3)",
              background: "rgba(32, 57, 84, 0.15)",
              color: COLORS.page
            }}
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

