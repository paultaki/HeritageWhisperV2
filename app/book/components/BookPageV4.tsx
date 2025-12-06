"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Volume2, Pause, Loader2 } from "lucide-react";
import { DecadeIntroPage } from "@/components/BookDecadePages";
// Note: We use a simple gradient fade instead of ScrollIndicator for cleaner UX
import { apiRequest } from "@/lib/queryClient";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";
import { PhotoLightbox, type LightboxPhoto } from "@/components/PhotoLightbox";

// V4 Premium Components
import PaperTexture from "./PaperTexture";
import GutterShadow from "./GutterShadow";
import PageStack from "./PageStack";
import { DateLabel } from "./DropCap";
import PhotoFrame from "./PhotoFrame";
import EditButton from "./EditButton";
import WaveformAudioPlayer from "./WaveformAudioPlayer";

interface Story {
  id: string;
  title: string;
  storyYear: number;
  lifeAge?: number;
  transcription?: string;
  audioUrl?: string;
  durationSeconds?: number | null;
  photos?: Array<{
    id: string;
    masterUrl?: string;
    displayUrl?: string;
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
  isChapter?: boolean;
}

interface BookPageV4Props {
  story?: Story | 'intro' | 'endpaper' | 'blank-endpaper' | 'toc-left' | 'toc-right' | 'add-story' | DecadePage;
  pageNum: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  position: "left" | "right";
  allStories?: Story[];
  onNavigateToStory?: (storyId: string) => void;
  fontSize?: number;
  isOwnAccount?: boolean;
  viewMode?: 'chronological' | 'chapters';
  isPriority?: boolean; // Whether images should load with priority (for first visible spread)
}

/**
 * BookPageV4 - Premium Skeuomorphic Book Page
 *
 * Enhanced version with:
 * - Cream paper background (#F5F1E8)
 * - Paper texture overlay (SVG noise)
 * - Gutter shadow (spine depth)
 * - Page stack lines (outer edges)
 * - Drop caps on first paragraph
 * - Premium typography (1.85 line-height)
 * - Photo frames with rotation/shadow
 * - Waveform audio player
 * - Hover-only edit button
 */
export const BookPageV4 = React.forwardRef<HTMLDivElement, BookPageV4Props>(
  ({ story, pageNum, onScroll, position, allStories = [], onNavigateToStory, fontSize = 18, isOwnAccount = true, viewMode = 'chronological', isPriority = false }, ref) => {
    const pageRef = React.useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = React.useState<{
      hasScroll: boolean;
      isAtBottom: boolean;
    }>({
      hasScroll: false,
      isAtBottom: false
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
              <h3 className="text-lg font-bold tracking-tight mt-5 mb-1.5 first:mt-0" style={{ color: 'var(--book-text-muted)' }}>
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
              className="flex justify-between items-baseline w-full hover:bg-[var(--book-accent-bg)] px-2 py-1.5 rounded transition-colors cursor-pointer text-left"
            >
              <span className="flex-1 pr-3 text-base" style={{ color: 'var(--book-text)' }}>
                {storyItem.title}
              </span>
              <span className="text-sm whitespace-nowrap" style={{ color: 'var(--book-text-muted)' }}>
                {storyItem.storyYear}
              </span>
            </button>
          </div>
        );
      });
    };

    // Helper to check if scrolled to bottom
    const checkIfAtBottom = React.useCallback((element: HTMLElement) => {
      const buffer = 10; // Small buffer for rounding errors
      return element.scrollTop + element.clientHeight >= element.scrollHeight - buffer;
    }, []);

    // Effect to manage scroll state
    React.useEffect(() => {
      const pageId = typeof story === 'string' ? story :
        (story && typeof story === 'object' && 'id' in story) ? story.id :
          `page-${pageNum}`;

      const isNewPage = pageId !== currentPageIdRef.current;

      if (isNewPage) {
        currentPageIdRef.current = pageId;
        setScrollState({ hasScroll: false, isAtBottom: false });

        const checkScrollTimer = setTimeout(() => {
          if (ref && typeof ref !== 'function' && ref.current) {
            const element = ref.current;
            const isScrollable = element.scrollHeight > element.clientHeight + 5;

            if (isScrollable) {
              const atBottom = checkIfAtBottom(element);
              setScrollState({ hasScroll: true, isAtBottom: atBottom });
            }
          }
        }, 300); // Faster check since we don't need animation delay

        return () => {
          clearTimeout(checkScrollTimer);
        };
      }
    }, [story, pageNum, ref, checkIfAtBottom]);

