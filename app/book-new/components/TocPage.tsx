"use client";

import { BookStory } from "./types";

/**
 * TocPage - Mobile table of contents page
 * Single scrollable page (desktop uses 2-page spread)
 */
export default function TocPage({
  stories,
  pageNumber,
  onStorySelect,
}: {
  stories: BookStory[];
  pageNumber?: number;
  onStorySelect?: (storyId: string) => void;
}) {
  // Determine if this is a left or right page (like in a real book)
  const isRightPage = !pageNumber || pageNumber % 2 === 1;
  const borderRadius = isRightPage ? '2px 12px 12px 2px' : '12px 2px 2px 12px';
  const insetShadow = isRightPage
    ? 'inset -4px 0 8px -4px rgba(0,0,0,0.08), inset 4px 0 12px -4px rgba(0,0,0,0.12)'
    : 'inset 4px 0 8px -4px rgba(0,0,0,0.08), inset -4px 0 12px -4px rgba(0,0,0,0.12)';
  // Format date helper
  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  // Group stories by decade for organized display
  const decadeGroups = stories.reduce((acc, story) => {
    const decade = `${Math.floor(story.storyYear / 10) * 10}s`;
    if (!acc[decade]) {
      acc[decade] = [];
    }
    acc[decade].push(story);
    return acc;
  }, {} as Record<string, BookStory[]>);

  const sortedDecades = Object.keys(decadeGroups).sort();

  return (
    <section
      className="relative h-[100dvh] w-screen flex-shrink-0 snap-start"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
      data-nav-ink="dark"
    >
      {/* Premium book page - cream paper with bound-page styling - full height */}
      <div
        className="relative w-full h-[100dvh] shadow-2xl overflow-hidden ring-1 ring-black/5"
        style={{
          backgroundColor: '#FFFDF8', // Cream paper
          borderRadius, // Asymmetric: alternates based on page position
          boxShadow: `${insetShadow}, 0 10px 40px -10px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Subtle paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.035,
          }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius,
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.05) 100%)",
          }}
        />

        {/* Scrollable content */}
        <div
          className="relative h-full overflow-y-auto p-6"
          style={{ touchAction: 'pan-y' }}
        >
          <h1
            className="text-5xl font-serif text-center mb-8 text-gray-800 sticky top-0 pb-4"
            style={{
              fontFamily: "Crimson Text, serif",
              background: 'linear-gradient(to bottom, #FFFDF8 70%, transparent)',
            }}
          >
            Table of Contents
          </h1>

          <div className="space-y-5">
            {sortedDecades.map((decade) => (
              <div key={decade} className="space-y-2">
                <h3 className="text-lg tracking-tight font-bold text-gray-700">
                  {decade.toLowerCase()}
                </h3>
                <div className="space-y-1.5">
                  {decadeGroups[decade].map((story) => (
                    <button
                      key={story.id}
                      onClick={() => onStorySelect?.(story.id)}
                      className="flex w-full justify-between items-baseline border-b border-gray-200/60 pb-1.5 text-left active:bg-gray-100/50 transition-colors rounded-sm"
                    >
                      <span className="text-gray-600 flex-1 pr-3 text-sm">
                        {story.title}
                      </span>
                      <span className="text-gray-700 font-medium text-base whitespace-nowrap">
                        {story.storyYear}
                        {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inner edge shadow for book effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius,
            boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.02), inset 0 -1px 0 rgba(0,0,0,0.02)',
          }}
        />

        {/* Page number - on outer edge */}
        {pageNumber && (
          <div
            className="absolute bottom-4 pointer-events-none"
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
