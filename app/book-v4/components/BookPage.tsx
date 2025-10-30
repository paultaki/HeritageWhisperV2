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
    const pageRef = React.useRef<HTMLDivElement>(null);

    // Forward wheel events from anywhere on the page to the scrollable content with native acceleration
    React.useEffect(() => {
      const pageElement = pageRef.current;
      const scrollElement = ref && 'current' in ref ? ref.current : null;
      
      if (!pageElement || !scrollElement) return;

      const handleWheel = (e: WheelEvent) => {
        // Check if the event target is already the scroll container or inside it
        if (scrollElement.contains(e.target as Node)) {
          // Let it scroll naturally
          return;
        }
        
        // Only intercept if the event is outside the scroll container
        e.preventDefault();
        e.stopPropagation();
        
        // Forward scroll with acceleration multiplier for smooth scrolling
        const multiplier = e.deltaMode === 0 ? 1.5 : 50; // Pixel vs line mode
        scrollElement.scrollTop += e.deltaY * multiplier;
      };

      pageElement.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        pageElement.removeEventListener('wheel', handleWheel);
      };
    }, [ref]);

    if (!story) {
      return (
        <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
          {/* Page stack layers - HIDDEN FOR NOW */}
          <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
          <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
          <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
          
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
      <div ref={pageRef} className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-1/2 [transform-style:preserve-3d]`}>
        {/* Page stack layers (3 behind) - HIDDEN FOR NOW */}
        <div className={`absolute inset-0 translate-y-0.5 ${position === "left" ? "-translate-x-0.5" : "translate-x-0.5"} scale-[0.998] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] opacity-70 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
        <div className={`absolute inset-0 translate-y-1 ${position === "left" ? "-translate-x-[3px]" : "translate-x-[3px]"} scale-[0.996] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] opacity-55 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>
        <div className={`absolute inset-0 translate-y-[6px] ${position === "left" ? "-translate-x-[6px]" : "translate-x-[6px]"} scale-[0.992] rounded-[18px] ring-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] opacity-35 bg-neutral-50 ring-black/10`} style={{ display: 'none' }}></div>

        {/* Main page */}
        <div className={`relative h-full w-full rounded-[20px] ring-1 shadow-2xl [transform:rotateY(${position === "left" ? "3deg" : "-3deg"})_translateZ(0.001px)] ring-black/15 bg-neutral-50`}>
          {/* Paper texture/vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: position === "left"
                ? `radial-gradient(160% 85% at 110% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at -10% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`
                : `radial-gradient(160% 85% at -10% 50%, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 55%),
                   radial-gradient(120% 60% at 110% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 58%)`,
            }}
          ></div>

          {/* Inner gutter shadow */}
          <div className={`absolute inset-y-0 ${position === "left" ? "right-0" : "left-0"} w-10 pointer-events-none z-10 bg-gradient-to-${position === "left" ? "l" : "r"} to-transparent from-black/12 via-black/6`}></div>

          {/* Outer edge lines */}
          <div
            className={`absolute inset-y-0 ${position === "left" ? "left-0" : "right-0"} w-3 pointer-events-none z-10`}
            style={{
              backgroundImage: `repeating-linear-gradient(${position === "left" ? "90deg" : "270deg"}, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)`,
              opacity: 0.25,
            }}
          ></div>

          <div className="relative h-full w-full p-7 md:p-8 lg:p-10">
            <div className="h-full w-full rounded-[14px] ring-1 backdrop-blur-[0.5px] ring-black/5 bg-white/60">
              <div
                ref={ref}
                onScroll={onScroll}
                tabIndex={0}
                className="js-flow h-full w-full rounded-[12px] text-neutral-900 outline-none p-6"
              >
                <StoryContent story={story} />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-8 text-[12px] text-neutral-500/80 pointer-events-none z-20">
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
      {/* Photo at top if available */}
      {story.photos && story.photos.length > 0 && (
        <div className="mb-4">
          <img
            src={story.photos[0].url}
            alt={story.title}
            className="w-full rounded-md shadow ring-1 ring-black/5"
          />
          {story.photos[0].caption && (
            <p className="text-[12px] text-neutral-600 mt-1">
              {story.photos[0].caption}
            </p>
          )}
        </div>
      )}

      {/* Title */}
      <h2 className="text-2xl tracking-tight font-semibold mb-3 text-neutral-900">
        {story.title}
      </h2>

      {/* Year and age */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          {story.storyYear}
          {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
        </div>
      </div>

      {/* Story text */}
      <div className="text-[15.5px] leading-7 text-neutral-800/95 space-y-3">
        {story.transcription?.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {story.wisdomClipText && (
        <div 
          className="mt-8 mb-4 p-6 clear-both relative"
          style={{
            background: 'linear-gradient(135deg, #fef9e7 0%, #faf3dd 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            transform: 'rotate(-0.5deg)',
            borderRadius: '2px',
            border: '1px solid rgba(139, 107, 122, 0.2)',
          }}
        >
          {/* Paper texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          ></div>
          
          {/* Tape at top corners */}
          <div 
            className="absolute -top-2 left-6 w-12 h-5 opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,240,0.7) 0%, rgba(255,250,230,0.8) 100%)',
              transform: 'rotate(-2deg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          ></div>
          <div 
            className="absolute -top-2 right-6 w-12 h-5 opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,240,0.7) 0%, rgba(255,250,230,0.8) 100%)',
              transform: 'rotate(2deg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          ></div>

          <p 
            className="text-sm mb-2"
            style={{
              fontFamily: '"Caveat", cursive',
              fontSize: '15px',
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
              fontSize: '18px',
              color: '#4a4a4a',
              lineHeight: '1.8',
            }}
          >
            {story.wisdomClipText}
          </p>
        </div>
      )}
    </>
  );
}