    // Common page wrapper with premium styling
    const PageWrapper = ({ children, showTexture = true }: { children: React.ReactNode; showTexture?: boolean }) => (
      <div
        ref={pageRef}
        className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}
        style={{
          zIndex: position === "right" ? 50 : 40,
          pointerEvents: 'none',
        }}
      >
        <div
          className={`relative h-full w-full rounded-[var(--book-radius)] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
          style={{ background: 'var(--book-paper)', pointerEvents: 'auto' }}
        >
          {/* Paper texture overlay */}
          {showTexture && <PaperTexture />}

          {/* Gutter shadow */}
          <GutterShadow side={position === "left" ? "right" : "left"} />

          {/* Page stack lines */}
          <PageStack side={position} />

          {children}
        </div>
      </div>
    );

    // Handle intro page
    if (story === 'intro') {
      return (
        <PageWrapper>
          <div className="relative h-full w-full p-[19px] md:p-[21px] lg:p-[23px]">
            <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 flex items-center justify-center">
              <div className="text-center space-y-8 p-8 w-full flex flex-col items-center">
                <h1
                  className="text-5xl font-serif mb-4 text-center"
                  style={{ fontFamily: "Crimson Text, serif", color: 'var(--book-text)' }}
                >
                  Family Memories
                </h1>
                <div className="w-24 h-1" style={{ backgroundColor: 'var(--book-accent)' }}></div>
                <p className="text-lg leading-relaxed max-w-md text-center italic" style={{ color: 'var(--book-text-muted)' }}>
                  A collection of cherished moments, stories, and lessons from a life well-lived.
                </p>
                <p className="text-base mt-8 text-center" style={{ color: 'var(--book-text-muted)' }}>
                  These pages hold the precious memories that shaped our family&apos;s journey.
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm pointer-events-none z-20" style={{ color: 'var(--book-text-muted)' }}>
              {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
            </div>
          </div>
        </PageWrapper>
      );
    }

    // Handle endpaper page
    if (story === 'endpaper') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          <div
            className={`relative h-full w-full rounded-[var(--book-radius)] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
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
            <GutterShadow side={position === "left" ? "right" : "left"} />

            {/* Page number */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] pointer-events-none z-20" style={{ color: 'var(--book-text-muted)', opacity: 0.8 }}>
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Handle blank endpaper page (paired with CTA page) - same as front endpaper, minus logo
    if (story === 'blank-endpaper') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          <div
            className={`relative h-full w-full rounded-[var(--book-radius)] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
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

            {/* Inner gutter shadow */}
            <GutterShadow side={position === "left" ? "right" : "left"} />

            {/* Page number */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] pointer-events-none z-20" style={{ color: 'var(--book-text-muted)', opacity: 0.8 }}>
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Handle table of contents left page - uses same structure as story pages for proper scrolling
    if (story === 'toc-left') {
      const midpoint = Math.ceil(allStories.length / 2);
      const leftStories = allStories.slice(0, midpoint);

      return (
        <div
          ref={pageRef}
          className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}
          style={{
            zIndex: position === "right" ? 50 : 40,
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <div
            className={`relative h-full w-full rounded-[var(--book-radius)] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{
              maxWidth: '100%',
              pointerEvents: 'auto',
              background: 'var(--book-paper)'
            }}
          >
            <PaperTexture />
            <GutterShadow side={position === "left" ? "right" : "left"} />
            <PageStack side={position} />

            <div className="relative h-full w-full p-[19px] md:p-[21px] lg:p-[23px]" style={{ zIndex: 10 }}>
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden" style={{ position: 'relative', zIndex: 15 }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    const atBottom = checkIfAtBottom(element);
                    setScrollState(prev => ({ ...prev, isAtBottom: atBottom }));
                  }}
                  tabIndex={0}
                  className="js-flow h-full w-full rounded-[8px] outline-none p-4 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    position: 'relative',
                    zIndex: 20,
                    color: 'var(--book-text)'
                  }}
                  aria-label="Scroll to view more table of contents"
                >
                  <h1 className="text-5xl font-semibold text-center mb-8" style={{ color: 'var(--book-text)' }}>
                    Table of Contents
                  </h1>
                  <div className="space-y-0">
                    {renderTOCItems(leftStories, 0)}
                  </div>
                </div>
              </div>

              {/* Gradient fade indicator - shows when there's more content below */}
              {scrollState.hasScroll && !scrollState.isAtBottom && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-30"
                  style={{
                    background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 30%, transparent 100%)',
                    borderRadius: '0 0 10px 10px',
                  }}
                />
              )}

              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm pointer-events-none z-20" style={{ color: 'var(--book-text-muted)' }}>
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle table of contents right page - uses same structure as story pages for proper scrolling
    if (story === 'toc-right') {
      const midpoint = Math.ceil(allStories.length / 2);
      const rightStories = allStories.slice(midpoint);

      return (
        <div
          ref={pageRef}
          className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}
          style={{
            zIndex: position === "right" ? 50 : 40,
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <div
            className={`relative h-full w-full rounded-[var(--book-radius)] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{
              maxWidth: '100%',
              pointerEvents: 'auto',
              background: 'var(--book-paper)'
            }}
          >
            <PaperTexture />
            <GutterShadow side={position === "left" ? "right" : "left"} />
            <PageStack side={position} />

            <div className="relative h-full w-full p-[19px] md:p-[21px] lg:p-[23px]" style={{ zIndex: 10 }}>
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden" style={{ position: 'relative', zIndex: 15 }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    const atBottom = checkIfAtBottom(element);
                    setScrollState(prev => ({ ...prev, isAtBottom: atBottom }));
                  }}
                  tabIndex={0}
                  className="js-flow h-full w-full rounded-[8px] outline-none p-4 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    position: 'relative',
                    zIndex: 20,
                    color: 'var(--book-text)'
                  }}
                  aria-label="Scroll to view more table of contents"
                >
                  <div className="space-y-0 pt-[72px]">
                    {renderTOCItems(rightStories, midpoint)}
                  </div>
                </div>
              </div>

              {/* Gradient fade indicator - shows when there's more content below */}
              {scrollState.hasScroll && !scrollState.isAtBottom && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-30"
                  style={{
                    background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 30%, transparent 100%)',
                    borderRadius: '0 0 10px 10px',
                  }}
                />
              )}

              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm pointer-events-none z-20" style={{ color: 'var(--book-text-muted)' }}>
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle "add new story" page - elegant prompt to record a new memory
    if (story === 'add-story') {
      return (
        <PageWrapper>
          <div className="relative h-full w-full p-[19px] md:p-[21px] lg:p-[23px]">
            <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 flex items-center justify-center">
              <AddStoryPrompt isOwnAccount={isOwnAccount} />
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-sm pointer-events-none z-20" style={{ color: 'var(--book-text-muted)' }}>
              {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
            </div>
          </div>
        </PageWrapper>
      );
    }

    // Handle decade page
    if (story && typeof story !== 'string' && 'type' in story && story.type === 'decade') {
      return (
        <PageWrapper>
          <div className="relative h-full w-full p-[19px] md:p-[21px] lg:p-[23px] z-10">
            <div className="relative h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden z-10">
              <DecadeIntroPage
                decade={story.decade}
                title={story.title}
                storiesCount={story.count}
                isChapter={story.isChapter}
              />
            </div>
          </div>

          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] pointer-events-none z-20" style={{ color: 'var(--book-text-muted)', opacity: 0.8 }}>
            {position === "left" && <span className="tracking-tight">{pageNum}</span>}
            {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
          </div>
        </PageWrapper>
      );
    }

    // Handle empty page
    if (!story) {
      return (
        <PageWrapper showTexture={false}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--book-text-muted)' }}>
            <span className="text-sm">No story</span>
          </div>
        </PageWrapper>
      );
    }

    // Handle story page (main content)
    return (
      <div
        ref={pageRef}
        className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}
        style={{
          zIndex: position === "right" ? 50 : 40,
          pointerEvents: 'none',
          overflow: 'visible'
        }}
      >
        {/* Main page */}
        <div
          className={`relative h-full w-full rounded-[var(--book-radius)] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
          style={{
            maxWidth: '100%',
            pointerEvents: 'auto',
            background: 'var(--book-paper)'
          }}
        >
          {/* Paper texture overlay */}
          <PaperTexture />

          {/* Gutter shadow */}
          <GutterShadow side={position === "left" ? "right" : "left"} />

          {/* Page stack lines */}
          <PageStack side={position} />

          <div className="relative h-full w-full p-[19px] md:p-[21px] lg:p-[23px]" style={{ zIndex: 10 }}>
            <div className="group h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden" style={{ position: 'relative', zIndex: 15 }}>
              <div
                ref={ref}
                onScroll={(e) => {
                  onScroll(e);
                  const element = e.currentTarget;
                  const atBottom = checkIfAtBottom(element);
                  setScrollState(prev => ({ ...prev, isAtBottom: atBottom }));
                }}
                tabIndex={0}
                className="js-flow h-full w-full rounded-[8px] outline-none p-4 overflow-y-auto"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'scroll-position',
                  position: 'relative',
                  zIndex: 20,
                  color: 'var(--book-text)'
                }}
                aria-label="Scroll down to continue reading"
              >
                <StoryContentV4 story={story as Story} position={position} pageNum={pageNum} fontSize={fontSize} isOwnAccount={isOwnAccount} isPriority={isPriority} />
              </div>

              {/* Gradient fade indicator - shows when there's more content below */}
              {scrollState.hasScroll && !scrollState.isAtBottom && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-30"
                  style={{
                    background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 30%, transparent 100%)',
                    borderRadius: '0 0 10px 10px',
                  }}
                />
              )}
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[11px] pointer-events-none z-20" style={{ color: 'var(--book-text-muted)', opacity: 0.8 }}>
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
BookPageV4.displayName = "BookPageV4";

