"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BookPage } from "./components/BookPage";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import "./book.css";

// Import handwriting font
import { Caveat } from "next/font/google";

const caveat = Caveat({ 
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

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
  
  const [isBookOpen, setIsBookOpen] = useState(false);
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

  // Group stories by decade
  const decadeGroups = useMemo(() => {
    const groups = new Map<string, Story[]>();
    
    sortedStories.forEach((story) => {
      const year = story.storyYear;
      const decade = `${Math.floor(year / 10) * 10}s`;
      
      if (!groups.has(decade)) {
        groups.set(decade, []);
      }
      groups.get(decade)!.push(story);
    });
    
    return Array.from(groups.entries()).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [sortedStories]);

  // Create spreads - intro, TOC (2 pages), decade pages, then story pairs
  const spreads = useMemo(() => {
    const result: Array<{ 
      left?: Story | 'intro' | 'toc-left' | 'toc-right' | { type: 'decade'; decade: string; title: string; count: number }; 
      right?: Story | 'intro' | 'toc-left' | 'toc-right' | { type: 'decade'; decade: string; title: string; count: number };
      type: 'intro' | 'toc' | 'decade' | 'stories';
    }> = [];
    
    // First spread: empty left, intro right
    result.push({
      left: undefined,
      right: 'intro',
      type: 'intro'
    });
    
    // Second spread: table of contents across both pages
    result.push({
      left: 'toc-left',
      right: 'toc-right',
      type: 'toc'
    });
    
    // Add decade pages and stories for each decade
    decadeGroups.forEach(([decade, stories], decadeIndex) => {
      const decadeYear = decade.replace('s', '');
      const decadePage = {
        type: 'decade' as const,
        decade,
        title: `The ${decadeYear}s`,
        count: stories.length
      };
      
      // Add decade page spread (empty left, decade right)
      result.push({
        left: undefined,
        right: decadePage,
        type: 'decade'
      });
      
      // Add story spreads for this decade
      for (let i = 0; i < stories.length; i += 2) {
        result.push({
          left: stories[i],
          right: stories[i + 1],
          type: 'stories'
        });
      }
    });
    
    return result;
  }, [decadeGroups]);

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

  // Prevent page scrolling
  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Restore scroll on unmount
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

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

  const currentSpread = spreads[currentSpreadIndex] || { left: undefined, right: undefined, type: 'stories' as const };

  // Navigate to a story from TOC
  const handleNavigateToStory = (storyIndex: number) => {
    // Find which spread contains this story
    let currentStoryCount = 0;
    
    for (let i = 0; i < spreads.length; i++) {
      const spread = spreads[i];
      
      // Count stories in this spread
      let storiesInSpread = 0;
      if (spread.left && typeof spread.left !== 'string' && !('type' in spread.left)) {
        storiesInSpread++;
      }
      if (spread.right && typeof spread.right !== 'string' && !('type' in spread.right)) {
        storiesInSpread++;
      }
      
      // Check if our target story is in this spread
      if (currentStoryCount + storiesInSpread > storyIndex) {
        setCurrentSpreadIndex(i);
        return;
      }
      
      currentStoryCount += storiesInSpread;
    }
  };

  // Render closed book cover state
  if (!isBookOpen) {
    return (
      <div className={`h-screen overflow-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-100 text-slate-200 bg-[#0b0d12] ${caveat.className}`}>
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 no-print">
          <div className="mx-auto max-w-[1800px] px-6">
            <div className="relative h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 grid place-items-center rounded-md ring-1 bg-white/5 ring-white/10">
                  <span className="text-xs font-semibold tracking-tight">BK</span>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl tracking-tight font-semibold text-white leading-tight">
                    {user?.name ? `${user.name}'s Story` : "Your Story"}
                  </h1>
                </div>
              </div>
              <button
                onClick={() => router.push("/")}
                className="hidden md:flex items-center gap-2 text-base text-slate-300 hover:text-white transition-colors font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Closed book cover - centered */}
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)", paddingTop: "64px" }}>
          <ClosedBookCover
            userName={user?.name || "Your"}
            storyCount={sortedStories.length}
            onOpen={() => setIsBookOpen(true)}
          />
        </div>

        {/* Footer with "Tap to open" */}
        <div className="fixed bottom-0 left-0 right-0 z-30 no-print pb-4">
          <div className="mx-auto max-w-[608px] px-6">
            <div className="flex items-center justify-center gap-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 shadow-2xl">
              <span className="text-white font-medium text-xl">
                Tap to open
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-100 text-slate-200 bg-[#0b0d12] ${caveat.className}`}>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 no-print">
        <div className="mx-auto max-w-[1800px] px-6">
          <div className="relative h-8 flex items-center">
            <div 
              className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10 cursor-pointer hover:h-2 transition-all"
              title={`${Math.round(scrollProgress)}% scrolled - Click to jump`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const currentSpread = spreads[currentSpreadIndex];
                
                // Try to scroll both pages to the clicked position
                if (flowLeftRef.current && currentSpread?.left) {
                  const maxScroll = flowLeftRef.current.scrollHeight - flowLeftRef.current.clientHeight;
                  flowLeftRef.current.scrollTop = maxScroll * percent;
                }
                if (flowRightRef.current && currentSpread?.right) {
                  const maxScroll = flowRightRef.current.scrollHeight - flowRightRef.current.clientHeight;
                  flowRightRef.current.scrollTop = maxScroll * percent;
                }
              }}
            >
              <div 
                className="h-full bg-indigo-400/70 transition-all pointer-events-none"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    
      <div className="md:py-8 max-w-[1800px] mr-auto ml-auto pt-6 pr-6 pb-24 pl-6">
        {/* Compact Header */}
        <div className="mx-auto max-w-[1600px] mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 grid place-items-center rounded-md ring-1 bg-white/5 ring-white/10">
                <span className="text-xs font-semibold tracking-tight">BK</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl tracking-tight font-semibold text-white leading-tight">
                  {user?.name ? `${user.name}'s Story` : "Your Story"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sortedStories.length} {sortedStories.length === 1 ? 'memory' : 'memories'} • Pages {currentSpreadIndex * 2 + 1}-{currentSpreadIndex * 2 + 2} of {spreads.length * 2}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center gap-2 text-base text-slate-300 hover:text-white transition-colors font-medium"
            >
              ← Back to Home
            </button>
          </div>
    
        </div>
    
        {/* Desktop: Dual-page spread */}
        <div className="relative mx-auto hidden lg:flex items-center justify-center" style={{ height: "calc(100vh - 180px)" }}>
          {/* Book container with fixed aspect ratio: 11" x 8.5" (dual-page spread) */}
          <div 
            className="relative [perspective:2000px]" 
            style={{ 
              width: "min(95vw, calc((100vh - 180px) * 1.294))",
              aspectRatio: "11 / 8.5",
              maxWidth: "1600px"
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
              allStories={sortedStories}
              onNavigateToStory={handleNavigateToStory}
            />
    
            {/* Right page */}
            <BookPage 
              story={currentSpread.right} 
              pageNum={currentSpreadIndex * 2 + 2} 
              onScroll={handleScroll} 
              ref={flowRightRef}
              position="right"
              allStories={sortedStories}
              onNavigateToStory={handleNavigateToStory}
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
    
        {/* TOC Drawer - Above Bottom Nav */}
        {showToc && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[520px] max-w-[calc(100vw-3rem)]">
            <div className="rounded-lg border border-white/10 bg-white/95 backdrop-blur-md px-4 py-3 text-sm text-black shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium tracking-tight">Table of Contents</div>
                <button 
                  onClick={() => setShowToc(false)}
                  className="p-1 rounded-md hover:bg-black/10"
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
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-black/10 transition-colors"
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

      </div>

      {/* Bottom Navigation Controls - positioned just above where nav bar was */}
      <div className="fixed bottom-0 left-0 right-0 z-30 no-print pb-4">
        <div className="mx-auto max-w-[608px] px-6">
          <div className="flex items-center justify-center gap-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 shadow-2xl">
            <button
              onClick={goToPrevSpread}
              disabled={currentSpreadIndex === 0}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-200 text-xl font-medium"
              title="Previous page (or use Left Arrow key)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-white font-medium text-xl">
                Pages {currentSpreadIndex * 2 + 1}-{currentSpreadIndex * 2 + 2} of {spreads.length * 2}
              </span>
              <button
                onClick={() => setShowToc(!showToc)}
                className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
                title="Table of Contents"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 6h16"></path>
                  <path d="M4 12h16"></path>
                  <path d="M4 18h16"></path>
                </svg>
              </button>
            </div>

            <button
              onClick={goToNextSpread}
              disabled={currentSpreadIndex === spreads.length - 1}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-200 text-xl font-medium"
              title="Next page (or use Right Arrow key)"
            >
              <span className="hidden sm:inline">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>
        </div>
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
        <div className="mb-4 max-w-sm">
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

// Closed Book Cover Component
function ClosedBookCover({ 
  userName, 
  storyCount, 
  onOpen 
}: { 
  userName: string; 
  storyCount: number; 
  onOpen: () => void;
}) {
  return (
    <div className="relative mx-auto" style={{ 
      width: "min(95vw, calc((100vh - 180px) * 0.647))",
      aspectRatio: "5.5 / 8.5",
      maxWidth: "800px"
    }}>
      {/* Ambient shadow */}
      <div className="pointer-events-none absolute -inset-8 rounded-2xl bg-[radial-gradient(1000px_400px_at_50%_30%,rgba(139,111,71,0.15)_0%,rgba(139,111,71,0.08)_35%,transparent_70%)]"></div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"></div>

      {/* Book cover */}
      <button
        onClick={onOpen}
        className="relative w-full h-full rounded-[24px] cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg, #8B6F47 0%, #6B5537 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)"
        }}
        aria-label="Open book"
      >
        {/* Leather texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15] rounded-[24px] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 text-amber-50 tracking-tight"
            style={{ 
              fontFamily: "Crimson Text, serif",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            {userName}&apos;s Story
          </h1>
          
          <div className="w-32 h-0.5 bg-amber-200/50 mb-6"></div>
          
          <p className="text-xl md:text-2xl text-amber-100/90 font-medium">
            {storyCount} {storyCount === 1 ? 'memory' : 'memories'}
          </p>

          <div className="mt-12 px-6 py-3 rounded-full bg-amber-50/10 border border-amber-200/30">
            <p className="text-amber-100 text-sm md:text-base font-medium">
              Tap to open
            </p>
          </div>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-amber-200/30 rounded-tl-lg"></div>
        <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-amber-200/30 rounded-tr-lg"></div>
        <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-amber-200/30 rounded-bl-lg"></div>
        <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-amber-200/30 rounded-br-lg"></div>
      </button>
    </div>
  );
}

// Endpaper Pattern Component (Inside Cover)
function EndpaperPage({ pageNum, position }: { pageNum: number; position: "left" | "right" }) {
  return (
    <div className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
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

        {/* HeritageWhisper watermark logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center opacity-[0.08]">
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              className="text-gray-700"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <p className="mt-2 text-xs tracking-widest font-serif text-gray-700">HERITAGE WHISPER</p>
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
                  <div className="w-full aspect-[16/10] overflow-hidden rounded-md shadow ring-1 ring-black/5">
                    <img
                      src={story.photos[0].url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
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
