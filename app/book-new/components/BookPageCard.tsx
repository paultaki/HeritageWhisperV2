"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { BookPageCardProps } from "./types";
import BookAudioPlayer from "./BookAudioPlayer";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";

/**
 * Format a date string or ISO date to readable format
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function BookPageCard({ story, isActive, caveatFont }: BookPageCardProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [showFade, setShowFade] = useState(false);

  // Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Fixed padding for top bar (56px)
  // Note: Dynamic viewport detection not needed since book page has overflow:hidden on body
  const fixedPadding = 56;

  // Get all photos
  const photos = story.photos || (story.photoUrl ? [{ url: story.photoUrl, transform: story.photoTransform, width: undefined, height: undefined }] : []);
  const hasMultiplePhotos = photos.length > 1;

  // Debug logging to identify photo carousel issues
  console.log('[BookPageCard] Story:', story.title, 'Photos count:', photos.length, 'hasMultiple:', hasMultiplePhotos, 'photos:', photos);
  const currentPhoto = photos[currentPhotoIndex];
  const photoUrl = currentPhoto?.url;
  const photoTransform = currentPhoto?.transform;
  const photoWidth = 'width' in currentPhoto ? currentPhoto.width : undefined;
  const photoHeight = 'height' in currentPhoto ? currentPhoto.height : undefined;

  // Photo carousel handlers
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for photo swipe (only on photo area)
  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handlePhotoTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handlePhotoTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left - next photo
      handleNextPhoto({} as React.MouseEvent);
    }
    if (touchStart - touchEnd < -75) {
      // Swiped right - prev photo
      handlePrevPhoto({} as React.MouseEvent);
    }
  };

  // Reset photo index when story changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [story.id]);

  // Check if content overflows and update hint visibility
  const checkOverflow = useCallback(() => {
    if (!scrollerRef.current) return;

    const hasOverflow =
      scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight > 12;
    const isAtTop = scrollerRef.current.scrollTop < 8;

    setShowContinueHint(hasOverflow && isAtTop);
    setShowFade(hasOverflow);
  }, []);

  // Handle scroll to hide continue hint and gradient
  const handleScroll = useCallback(() => {
    if (!scrollerRef.current) return;
    const isAtTop = scrollerRef.current.scrollTop < 8;

    if (!isAtTop) {
      setShowContinueHint(false);
      setShowFade(false);
    } else {
      checkOverflow();
    }
  }, [checkOverflow]);

  // Reset scroll BEFORE paint when story changes (fixes Chrome scroll carryover)
  useLayoutEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [story.id]);

  // Also reset when this card becomes active (defensive)
  useEffect(() => {
    if (isActive && scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [isActive]);

  // Set up resize observer and scroll listener
  useEffect(() => {
    if (!scrollerRef.current) return;

    const scroller = scrollerRef.current;
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(scroller);

    scroller.addEventListener("scroll", handleScroll, { passive: true });

    // Initial check
    setTimeout(checkOverflow, 100);

    return () => {
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", handleScroll);
    };
  }, [checkOverflow, handleScroll]);

  // Split transcription into paragraphs
  const paragraphs = story.transcription
    .split("\n")
    .filter((p) => p.trim().length > 0);

  return (
    <section
      className="relative flex h-[100dvh] w-screen flex-shrink-0 snap-start"
      data-story-id={story.id}
      data-nav-ink="dark"
    >
      <div className="relative mx-auto my-0 h-[100dvh] w-full rounded-none bg-stone-50 text-stone-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/5">
        {/* Subtle inner edge shadow */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(0,0,0,0.03),inset_0_-1px_0_rgba(0,0,0,0.03)]"></div>

        {/* Vertical scroller */}
        <div
          ref={scrollerRef}
          className="relative h-full overflow-y-auto overscroll-contain"
          style={{
            paddingTop: `${fixedPadding}px`
          }}
        >
          {/* Header image with carousel */}
          <div className="px-3 pt-0">
            <div
              className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200"
              style={{ aspectRatio: "16/10" }}
              onTouchStart={hasMultiplePhotos ? handlePhotoTouchStart : undefined}
              onTouchMove={hasMultiplePhotos ? handlePhotoTouchMove : undefined}
              onTouchEnd={hasMultiplePhotos ? handlePhotoTouchEnd : undefined}
            >
              {photoUrl ? (
                <StoryPhotoWithBlurExtend
                  src={photoUrl}
                  alt={story.title}
                  transform={photoTransform}
                  width={photoWidth}
                  height={photoHeight}
                  aspectRatio={16 / 10}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                  <span className="text-4xl text-stone-400">📖</span>
                </div>
              )}

              {/* Photo count indicator */}
              {hasMultiplePhotos && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              )}

              {/* Navigation arrows (44x44px for senior-friendly touch targets) */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 hover:bg-black/80 active:bg-black/90 rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Previous photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 hover:bg-black/80 active:bg-black/90 rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Next photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {hasMultiplePhotos && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(index);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        index === currentPhotoIndex
                          ? 'bg-white w-4'
                          : 'bg-white/60 w-2'
                      }`}
                      aria-label={`Go to photo ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-5 pb-40">
            {/* Title and metadata */}
            <h1 className="text-[26px] font-serif font-semibold tracking-tight text-stone-900 sm:text-3xl" style={{ fontFamily: "Crimson Text, serif" }}>
              {story.title}
            </h1>
            <div className="mt-1 text-[15px] text-stone-500">
              {story.lifeAge && <span>Age {story.lifeAge}</span>}
              {story.lifeAge && story.storyDate && <span className="mx-1">•</span>}
              {story.storyDate && (
                <time dateTime={typeof story.storyDate === 'string' ? story.storyDate : story.storyDate.toISOString()}>
                  {formatDate(typeof story.storyDate === 'string' ? story.storyDate : story.storyDate.toISOString())}
                </time>
              )}
              {!story.lifeAge && !story.storyDate && (
                <span>{story.storyYear}</span>
              )}
            </div>

            {/* Audio player */}
            {story.audioUrl && (
              <div className="mt-[11px]">
                <BookAudioPlayer audioUrl={story.audioUrl} />
              </div>
            )}

            {/* Transcription */}
            <div className="mt-5 space-y-4 text-[18px] leading-8 text-stone-800 font-serif" style={{ fontFamily: "Crimson Text, serif" }}>
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Lesson learned / Wisdom clip */}
            {story.wisdomClipText && (
              <div className="relative my-8 -mx-2 p-6 bg-white shadow-sm rotate-[0.5deg]">
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
                <p className={`relative text-slate-700 text-lg leading-relaxed ${caveatFont || ''}`}>
                  {story.wisdomClipText}
                </p>
              </div>
            )}
          </div>

          {/* Fade gradient */}
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-stone-50 to-transparent transition-opacity duration-300 ${showFade ? "opacity-100" : "opacity-0"
              }`}
          ></div>

          {/* Continue reading hint */}
          <div
            className={`absolute bottom-[63px] left-0 right-0 flex justify-center transition-opacity duration-300 ${showContinueHint ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-stone-900 shadow-lg backdrop-blur-md ring-1 ring-white/40">
              <span className="text-sm font-medium">Continue reading</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
