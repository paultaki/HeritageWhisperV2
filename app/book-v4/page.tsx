"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BookPage } from "./components/BookPage";
import { BottomNav } from "./components/BottomNav";
import "./book.css";

// Story interface matching your API structure
interface Story {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  transcription?: string;
  durationSeconds?: number;
  wisdomClipUrl?: string;
  wisdomClipText?: string;
  storyYear: number;
  storyDate?: string;
  lifeAge?: number;
  photoUrl?: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  photos?: Array<{
    id: string;
    url: string;
    transform?: { zoom: number; position: { x: number; y: number } };
    caption?: string;
    isHero?: boolean;
  }>;
  emotions?: string[];
  pivotalCategory?: string;
  includeInBook?: boolean;
  formattedContent?: {
    formattedText?: string;
    pages?: string[];
    questions?: Array<{ text: string }>;
  };
  createdAt: string;
}

export default function BookV4Page() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showToc, setShowToc] = useState(false);
  
  const flowLeftRef = useRef<HTMLDivElement>(null);
  const flowRightRef = useRef<HTMLDivElement>(null);

  // Fetch stories - same as main book
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  const stories = data?.stories || [];

  // Filter stories that should be included in book (must be explicitly true)
  const bookStories = stories.filter(
    (s) => s.includeInBook === true && s.storyYear && s.transcription
  );

  // Sort by year
  const sortedStories = useMemo(() => 
    [...bookStories].sort((a, b) => a.storyYear - b.storyYear),
    [bookStories]
  );

  // Create spreads - pairs of stories for left/right pages
  const spreads = useMemo(() => {
    const result: Array<{ left?: Story; right?: Story }> = [];
    for (let i = 0; i < sortedStories.length; i += 2) {
      result.push({
        left: sortedStories[i],
        right: sortedStories[i + 1],
      });
    }
    return result;
  }, [sortedStories]);

  // Update scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const max = Math.max(1, target.scrollHeight - target.clientHeight);
    const pct = Math.max(0, Math.min(100, (target.scrollTop / max) * 100));
    setScrollProgress(pct);
  };

  // Navigate spreads
  const goToPrevSpread = () => {
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  };

  const goToNextSpread = () => {
    if (currentSpreadIndex < spreads.length - 1) {
      setCurrentSpreadIndex(currentSpreadIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevSpread();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextSpread();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpreadIndex, spreads.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your stories...</p>
        </div>
      </div>
    );
  }

  // No stories state
  if (sortedStories.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Your Book is Empty
          </h2>
          <p className="text-slate-300 mb-6">
            Start creating memories to see them appear here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all"
          >
            Create Your First Memory
          </button>
        </div>
      </div>
    );
  }

  const currentSpread = spreads[currentSpreadIndex] || { left: undefined, right: undefined };

  return (
    <div className="h-screen overflow-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-100 text-slate-200 bg-[#0b0d12]">
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 no-print">
        <div className="mx-auto max-w-[1800px] px-6">
          <div className="relative h-8 flex items-center">
            <div 
              className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10 cursor-pointer"
              title={`${Math.round(scrollProgress)}% scrolled`}
            >
              <div 
                className="h-full bg-indigo-400/70 transition-all"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    
      <div className="md:py-12 max-w-[1800px] mr-auto ml-auto pt-12 pr-6 pb-8 pl-6">
        {/* Header */}
        <div className="mx-auto max-w-[1600px] mb-8 md:mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 grid place-items-center rounded-md ring-1 bg-white/5 ring-white/10">
                <span className="text-xs font-semibold tracking-tight">BK</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl tracking-tight font-semibold text-white">
                  {user?.name ? `${user.name}'s Story` : "Your Story"}
                </h1>
                <p className="text-sm text-slate-400">
                  {sortedStories.length} {sortedStories.length === 1 ? 'memory' : 'memories'} • Spread {currentSpreadIndex + 1} of {spreads.length}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
    
        </div>
    
        {/* Desktop: Dual-page spread */}
        <div className="relative mx-auto hidden lg:flex items-center justify-center" style={{ height: "calc(100vh - 180px)" }}>
          {/* Book container with viewport constraints */}
          <div 
            className="relative w-full h-full [perspective:2000px]" 
            style={{ 
              maxWidth: "min(95vw, 1600px)",
              maxHeight: "min(85vh, 900px)",
              aspectRatio: "110 / 85"
            }}
          >
            {/* Ambient shadow/vignette */}
            <div className="pointer-events-none absolute -inset-8 rounded-2xl bg-[radial-gradient(1000px_400px_at_50%_30%,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0.04)_35%,transparent_70%)]"></div>
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"></div>
    
            {/* Outer book cover/border - wider on left/right */}
            <div 
              aria-hidden="true" 
              className="pointer-events-none absolute rounded-[28px]" 
              style={{ 
                top: "-14px",
                bottom: "-14px",
                left: "-29px",
                right: "-29px",
                background: "linear-gradient(180deg, #2e1f14 0%, #1f150d 100%)", 
                boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)" 
              }}
            ></div>
    
            {/* Left page */}
            <BookPage 
              story={currentSpread.left} 
              pageNum={currentSpreadIndex * 2 + 1} 
              onScroll={handleScroll} 
              ref={flowLeftRef}
              position="left"
            />
    
            {/* Right page */}
            <BookPage 
              story={currentSpread.right} 
              pageNum={currentSpreadIndex * 2 + 2} 
              onScroll={handleScroll} 
              ref={flowRightRef}
              position="right"
            />
    
            {/* Refined spine */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 md:w-14 lg:w-16">
              <div className="absolute inset-y-6 left-0 w-1/2 bg-gradient-to-r from-black/30 via-black/10 to-transparent opacity-20"></div>
              <div className="absolute inset-y-6 right-0 w-1/2 bg-gradient-to-l from-black/30 via-black/10 to-transparent opacity-20"></div>
              <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-px bg-white/70 opacity-60"></div>
              <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-0.5 opacity-20 shadow-[inset_1px_0_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.45)]"></div>
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-3 h-1.5 w-14 rounded-sm ring-1 ring-black/10 shadow-sm" 
                style={{ background: "repeating-linear-gradient(90deg, rgba(59,130,246,0.25) 0 6px, rgba(99,102,241,0.25) 6px 12px, rgba(16,185,129,0.25) 12px 18px, rgba(253,186,116,0.25) 18px 24px, rgba(244,63,94,0.25) 24px 30px)" }}
              ></div>
              <div 
                className="absolute left-1/2 -translate-x-1/2 bottom-3 h-1.5 w-14 rounded-sm ring-1 ring-black/10 shadow-sm" 
                style={{ background: "repeating-linear-gradient(90deg, rgba(59,130,246,0.25) 0 6px, rgba(99,102,241,0.25) 6px 12px, rgba(16,185,129,0.25) 12px 18px, rgba(253,186,116,0.25) 18px 24px, rgba(244,63,94,0.25) 24px 30px)" }}
              ></div>
            </div>
    
            {/* Navigation removed from center - now in bottom bar */}
    
            {/* Ground shadow */}
            <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-16 w-[80%] rounded-[100%] blur-2xl bg-black/60"></div>
          </div>
        </div>
    
        {/* Mobile & Tablet: Single page with horizontal swipe */}
        <MobileView stories={sortedStories} />
    
        {/* TOC Drawer - Bottom Right */}
        {showToc && (
          <div className="fixed bottom-24 right-6 z-40 w-[320px] max-w-[calc(100vw-3rem)]">
            <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 text-sm text-slate-200 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium tracking-tight">Table of Contents</div>
                <button 
                  onClick={() => setShowToc(false)}
                  className="p-1 rounded-md hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <ul className="space-y-1.5">
                  {sortedStories.map((story, index) => (
                    <li key={story.id}>
                      <button
                        onClick={() => {
                          setCurrentSpreadIndex(Math.floor(index / 2));
                          setShowToc(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors"
                      >
                        {story.title} ({story.storyYear})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <BottomNav
          currentStory={currentSpreadIndex * 2}
          totalStories={sortedStories.length}
          onPrevious={goToPrevSpread}
          onNext={goToNextSpread}
          onTocClick={() => setShowToc(!showToc)}
        />
      </div>
    </div>
  );
}

// Left Page Component
const LeftPage = React.forwardRef<HTMLDivElement, { story?: Story; pageNum: number; onScroll: (e: React.UIEvent<HTMLDivElement>) => void }>(
  ({ story, pageNum, onScroll }, ref) => {
    if (!story) {
      return (
        <div className="absolute inset-y-0 left-0 w-1/2 [transform-style:preserve-3d]">
          {/* Page stack layers */}
          <div className="absolute inset-0 translate-y-0.5 -translate-x-0.5 scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10"></div>
          <div className="absolute inset-0 translate-y-1 -translate-x-[3px] scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10"></div>
          <div className="-translate-x-[6px] bg-neutral-50 opacity-35 ring-black/10 ring-1 rounded-[18px] absolute top-0 right-0 bottom-0 left-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] translate-y-[6px] scale-[0.992]"></div>
          
          {/* Main page - Empty */}
          <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(3deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
              <span className="text-sm">No story</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-y-0 left-0 w-1/2 [transform-style:preserve-3d]">
        {/* Page stack layers */}
        <div className="absolute inset-0 translate-y-0.5 -translate-x-0.5 scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10"></div>
        <div className="absolute inset-0 translate-y-1 -translate-x-[3px] scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10"></div>
        <div className="-translate-x-[6px] bg-neutral-50 opacity-35 ring-black/10 ring-1 rounded-[18px] absolute top-0 right-0 bottom-0 left-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] translate-y-[6px] scale-[0.992]"></div>

        {/* Main page */}
        <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(3deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
          {/* Paper texture/vignette */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              backgroundImage: `
                radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%),
                linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.85))
              `
            }}
          ></div>
          {/* Inner gutter shadow */}
          <div className="absolute inset-y-0 right-0 w-10 pointer-events-none bg-gradient-to-l to-transparent from-black/12 via-black/6"></div>
          {/* Outer edge lines */}
          <div 
            className="absolute inset-y-0 left-0 w-3 pointer-events-none" 
            style={{ 
              backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)", 
              opacity: 0.25 
            }}
          ></div>

          <div className="md:p-8 lg:p-10 w-full h-full pt-7 pr-7 pb-7 pl-7 relative">
            <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden">
              <div 
                ref={ref}
                onScroll={onScroll}
                className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
              >
                <StoryContent story={story} />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80">
              <span className="tracking-tight">{pageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
LeftPage.displayName = "LeftPage";

// Right Page Component
const RightPage = React.forwardRef<HTMLDivElement, { story?: Story; pageNum: number; onScroll: (e: React.UIEvent<HTMLDivElement>) => void }>(
  ({ story, pageNum, onScroll }, ref) => {
    if (!story) {
      return (
        <div className="absolute inset-y-0 right-0 w-1/2 [transform-style:preserve-3d]">
          {/* Page stack layers */}
          <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10"></div>
          <div className="absolute inset-0 translate-y-1 translate-x-[3px] scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10"></div>
          <div className="absolute inset-0 translate-y-[6px] translate-x-[6px] scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10"></div>

          {/* Main page - Empty */}
          <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(-3deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
              <span className="text-sm">No story</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-y-0 right-0 w-1/2 [transform-style:preserve-3d]">
        {/* Page stack layers */}
        <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10"></div>
        <div className="absolute inset-0 translate-y-1 translate-x-[3px] scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10"></div>
        <div className="absolute inset-0 translate-y-[6px] translate-x-[6px] scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10"></div>

        {/* Main page */}
        <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(-3deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
          {/* Paper texture/vignette */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              backgroundImage: `
                radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%),
                linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.85))
              `
            }}
          ></div>
          {/* Inner gutter shadow */}
          <div className="absolute inset-y-0 left-0 w-10 pointer-events-none bg-gradient-to-r to-transparent from-black/12 via-black/6"></div>
          {/* Outer edge lines */}
          <div 
            className="absolute inset-y-0 right-0 w-3 pointer-events-none" 
            style={{ 
              backgroundImage: "repeating-linear-gradient(270deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)", 
              opacity: 0.25 
            }}
          ></div>

          <div className="relative h-full w-full p-7 md:p-8 lg:p-10">
            <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60 overflow-hidden">
              <div 
                ref={ref}
                onScroll={onScroll}
                className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
              >
                <StoryContent story={story} />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80">
              <span className="tracking-tight"></span>
              <span className="tracking-tight">{pageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RightPage.displayName = "RightPage";

// Story Content Component
function StoryContent({ story }: { story: Story }) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          {story.storyYear}
          {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
        </div>
      </div>

      <h2 className="text-2xl tracking-tight font-semibold mb-3 text-neutral-900">
        {story.title}
      </h2>

      {story.photos && story.photos.length > 0 && (
        <div className="mb-4">
          <img
            src={story.photos[0].url}
            alt={story.title}
            className="w-full max-w-sm rounded-md shadow ring-1 ring-black/5"
          />
          {story.photos[0].caption && (
            <p className="text-[12px] text-neutral-600 mt-1">
              {story.photos[0].caption}
            </p>
          )}
        </div>
      )}

      <div className="text-[15.5px] leading-7 text-neutral-800/95 space-y-3">
        {story.transcription?.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {story.wisdomClipText && (
        <div className="mt-6 p-4 bg-amber-50/80 rounded-lg border-l-4 border-amber-400">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Lesson Learned
          </p>
          <p className="text-[14px] text-neutral-700 italic leading-6">
            {story.wisdomClipText}
          </p>
        </div>
      )}
    </>
  );
}

// Mobile View Component
function MobileView({ stories }: { stories: Story[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: -(scrollerRef.current.clientWidth + 24), behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: scrollerRef.current.clientWidth + 24, behavior: 'smooth' });
    }
  };

  return (
    <div className="lg:hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 Z"></path>
          </svg>
          <span className="text-slate-400">Swipe to navigate</span>
        </div>
      </div>

      <div className="relative -mx-2 px-2">
        {/* Mobile prev/next controls */}
        <button 
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 ml-1 h-9 w-9 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15 active:bg-white/20 grid place-items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 mr-1 h-9 w-9 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15 active:bg-white/20 grid place-items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>

        <div 
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto gap-6 pb-4"
        >
          {stories.map((story, index) => (
            <MobilePage key={story.id} story={story} pageNum={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile Page Component  
function MobilePage({ story, pageNum }: { story: Story; pageNum: number }) {
  return (
    <div className="mobile-page relative mx-auto w-[min(92vw,520px)] aspect-[55/85] snap-center shrink-0 [perspective:1600px]">
      {/* Outer book cover/border */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute rounded-[24px]" 
        style={{ 
          inset: "-12px", 
          background: "linear-gradient(180deg, #2e1f14 0%, #1f150d 100%)", 
          boxShadow: "0 18px 50px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)" 
        }}
      ></div>

      <div className="absolute inset-0 translate-y-[5px] -translate-x-[5px] scale-[0.994] rounded-[18px] ring-1 opacity-35 bg-neutral-50 ring-black/10"></div>
      <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(2.2deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              radial-gradient(120% 65% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 60%),
              linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))
            `
          }}
        ></div>
        <div className="absolute inset-y-0 right-0 w-8 pointer-events-none bg-gradient-to-l to-transparent from-black/10 via-black/5"></div>
        <div 
          className="absolute inset-y-0 left-0 w-3 pointer-events-none" 
          style={{ 
            backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)", 
            opacity: 0.22 
          }}
        ></div>

        <div className="relative h-full w-full p-6">
          <div className="h-full w-full rounded-[14px] ring-1 ring-black/5 bg-white/60 overflow-hidden">
            <div className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-5 overflow-y-auto">
              <h2 className="mb-2.5 text-[19px] tracking-tight font-semibold text-neutral-900">
                {story.title}
              </h2>
              
              <div className="text-[13px] text-neutral-600 mb-3">
                {story.storyYear}
                {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
              </div>

              {story.photos && story.photos.length > 0 && (
                <div className="mb-3">
                  <img
                    src={story.photos[0].url}
                    alt={story.title}
                    className="w-full rounded-md shadow ring-1 ring-black/5"
                  />
                </div>
              )}

              <div className="text-[14.5px] leading-6 text-neutral-800/95 space-y-2.5">
                {story.transcription?.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {story.wisdomClipText && (
                <div className="mt-4 p-3 bg-amber-50/80 rounded-lg border-l-4 border-amber-400">
                  <p className="text-xs font-semibold text-amber-900 mb-1">
                    Lesson Learned
                  </p>
                  <p className="text-[13px] text-neutral-700 italic leading-5">
                    {story.wisdomClipText}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-3 left-0 right-0 px-6 text-right text-[12px] text-neutral-500/80">
            {pageNum}
          </div>
        </div>
      </div>
    </div>
  );
}
