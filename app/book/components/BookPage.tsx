"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Clock, Volume2, Pause, Loader2 } from "lucide-react";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import { ScrollIndicator } from "@/components/ScrollIndicators";
import { apiRequest } from "@/lib/queryClient";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";

interface Story {
  id: string;
  title: string;
  storyYear: number;
  lifeAge?: number;
  transcription?: string;
  audioUrl?: string;
  photos?: Array<{
    id: string;
    // NEW: Dual WebP URLs
    masterUrl?: string;
    displayUrl?: string;
    // DEPRECATED (backward compatibility):
    url?: string;
    caption?: string;
    isHero?: boolean;
    width?: number;
    height?: number;
    transform?: { zoom: number; position: { x: number; y: number } };
  }>;
  wisdomClipText?: string;
  chapterId?: string;
  chapterTitle?: string;
}

interface DecadePage {
  type: 'decade';
  decade: string;
  title: string;
  count: number;
  isChapter?: boolean; // NEW: Flag to distinguish chapter pages from decade pages
}

interface BookPageProps {
  story?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | DecadePage;
  pageNum: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  position: "left" | "right";
  allStories?: Story[]; // For TOC
  onNavigateToStory?: (storyId: string) => void; // For TOC navigation - pass story ID
  fontSize?: number; // Font size for story text
  isOwnAccount?: boolean; // Whether user owns this account (for edit permissions)
  viewMode?: 'chronological' | 'chapters';
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({ story, pageNum, onScroll, position, allStories = [], onNavigateToStory, fontSize = 18, isOwnAccount = true, viewMode = 'chronological' }, ref) => {
    const pageRef = React.useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = React.useState<{
      hasScroll: boolean;
      isAnimating: boolean;
      hasUserScrolled: boolean;
    }>({
      hasScroll: false,
      isAnimating: false,
      hasUserScrolled: false
    });
    const currentPageIdRef = React.useRef<string>('');

    // Helper to render TOC items with grouping
    const renderTOCItems = (stories: Story[], startIndex: number) => {
      let lastGroup = '';

      return stories.map((storyItem, idx) => {
        let currentGroup = '';
        let groupTitle = '';

        if (viewMode === 'chapters') {
          currentGroup = storyItem.chapterId || 'uncategorized';
          groupTitle = storyItem.chapterTitle || 'Uncategorized';
        } else {
          const decade = Math.floor(storyItem.storyYear / 10) * 10;
          currentGroup = `${decade}s`;
          groupTitle = `${decade}s`;
        }

        const showHeader = currentGroup !== lastGroup;
        lastGroup = currentGroup;

        return (
          <div key={storyItem.id}>
            {showHeader && (
              <h3 className="text-lg font-bold tracking-tight text-neutral-700 mt-5 mb-1.5 first:mt-0">
                {groupTitle.toLowerCase()}
              </h3>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToStory) {
                  onNavigateToStory(storyItem.id);
                }
              }}
              className="flex justify-between items-baseline w-full hover:bg-gray-100 px-2 py-1.5 rounded transition-colors cursor-pointer text-left"
            >
              <span className="text-gray-600 flex-1 pr-3 hover:text-indigo-600 text-base">
                {storyItem.title}
              </span>
              <span className="text-gray-400 text-sm whitespace-nowrap">
                {storyItem.storyYear}
              </span>
            </button>
          </div>
        );
      });
    };

    // Single effect to manage everything
    React.useEffect(() => {
      // Generate unique page ID
      const pageId = typeof story === 'string' ? story :
        (story && typeof story === 'object' && 'id' in story) ? story.id :
          `page-${pageNum}`;

      // Check if this is a new page
      const isNewPage = pageId !== currentPageIdRef.current;

      if (isNewPage) {
        currentPageIdRef.current = pageId;

        // Reset state for new page
        setScrollState({ hasScroll: false, isAnimating: false, hasUserScrolled: false });

        let stopAnimationTimer: NodeJS.Timeout | null = null;

        // Check for scroll after content loads
        const checkScrollTimer = setTimeout(() => {
          if (ref && typeof ref !== 'function' && ref.current) {
            const element = ref.current;
            const isScrollable = element.scrollHeight > element.clientHeight + 5;

            if (isScrollable) {
              // Start showing indicators (bouncing for first 1.5 seconds)
              setScrollState({ hasScroll: true, isAnimating: true, hasUserScrolled: false });

              // Stop bouncing animation after 1.5 seconds, but KEEP indicators visible
              stopAnimationTimer = setTimeout(() => {
                setScrollState(prev => ({ ...prev, isAnimating: false }));
              }, 1500);
            }
          }
        }, 1200);

        // Cleanup
        return () => {
          clearTimeout(checkScrollTimer);
          if (stopAnimationTimer) {
            clearTimeout(stopAnimationTimer);
          }
        };
      }
    }, [story, pageNum, ref]);

