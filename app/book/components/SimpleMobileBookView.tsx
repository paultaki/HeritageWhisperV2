"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, Menu, ChevronLeft, ChevronRight, BookOpen, X, Play, Pause, ChevronDown } from "lucide-react";

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

interface SimpleMobileBookViewProps {
  stories: Story[];
  bookTitle: string;
  userInitials?: string;
  onTimelineClick?: () => void;
  onEditClick?: () => void;
}

export default function SimpleMobileBookView({
  stories,
  bookTitle,
  userInitials = "JH",
  onTimelineClick,
  onEditClick,
}: SimpleMobileBookViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const pagerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Group stories by decade
  const decadeGroups = React.useMemo(() => {
    const groups = new Map<string, Story[]>();
    stories.forEach((story) => {
      const decade = `${Math.floor(story.storyYear / 10) * 10}s`;
      if (!groups.has(decade)) {
        groups.set(decade, []);
      }
      groups.get(decade)!.push(story);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stories]);

  // Utility functions
  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmtTime = (secs: number) => {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${pad(s)}`;
  };

  // Handle scroll to specific page
  const scrollToPage = useCallback((index: number) => {
    if (!pagerRef.current) return;
    const pageWidth = pagerRef.current.clientWidth;
    isProgrammaticScroll.current = true;

    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({
        left: index * pageWidth,
        behavior: "smooth",
      });

      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    });
  }, []);

  // Detect page change from scroll
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current || !pagerRef.current) return;

    const pageWidth = pagerRef.current.clientWidth;
    const scrollLeft = pagerRef.current.scrollLeft;
    const newPage = Math.round(scrollLeft / pageWidth);

    if (newPage !== currentPageIndex && newPage >= 0 && newPage < stories.length) {
      setCurrentPageIndex(newPage);
    }
  }, [currentPageIndex, stories.length]);

  // Navigation functions
  const goToPrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      scrollToPage(currentPageIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentPageIndex < stories.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      scrollToPage(currentPageIndex + 1);
    }
  };

  // TOC functions
  const openTOC = () => setShowToc(true);
  const closeTOC = () => setShowToc(false);

  const goToStory = (storyId: string) => {
    const index = stories.findIndex((s) => s.id === storyId);
    if (index >= 0) {
      closeTOC();
      setTimeout(() => {
        setCurrentPageIndex(index);
        scrollToPage(index);
      }, 10);
    }
  };

  // Sync scroll position when page changes
  useEffect(() => {
    scrollToPage(currentPageIndex);
  }, [currentPageIndex, scrollToPage]);

  return (
    <div className="lg:hidden relative h-[100dvh] w-screen overflow-hidden select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900" />

      {/* Top bar gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-black/40 to-transparent" />

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] h-16">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-white/10 ring-1 ring-white/15 text-white/90 grid place-items-center text-sm font-medium">
            {userInitials}
          </div>
          <div className="min-w-0">
            <div className="text-white/95 text-lg sm:text-xl tracking-tight font-medium truncate">
              {bookTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditClick}
            className="pointer-events-auto rounded-full bg-white/6 text-white p-2 backdrop-blur-sm ring-1 ring-white/10 active:scale-[0.98] transition flex items-center justify-center"
            aria-label="Edit"
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={openTOC}
            className="pointer-events-auto rounded-full bg-white/6 text-white p-2 backdrop-blur-sm ring-1 ring-white/10 active:scale-[0.98] transition flex items-center justify-center"
            aria-label="Open contents"
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Horizontal Pager */}
      <div
        ref={pagerRef}
        onScroll={handleScroll}
        className="relative z-10 h-[100dvh] w-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
          scrollSnapType: "x mandatory",
        }}
      >
        {stories.map((story, index) => (
          <StoryPage key={story.id} story={story} formatDate={formatDate} fmtTime={fmtTime} />
        ))}
      </div>

      {/* Side Navigation Arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2">
        <button
          onClick={goToPrev}
          className={`pointer-events-auto h-11 w-11 grid place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md shadow-lg active:scale-95 transition ${
            currentPageIndex <= 0 ? "hidden" : ""
          }`}
          aria-label="Previous"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className={`pointer-events-auto h-11 w-11 grid place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md shadow-lg active:scale-95 transition ${
            currentPageIndex >= stories.length - 1 ? "hidden" : ""
          }`}
          aria-label="Next"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* TOC Top Sheet */}
      {showToc && (
        <TOCSheet
          decadeGroups={decadeGroups}
          onClose={closeTOC}
          onStoryClick={goToStory}
          formatDate={formatDate}
        />
      )}


    </div>
  );
}

// Story Page Component
function StoryPage({
  story,
  formatDate,
  fmtTime,
}: {
  story: Story;
  formatDate: (iso?: string) => string;
  fmtTime: (secs: number) => string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [showFade, setShowFade] = useState(false);

  // Get the hero photo or first photo
  const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
  const photoUrl = heroPhoto?.url || story.photoUrl || "https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80";

  // Check if content is scrollable
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const hasOverflow = scrollRef.current.scrollHeight - scrollRef.current.clientHeight > 12;
        const atTop = scrollRef.current.scrollTop < 8;
        setShowContinueHint(hasOverflow && atTop);
        setShowFade(hasOverflow);
      }
    };

    checkScroll();
    const timer = setTimeout(checkScroll, 500);

    const handleScroll = () => {
      if (scrollRef.current) {
        setShowContinueHint(scrollRef.current.scrollTop < 8);
      }
    };

    scrollRef.current?.addEventListener("scroll", handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkScroll);
    if (scrollRef.current) resizeObserver.observe(scrollRef.current);

    return () => {
      clearTimeout(timer);
      scrollRef.current?.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <section 
      className="relative min-w-full h-[100dvh] snap-start flex" 
      data-story-id={story.id}
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      <div className="relative mx-auto my-0 h-[100dvh] w-full bg-stone-50 text-stone-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/5 rounded-none">
        {/* Subtle inner edge */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_0_rgba(0,0,0,0.03),inset_0_-1px_0_rgba(0,0,0,0.03)]" />

        {/* Vertical scroller */}
        <div ref={scrollRef} className="relative h-full overflow-y-auto overscroll-contain">
          {/* Header image */}
          <div className="px-3 pt-4">
            <div
              className="overflow-hidden rounded-3xl ring-1 ring-stone-200 shadow-sm bg-white"
              style={{ aspectRatio: "16/10" }}
            >
              <img src={photoUrl} alt={story.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-5 pb-40">
            <h1 className="text-[26px] sm:text-3xl tracking-tight font-semibold text-stone-900">
              {story.title}
            </h1>
            <div className="mt-1 text-[15px] text-stone-500">
              {story.lifeAge && <span>Age {story.lifeAge}</span>}
              {story.lifeAge && story.storyDate && <span className="mx-1">•</span>}
              {story.storyDate && <time dateTime={story.storyDate}>{formatDate(story.storyDate)}</time>}
            </div>

            {/* Audio Player */}
            {story.audioUrl && (
              <AudioPlayer audioUrl={story.audioUrl} fmtTime={fmtTime} />
            )}

            {/* Story Content */}
            <div className="mt-5 space-y-4 text-[17px] leading-8 text-stone-800">
              {story.formattedContent?.formattedText ? (
                <div dangerouslySetInnerHTML={{ __html: story.formattedContent.formattedText }} />
              ) : story.transcription ? (
                story.transcription.split("\n").map((para, idx) => para.trim() && <p key={idx}>{para}</p>)
              ) : null}
            </div>
          </div>

          {/* Fade and Continue hint */}
          {showFade && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-stone-50 to-transparent" />
          )}
          {showContinueHint && (
            <div className="absolute bottom-[88px] left-0 right-0 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white text-stone-900 px-4 py-2 shadow ring-1 ring-stone-200">
                <span className="text-sm font-medium">Continue reading</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Audio Player Component
function AudioPlayer({ audioUrl, fmtTime }: { audioUrl: string; fmtTime: (secs: number) => string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));

    if (isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-5">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="relative grid place-items-center h-12 w-12 flex-shrink-0 rounded-full bg-stone-900 text-white ring-1 ring-stone-800 shadow-md active:scale-95 transition"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 relative left-[0.5px]" />
          )}
        </button>
        <div className="flex-1">
          <div
            className="relative h-3 rounded-full bg-stone-200 cursor-pointer"
            onMouseDown={(e) => {
              setIsDragging(true);
              handleScrub(e);
            }}
            onMouseMove={(e) => isDragging && handleScrub(e)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleScrub(e);
            }}
            onTouchMove={(e) => isDragging && handleScrub(e)}
            onTouchEnd={() => setIsDragging(false)}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-stone-900"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white ring-1 ring-stone-300 shadow -translate-x-1/2"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-end text-xs text-stone-500">
            <span>
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// TOC Sheet Component
function TOCSheet({
  decadeGroups,
  onClose,
  onStoryClick,
  formatDate,
}: {
  decadeGroups: [string, Story[]][];
  onClose: () => void;
  onStoryClick: (storyId: string) => void;
  formatDate: (iso?: string) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsOpen(true));
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`absolute inset-x-0 top-0 transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-b-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-neutral-700" />
              <h2 className="text-lg tracking-tight font-semibold">Table of Contents</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-neutral-100 active:scale-95 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-700" />
            </button>
          </div>
          <div className="px-4 pb-4 space-y-6 max-h-[70dvh] overflow-y-auto overscroll-contain">
            {decadeGroups.map(([decade, stories]) => (
              <section key={decade} className="space-y-3">
                <h3 className="text-sm tracking-tight font-semibold text-neutral-800">{decade}</h3>
                <div className="divide-y divide-neutral-100 rounded-xl ring-1 ring-neutral-100 overflow-hidden bg-white">
                  {stories.map((story) => {
                    const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
                    const photoUrl =
                      heroPhoto?.url ||
                      story.photoUrl ||
                      "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=1080&q=80";

                    return (
                      <button
                        key={story.id}
                        onClick={() => onStoryClick(story.id)}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 active:bg-neutral-100 transition flex items-start gap-3"
                      >
                        <img
                          src={photoUrl}
                          className="h-10 w-10 rounded-md object-cover ring-1 ring-neutral-200"
                          alt=""
                        />
                        <div className="min-w-0">
                          <div className="text-[15px] tracking-tight font-medium text-neutral-900 truncate">
                            {story.title}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {story.lifeAge && `Age ${story.lifeAge}`}
                            {story.lifeAge && story.storyDate && " • "}
                            {story.storyDate && formatDate(story.storyDate)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
