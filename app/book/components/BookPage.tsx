"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Clock, Volume2, Pause, Loader2 } from "lucide-react";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import { ScrollIndicator } from "@/components/ScrollIndicators";

interface Story {
  id: string;
  title: string;
  storyYear: number;
  lifeAge?: number;
  transcription?: string;
  audioUrl?: string;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string;
    isHero?: boolean;
  }>;
  wisdomClipText?: string;
}

interface DecadePage {
  type: 'decade';
  decade: string;
  title: string;
  count: number;
}

interface BookPageProps {
  story?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | DecadePage;
  pageNum: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  position: "left" | "right";
  allStories?: Story[]; // For TOC
  onNavigateToStory?: (storyIndex: number) => void; // For TOC navigation
  fontSize?: number; // Font size for story text
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({ story, pageNum, onScroll, position, allStories = [], onNavigateToStory, fontSize = 17 }, ref) => {
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
          <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
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

            <div className="relative h-full w-full p-7 md:p-8 lg:p-10">
              <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 flex items-center justify-center">
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
              <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
                {position === "left" && <span className="tracking-tight">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
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
          <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15`}
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
                  src="/logo black.svg"
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
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
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
          <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
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

            <div className="relative h-full w-full p-7 md:p-8 lg:p-10" style={{ pointerEvents: 'auto' }}>
              <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60" style={{ pointerEvents: 'auto' }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    if (element.scrollTop > 50) {
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                  className="h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    pointerEvents: 'auto'
                  }}
                >
                  <h1 className="text-5xl font-serif text-center mb-8 text-gray-800">
                    Table of Contents
                  </h1>
                  <div className="space-y-4" style={{ pointerEvents: 'auto' }}>
                    {leftStories.map((storyItem, idx) => (
                      <button
                        key={storyItem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToStory) {
                            onNavigateToStory(idx);
                          }
                        }}
                        className="flex justify-between items-baseline text-lg w-full hover:bg-gray-100 px-3 py-2.5 rounded transition-colors cursor-pointer text-left block"
                      >
                        <span className="text-gray-700 flex-1 pr-3 hover:text-indigo-600 font-medium">
                          {storyItem.title}
                        </span>
                        <span className="text-gray-500 text-base whitespace-nowrap">
                          {storyItem.storyYear}
                          {storyItem.lifeAge !== undefined && ` • Age ${storyItem.lifeAge}`}
                        </span>
                      </button>
                    ))}
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
              
              <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
                {position === "left" && <span className="tracking-tight">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
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
            className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}
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

            <div className="relative h-full w-full p-7 md:p-8 lg:p-10" style={{ pointerEvents: 'auto' }}>
              <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60" style={{ pointerEvents: 'auto' }}>
                <div
                  ref={ref}
                  onScroll={(e) => {
                    onScroll(e);
                    const element = e.currentTarget;
                    if (element.scrollTop > 50) {
                      setScrollState(prev => ({ ...prev, hasUserScrolled: true }));
                    }
                  }}
                  className="h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    pointerEvents: 'auto'
                  }}
                >
                  <div className="space-y-4 pt-[72px]" style={{ pointerEvents: 'auto' }}>
                    {rightStories.map((storyItem, idx) => (
                      <button
                        key={storyItem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToStory) {
                            onNavigateToStory(midpoint + idx);
                          }
                        }}
                        className="flex justify-between items-baseline text-lg w-full hover:bg-gray-100 px-3 py-2.5 rounded transition-colors cursor-pointer text-left block"
                      >
                        <span className="text-gray-700 flex-1 pr-3 hover:text-indigo-600 font-medium">
                          {storyItem.title}
                        </span>
                        <span className="text-gray-500 text-base whitespace-nowrap">
                          {storyItem.storyYear}
                          {storyItem.lifeAge !== undefined && ` • Age ${storyItem.lifeAge}`}
                        </span>
                      </button>
                    ))}
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
              
              <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
                {position === "left" && <span className="tracking-tight">{pageNum}</span>}
                {position === "right" && <span className="tracking-tight ml-auto">{pageNum}</span>}
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
          {/* Main page */}
          <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
            <DecadeIntroPage
              decade={story.decade}
              title={story.title}
              storiesCount={story.count}
            />
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
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
          <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
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
          className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}
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

          <div className="relative h-full w-full p-7 md:p-8 lg:p-10" style={{ zIndex: 10 }}>
            <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden" style={{ position: 'relative', zIndex: 15 }}>
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
                className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'scroll-position',
                  position: 'relative',
                  zIndex: 20
                }}
                aria-label="Scroll down to continue reading"
              >
                <StoryContent story={story as Story} position={position} pageNum={pageNum} fontSize={fontSize} />
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
            
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
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
function StoryContent({ story, position, pageNum, fontSize = 17 }: { story: Story; position: "left" | "right"; pageNum: number; fontSize?: number }) {
  const router = useRouter();
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
      {/* Edit and Timeline buttons */}
      <div className={`flex gap-2 mb-1.5 -mt-5 ${position === "right" ? "justify-end" : ""}`}>
        <button
          onClick={() =>
            router.push(
              `/review/book-style?id=${story.id}&returnPath=${encodeURIComponent(`/book?page=${pageNum}`)}`,
            )
          }
          className="flex items-center gap-1.5 px-2.5 py-0 min-h-[34px] rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-base font-medium text-gray-700"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => {
            // Store navigation context for timeline to pick up
            const context = {
              memoryId: story.id,
              scrollPosition: 0, // Start at top, will scroll to card
              timestamp: Date.now(),
              returnPath: '/timeline', // Required by timeline navigation logic
            };
            sessionStorage.setItem('timeline-navigation-context', JSON.stringify(context));

            // Navigate to timeline
            router.push('/timeline');
          }}
          className="flex items-center gap-1.5 px-2.5 py-0 min-h-[34px] rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-base font-medium text-gray-700"
        >
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
        </button>
      </div>

      {/* Photo at top if available */}
      {story.photos && story.photos.length > 0 && (() => {
        // Find the hero photo, or use the first photo as fallback
        const heroPhoto = story.photos.find(p => p.isHero) || story.photos[0];
        return (
          <div className="mb-2">
            <div className="w-full aspect-[16/10] overflow-hidden rounded-md shadow ring-1 ring-black/5">
              <img
                src={heroPhoto.url}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
            {heroPhoto.caption && (
              <p className="text-[12px] text-neutral-600 mt-1">
                {heroPhoto.caption}
              </p>
            )}
          </div>
        );
      })()}

      {/* Title */}
      <h2 className="text-2xl tracking-tight font-semibold mb-2 text-neutral-900">
        {story.title}
      </h2>

      {/* Age and year */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xl text-neutral-600 font-medium">
          {story.lifeAge !== undefined && `Age ${story.lifeAge} • `}
          {story.storyYear}
        </div>
      </div>

      {/* Audio Player */}
      {story.audioUrl && (
        <div className="mb-2 relative" style={{ zIndex: 9999 }}>
          <div className="flex items-center gap-3">
            {/* Circular play button with progress ring */}
            <button
              onClick={toggleAudio}
              className="relative flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 9999,
                position: 'relative'
              }}
            >
              <svg className="w-10 h-10 -rotate-90">
                {/* Background ring - very subtle */}
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="rgba(139,107,122,0.15)"
                  strokeWidth="2"
                />
                {/* Progress ring - sepia tone */}
                {isPlaying && (
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(139,107,122,0.5)"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}
              </svg>
              {/* Icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 text-neutral-600 fill-neutral-600" />
                ) : (
                  <Volume2 className="w-4 h-4 text-neutral-600" />
                )}
              </div>
            </button>

            {/* Linear progress bar - subtle, book-style */}
            <div className="flex-1">
              <div 
                className="h-1.5 bg-neutral-200 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
                onClick={(e) => {
                  if (!audioRef.current || !duration) return;
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const newTime = percentage * duration;
                  
                  audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }}
                style={{ pointerEvents: 'auto', zIndex: 9999 }}
              >
                <div 
                  className="h-full bg-neutral-400 transition-all duration-100 pointer-events-none" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            {/* Timestamps - small, subtle */}
            <span className="text-xs text-neutral-500 whitespace-nowrap tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      {/* Story text */}
      <div
        className="text-neutral-800/95 space-y-3"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: fontSize <= 16 ? '1.6' : fontSize >= 20 ? '1.8' : '1.7'
        }}
      >
        {story.transcription?.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
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
          <p className="relative text-slate-700 text-lg leading-relaxed" style={{ fontFamily: '"Caveat", cursive' }}>
            {story.wisdomClipText}
          </p>
        </div>
      )}
      
    </>
  );
}

