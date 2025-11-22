"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { BookPageCardProps } from "./types";
import BookAudioPlayer from "./BookAudioPlayer";

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

  // Fixed padding for top bar (56px)
  // Note: Dynamic viewport detection not needed since book page has overflow:hidden on body
  const fixedPadding = 56;

  // Get the hero photo or first photo (same logic as SimpleMobileBookView)
  const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
  const photoUrl = heroPhoto?.url || story.photoUrl;
  const photoTransform = heroPhoto?.transform || story.photoTransform;

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
      className="relative flex h-[100dvh] min-w-full snap-start"
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
          {/* Header image */}
          <div className="px-3 pt-0">
            <div
              className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200"
              style={{ aspectRatio: "16/10" }}
            >
              {photoUrl ? (
                photoTransform ? (
                  // Use <img> tag for images with transform (crop/zoom)
                  <img
                    src={photoUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                    style={{
                      transform: `scale(${photoTransform.zoom || 1})`,
                      transformOrigin: `${photoTransform.position?.x || 50}% ${photoTransform.position?.y || 50}%`,
                    }}
                  />
                ) : (
                  // Use Next.js Image for untransformed images
                  <Image
                    src={photoUrl}
                    alt={story.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={isActive}
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                  <span className="text-4xl text-stone-400">📖</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-5 pb-40">
            {/* Title and metadata */}
            <h1 className="text-[26px] font-semibold tracking-tight text-stone-900 sm:text-3xl">
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
            <div className="mt-5 space-y-4 text-[17px] leading-8 text-stone-800">
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
