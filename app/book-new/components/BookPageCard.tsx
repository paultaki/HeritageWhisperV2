"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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

export default function BookPageCard({ story, isActive }: BookPageCardProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [showFade, setShowFade] = useState(false);

  // Check if content overflows and update hint visibility
  const checkOverflow = useCallback(() => {
    if (!scrollerRef.current) return;

    const hasOverflow =
      scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight > 12;
    const isAtTop = scrollerRef.current.scrollTop < 8;

    setShowContinueHint(hasOverflow && isAtTop);
    setShowFade(hasOverflow);
  }, []);

  // Handle scroll to hide continue hint
  const handleScroll = useCallback(() => {
    if (!scrollerRef.current) return;
    const isAtTop = scrollerRef.current.scrollTop < 8;

    if (!isAtTop) {
      setShowContinueHint(false);
    } else {
      checkOverflow();
    }
  }, [checkOverflow]);

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
    >
      <div className="relative mx-auto my-0 h-[100dvh] w-full rounded-none bg-stone-50 text-stone-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/5">
        {/* Subtle inner edge shadow */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(0,0,0,0.03),inset_0_-1px_0_rgba(0,0,0,0.03)]"></div>

        {/* Vertical scroller */}
        <div
          ref={scrollerRef}
          className="relative h-full overflow-y-auto overscroll-contain"
        >
          {/* Header image */}
          <div className="px-3 pt-[23px]">
            <div
              className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200"
              style={{ aspectRatio: "16/10" }}
            >
              {story.photoUrl ? (
                story.photoTransform ? (
                  // Use <img> tag for images with transform (crop/zoom)
                  <img
                    src={story.photoUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                    style={{
                      transform: `scale(${story.photoTransform.zoom || 1})`,
                      transformOrigin: `${story.photoTransform.position?.x || 50}% ${story.photoTransform.position?.y || 50}%`,
                    }}
                  />
                ) : (
                  // Use Next.js Image for untransformed images
                  <Image
                    src={story.photoUrl}
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
              <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <span className="text-lg">💡</span>
                  <span>Lesson Learned</span>
                </div>
                <p className="text-[15px] leading-7 text-amber-900/80">
                  {story.wisdomClipText}
                </p>
              </div>
            )}
          </div>

          {/* Fade gradient */}
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-stone-50 to-transparent transition-opacity duration-300 ${
              showFade ? "opacity-100" : "opacity-0"
            }`}
          ></div>

          {/* Continue reading hint */}
          <div
            className={`absolute bottom-[88px] left-0 right-0 flex justify-center transition-opacity duration-300 ${
              showContinueHint ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-stone-900 shadow ring-1 ring-stone-200">
              <span className="text-sm font-medium">Continue reading</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