    // Handle intro page
    if (story === 'intro') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          {/* Main page */}
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
            {/* Paper texture/vignette */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            <div className="relative h-full w-full p-2.5 md:p-3 lg:p-3.5">
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 flex items-center justify-center">
                <div className="text-center space-y-8 p-8 w-full flex flex-col items-center">
                  <h1
                    className="text-5xl font-serif text-gray-800 mb-4 text-center"
                    style={{ fontFamily: "Crimson Text, serif" }}
                  >
                    Family Memories
                  </h1>
                  <div className="w-24 h-1 bg-indigo-500"></div>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-md text-center italic">
                    A collection of cherished moments, stories, and lessons from a life well-lived.
                  </p>
                  <p className="text-base text-gray-500 mt-8 text-center">
                    These pages hold the precious memories that shaped our family&apos;s journey.
                  </p>
                </div>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm text-neutral-600 pointer-events-none z-20">
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle endpaper page
    if (story === 'endpaper') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{
              background: "linear-gradient(135deg, #F5E6D3 0%, #EAD5BA 50%, #F5E6D3 100%)"
            }}
          >
            {/* Marbled texture pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='marble'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='8' seed='2' /%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23marble)' fill='%23D4B896'/%3E%3C/svg%3E")`,
                backgroundSize: '400px 400px',
              }}
            ></div>

            {/* Subtle swirl pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(ellipse at 20% 30%, rgba(139,111,71,0.3) 0%, transparent 50%),
                                  radial-gradient(ellipse at 80% 70%, rgba(139,111,71,0.25) 0%, transparent 50%),
                                  radial-gradient(ellipse at 40% 80%, rgba(139,111,71,0.2) 0%, transparent 40%)`,
              }}
            ></div>

            {/* HW watermark logo in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="opacity-[0.08]">
                <img
                  src="/final logo/logo-new.svg"
                  alt="Heritage Whisper"
                  className="w-32 h-32"
                  style={{ filter: 'grayscale(100%)' }}
                />
              </div>
            </div>

            {/* Inner gutter shadow */}
            <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/12 via-black/6`}></div>

            {/* Subtle vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: position === "left"
                  ? "radial-gradient(ellipse at 90% 50%, rgba(0,0,0,0.08) 0%, transparent 60%)"
                  : "radial-gradient(ellipse at 10% 50%, rgba(0,0,0,0.08) 0%, transparent 60%)"
              }}
            ></div>

            {/* Page number */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] text-neutral-500/80 pointer-events-none z-20">
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Handle table of contents left page
    if (story === 'toc-left') {
      const midpoint = Math.ceil(allStories.length / 2);
      const leftStories = allStories.slice(0, midpoint);

      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          {/* Main page */}
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
            {/* Paper texture/vignette */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            {/* Inner gutter shadow */}
            <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none z-10 bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/12 via-black/6`}></div>

            <div className="relative h-full w-full p-2.5 md:p-3 lg:p-3.5" style={{ pointerEvents: 'auto' }}>
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60" style={{ pointerEvents: 'auto' }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    if (element.scrollTop > 50) {
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                  className="h-full w-full rounded-[8px] text-neutral-900 outline-none p-4 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    pointerEvents: 'auto'
                  }}
                >
                  <h1 className="text-5xl font-semibold text-center mb-8 text-gray-800">
                    Table of Contents
                  </h1>
                  <div className="space-y-0" style={{ pointerEvents: 'auto' }}>
                    {renderTOCItems(leftStories, 0)}
                  </div>
                </div>
              </div>

              {/* Senior-friendly scroll indicator for TOC left */}
              {scrollState.hasScroll && !scrollState.hasUserScrolled && (
                <ScrollIndicator
                  show={true}
                  position={position}
                  contentType="book"
                  onScrollClick={() => {
                    if (ref && typeof ref !== 'function' && ref.current) {
                      ref.current.scrollBy({ top: 300, behavior: 'smooth' });
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                />
              )}

              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm text-neutral-600 pointer-events-none z-20">
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle table of contents right page
    if (story === 'toc-right') {
      const midpoint = Math.ceil(allStories.length / 2);
      const rightStories = allStories.slice(midpoint);

      return (
        <div
          ref={pageRef}
          className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Main page */}
          <div
            className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Paper texture/vignette */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            {/* Inner gutter shadow */}
            <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none z-10 bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/12 via-black/6`}></div>

            <div className="relative h-full w-full p-2.5 md:p-3 lg:p-3.5" style={{ pointerEvents: 'auto' }}>
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60" style={{ pointerEvents: 'auto' }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    if (element.scrollTop > 50) {
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                  className="h-full w-full rounded-[8px] text-neutral-900 outline-none p-4 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    pointerEvents: 'auto'
                  }}
                >
                  <div className="space-y-0 pt-[72px]" style={{ pointerEvents: 'auto' }}>
                    {renderTOCItems(rightStories, midpoint)}
                  </div>
                </div>
              </div>


              {/* Senior-friendly scroll indicator for TOC right */}
              {scrollState.hasScroll && !scrollState.hasUserScrolled && (
                <ScrollIndicator
                  show={true}
                  position={position}
                  contentType="book"
                  onScrollClick={() => {
                    if (ref && typeof ref !== 'function' && ref.current) {
                      ref.current.scrollBy({ top: 300, behavior: 'smooth' });
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                />
              )}

              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm text-neutral-600 pointer-events-none z-20">
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle decade page - with same paper layers as story pages
    if (story && typeof story !== 'string' && 'type' in story && story.type === 'decade') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          {/* Main page */}
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
            {/* Paper texture/vignette */}
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            <div className="relative h-full w-full p-2.5 md:p-3 lg:p-3.5 z-10">
              {/* Inner gutter shadow - inside the padding container, behind the white paper */}
              <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-8 pointer-events-none z-[1] bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/10 via-black/5`}></div>

              <div className="relative h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden z-10">
                <DecadeIntroPage
                  decade={story.decade}
                  title={story.title}
                  storiesCount={story.count}
                  isChapter={story.isChapter}
                />
              </div>
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] text-neutral-500/80 pointer-events-none z-20">
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      );
    }

    if (!story) {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          {/* Page stack layers - HIDDEN FOR NOW */}
          <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
          <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
          <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>

          {/* Main page - Empty */}
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
              <span className="text-sm">No story</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={pageRef}
        className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}
        style={{
          zIndex: position === "right" ? 50 : 40,
          pointerEvents: 'none', // Don't catch clicks at this level
          overflow: 'visible'
        }}
      >
        {/* Page stack layers (3 behind) - HIDDEN FOR NOW */}
        <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
        <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
        <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>

        {/* Main page */}
        <div
          className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}
          style={{
            maxWidth: '100%',
            pointerEvents: 'auto'
          }}
        >
          {/* Paper texture/vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundImage: position === "left"
                ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`
                : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`,
            }}
          ></div>

          {/* Inner gutter shadow - does not block interactions */}
          <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/12 via-black/6`} style={{ zIndex: 2 }}></div>

          {/* Outer edge lines */}
          <div
            className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-3 pointer-events-none`}
            style={{
              zIndex: 2,
              backgroundImage: `repeating-linear-gradient(${position === "left" ? "90deg" : "270deg"}, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)`,
              opacity: 0.25
            }}
          ></div>

          <div className="relative h-full w-full p-2.5 md:p-3 lg:p-3.5" style={{ zIndex: 10 }}>
            <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden" style={{ position: 'relative', zIndex: 15 }}>
              <div
                ref={ref}
                onScroll={(e) => {
                  // Call parent scroll handler
                  onScroll(e);

                  // Check scroll position to hide indicator
                  const element = e.currentTarget;
                  if (element.scrollTop > 50) {
                    setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                  }
                }}
                tabIndex={0}
                className="js-flow h-full w-full rounded-[8px] text-neutral-900 outline-none p-4 overflow-y-auto"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'scroll-position',
                  position: 'relative',
                  zIndex: 20
                }}
                aria-label="Scroll down to continue reading"
              >
                <StoryContent story={story as Story} position={position} pageNum={pageNum} fontSize={fontSize} isOwnAccount={isOwnAccount} />
              </div>

              {/* Scroll indicators - stay visible until user scrolls */}
              {scrollState.hasScroll && !scrollState.hasUserScrolled && (
                <ScrollIndicator
                  show={true}
                  position={position}
                  contentType="book"
                  onScrollClick={() => {
                    if (ref && typeof ref !== 'function' && ref.current) {
                      ref.current.scrollBy({ top: 300, behavior: 'smooth' });
                      // Immediately hide indicator on click
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                />
              )}
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] text-neutral-500/80 pointer-events-none z-20">
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
BookPage.displayName = "BookPage";

// Story Content Component
function StoryContent({ story, position, pageNum, fontSize = 18, isOwnAccount = true }: { story: Story; position: "left" | "right"; pageNum: number; fontSize?: number; isOwnAccount?: boolean }) {
  const router = useRouter();

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Get all photos and check if multiple
  const photos = story.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  // Photo carousel handlers
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left - next photo
      handleNextPhoto();
    }
    if (touchStart - touchEnd < -75) {
      // Swiped right - prev photo
      handlePrevPhoto();
    }
  };

  // Reset photo index when story changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [story.id]);

  // Activity tracking state - only log once per playback session
  const hasLoggedListeningRef = useRef(false);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Format time helper
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize audio element on mount - ONLY ONCE per story
  useEffect(() => {
    if (!story.audioUrl) return;

    // Only initialize if we don't already have an audio element
    if (audioRef.current) {
      return;
    }

    const audio = new Audio(story.audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handleError = (err: Event) => {
      console.error(`Audio error for ${story.title} (${position} page):`, err);
      if (audio.error) {
        const errorMessages = [
          'MEDIA_ERR_ABORTED', // 1
          'MEDIA_ERR_NETWORK', // 2  
          'MEDIA_ERR_DECODE',  // 3
          'MEDIA_ERR_SRC_NOT_SUPPORTED' // 4
        ];
        console.error('Error code:', audio.error.code, '-', errorMessages[audio.error.code - 1] || 'UNKNOWN');
        console.error('Audio src:', audio.src);
      }
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    // Cleanup only on unmount
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
    // Only re-run when story.id changes, not when other story properties change.
    // This prevents recreating the audio element unnecessarily which would cause playback issues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);

  // Activity tracking: Log story_listened event when threshold is met
  useEffect(() => {
    // Skip if already logged for this playback session
    if (hasLoggedListeningRef.current) return;

    // Skip if no duration or current time yet
    if (!duration || !currentTime) return;

    // Check if threshold is met: 10 seconds OR 50% of duration
    const hasReachedTimeThreshold = currentTime >= 10;
    const hasReachedPercentageThreshold = (currentTime / duration) >= 0.5;

    if (hasReachedTimeThreshold || hasReachedPercentageThreshold) {
      // Mark as logged to prevent duplicate events
      hasLoggedListeningRef.current = true;

      // Log the activity event (async, non-blocking)
      apiRequest("POST", "/api/activity", {
        eventType: "story_listened",
        storyId: story.id,
        metadata: {
          listenedDuration: Math.floor(currentTime),
          totalDuration: Math.floor(duration),
          percentageListened: Math.floor((currentTime / duration) * 100),
        },
      }).catch((error) => {
        console.error("[BookPage] Failed to log story_listened activity:", error);
      });
    }
  }, [currentTime, duration, story.id]);

  // Reset activity tracking when story changes
  useEffect(() => {
    hasLoggedListeningRef.current = false;
  }, [story.id]);

  // Toggle audio playback
  const toggleAudio = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) {
      return;
    }

    try {
      // Stop other audio on the page first
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audio => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });

      if (audioRef.current.paused) {
        setIsLoading(true);
        await audioRef.current.play();
        setIsLoading(false);
      } else {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error(`Audio playback error on ${position} page:`, error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <>
      {/* Edit button - only show for account owners with actual stories */}
      {isOwnAccount && typeof story === 'object' && 'id' in story && (
        <div className={`flex gap-2 mb-1.5 -mt-3 ${position === "right" ? "justify-end" : ""}`}>
          <button
            onClick={() =>
              router.push(
                `/review/book-style?edit=${story.id}&returnPath=${encodeURIComponent(`/book?storyId=${story.id}`)}`,
              )
            }
            className="hidden md:flex items-center gap-1.5 px-2.5 py-0 min-h-[34px] rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-base font-medium text-gray-700"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
      )}

      {/* Photo at top if available - Now with carousel for multiple photos */}
      {photos.length > 0 && (() => {
        // Get current photo from carousel
        const currentPhoto = photos[currentPhotoIndex];
        // Get display URL (prefer displayUrl, fall back to url for backward compatibility)
        const photoUrl = currentPhoto?.displayUrl || currentPhoto?.url;

        // Only render if we have a valid photo URL
        if (!photoUrl) return null;

        return (
          <div className="mb-2">
            <div
              className="relative"
              data-nav-ink="light"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <StoryPhotoWithBlurExtend
                src={photoUrl}
                alt={story.title}
                width={currentPhoto.width}
                height={currentPhoto.height}
                transform={currentPhoto.transform}
                aspectRatio={16 / 10}
                className="rounded-md shadow ring-1 ring-black/5"
              />

              {/* Photo count indicator - z-20 to appear above image (which has z-10) */}
              {hasMultiplePhotos && (
                <div className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              )}

              {/* Navigation arrows (44x44px for senior-friendly touch targets) - z-20 to appear above image */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Previous photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Next photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </button>
                </>
              )}
            </div>
            {currentPhoto?.caption && (
              <p className="text-[12px] text-neutral-600 mt-1">
                {currentPhoto.caption}
              </p>
            )}
          </div>
        );
      })()}

      {/* Title - responsive sizing */}
      <h2
        className="tracking-tight font-serif font-semibold mb-1.5 text-neutral-900"
        style={{
          fontFamily: "Crimson Text, serif",
          fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)",
          lineHeight: 1.2
        }}
      >
        {story.title}
      </h2>

      {/* Age and year - responsive sizing */}
      <div className="mb-2 flex items-center justify-between">
        <div
          className="text-neutral-600 font-medium"
          style={{ fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)" }}
        >
          {story.lifeAge !== undefined && `Age ${story.lifeAge} • `}
          {story.storyYear}
        </div>
      </div>

      {/* Audio Player - responsive controls */}
      {story.audioUrl && (
        <div className="mb-2 flex items-center gap-2">
          {/* Play button - responsive size */}
          <button
            onClick={toggleAudio}
            className="relative flex-shrink-0 rounded-full bg-white hover:bg-gray-50 transition-colors"
            style={{ width: "clamp(36px, 4vw, 48px)", height: "clamp(36px, 4vw, 48px)" }}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              {/* Background ring - always visible */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(180,180,180,0.4)"
                strokeWidth="1.5"
              />
              {/* Progress ring - fills as audio plays */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(139,107,122,0.7)"
                strokeWidth="2"
                strokeDasharray="283"
                strokeDashoffset={`${283 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
            {/* Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 text-neutral-600 fill-neutral-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-neutral-600" />
              )}
            </div>
          </button>

          {/* Linear progress bar - responsive height */}
          <div className="flex-1">
            <div
              className="bg-neutral-200 rounded-full overflow-hidden cursor-pointer transition-all"
              style={{ height: "clamp(6px, 0.8vw, 8px)" }}
              onClick={(e) => {
                if (!audioRef.current || !duration) return;

                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                const newTime = percentage * duration;

                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }}
            >
              <div
                className="h-full bg-neutral-400 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timestamps - tabular nums, responsive sizing */}
          <div
            className="text-neutral-500 font-mono tabular-nums whitespace-nowrap text-right"
            style={{ fontSize: "clamp(0.625rem, 1vw, 0.75rem)" }}
          >
            {formatTime(currentTime)}<span className="text-neutral-400"> / </span>{formatTime(duration)}
          </div>
        </div>
      )}

      {/* Story text */}
      <div className="text-neutral-800/95 space-y-3 font-serif">
        {story.transcription?.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            style={{
              fontFamily: "Crimson Text, serif",
              fontSize: `${fontSize + 1}px`, // Slightly larger for serif readability
              lineHeight: fontSize <= 16 ? '1.6' : fontSize >= 20 ? '1.8' : '1.7'
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {story.wisdomClipText && (
        <div className="relative my-8 -mx-2 p-6 bg-white shadow-sm rotate-[0.5deg] clear-both">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 27px,
                #cbd5e1 27px,
                #cbd5e1 28px
              )`
            }}
          />
          <p
            className="relative text-slate-700 leading-relaxed"
            style={{
              fontFamily: '"Caveat", cursive',
              fontSize: `${fontSize + 3}px`,
              lineHeight: fontSize <= 16 ? '1.7' : fontSize >= 20 ? '1.9' : '1.8'
            }}
          >
            {story.wisdomClipText}
          </p>
        </div>
      )}

    </>
  );
}

