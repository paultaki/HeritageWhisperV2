"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Volume2, Pause, Loader2 } from "lucide-react";
import { BookPage } from "./components/BookPage";
import DarkBookProgressBar from "./components/DarkBookProgressBar";
import { BookPage as BookPageType } from "@/lib/bookPagination";
import { ScrollIndicator } from "@/components/ScrollIndicators";
import { CompactNav } from "./components/CompactNav";
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
  const [currentMobilePage, setCurrentMobilePage] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [hasNavigatedToStory, setHasNavigatedToStory] = useState(false);
  
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
      left?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | { type: 'decade'; decade: string; title: string; count: number }; 
      right?: Story | 'intro' | 'endpaper' | 'toc-left' | 'toc-right' | { type: 'decade'; decade: string; title: string; count: number };
      type: 'intro' | 'toc' | 'decade' | 'stories';
    }> = [];
    
    // First spread: endpaper left, intro right
    result.push({
      left: 'endpaper',
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
    decadeGroups.forEach(([decade, stories]) => {
      const decadeYear = decade.replace('s', '');
      const decadePage = {
        type: 'decade' as const,
        decade,
        title: `The ${decadeYear}s`,
        count: stories.length
      };
      
      // Check if we need to add decade marker on left or right
      const lastSpread = result[result.length - 1];
      const needsNewSpread = !lastSpread || (lastSpread.left && lastSpread.right);
      
      if (needsNewSpread) {
        // Create new spread with decade on left
        result.push({
          left: decadePage,
          right: stories[0],
          type: 'stories'
        });
        
        // Add remaining story spreads
        for (let i = 1; i < stories.length; i += 2) {
          result.push({
            left: stories[i],
            right: stories[i + 1],
            type: 'stories'
          });
        }
      } else {
        // Fill the empty right slot with decade marker
        lastSpread.right = decadePage;
        lastSpread.type = 'decade';
        
        // Add all story spreads for this decade
        for (let i = 0; i < stories.length; i += 2) {
          result.push({
            left: stories[i],
            right: stories[i + 1],
            type: 'stories'
          });
        }
      }
    });
    
    return result;
  }, [decadeGroups]);

  // Create book pages array for progress bar
  const bookPages: BookPageType[] = useMemo(() => {
    const pages: BookPageType[] = [];
    let pageNum = 1;
    
    spreads.forEach((spread) => {
      // Left page
      if (spread.left) {
        let pageType: 'intro' | 'table-of-contents' | 'decade-marker' | 'story-start' = 'intro';
        if (typeof spread.left === 'string') {
          if (spread.left === 'intro' || spread.left === 'endpaper') pageType = 'intro';
          else if (spread.left === 'toc-left' || spread.left === 'toc-right') pageType = 'table-of-contents';
        } else if ('type' in spread.left) {
          pageType = 'decade-marker';
        } else {
          pageType = 'story-start';
        }
        
        const leftPage: BookPageType = {
          pageNumber: pageNum++,
          type: pageType,
          isLeftPage: true,
          isRightPage: false,
          decade: typeof spread.left === 'object' && 'decade' in spread.left ? spread.left.decade : undefined,
          year: typeof spread.left === 'object' && 'storyYear' in spread.left ? spread.left.storyYear.toString() : undefined,
        };
        pages.push(leftPage);
      }
      
      // Right page
      if (spread.right) {
        let pageType: 'intro' | 'table-of-contents' | 'decade-marker' | 'story-start' = 'intro';
        if (typeof spread.right === 'string') {
          if (spread.right === 'intro' || spread.right === 'endpaper') pageType = 'intro';
          else if (spread.right === 'toc-left' || spread.right === 'toc-right') pageType = 'table-of-contents';
        } else if ('type' in spread.right) {
          pageType = 'decade-marker';
        } else {
          pageType = 'story-start';
        }
        
        const rightPage: BookPageType = {
          pageNumber: pageNum++,
          type: pageType,
          isLeftPage: false,
          isRightPage: true,
          decade: typeof spread.right === 'object' && 'decade' in spread.right ? spread.right.decade : undefined,
          year: typeof spread.right === 'object' && 'storyYear' in spread.right ? spread.right.storyYear.toString() : undefined,
        };
        pages.push(rightPage);
      }
    });
    
    return pages;
  }, [spreads]);

  // Create mobile pages array (intro + TOC + all stories)
  const mobilePages = useMemo(() => {
    const pages: Array<{ type: 'intro' | 'toc' | 'story'; story?: Story; index: number }> = [];
    
    // Add intro page
    pages.push({ type: 'intro', index: 0 });
    
    // Add TOC page
    pages.push({ type: 'toc', index: 1 });
    
    // Add all story pages
    sortedStories.forEach((story, idx) => {
      pages.push({ type: 'story', story, index: idx + 2 });
    });
    
    return pages;
  }, [sortedStories]);

  // Navigate to specific page from progress bar
  const handleNavigateToPage = useCallback((pageIndex: number) => {
    const spreadIndex = Math.floor(pageIndex / 2);
    setCurrentSpreadIndex(Math.min(Math.max(0, spreadIndex), spreads.length - 1));
  }, [spreads.length]);

  // Navigate spreads
  const goToPrevSpread = useCallback(() => {
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  }, [currentSpreadIndex]);

  const goToNextSpread = useCallback(() => {
    if (currentSpreadIndex < spreads.length - 1) {
      setCurrentSpreadIndex(currentSpreadIndex + 1);
    }
  }, [currentSpreadIndex, spreads.length]);

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

  // Reset scroll position and stop audio when spread changes
  useEffect(() => {
    if (flowLeftRef.current) {
      flowLeftRef.current.scrollTop = 0;
    }
    if (flowRightRef.current) {
      flowRightRef.current.scrollTop = 0;
    }
    
    // Stop all audio elements when navigating
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, [currentSpreadIndex]);

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
  }, [currentSpreadIndex, spreads.length, goToPrevSpread, goToNextSpread]);

  // Navigate to story from URL parameter (from timeline)
  useEffect(() => {
    if (hasNavigatedToStory || sortedStories.length === 0 || spreads.length === 0) return;
    
    // Check for storyId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('storyId');
    
    if (storyId) {
      // Find the story index
      const storyIndex = sortedStories.findIndex(s => s.id === storyId);
      
      if (storyIndex !== -1) {
        // Desktop: Find which spread contains this story
        let targetSpreadIndex = 0;
        
        for (let i = 0; i < spreads.length; i++) {
          const spread = spreads[i];
          
          // Check left page
          if (spread.left && typeof spread.left !== 'string' && !('type' in spread.left)) {
            if ((spread.left as Story).id === storyId) {
              targetSpreadIndex = i;
              break;
            }
          }
          
          // Check right page
          if (spread.right && typeof spread.right !== 'string' && !('type' in spread.right)) {
            if ((spread.right as Story).id === storyId) {
              targetSpreadIndex = i;
              break;
            }
          }
        }
        
        setCurrentSpreadIndex(targetSpreadIndex);
        
        // Mobile: Navigate to story page (intro + toc + stories)
        setCurrentMobilePage(storyIndex + 2);
        
        // Open the book automatically when navigating from timeline
        setIsBookOpen(true);
        
        setHasNavigatedToStory(true);
        
        // Clean up URL
        window.history.replaceState({}, '', '/book');
      }
    }
  }, [sortedStories, spreads, hasNavigatedToStory]);

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
    // For mobile: navigate to the story page directly
    // Mobile pages: 0=intro, 1=toc, 2+=stories
    setCurrentMobilePage(storyIndex + 2);
    
    // For desktop: find which spread contains this story
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
        <div className="fixed top-0 left-0 right-0 z-50 no-print -mt-[5px] md:-mt-[15px]">
          <div className="mx-auto max-w-[1800px] px-6">
            <div className="relative h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center">
                  <img 
                    src="/circle logo white.svg" 
                    alt="Heritage Whisper" 
                    className="h-9 w-9"
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl tracking-tight font-semibold text-white leading-tight">
                    {user?.name ? `${user.name}'s Story` : "Your Story"}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/timeline")}
                  className="hidden md:flex items-center gap-2 text-base text-slate-300 hover:text-white transition-colors font-medium mr-[70px]"
                >
                  ← Timeline
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Closed book cover - centered */}
        <div className="flex items-start md:items-center justify-center pt-[109px] md:pt-[64px]" style={{ height: "calc(100vh - 64px)" }}>
          <ClosedBookCover
            userName={user?.name || "Your"}
            storyCount={sortedStories.length}
            onOpen={() => setIsBookOpen(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-100 text-slate-200 bg-[#0b0d12] ${caveat.className}`}>
      {/* Dark Book Progress Bar - hidden on mobile */}
      <div className="hidden md:block">
        <DarkBookProgressBar
          pages={bookPages}
          currentPage={currentSpreadIndex * 2}
          totalPages={bookPages.length}
          onNavigateToPage={handleNavigateToPage}
          onTocClick={() => setShowToc(!showToc)}
        />
      </div>
    
      <div className="md:py-8 max-w-[1800px] mr-auto ml-auto pr-6 pb-24 pl-6 mt-0 md:mt-[51px]" style={{ paddingTop: '0px' }}>
        {/* Compact Header */}
        <div className="mx-auto max-w-[1600px] mb-6 mt-[10px] md:mt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center">
                <img 
                  src="/circle logo white.svg" 
                  alt="Heritage Whisper" 
                  className="h-9 w-9"
                />
              </div>
              <h1 className="text-xl md:text-2xl tracking-tight font-semibold text-white leading-tight">
                {user?.name ? `${user.name}'s Story` : "Your Story"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/timeline")}
                className="hidden md:flex items-center gap-2 text-base text-slate-300 hover:text-white transition-colors font-medium"
              >
                ← Timeline
              </button>
            </div>
          </div>
    
        </div>
    
        {/* Desktop: Dual-page spread */}
        <div className="relative mx-auto hidden lg:flex items-center justify-center" style={{ height: "calc(100vh - 180px)" }}>
          {/* Clickable Navigation Zones - Left margin for previous */}
          <button
            onClick={goToPrevSpread}
            disabled={currentSpreadIndex === 0}
            className="absolute left-0 top-0 bottom-0 z-40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-0"
            style={{ 
              width: "calc((100vw - min(95vw, calc((100vh - 180px) * 1.294))) / 2 + 11px)",
              background: "transparent"
            }}
            aria-label="Previous page"
            onMouseEnter={(e) => {
              if (currentSpreadIndex > 0) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.cursor = "pointer";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          />
          
          {/* Clickable Navigation Zones - Right margin for next */}
          <button
            onClick={goToNextSpread}
            disabled={currentSpreadIndex >= spreads.length - 1}
            className="absolute right-0 top-0 bottom-0 z-40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-0"
            style={{ 
              width: "calc((100vw - min(95vw, calc((100vh - 180px) * 1.294))) / 2 + 11px)",
              background: "transparent"
            }}
            aria-label="Next page"
            onMouseEnter={(e) => {
              if (currentSpreadIndex < spreads.length - 1) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.cursor = "pointer";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          />

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
    
            {/* Right page - RENDERED FIRST so it's on top in case of overlap */}
            <BookPage 
              story={currentSpread.right} 
              pageNum={currentSpreadIndex * 2 + 2} 
              onScroll={() => {}} 
              ref={flowRightRef}
              position="right"
              allStories={sortedStories}
              onNavigateToStory={handleNavigateToStory}
            />
            
            {/* Left page */}
            <BookPage 
              story={currentSpread.left} 
              pageNum={currentSpreadIndex * 2 + 1} 
              onScroll={() => {}} 
              ref={flowLeftRef}
              position="left"
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
    
            {/* Left margin click indicator - Previous page */}
            {currentSpreadIndex > 0 && (
              <button
                onClick={() => setCurrentSpreadIndex(currentSpreadIndex - 1)}
                className="group absolute top-0 bottom-0 w-24 flex items-center justify-start pl-4 opacity-30 hover:opacity-100 transition-opacity duration-300"
                style={{ zIndex: 9999, left: '-21px' }}
                aria-label="Previous page"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-xl border border-neutral-300 group-hover:bg-white group-hover:scale-110 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </div>
              </button>
            )}
    
            {/* Right margin click indicator - Next page */}
            {currentSpreadIndex < spreads.length - 1 && (
              <button
                onClick={() => setCurrentSpreadIndex(currentSpreadIndex + 1)}
                className="group absolute top-0 bottom-0 w-24 flex items-center justify-end pr-4 opacity-30 hover:opacity-100 transition-opacity duration-300"
                style={{ zIndex: 9999, right: '-21px' }}
                aria-label="Next page"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-xl border border-neutral-300 group-hover:bg-white group-hover:scale-110 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </div>
              </button>
            )}
    
            {/* Ground shadow */}
            <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-16 w-[80%] rounded-[100%] blur-2xl bg-black/60"></div>
          </div>
        </div>
    
        {/* Mobile & Tablet: Single page with horizontal swipe */}
        <MobileView 
          allPages={mobilePages}
          currentPage={currentMobilePage}
          onPageChange={setCurrentMobilePage}
          sortedStories={sortedStories}
        />
    
        {/* TOC Drawer - Above Bottom Nav */}
        {showToc && (
          <div className="fixed bottom-[100px] md:bottom-24 left-1/2 -translate-x-1/2 z-40 w-[580px] max-w-[calc(100vw-3rem)]">
            <div className="rounded-lg border border-white/10 bg-white/95 backdrop-blur-md px-6 py-4 text-black shadow-2xl">
              <div className="mb-4 flex items-center justify-center relative">
                <button 
                  onClick={() => {
                    // Navigate to TOC page
                    // Mobile: Navigate to page 1 (intro is 0, TOC is 1)
                    setCurrentMobilePage(1);
                    
                    // Desktop: Find the spread containing TOC
                    // TOC is typically on spread index 1 (after intro on spread 0)
                    const tocSpreadIndex = spreads.findIndex(spread => 
                      spread.left === 'toc-left' || spread.right === 'toc-right' ||
                      spread.left === 'toc-right' || spread.right === 'toc-left'
                    );
                    
                    if (tocSpreadIndex !== -1) {
                      setCurrentSpreadIndex(tocSpreadIndex);
                    }
                    
                    setShowToc(false);
                  }}
                  className="font-semibold tracking-tight text-2xl whitespace-nowrap hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Table of Contents
                </button>
                <button 
                  onClick={() => setShowToc(false)}
                  className="absolute right-0 p-1 rounded-md hover:bg-black/10 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <ul className="space-y-2.5">
                  {sortedStories.map((story, index) => (
                    <li key={story.id}>
                      <button
                        onClick={() => {
                          handleNavigateToStory(index);
                          setShowToc(false);
                        }}
                        className="w-full text-center px-3 py-2.5 rounded-md hover:bg-black/10 transition-colors text-lg font-medium"
                      >
                        {story.title} ({story.storyDate || story.storyYear})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Floating Zoom Controls - Bottom right corner (desktop only) */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-30 no-print">
        <div className="flex flex-col gap-2 rounded-lg border-2 border-white/30 overflow-hidden backdrop-blur-sm bg-white/5 p-1">
          <button
            onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors text-white font-bold text-xl rounded"
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <div className="w-10 text-center text-xs text-white font-medium py-1">
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors text-white font-bold text-xl rounded"
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <CompactNav />
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
          {story.storyDate || story.storyYear}
          {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
        </div>
      </div>

      <h2 className="text-2xl tracking-tight font-semibold mb-3 text-neutral-900">
        {story.title}
      </h2>

      {story.photos && story.photos.length > 0 && (() => {
        // Find the hero photo, or use the first photo as fallback
        const heroPhoto = story.photos.find(p => p.isHero) || story.photos[0];
        return (
          <div className="mb-4 max-w-sm">
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
function MobileView({ 
  allPages,
  currentPage,
  onPageChange,
  sortedStories
}: { 
  allPages: Array<{ type: 'intro' | 'toc' | 'story'; story?: Story; index: number }>;
  currentPage: number;
  onPageChange: (index: number) => void;
  sortedStories: Story[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Scroll to current page when it changes
  useEffect(() => {
    if (scrollerRef.current) {
      const pageWidth = scrollerRef.current.clientWidth;
      scrollerRef.current.scrollTo({
        left: currentPage * pageWidth,
        behavior: 'smooth'
      });
    }
  }, [currentPage]);

  // Detect page change from scroll (throttled for performance)
  const handleScroll = useCallback(() => {
    if (!scrollerRef.current) return;
    
    const pageWidth = scrollerRef.current.clientWidth;
    const scrollLeft = scrollerRef.current.scrollLeft;
    const newPage = Math.round(scrollLeft / pageWidth);
    
    if (newPage !== currentPage && newPage >= 0 && newPage < allPages.length) {
      onPageChange(newPage);
    }
  }, [currentPage, allPages.length, onPageChange]);

  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < allPages.length - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="lg:hidden w-full" style={{ marginTop: '-30px' }}>
      <div className="relative w-full" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Mobile prev/next controls */}
        <button 
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="absolute left-2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15 active:bg-white/20 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ top: 'calc(50% + 12px)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <button 
          onClick={handleNext}
          disabled={currentPage === allPages.length - 1}
          className="absolute right-2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15 active:bg-white/20 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ top: 'calc(50% + 12px)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>

        <div 
          ref={scrollerRef}
          onScroll={handleScroll}
          className="h-full w-full flex items-start md:items-center justify-center overflow-x-scroll hide-scrollbar -mt-[26px] md:mt-0"
          style={{ 
            scrollSnapType: 'x mandatory',
            scrollSnapStop: 'normal',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            overscrollBehaviorX: 'contain'
          }}
        >
          {allPages.map((page, index) => (
            <div 
              key={index} 
              className="shrink-0 flex items-center justify-center" 
              style={{ 
                minWidth: '100%', 
                width: '100%',
                height: '100%',
                padding: '0 1rem',
                scrollSnapAlign: 'center',
                scrollSnapStop: 'always'
              }}
            >
              <MobilePage page={page} pageNum={index + 1} allStories={sortedStories} />
            </div>
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

      {/* Book cover with spine */}
      <div className="relative w-full h-full">
        {/* Book spine (left edge) */}
        <div 
          className="absolute left-0 top-0 bottom-0 rounded-l-lg pointer-events-none"
          style={{
            width: '32px',
            background: "linear-gradient(90deg, #1a0f08 0%, #2d1f12 50%, #3a2818 100%)",
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.6), inset 2px 0 4px rgba(0,0,0,0.3)",
            borderRight: '1px solid rgba(0,0,0,0.4)',
          }}
        >
          {/* Spine ridges */}
          <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5 bg-black/20"></div>
          <div className="absolute inset-y-8 left-1/3 w-px bg-black/15"></div>
          <div className="absolute inset-y-8 right-1/3 w-px bg-black/15"></div>
        </div>

        {/* Main cover button */}
        <button
          onClick={onOpen}
          className="relative w-full h-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
          style={{
            borderRadius: '0 12px 12px 0',
            background: "linear-gradient(145deg, #4a3420 0%, #2d1f12 50%, #1a0f08 100%)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(139,111,71,0.15), inset 0 -1px 0 rgba(0,0,0,0.5), inset -3px 0 10px rgba(0,0,0,0.4)"
          }}
          aria-label="Open book"
        >
          {/* Leather grain texture */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leather'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='1' /%3E%3CfeColorMatrix type='saturate' values='0.1'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23leather)' opacity='0.6'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          ></div>

          {/* Subtle highlight along edges */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              background: "radial-gradient(ellipse at 20% 20%, rgba(139,111,71,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,111,71,0.15) 0%, transparent 50%)",
            }}
          ></div>

          {/* Vignette for depth */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '0 12px 12px 0',
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
            }}
          ></div>

          {/* Book crease shadow (where the book opens) */}
          <div 
            className="absolute top-0 bottom-0 left-0 pointer-events-none"
            style={{
              width: '24px',
              background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)",
            }}
          ></div>

          {/* Embossed border frame (like real book covers) */}
          <div 
            className="absolute pointer-events-none"
            style={{
              top: '48px',
              left: '48px',
              right: '48px',
              bottom: '48px',
              border: '2px solid rgba(0,0,0,0.3)',
              borderRadius: '8px',
              boxShadow: 'inset 0 1px 0 rgba(139,111,71,0.15), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          ></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 tracking-tight"
              style={{ 
                fontFamily: "Crimson Text, serif",
                color: "#d4af87",
                textShadow: "0 3px 6px rgba(0,0,0,0.9), 0 -1px 2px rgba(255,255,255,0.1)",
                fontWeight: 600,
              }}
            >
              {userName}&apos;s Story
            </h1>
            
            <div className="w-32 h-0.5 mb-6" style={{ background: "linear-gradient(90deg, transparent, #d4af87, transparent)" }}></div>
            
            <p className="text-xl md:text-2xl font-medium" style={{ color: "#c4a87a", textShadow: "0 2px 4px rgba(0,0,0,0.7)" }}>
              {storyCount} {storyCount === 1 ? 'memory' : 'memories'}
            </p>

            <div className="mt-12 px-5 py-2 rounded-full border" style={{ 
              backgroundColor: "rgba(212, 175, 135, 0.08)",
              borderColor: "rgba(212, 175, 135, 0.25)"
            }}>
              <p className="text-sm font-medium" style={{ color: "#d4af87" }}>
                Tap to open
              </p>
            </div>
          </div>

          {/* Decorative embossed corner accents inside the border */}
          <div className="absolute top-14 left-14 w-8 h-8 border-l border-t rounded-tl" style={{ borderColor: "rgba(212, 175, 135, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute top-14 right-14 w-8 h-8 border-r border-t rounded-tr" style={{ borderColor: "rgba(212, 175, 135, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute bottom-14 left-14 w-8 h-8 border-l border-b rounded-bl" style={{ borderColor: "rgba(212, 175, 135, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
          <div className="absolute bottom-14 right-14 w-8 h-8 border-r border-b rounded-br" style={{ borderColor: "rgba(212, 175, 135, 0.25)", filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))" }}></div>
        </button>
      </div>
    </div>
  );
}

// Mobile Audio Player Component
function MobileAudioPlayer({ story }: { story: Story }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Initialize audio element on mount - ONLY ONCE per story
  useEffect(() => {
    if (!story.audioUrl) return;
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
      console.error(`Mobile audio error for ${story.title}:`, err);
      if (audio.error) {
        console.error('Error code:', audio.error.code);
      }
      setIsLoading(false);
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
    // Only re-run when story.id changes, not when other story properties change.
    // This prevents recreating the audio element unnecessarily which would cause playback issues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);
  
  const toggleAudio = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!audioRef.current) return;
    
    try {
      // Stop other audio elements first
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
      console.error('Mobile audio playback error:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleAudio}
          className="relative flex-shrink-0 hover:scale-105 transition-transform"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          <svg className="w-9 h-9 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="rgba(139,107,122,0.15)"
              strokeWidth="2"
            />
            {isPlaying && (
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="rgba(139,107,122,0.5)"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600" />
            ) : isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-neutral-600 fill-neutral-600" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
            )}
          </div>
        </button>
        
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
          >
            <div 
              className="h-full bg-neutral-400 transition-all duration-100 pointer-events-none" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
        
        <span className="text-[11px] text-neutral-500 whitespace-nowrap tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

// Mobile Page Component  
function MobilePage({ 
  page, 
  pageNum,
  allStories
}: { 
  page: { type: 'intro' | 'toc' | 'story'; story?: Story; index: number };
  pageNum: number;
  allStories: Story[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  
  // Check if content is scrollable and track user scroll
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const isScrollable = scrollRef.current.scrollHeight > scrollRef.current.clientHeight + 5;
        setShowScrollIndicator(isScrollable);
      }
    };
    
    checkScroll();
    setTimeout(checkScroll, 500); // Recheck after content loads
    
    return () => {};
  }, [page]);
  
  const handleScrollClick = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 300, behavior: 'smooth' });
      setShowScrollIndicator(false);
    }
  };
  // Intro page
  if (page.type === 'intro') {
    return (
      <div className="mobile-page relative mx-auto [perspective:1600px]" style={{ 
        width: "min(95vw, calc((100vh - 160px) * 0.647))",
        aspectRatio: "5.5 / 8.5",
        maxWidth: "800px"
      }}>
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute rounded-[24px]" 
          style={{ 
            inset: "-16px", 
            background: "linear-gradient(180deg, #2e1f14 0%, #1f150d 100%)", 
            boxShadow: "0 18px 50px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)" 
          }}
        ></div>
        <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(2.2deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
          <div className="relative h-full w-full p-6 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-serif text-gray-800" style={{ fontFamily: "Crimson Text, serif" }}>
                Family Memories
              </h1>
              <div className="w-20 h-1 bg-indigo-500 mx-auto"></div>
              <p className="text-base text-gray-600 leading-relaxed italic px-4">
                A collection of cherished moments, stories, and lessons from a life well-lived.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // TOC page
  if (page.type === 'toc') {
    return (
      <div className="mobile-page relative mx-auto [perspective:1600px]" style={{ 
        width: "min(95vw, calc((100vh - 160px) * 0.647))",
        aspectRatio: "5.5 / 8.5",
        maxWidth: "800px"
      }}>
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute rounded-[24px]" 
          style={{ 
            inset: "-16px", 
            background: "linear-gradient(180deg, #2e1f14 0%, #1f150d 100%)", 
            boxShadow: "0 18px 50px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)" 
          }}
        ></div>
        <div className="relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(2.2deg)_translateZ(0.001px)] ring-black/15 bg-neutral-50">
          <div className="relative h-full w-full p-6">
            <div className="h-full w-full rounded-[14px] ring-1 ring-black/5 bg-white/60 overflow-hidden">
              <div className="h-full w-full rounded-[12px] text-neutral-900 outline-none p-5 overflow-y-auto">
                <h1 className="text-3xl font-serif text-center mb-6 text-gray-800">
                  Table of Contents
                </h1>
                <div className="space-y-3">
                  {allStories.map((storyItem) => (
                    <div
                      key={storyItem.id}
                      className="text-sm border-b border-gray-200 pb-2"
                    >
                      <div className="font-medium text-gray-700">{storyItem.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {storyItem.storyDate || storyItem.storyYear}
                        {storyItem.lifeAge !== undefined && ` • Age ${storyItem.lifeAge}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Story page
  const story = page.story;
  if (!story) return null;
  
  return (
    <div className="mobile-page relative mx-auto [perspective:1600px]" style={{ 
      width: "min(95vw, calc((100vh - 160px) * 0.647))",
      aspectRatio: "5.5 / 8.5",
      maxWidth: "800px"
    }}>
      {/* Outer book cover/border */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute rounded-[24px]" 
        style={{ 
          inset: "-16px", 
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
            <div 
              ref={scrollRef}
              className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-5 overflow-y-auto"
              onScroll={() => {
                if (scrollRef.current && scrollRef.current.scrollTop > 50) {
                  setShowScrollIndicator(false);
                }
              }}
            >
              {/* Photo first if available */}
              {story.photos && story.photos.length > 0 && (() => {
                // Find the hero photo, or use the first photo as fallback
                const heroPhoto = story.photos.find(p => p.isHero) || story.photos[0];
                return (
                  <div className="mb-3">
                    <div className="w-full aspect-[16/10] overflow-hidden rounded-md shadow ring-1 ring-black/5">
                      <img
                        src={heroPhoto.url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                );
              })()}
              
              {/* Title */}
              <h2 className="mb-2.5 text-[19px] tracking-tight font-semibold text-neutral-900">
                {story.title}
              </h2>
              
              {/* Age and year */}
              <div className="text-[13px] text-neutral-600 mb-3">
                {story.lifeAge !== undefined && `Age ${story.lifeAge} • `}
                {story.storyDate || story.storyYear}
              </div>

              {/* Audio Player - Mobile */}
              {story.audioUrl && <MobileAudioPlayer story={story} />}

              {/* Story text */}
              <div className="text-[14.5px] leading-6 text-neutral-800/95 space-y-2.5">
                {story.transcription?.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {/* Lesson learned */}
              {story.wisdomClipText && (
                <div 
                  className="mt-6 mb-3 p-5 clear-both relative"
                  style={{
                    background: 'linear-gradient(135deg, #fef9e7 0%, #faf3dd 100%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
                    transform: 'rotate(-0.5deg)',
                    borderRadius: '2px',
                    border: '1px solid rgba(139, 107, 122, 0.2)',
                  }}
                >
                  <p 
                    className="text-sm mb-2"
                    style={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '18px',
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
                      fontSize: '22px',
                      color: '#4a4a4a',
                      lineHeight: '1.8',
                    }}
                  >
                    {story.wisdomClipText}
                  </p>
                </div>
              )}
            </div>
            
            {/* Mobile scroll indicator */}
            {showScrollIndicator && (
              <ScrollIndicator 
                show={true}
                position="right"
                contentType="book"
                onScrollClick={handleScrollClick}
              />
            )}
          </div>
          <div className="absolute bottom-3 left-0 right-0 px-6 text-right text-[12px] text-neutral-500/80">
            {pageNum}
          </div>
        </div>
      </div>
    </div>
  );
}
