"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, Menu, ChevronLeft, ChevronRight, BookOpen, X, Play, Pause, ChevronDown } from "lucide-react";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";
import { PhotoLightbox, type LightboxPhoto } from "@/components/PhotoLightbox";

// Story interface
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
    width?: number;
    height?: number;
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

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current || !pagerRef.current) return;

    const pageWidth = pagerRef.current.clientWidth;
    const scrollLeft = pagerRef.current.scrollLeft;
    const newPage = Math.round(scrollLeft / pageWidth);

    if (newPage !== currentPageIndex && newPage >= 0 && newPage < stories.length) {
      setCurrentPageIndex(newPage);
    }
  }, [currentPageIndex, stories.length]);

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

  useEffect(() => {
    scrollToPage(currentPageIndex);
  }, [currentPageIndex, scrollToPage]);

  return (
    <div className="lg:hidden relative h-[100dvh] w-screen overflow-hidden select-none">
      {/* Premium dark background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #1a1a1a 0%, #141414 50%, #1a1a1a 100%)" }} />

      {/* Top bar gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-black/50 to-transparent" />

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] h-16">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="h-8 w-8 rounded-full ring-1 grid place-items-center text-sm font-medium"
            style={{ 
              background: "rgba(203, 164, 106, 0.15)",
              ringColor: "rgba(203, 164, 106, 0.3)",
              color: "#CBA46A"
            }}
          >
            {userInitials}
          </div>
          <div className="min-w-0">
            <div 
              className="text-lg sm:text-xl tracking-tight font-medium truncate font-serif"
              style={{ color: "#fdfbf7" }}
            >
              {bookTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditClick}
            className="pointer-events-auto rounded-full p-2 backdrop-blur-sm ring-1 active:scale-[0.98] transition flex items-center justify-center"
            style={{
              background: "rgba(203, 164, 106, 0.1)",
              ringColor: "rgba(203, 164, 106, 0.25)",
              color: "#CBA46A"
            }}
            aria-label="Edit"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={openTOC}
            className="pointer-events-auto rounded-full p-2 backdrop-blur-sm ring-1 active:scale-[0.98] transition flex items-center justify-center"
            style={{
              background: "rgba(203, 164, 106, 0.1)",
              ringColor: "rgba(203, 164, 106, 0.25)",
              color: "#CBA46A"
            }}
            aria-label="Open contents"
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
          className={`pointer-events-auto h-11 w-11 grid place-items-center rounded-full ring-1 backdrop-blur-md shadow-lg active:scale-95 transition ${
            currentPageIndex <= 0 ? "hidden" : ""
          }`}
          style={{
            background: "rgba(253, 251, 247, 0.2)",
            color: "#fdfbf7",
            ringColor: "rgba(253, 251, 247, 0.3)"
          }}
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className={`pointer-events-auto h-11 w-11 grid place-items-center rounded-full ring-1 backdrop-blur-md shadow-lg active:scale-95 transition ${
            currentPageIndex >= stories.length - 1 ? "hidden" : ""
          }`}
          style={{
            background: "rgba(253, 251, 247, 0.2)",
            color: "#fdfbf7",
            ringColor: "rgba(253, 251, 247, 0.3)"
          }}
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* TOC Sheet */}
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

  const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
  const photoUrl = heroPhoto?.url || story.photoUrl || "https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80";

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photos = story.photos || [];

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
      <div 
        className="relative mx-auto my-0 h-[100dvh] w-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 rounded-none"
        style={{ 
          background: "#fdfbf7",
          color: "#2d2a26",
          ringColor: "rgba(139, 107, 74, 0.1)"
        }}
      >
        {/* Subtle inner edge */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_0_rgba(0,0,0,0.02),inset_0_-1px_0_rgba(0,0,0,0.02)]" />

        {/* Vertical scroller */}
        <div ref={scrollRef} className="relative h-full overflow-y-auto overscroll-contain book-v3-scroll">
          {/* Header image */}
          <div className="px-3 pt-4">
            <div
              className="overflow-hidden rounded-xl ring-1 shadow-sm relative cursor-pointer group book-v3-photo book-v3-photo-rotate-1"
              style={{ 
                aspectRatio: "4/3",
                background: "white",
                ringColor: "rgba(139, 107, 74, 0.15)"
              }}
              onClick={() => setLightboxOpen(true)}
              role="button"
              tabIndex={0}
              aria-label={`View ${story.title} photo in full screen`}
            >
              <StoryPhotoWithBlurExtend
                src={photoUrl}
                alt={story.title}
                width={heroPhoto?.width}
                height={heroPhoto?.height}
                transform={heroPhoto?.transform || story.photoTransform}
                aspectRatio={4 / 3}
                className="w-full h-full transition-all duration-200 group-hover:brightness-105 group-hover:scale-[1.02]"
              />
            </div>

            <PhotoLightbox
              photos={photos.length > 0 ? photos.map(p => ({
                url: p.url || '',
                caption: p.caption,
                transform: p.transform,
                width: p.width,
                height: p.height,
              })) as LightboxPhoto[] : [{
                url: photoUrl,
                transform: heroPhoto?.transform || story.photoTransform,
                width: heroPhoto?.width,
                height: heroPhoto?.height,
              }]}
              initialIndex={0}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              alt={story.title}
            />
          </div>

          {/* Content */}
          <div className="px-5 pt-5 pb-40">
            <h1 
              className="text-[26px] sm:text-3xl tracking-tight font-semibold font-serif"
              style={{ color: "#3d2e1f" }}
            >
              {story.title}
            </h1>
            <div className="mt-1 text-[15px] book-v3-date">
              {story.lifeAge && <span>Age {story.lifeAge}</span>}
              {story.lifeAge && story.storyDate && <span className="mx-1">·</span>}
              {story.storyDate && <time dateTime={story.storyDate}>{formatDate(story.storyDate)}</time>}
            </div>

            {/* Audio Player */}
            {story.audioUrl && (
              <AudioPlayer audioUrl={story.audioUrl} fmtTime={fmtTime} />
            )}

            {/* Story Content */}
            <div className="mt-5 space-y-4 text-[19px] leading-8 font-serif" style={{ color: "#2d2a26" }}>
              {story.formattedContent?.formattedText ? (
                <div dangerouslySetInnerHTML={{ __html: story.formattedContent.formattedText }} />
              ) : story.transcription ? (
                story.transcription.split("\n").map((para, idx) => para.trim() && <p key={idx}>{para}</p>)
              ) : null}
            </div>

            {/* Wisdom/Lesson */}
            {story.wisdomClipText && (
              <div className="book-v3-wisdom mt-6">
                <p className="book-v3-wisdom-text">
                  {story.wisdomClipText}
                </p>
              </div>
            )}
          </div>

          {/* Fade and Continue hint */}
          {showFade && (
            <div 
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
              style={{ background: "linear-gradient(to top, #fdfbf7 0%, transparent 100%)" }}
            />
          )}
          {showContinueHint && (
            <div className="absolute bottom-[88px] left-0 right-0 flex justify-center">
              <div 
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 shadow ring-1"
                style={{
                  background: "white",
                  color: "#3d2e1f",
                  ringColor: "rgba(139, 107, 74, 0.2)"
                }}
              >
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

// Audio Player Component - Minimalist gold theme
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
    <div className="mt-5 book-v3-audio">
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
          className="book-v3-audio-button"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 relative left-[0.5px]" />
          )}
        </button>
        <div className="flex-1">
          <div
            className="book-v3-audio-track"
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
              className="book-v3-audio-progress"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-end book-v3-audio-time">
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
        <div 
          className="rounded-b-2xl shadow-2xl ring-1 pt-[env(safe-area-inset-top)]"
          style={{
            background: "#fdfbf7",
            color: "#2d2a26",
            ringColor: "rgba(139, 107, 74, 0.1)"
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: "#8B6B4A" }} />
              <h2 className="text-lg tracking-tight font-semibold font-serif">Table of Contents</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 active:scale-95 transition"
              style={{ background: "rgba(139, 107, 74, 0.1)" }}
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: "#8B6B4A" }} />
            </button>
          </div>
          <div className="px-4 pb-4 space-y-6 max-h-[70dvh] overflow-y-auto overscroll-contain book-v3-scroll">
            {decadeGroups.map(([decade, stories]) => (
              <section key={decade} className="space-y-3">
                <h3 className="text-sm tracking-tight font-semibold" style={{ color: "#3d2e1f" }}>{decade}</h3>
                <div 
                  className="divide-y rounded-xl ring-1 overflow-hidden"
                  style={{ 
                    background: "white",
                    divideColor: "rgba(139, 107, 74, 0.1)",
                    ringColor: "rgba(139, 107, 74, 0.1)"
                  }}
                >
                  {stories.map((story) => {
                    const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
                    const photoUrl = heroPhoto?.url || story.photoUrl;

                    return (
                      <button
                        key={story.id}
                        onClick={() => onStoryClick(story.id)}
                        className="w-full text-left px-4 py-3 transition flex items-start gap-3"
                        style={{ background: "transparent" }}
                      >
                        {photoUrl && (
                          <img
                            src={photoUrl}
                            className="h-10 w-10 rounded-md object-cover ring-1"
                            style={{ ringColor: "rgba(139, 107, 74, 0.15)" }}
                            alt=""
                          />
                        )}
                        <div className="min-w-0">
                          <div 
                            className="text-[15px] tracking-tight font-medium truncate font-serif"
                            style={{ color: "#3d2e1f" }}
                          >
                            {story.title}
                          </div>
                          <div className="text-xs book-v3-date">
                            {story.lifeAge && `Age ${story.lifeAge}`}
                            {story.lifeAge && story.storyDate && " · "}
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

