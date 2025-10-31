"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Clock } from "lucide-react";
import { DecadeIntroPage } from "@/components/BookDecadePages";

interface Story {
  id: string;
  title: string;
  storyYear: number;
  lifeAge?: number;
  transcription?: string;
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
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({ story, pageNum, onScroll, position, allStories = [], onNavigateToStory }, ref) => {
    const pageRef = React.useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = React.useState<{ hasScroll: boolean; isAnimating: boolean }>({
      hasScroll: false,
      isAnimating: false
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
        setScrollState({ hasScroll: false, isAnimating: false });
        
        let stopAnimationTimer: NodeJS.Timeout | null = null;
        
        // Check for scroll after content loads
        const checkScrollTimer = setTimeout(() => {
          if (ref && typeof ref !== 'function' && ref.current) {
            const element = ref.current;
            const isScrollable = element.scrollHeight > element.clientHeight + 5;
            
            if (isScrollable) {
              // Start bouncing
              setScrollState({ hasScroll: true, isAnimating: true });
              
              // Stop bouncing after 1.5 seconds
              stopAnimationTimer = setTimeout(() => {
                setScrollState({ hasScroll: true, isAnimating: false });
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
                  src="/circle logo hw.svg" 
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

            <div className="relative h-full w-full p-7 md:p-8 lg:p-10">
              <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60">
                <div
                  ref={ref}
                  onScroll={onScroll}
                  className="h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position'
                  }}
                >
                  <h1 className="text-5xl font-serif text-center mb-8 text-gray-800">
                    Table of Contents
                  </h1>
                  <div className="space-y-4">
                    {leftStories.map((storyItem, idx) => (
                      <button
                        key={storyItem.id}
                        onClick={() => onNavigateToStory && onNavigateToStory(idx)}
                        className="flex justify-between items-baseline text-lg w-full hover:bg-gray-100 px-3 py-2.5 rounded transition-colors cursor-pointer text-left"
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
              
              {/* Scroll indicator - appears on outer edge */}
              {scrollState.hasScroll && (
                <div className={`absolute bottom-16 ${position === "left" ? "left-4" : "right-4"} ${scrollState.isAnimating ? 'animate-bounce' : ''} pointer-events-none`} style={{ zIndex: 40 }}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300 ${!scrollState.isAnimating ? 'bg-neutral-200/40' : 'bg-neutral-200/80'}`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-neutral-600" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
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

            <div className="relative h-full w-full p-7 md:p-8 lg:p-10">
              <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60">
                <div
                  ref={ref}
                  onScroll={onScroll}
                  className="h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position'
                  }}
                >
                  <div className="space-y-4 pt-[72px]">
                    {rightStories.map((storyItem, idx) => (
                      <button
                        key={storyItem.id}
                        onClick={() => onNavigateToStory && onNavigateToStory(midpoint + idx)}
                        className="flex justify-between items-baseline text-lg w-full hover:bg-gray-100 px-3 py-2.5 rounded transition-colors cursor-pointer text-left"
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
              
              {/* Scroll indicator - appears on outer edge */}
              {scrollState.hasScroll && (
                <div className={`absolute bottom-16 ${position === "left" ? "left-4" : "right-4"} ${scrollState.isAnimating ? 'animate-bounce' : ''} pointer-events-none`} style={{ zIndex: 40 }}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300 ${!scrollState.isAnimating ? 'bg-neutral-200/40' : 'bg-neutral-200/80'}`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-neutral-600" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
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
      <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
        {/* Page stack layers (3 behind) - HIDDEN FOR NOW */}
        <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
        <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
        <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>

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

          {/* Outer edge lines */}
          <div
            className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-3 pointer-events-none z-10`}
            style={{
              backgroundImage: `repeating-linear-gradient(${position === "left" ? "90deg" : "270deg"}, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)`,
              opacity: 0.25,
            }}
          ></div>

          <div className="relative h-full w-full p-7 md:p-8 lg:p-10">
            <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60">
              <div
                ref={ref}
                onScroll={onScroll}
                tabIndex={0}
                className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'scroll-position'
                }}
              >
                <StoryContent story={story as Story} position={position} />
              </div>
            </div>
            
            {/* Scroll indicator - appears on outer edge */}
            {scrollState.hasScroll && (
              <div className={`absolute bottom-16 ${position === "left" ? "left-4" : "right-4"} ${scrollState.isAnimating ? 'animate-bounce' : ''} pointer-events-none`} style={{ zIndex: 40 }}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300 ${!scrollState.isAnimating ? 'bg-neutral-200/40' : 'bg-neutral-200/80'}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-neutral-600" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                  >
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                </div>
              </div>
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
);
BookPage.displayName = "BookPage";

// Story Content Component
function StoryContent({ story, position }: { story: Story; position: "left" | "right" }) {
  const router = useRouter();

  return (
    <>
      {/* Edit and Timeline buttons */}
      <div className={`flex gap-2 mb-4 -mt-2.5 ${position === "right" ? "justify-end" : ""}`}>
        <button
          onClick={() =>
            router.push(
              `/review/book-style?id=${story.id}&returnPath=${encodeURIComponent(`/book-v4?storyId=${story.id}`)}`,
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Pencil className="w-3.5 h-3.5" />
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>
      </div>

      {/* Photo at top if available */}
      {story.photos && story.photos.length > 0 && (
        <div className="mb-4">
          <div className="w-full aspect-[16/10] overflow-hidden rounded-md shadow ring-1 ring-black/5">
            <img
              src={story.photos[0].url}
              alt={story.title}
              className="w-full h-full object-cover"
            />
          </div>
          {story.photos[0].caption && (
            <p className="text-[12px] text-neutral-600 mt-1">
              {story.photos[0].caption}
            </p>
          )}
        </div>
      )}

      {/* Title */}
      <h2 className="text-2xl tracking-tight font-semibold mb-3 text-neutral-900">
        {story.title}
      </h2>

      {/* Age and year */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base text-neutral-600">
          {story.lifeAge !== undefined && `Age ${story.lifeAge} • `}
          {story.storyYear}
        </div>
      </div>

      {/* Story text */}
      <div className="text-[15.5px] leading-7 text-neutral-800/95 space-y-3">
        {story.transcription?.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {story.wisdomClipText && (
        <div 
          className="mt-8 mb-4 p-6 clear-both relative"
          style={{
            background: 'linear-gradient(135deg, #fef9e7 0%, #faf3dd 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            transform: 'rotate(-0.5deg)',
            borderRadius: '2px',
            border: '1px solid rgba(139, 107, 122, 0.2)',
          }}
        >
          {/* Paper texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          ></div>
          
          {/* Tape at top corners */}
          <div 
            className="absolute -top-2 left-6 w-12 h-5 opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,240,0.7) 0%, rgba(255,250,230,0.8) 100%)',
              transform: 'rotate(-2deg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          ></div>
          <div 
            className="absolute -top-2 right-6 w-12 h-5 opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,240,0.7) 0%, rgba(255,250,230,0.8) 100%)',
              transform: 'rotate(2deg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          ></div>

          <p 
            className="text-sm mb-2"
            style={{
              fontFamily: '"Caveat", cursive',
              fontSize: '15px',
              color: '#8b6b7a',
              fontWeight: 600,
            }}
          >
            Lesson Learned
          </p>
          <p 
            className="leading-7"
            style={{
              fontFamily: '"Caveat", cursive',
              fontSize: '18px',
              color: '#4a4a4a',
              lineHeight: '1.8',
            }}
          >
            {story.wisdomClipText}
          </p>
        </div>
      )}
    </>
  );
}

