"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { BookPageCardProps } from "./types";
import BookAudioPlayer from "./BookAudioPlayer";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";
import { PhotoLightbox, type LightboxPhoto } from "@/components/PhotoLightbox";

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

export default function BookPageCard({ story, isActive, caveatFont, pageNumber, isPriority = false }: BookPageCardProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [showFade, setShowFade] = useState(false);

  // Fixed padding for top bar (56px)
  // Note: Dynamic viewport detection not needed since book page has overflow:hidden on body
  const fixedPadding = 56;

  // Get all photos (must be before state initialization)
  // Note: Legacy photoUrl fallback needs all fields for type compatibility
  const photos = story.photos || (story.photoUrl ? [{
    url: story.photoUrl,
    displayUrl: undefined,
    masterUrl: undefined,
    transform: story.photoTransform,
    width: undefined,
    height: undefined,
    isHero: false
  }] : []);

  // Photo carousel state - initialize to hero image index to avoid flash
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(() => {
    const heroIdx = photos.findIndex(p => p.isHero);
    return heroIdx >= 0 ? heroIdx : 0;
  });
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const hasMultiplePhotos = photos.length > 1;

  // Photo lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const currentPhoto = photos[currentPhotoIndex];
  // Use displayUrl (550px) as base, masterUrl (2400px) for high-res foreground
  const photoUrl = currentPhoto?.displayUrl || currentPhoto?.url;
  const masterUrl = currentPhoto?.masterUrl;
  const photoTransform = currentPhoto?.transform;
  const photoWidth = currentPhoto?.width;
  const photoHeight = currentPhoto?.height;

  // Photo carousel handlers
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for photo swipe (only on photo area)
  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0); // Reset touch end to distinguish tap from swipe
  };

  const handlePhotoTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Set initial photo to hero image when story changes
  useEffect(() => {
    const heroIndex = photos.findIndex(p => p.isHero);
    setCurrentPhotoIndex(heroIndex >= 0 ? heroIndex : 0);
  }, [story.id]);

  const handlePhotoTouchEnd = (e: React.TouchEvent) => {
    // Only process swipe if touchEnd was set (i.e., there was actual movement)
    // touchEnd === 0 means it was just a tap
    if (touchEnd === 0) {
      return; // Let onClick handle taps
    }

    const distance = touchStart - touchEnd;
    if (distance > 75) {
      // Swiped left - next photo
      e.preventDefault(); // Prevent onClick from firing
      handleNextPhoto();
    } else if (distance < -75) {
      // Swiped right - prev photo
      e.preventDefault(); // Prevent onClick from firing
      handlePrevPhoto();
    }

    // Reset for next interaction
    setTouchStart(0);
    setTouchEnd(0);
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

  // Determine if this is a left or right page (like in a real book)
  // Odd pages = right side of spread (rounded on right)
  // Even pages = left side of spread (rounded on left)
  const isRightPage = !pageNumber || pageNumber % 2 === 1;
  const borderRadius = isRightPage ? '2px 12px 12px 2px' : '12px 2px 2px 12px';
  const insetShadow = isRightPage
    ? 'inset -4px 0 8px -4px rgba(0,0,0,0.08), inset 4px 0 12px -4px rgba(0,0,0,0.12)'
    : 'inset 4px 0 8px -4px rgba(0,0,0,0.08), inset -4px 0 12px -4px rgba(0,0,0,0.12)';

  // Deterministic photo rotation based on story ID
  const getPhotoRotation = (id: string) => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rotations = [-0.5, 0, 0.5];
    return rotations[hash % rotations.length];
  };
  const photoRotation = getPhotoRotation(story.id);

  return (
    <section
      className="relative flex h-[100dvh] w-screen flex-shrink-0 snap-start"
      data-story-id={story.id}
      data-nav-ink="dark"
    >
      {/* Premium book page card - cream paper with bound-page styling */}
      <div
        className="relative mx-auto my-0 h-[100dvh] w-full text-stone-900 ring-1 ring-black/5 overflow-hidden"
        style={{
          backgroundColor: '#F5F1E8', // Warm cream paper (matches desktop sepia theme)
          borderRadius, // Asymmetric: alternates based on page position
          boxShadow: `${insetShadow}, 0 10px 40px -10px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Subtle paper texture overlay - barely perceptible grain */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.035,
          }}
        />
        {/* Subtle inner edge shadow for page depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius,
            boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.02), inset 0 -1px 0 rgba(0,0,0,0.02)',
          }}
        />

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
              className="relative overflow-hidden rounded-3xl bg-white cursor-pointer group"
              style={{
                aspectRatio: "4/3",
                transform: `rotate(${photoRotation}deg)`,
                boxShadow: '0 8px 20px -6px rgba(0,0,0,0.2)',
              }}
              onTouchStart={hasMultiplePhotos ? handlePhotoTouchStart : undefined}
              onTouchMove={hasMultiplePhotos ? handlePhotoTouchMove : undefined}
              onTouchEnd={hasMultiplePhotos ? handlePhotoTouchEnd : undefined}
              onClick={() => {
                if (photoUrl) {
                  setLightboxIndex(currentPhotoIndex);
                  setLightboxOpen(true);
                }
              }}
              role="button"
              tabIndex={photoUrl ? 0 : undefined}
              aria-label={photoUrl ? `View ${story.title} photo in full screen` : undefined}
              onKeyDown={(e) => {
                if (photoUrl && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setLightboxIndex(currentPhotoIndex);
                  setLightboxOpen(true);
                }
              }}
            >
              {photoUrl ? (
                <StoryPhotoWithBlurExtend
                  src={photoUrl}
                  masterUrl={masterUrl}
                  alt={story.title}
                  transform={photoTransform}
                  width={photoWidth}
                  height={photoHeight}
                  aspectRatio={4 / 3}
                  quality={90}
                  priority={isPriority}
                  useRawImg={true}
                  sizes="100vw"
                  className="h-full w-full transition-all duration-200 group-hover:brightness-105 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                  <span className="text-4xl text-stone-400">📖</span>
                </div>
              )}

              {/* Photo count indicator - z-20 to appear above image (which has z-10) */}
              {hasMultiplePhotos && (
                <div className="absolute top-2 right-2 z-20 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              )}

              {/* Navigation arrows (44x44px for senior-friendly touch targets) - z-20 to appear above image */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPhoto(e);
                    }}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 active:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Previous photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPhoto(e);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 active:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Next photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Photo Lightbox */}
            {photos.length > 0 && (
              <PhotoLightbox
                photos={photos.map(p => ({
                  url: p.masterUrl || p.url || '', // Use masterUrl for full-screen lightbox
                  displayUrl: p.displayUrl,
                  masterUrl: p.masterUrl,
                  caption: undefined,
                  transform: p.transform,
                  width: p.width,
                  height: p.height,
                })) as LightboxPhoto[]}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                alt={story.title}
              />
            )}
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
              <div className="relative my-8 -mx-2 p-6 rounded-lg rotate-[0.5deg]" style={{ backgroundColor: 'rgba(139, 115, 85, 0.08)' }}>
                <div
                  className="absolute inset-0 opacity-10 rounded-lg"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 27px,
                      rgba(139, 115, 85, 0.3) 27px,
                      rgba(139, 115, 85, 0.3) 28px
                    )`
                  }}
                />
                <p className={`relative text-[#2D2926] text-lg leading-relaxed ${caveatFont || ''}`}>
                  {story.wisdomClipText}
                </p>
              </div>
            )}
          </div>

          {/* Fade gradient - matches cream paper background */}
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-28 transition-opacity duration-300 ${showFade ? "opacity-100" : "opacity-0"
              }`}
            style={{ background: 'linear-gradient(to top, #F5F1E8, transparent)' }}
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

        {/* Page number - subtle, book-style positioning on outer edge */}
        {pageNumber && (
          <div
            className="absolute bottom-[calc(env(safe-area-inset-bottom)+12px)] pointer-events-none"
            style={{ [isRightPage ? 'right' : 'left']: '20px' }}
          >
            <span className="text-xs font-medium text-stone-400 tabular-nums tracking-wide">
              {pageNumber}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
