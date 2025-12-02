"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Clock, Volume2, Pause, Loader2 } from "lucide-react";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import { ScrollIndicator } from "@/components/ScrollIndicators";
import { apiRequest } from "@/lib/queryClient";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";
import { PhotoLightbox, type LightboxPhoto } from "@/components/PhotoLightbox";

interface Story {
  id: string;
  title: string;
  storyYear: number;
  lifeAge?: number;
  transcription?: string;
  audioUrl?: string;
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

interface BookPageProps {
  story?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | DecadePage;
  pageNum: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  position: "left" | "right";
  allStories?: Story[];
  onNavigateToStory?: (storyId: string) => void;
  fontSize?: number;
  isOwnAccount?: boolean;
  viewMode?: 'chronological' | 'chapters';
}

// Brand token colors
const COLORS = {
  page: 'var(--hw-page-bg, #F7F2EC)',
  text: 'var(--hw-text-primary, #1F1F1F)',
  textSecondary: 'var(--hw-text-secondary, #4A4A4A)',
  textMuted: 'var(--hw-text-muted, #8A8378)',
  accent: 'var(--hw-accent-gold, #CBA46A)',
  primary: 'var(--hw-primary, #203954)',
  border: 'var(--hw-border-subtle, #D2C9BD)',
  borderStrong: 'var(--hw-border-strong, #B8AA9C)',
  section: 'var(--hw-section-bg, #EFE6DA)',
};

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
              <h3 className="text-lg font-bold tracking-tight mt-5 mb-1.5 first:mt-0 font-serif" style={{ color: COLORS.text }}>
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
              className="flex justify-between items-baseline w-full px-2 py-1.5 rounded transition-colors cursor-pointer text-left"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hw-accent-gold-soft, #F4E6CC)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span className="flex-1 pr-3 text-base font-serif" style={{ color: COLORS.textSecondary }}>
                {storyItem.title}
              </span>
              <span className="text-sm whitespace-nowrap book-v5-date" style={{ color: COLORS.textMuted }}>
                {storyItem.storyYear}
              </span>
            </button>
          </div>
        );
      });
    };

    // Single effect to manage everything
    React.useEffect(() => {
      const pageId = typeof story === 'string' ? story :
        (story && typeof story === 'object' && 'id' in story) ? story.id :
          `page-${pageNum}`;

      const isNewPage = pageId !== currentPageIdRef.current;

      if (isNewPage) {
        currentPageIdRef.current = pageId;
        setScrollState({ hasScroll: false, isAnimating: false, hasUserScrolled: false });

        let stopAnimationTimer: NodeJS.Timeout | null = null;

        const checkScrollTimer = setTimeout(() => {
          if (ref && typeof ref !== 'function' && ref.current) {
            const element = ref.current;
            const isScrollable = element.scrollHeight > element.clientHeight + 5;

            if (isScrollable) {
              setScrollState({ hasScroll: true, isAnimating: true, hasUserScrolled: false });

              stopAnimationTimer = setTimeout(() => {
                setScrollState(prev => ({ ...prev, isAnimating: false }));
              }, 1500);
            }
          }
        }, 1200);

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
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{ background: COLORS.page }}
          >
            {/* Paper texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10 rounded-[16px]"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            <div className="relative h-full w-full p-[24px] md:p-[28px] lg:p-[32px]">
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] flex items-center justify-center"
                style={{ background: `${COLORS.page}cc`, ringColor: 'rgba(32, 57, 84, 0.05)' }}
              >
                <div className="text-center space-y-8 p-8 w-full flex flex-col items-center">
                  <h1
                    className="text-5xl font-serif mb-4 text-center"
                    style={{ fontFamily: "Crimson Text, Georgia, serif", color: COLORS.text }}
                  >
                    Family Memories
                  </h1>
                  <div className="w-24 h-0.5 book-v5-separator-gradient"></div>
                  <p className="text-lg leading-relaxed max-w-md text-center italic font-serif" style={{ color: COLORS.textSecondary }}>
                    A collection of cherished moments, stories, and lessons from a life well-lived.
                  </p>
                  <p className="text-base mt-8 text-center font-serif" style={{ color: COLORS.textMuted }}>
                    These pages hold the precious memories that shaped our family&apos;s journey.
                  </p>
                </div>
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-sm pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle endpaper page - brand primary tinted
    if (story === 'endpaper') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{
              background: `linear-gradient(135deg, ${COLORS.section} 0%, ${COLORS.page} 50%, ${COLORS.section} 100%)`
            }}
          >
            {/* Marbled texture pattern */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='marble'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='8' seed='2' /%3E%3CfeColorMatrix type='saturate' values='0.2'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23marble)' fill='%23203954'/%3E%3C/svg%3E")`,
                backgroundSize: '400px 400px',
              }}
            ></div>

            {/* Subtle swirl pattern with brand primary */}
            <div
              className="absolute inset-0 opacity-8"
              style={{
                backgroundImage: `radial-gradient(ellipse at 20% 30%, rgba(32,57,84,0.15) 0%, transparent 50%),
                                  radial-gradient(ellipse at 80% 70%, rgba(32,57,84,0.1) 0%, transparent 50%),
                                  radial-gradient(ellipse at 40% 80%, rgba(32,57,84,0.08) 0%, transparent 40%)`,
              }}
            ></div>

            {/* HW watermark logo in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="opacity-[0.04]">
                <img
                  src="/final logo/logo-new.svg"
                  alt="Heritage Whisper"
                  className="w-32 h-32"
                  style={{ filter: 'grayscale(100%)' }}
                />
              </div>
            </div>

            {/* Inner gutter shadow */}
            <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/8 via-black/4`}></div>

            {/* Page number */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[11px] pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
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
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{ background: COLORS.page }}
          >
            {/* Paper texture */}
            <div
              className="absolute inset-0 pointer-events-none z-10 rounded-[16px]"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            {/* Gutter shadow */}
            <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none z-10 bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/8 via-black/4`}></div>

            <div className="relative h-full w-full p-[24px] md:p-[28px] lg:p-[32px]" style={{ pointerEvents: 'auto' }}>
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px]" style={{ background: `${COLORS.page}cc`, ringColor: 'rgba(32, 57, 84, 0.05)', pointerEvents: 'auto' }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    if (element.scrollTop > 50) {
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                  className="h-full w-full rounded-[8px] outline-none p-5 overflow-y-auto book-v5-scroll"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    pointerEvents: 'auto',
                    color: COLORS.text
                  }}
                >
                  <h1 className="text-5xl font-semibold text-center mb-8 font-serif" style={{ color: COLORS.text }}>
                    Table of Contents
                  </h1>
                  <div className="space-y-0" style={{ pointerEvents: 'auto' }}>
                    {renderTOCItems(leftStories, 0)}
                  </div>
                </div>
              </div>

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

              <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-sm pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
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
          <div
            className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{ background: COLORS.page, pointerEvents: 'auto' }}
          >
            {/* Paper texture */}
            <div
              className="absolute inset-0 pointer-events-none z-10 rounded-[16px]"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            {/* Gutter shadow */}
            <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none z-10 bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/8 via-black/4`}></div>

            <div className="relative h-full w-full p-[24px] md:p-[28px] lg:p-[32px]" style={{ pointerEvents: 'auto' }}>
              <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px]" style={{ background: `${COLORS.page}cc`, ringColor: 'rgba(32, 57, 84, 0.05)', pointerEvents: 'auto' }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    if (element.scrollTop > 50) {
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                  className="h-full w-full rounded-[8px] outline-none p-5 overflow-y-auto book-v5-scroll"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    pointerEvents: 'auto',
                    color: COLORS.text
                  }}
                >
                  <div className="space-y-0 pt-[72px]" style={{ pointerEvents: 'auto' }}>
                    {renderTOCItems(rightStories, midpoint)}
                  </div>
                </div>
              </div>

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

              <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-sm pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
                {position === "left" && <span className="tracking-tight font-medium">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight font-medium ml-auto">{pageNum}</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle decade page
    if (story && typeof story !== 'string' && 'type' in story && story.type === 'decade') {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{ background: COLORS.page }}
          >
            {/* Paper texture */}
            <div
              className="absolute inset-0 pointer-events-none z-[1] rounded-[16px]"
              style={{
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            <div className="relative h-full w-full p-[24px] md:p-[28px] lg:p-[32px] z-10">
              <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-8 pointer-events-none z-[1] bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/6 via-black/3`}></div>

              <div className="relative h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] overflow-hidden z-10"
                style={{ background: `${COLORS.page}cc`, ringColor: 'rgba(32, 57, 84, 0.05)' }}
              >
                <DecadeIntroPage
                  decade={story.decade}
                  title={story.title}
                  storiesCount={story.count}
                  isChapter={story.isChapter}
                />
              </div>
            </div>

            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[11px] pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Empty page - "Add Next Story" CTA
    if (!story) {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          <div className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
            style={{ background: COLORS.page }}
          >
            {/* Paper texture */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[16px]"
              style={{
                zIndex: 1,
                backgroundImage: position === "left"
                  ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`
                  : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                     radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`,
              }}
            ></div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center p-8" style={{ zIndex: 10 }}>
              <AddNextStoryCard />
            </div>

            {/* Page number */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[11px] pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
              {position === "left" && <span className="tracking-tight">{pageNum}</span>}
              {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Story page - Premium styling with brand tokens
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
          className={`relative h-full w-full rounded-[16px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 book-v5-page-stack ${position === "left" ? "book-v5-page-stack-left" : "book-v5-page-stack-right"}`}
          style={{
            maxWidth: '100%',
            pointerEvents: 'auto',
            background: COLORS.page
          }}
        >
          {/* Paper texture */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[16px]"
            style={{
              zIndex: 1,
              backgroundImage: position === "left"
                ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`
                : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 58%)`,
            }}
          ></div>

          {/* Spine shadow */}
          <div className={`book-v5-spine-shadow-${position}`}></div>

          {/* Outer edge lines */}
          <div
            className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-3 pointer-events-none rounded-[16px]`}
            style={{
              zIndex: 2,
              backgroundImage: `repeating-linear-gradient(${position === "left" ? "90deg" : "270deg"}, rgba(32,57,84,0.06) 0px, rgba(32,57,84,0.06) 1px, transparent 1px, transparent 2px)`,
              opacity: 0.35
            }}
          ></div>

          <div className="relative h-full w-full p-[24px] md:p-[28px] lg:p-[32px]" style={{ zIndex: 10 }}>
            <div className="h-full w-full rounded-[10px] ring-1 backdrop-blur-[0.5px] overflow-hidden" 
              style={{ position: 'relative', zIndex: 15, background: `${COLORS.page}cc`, ringColor: 'rgba(32, 57, 84, 0.05)' }}
            >
              <div
                ref={ref}
                onScroll={(e) => {
                  onScroll(e);
                  const element = e.currentTarget;
                  if (element.scrollTop > 50) {
                    setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                  }
                }}
                tabIndex={0}
                className="h-full w-full rounded-[8px] outline-none p-5 overflow-y-auto book-v5-scroll"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'scroll-position',
                  position: 'relative',
                  zIndex: 20,
                  color: COLORS.text
                }}
                aria-label="Scroll down to continue reading"
              >
                <StoryContent story={story as Story} position={position} pageNum={pageNum} fontSize={fontSize} isOwnAccount={isOwnAccount} />
              </div>

              {/* Gradient fade for continue reading */}
              {scrollState.hasScroll && !scrollState.hasUserScrolled && (
                <div className="book-v5-fade-bottom"></div>
              )}

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
            </div>

            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[11px] pointer-events-none z-20" style={{ color: COLORS.textMuted }}>
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

// Add Next Story Card - Heritage Premium style CTA with brand tokens
function AddNextStoryCard() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push("/recording");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add your next story"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full max-w-[320px] rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background: COLORS.page,
        border: `2px dashed ${COLORS.border}`,
        boxShadow: isHovered
          ? "0 12px 32px rgba(32, 57, 84, 0.12)"
          : "0 6px 20px rgba(32, 57, 84, 0.06)",
        transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
      }}
    >
      {/* Decorative top section with quill/feather icon */}
      <div
        className="flex flex-col items-center justify-center rounded-t-xl py-8"
        style={{
          background: COLORS.section,
          borderBottom: `1px dashed ${COLORS.border}`,
        }}
      >
        {/* Quill/Feather pen icon */}
        <div className="mb-3 relative">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.primary}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300"
            style={{ transform: isHovered ? "rotate(-8deg)" : "rotate(0deg)" }}
          >
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
            <line x1="16" y1="8" x2="2" y2="22" />
            <line x1="17.5" y1="15" x2="9" y2="15" />
          </svg>
          {/* Decorative sparkle */}
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              background: `radial-gradient(circle, ${COLORS.accent} 0%, transparent 70%)`,
              opacity: isHovered ? 1 : 0.5,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>
        <p className="text-sm px-6 text-center font-serif italic" style={{ color: COLORS.textMuted }}>
          Your next chapter awaits...
        </p>
      </div>

      {/* Content Section */}
      <div className="px-5 py-5 space-y-4">
        {/* Title */}
        <h3
          className="text-xl font-semibold text-center font-serif"
          style={{ color: COLORS.text }}
        >
          Add Your Next Story
        </h3>

        {/* Subtitle */}
        <p
          className="text-sm text-center mx-auto font-serif"
          style={{ color: COLORS.textSecondary, maxWidth: "260px", lineHeight: 1.5 }}
        >
          Every memory you share becomes a treasured page in your family&apos;s legacy
        </p>

        {/* CTA Button - Using brand primary */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="w-full max-w-[220px] mx-auto block text-white font-semibold text-base py-3 rounded-full transition-all font-serif"
          style={{
            background: COLORS.primary,
            boxShadow: isHovered
              ? "0 8px 20px rgba(32, 57, 84, 0.35)"
              : "0 4px 12px rgba(32, 57, 84, 0.2)",
            transform: isHovered ? "scale(1.03)" : "scale(1)",
          }}
          aria-label="Record a new memory"
        >
          ✦ Record Memory
        </button>

        {/* Helper Text */}
        <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
          Tap to begin recording
        </p>
      </div>
    </div>
  );
}

// Story Content Component - Premium styling with brand tokens
function StoryContent({ story, position, pageNum, fontSize = 18, isOwnAccount = true }: { story: Story; position: "left" | "right"; pageNum: number; fontSize?: number; isOwnAccount?: boolean }) {
  const router = useRouter();

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get all photos
  const photos = story.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  // Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(() => {
    const heroIdx = photos.findIndex(p => p.isHero);
    return heroIdx >= 0 ? heroIdx : 0;
  });
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Photo lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Deterministic rotation based on story ID
  const getPhotoRotation = () => {
    if (!story.id) return 'book-v5-photo-rotate-1';
    const hash = story.id.charCodeAt(0) % 5;
    return `book-v5-photo-rotate-${hash + 1}`;
  };

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
      handleNextPhoto();
    }
    if (touchStart - touchEnd < -75) {
      handlePrevPhoto();
    }
  };

  // Reset photo index when story changes
  useEffect(() => {
    const heroIndex = photos.findIndex(p => p.isHero);
    setCurrentPhotoIndex(heroIndex >= 0 ? heroIndex : 0);
  }, [story.id, photos]);

  // Activity tracking
  const hasLoggedListeningRef = useRef(false);

  const progress = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize audio
  useEffect(() => {
    if (!story.audioUrl) return;
    if (audioRef.current) return;

    const audio = new Audio(story.audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    const handleError = (err: Event) => {
      console.error(`Audio error for ${story.title}:`, err);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

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
  }, [story.id]);

  // Activity tracking for listening
  useEffect(() => {
    if (hasLoggedListeningRef.current) return;
    if (!duration || !currentTime) return;

    const hasReachedTimeThreshold = currentTime >= 10;
    const hasReachedPercentageThreshold = (currentTime / duration) >= 0.5;

    if (hasReachedTimeThreshold || hasReachedPercentageThreshold) {
      hasLoggedListeningRef.current = true;

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

  useEffect(() => {
    hasLoggedListeningRef.current = false;
  }, [story.id]);

  const toggleAudio = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) return;

    try {
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
      console.error(`Audio playback error:`, error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <>
      {/* Edit button - Subtle pencil icon in corner using text-secondary */}
      {isOwnAccount && typeof story === 'object' && 'id' in story && (
        <button
          onClick={() =>
            router.push(
              `/review/book-style?edit=${story.id}&returnPath=${encodeURIComponent(`/book-v5?storyId=${story.id}`)}`,
            )
          }
          className="book-v5-edit-button hidden md:flex"
          aria-label="Edit story"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* Photo - Polaroid style with rotation */}
      {photos.length > 0 && (() => {
        const currentPhoto = photos[currentPhotoIndex];
        const photoUrl = currentPhoto?.displayUrl || currentPhoto?.url;

        if (!photoUrl) return null;

        return (
          <div className="mb-5 mx-auto" style={{ maxWidth: "85%" }}>
            <div
              className={`relative overflow-hidden cursor-pointer group book-v5-photo ${getPhotoRotation()}`}
              style={{ aspectRatio: "4 / 3" }}
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
                alt={story.title}
                width={currentPhoto.width}
                height={currentPhoto.height}
                transform={currentPhoto.transform}
                aspectRatio={4 / 3}
                className="transition-all duration-200 group-hover:brightness-105 group-hover:scale-[1.02]"
              />

              {/* Photo count */}
              {hasMultiplePhotos && (
                <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                >
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              )}

              {/* Navigation arrows */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white transition-all"
                    style={{ background: "rgba(0,0,0,0.4)" }}
                    aria-label="Previous photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white transition-all"
                    style={{ background: "rgba(0,0,0,0.4)" }}
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
              <p className="text-[12px] mt-2 italic" style={{ color: COLORS.textMuted }}>
                {currentPhoto.caption}
              </p>
            )}

            <PhotoLightbox
              photos={photos.map(p => ({
                url: p.url || '',
                displayUrl: p.displayUrl,
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

      {/* Title */}
      <h2
        className="tracking-tight font-serif font-semibold mb-2"
        style={{
          fontFamily: "Crimson Text, Georgia, serif",
          fontSize: "clamp(1.35rem, 2.8vw, 2rem)",
          lineHeight: 1.2,
          color: COLORS.text
        }}
      >
        {story.title}
      </h2>

      {/* Date/Year - uppercase, tracked */}
      <div className="mb-3 flex items-center justify-between">
        <div className="book-v5-date">
          {story.lifeAge !== undefined && `Age ${story.lifeAge} · `}
          {story.storyYear}
        </div>
      </div>

      {/* Audio Player - Minimalist with brand primary controls */}
      {story.audioUrl && (
        <div className="book-v5-audio mb-4">
          <button
            onClick={toggleAudio}
            className={`book-v5-audio-button ${isPlaying ? 'playing' : ''}`}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <div
            className="book-v5-audio-track"
            onClick={(e) => {
              if (!audioRef.current || !isFinite(duration) || duration <= 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, x / rect.width));
              const newTime = percentage * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
          >
            <div
              className="book-v5-audio-progress"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="book-v5-audio-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {/* Story text - Drop cap on first paragraph */}
      <div className="space-y-4 font-serif book-v5-content">
        {story.transcription?.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            className={i === 0 && !photos.length ? 'book-v5-drop-cap' : ''}
            style={{
              fontFamily: "Crimson Text, Georgia, serif",
              fontSize: `${fontSize + 1}px`,
              lineHeight: '1.8',
              color: COLORS.text
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Wisdom clip - Handwritten note style with gold accent border */}
      {story.wisdomClipText && (
        <div className="book-v5-wisdom">
          <p className="book-v5-wisdom-text">
            {story.wisdomClipText}
          </p>
        </div>
      )}
    </>
  );
}

