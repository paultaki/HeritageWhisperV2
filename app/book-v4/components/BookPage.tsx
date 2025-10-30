"use client";

import React from "react";

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

interface BookPageProps {
  story?: Story;
  pageNum: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  position: "left" | "right";
}

export const BookPage = React.forwardRef<HTMLDivElement, BookPageProps>(
  ({ story, pageNum, onScroll, position }, ref) => {
    if (!story) {
      return (
        <div className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          {/* Page stack layers */}
          <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`}></div>
          <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`}></div>
          <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`}></div>
          
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
      <div className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
        {/* Page stack layers (3 behind) */}
        <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`}></div>
        <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`}></div>
        <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`}></div>

        {/* Main page */}
        <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl overflow-hidden [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
          {/* Paper texture/vignette - DEBUG: RED BACKGROUND */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: "rgba(255, 0, 0, 0.1)", // DEBUG: Red tint
              backgroundImage: position === "left"
                ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%),
                   linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.85))`
                : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%),
                   linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.85))`,
            }}
          ></div>

          {/* Inner gutter shadow - DEBUG: BLUE BACKGROUND */}
          <div 
            className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/12 via-black/6`}
            style={{ backgroundColor: "rgba(0, 0, 255, 0.1)" }} // DEBUG: Blue tint
          ></div>

          {/* Outer edge lines */}
          <div
            className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-3 pointer-events-none`}
            style={{
              backgroundImage: `repeating-linear-gradient(${position === "left" ? "90deg" : "270deg"}, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)`,
              opacity: 0.25,
            }}
          ></div>

          <div className="relative h-full w-full p-7 md:p-8 lg:p-10" style={{ backgroundColor: "rgba(0, 255, 0, 0.1)" }}> {/* DEBUG: Green */}
            <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 0, 0.1)" }}> {/* DEBUG: Yellow - REMOVED bg-white/60 */}
              <div
                ref={ref}
                onScroll={onScroll}
                className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-6 overflow-y-auto"
                style={{ backgroundColor: "rgba(255, 0, 255, 0.1)" }} // DEBUG: Magenta
              >
                <StoryContent story={story} />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80">
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
        {story.transcription?.split("\n\n").map((paragraph, i) => (
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