/**
 * StoryContentV4 - Enhanced Story Content with Premium Styling
 */
function StoryContentV4({ story, position, pageNum, fontSize = 18, isOwnAccount = true, isPriority = false }: { story: Story; position: "left" | "right"; pageNum: number; fontSize?: number; isOwnAccount?: boolean; isPriority?: boolean }) {
  const router = useRouter();

  // Photo state
  const photos = story.photos || [];
  const hasMultiplePhotos = photos.length > 1;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(() => {
    const heroIdx = photos.findIndex(p => p.isHero);
    return heroIdx >= 0 ? heroIdx : 0;
  });
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Photo handlers
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) handleNextPhoto();
    if (touchStart - touchEnd < -75) handlePrevPhoto();
  };

  // Reset photo index when story changes
  useEffect(() => {
    const heroIndex = photos.findIndex(p => p.isHero);
    setCurrentPhotoIndex(heroIndex >= 0 ? heroIndex : 0);
  }, [story.id, photos]);

  // Format date with small-caps styling
  const formatDateDisplay = () => {
    const parts = [];
    if (story.lifeAge !== undefined) parts.push(`Age ${story.lifeAge}`);
    parts.push(story.storyYear.toString());
    return parts.join(' • ');
  };

  // Split transcription into paragraphs
  const paragraphs = story.transcription?.split("\n\n") || [];

  return (
    <>
      {/* Edit button - hover-only, corner positioned */}
      {isOwnAccount && typeof story === 'object' && 'id' in story && (
        <EditButton
          onClick={() =>
            router.push(
              `/review/book-style?edit=${story.id}&returnPath=${encodeURIComponent(`/book?storyId=${story.id}`)}`
            )
          }
          ariaLabel={`Edit ${story.title}`}
        />
      )}

      {/* Photo with premium frame */}
      {photos.length > 0 && (() => {
        const currentPhoto = photos[currentPhotoIndex];
        // Use displayUrl (550px) as base, masterUrl (2400px) for high-res foreground
        const photoUrl = currentPhoto?.displayUrl || currentPhoto?.url;
        const masterUrl = currentPhoto?.masterUrl;

        if (!photoUrl) return null;

        return (
          <div className="mb-3 mx-auto" style={{ maxWidth: "85%" }}>
            <PhotoFrame storyId={story.id} rotation="none">
              <div
                className="relative overflow-hidden cursor-pointer group"
                style={{ aspectRatio: "4 / 3", borderRadius: 'var(--book-radius-img)' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                  setLightboxIndex(currentPhotoIndex);
                  setLightboxOpen(true);
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${story.title} photo in full screen`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxIndex(currentPhotoIndex);
                    setLightboxOpen(true);
                  }
                }}
              >
                <StoryPhotoWithBlurExtend
                  src={photoUrl}
                  masterUrl={masterUrl}
                  alt={story.title}
                  width={currentPhoto.width}
                  height={currentPhoto.height}
                  transform={currentPhoto.transform}
                  aspectRatio={4 / 3}
                  quality={90}
                  priority={isPriority}
                  useRawImg={true}
                  sizes="(min-width: 1024px) 680px, 100vw"
                  className="shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:brightness-105 group-hover:scale-[1.02]"
                />

                {/* Photo count indicator */}
                {hasMultiplePhotos && (
                  <div className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                )}

                {/* Navigation arrows */}
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
            </PhotoFrame>

            {currentPhoto?.caption && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--book-text-muted)' }}>
                {currentPhoto.caption}
              </p>
            )}

            <PhotoLightbox
              photos={photos.map(p => ({
                url: p.masterUrl || p.url || '', // Use masterUrl for full-screen lightbox
                displayUrl: p.displayUrl,
                masterUrl: p.masterUrl,
                caption: p.caption,
                transform: p.transform,
                width: p.width,
                height: p.height,
              })) as LightboxPhoto[]}
              initialIndex={lightboxIndex}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              alt={story.title}
            />
          </div>
        );
      })()}

      {/* Title - premium typography */}
      <h2
        className="tracking-tight font-serif font-semibold mb-1.5 book-story-text"
        style={{
          fontFamily: "Crimson Text, serif",
          fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)",
          lineHeight: 1.2,
          color: 'var(--book-text)'
        }}
      >
        {story.title}
      </h2>

      {/* Date with small-caps styling */}
      <div className="mb-2 flex items-center justify-between">
        <DateLabel>
          {formatDateDisplay()}
        </DateLabel>
      </div>

      {/* Waveform Audio Player */}
      {story.audioUrl && (
        <div className="mb-3">
          <WaveformAudioPlayer src={story.audioUrl} durationSeconds={story.durationSeconds ?? undefined} />
        </div>
      )}

      {/* Story text with drop cap on first paragraph */}
      <div className="book-story-text space-y-3">
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className={i === 0 ? "book-drop-cap" : ""}
            style={{
              fontFamily: "Crimson Text, serif",
              fontSize: `${fontSize + 1}px`,
              lineHeight: 'var(--book-line-height)',
              color: 'var(--book-text)'
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Wisdom clip note */}
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
            className="relative leading-relaxed"
            style={{
              fontFamily: '"Caveat", cursive',
              fontSize: `${fontSize + 3}px`,
              lineHeight: fontSize <= 16 ? '1.7' : fontSize >= 20 ? '1.9' : '1.8',
              color: 'var(--book-text)'
            }}
          >
            {story.wisdomClipText}
          </p>
        </div>
      )}
    </>
  );
}

/**
 * AddStoryPrompt - Elegant page inviting users to add a new story
 *
 * Matches the premium book theme with sepia/gold accents.
 * Only shows the record button for own account (not family viewers).
 */
function AddStoryPrompt({ isOwnAccount = true }: { isOwnAccount?: boolean }) {
  const router = useRouter();

  const handleRecordClick = () => {
    router.push('/recording');
  };

  return (
    <div className="text-center space-y-6 p-8 w-full flex flex-col items-center max-w-sm">
      {/* Decorative quill/pen icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, var(--book-accent-light) 0%, transparent 100%)',
          border: '2px solid var(--book-accent)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--book-accent)' }}
        >
          {/* Quill/feather pen icon */}
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
          <line x1="16" y1="8" x2="2" y2="22"></line>
          <line x1="17.5" y1="15" x2="9" y2="15"></line>
        </svg>
      </div>

      {/* Title */}
      <h2
        className="text-2xl font-serif"
        style={{
          fontFamily: "Crimson Text, serif",
          color: 'var(--book-text)'
        }}
      >
        Continue Your Story
      </h2>

      {/* Decorative divider */}
      <div
        className="w-16 h-0.5"
        style={{ background: 'linear-gradient(90deg, transparent, var(--book-accent), transparent)' }}
      />

      {/* Description */}
      <p
        className="text-base leading-relaxed"
        style={{
          color: 'var(--book-text-muted)',
          fontFamily: "Crimson Text, serif",
        }}
      >
        {isOwnAccount
          ? "Every memory you share adds another page to your legacy. What moment would you like to capture next?"
          : "More stories are waiting to be told. Check back soon for new memories."}
      </p>

      {/* Record button - only for own account */}
      {isOwnAccount && (
        <button
          onClick={handleRecordClick}
          className="group mt-4 px-8 py-3 rounded-full transition-all duration-300 flex items-center gap-3 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--book-accent) 0%, color-mix(in srgb, var(--book-accent) 80%, black) 100%)',
            color: 'white',
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)',
          }}
        >
          {/* Microphone icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 transition-transform group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
          </svg>
          <span className="font-medium">Record a Memory</span>
        </button>
      )}

      {/* Subtle flourish at bottom */}
      <div className="mt-4 opacity-30">
        <svg
          width="80"
          height="20"
          viewBox="0 0 80 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 10C10 10 15 2 25 2C35 2 35 18 45 18C55 18 55 2 65 2C75 2 80 10 80 10"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: 'var(--book-accent)' }}
          />
        </svg>
      </div>
    </div>
  );
}

export default BookPageV4;
