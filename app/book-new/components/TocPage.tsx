"use client";

import { BookStory } from "./types";

/**
 * TocPage - Mobile table of contents page
 * Single scrollable page (desktop uses 2-page spread)
 */
export default function TocPage({ stories }: { stories: BookStory[] }) {
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
      className="relative h-[100dvh] w-screen flex-shrink-0 snap-start flex items-center justify-center px-4"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      {/* Page background - styled like a book page */}
      <div
        className="relative w-full max-w-md h-[85vh] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #faf9f7, #f5f3f0)",
        }}
      >
        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            backgroundSize: "100px 100px",
          }}
        ></div>

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)",
          }}
        ></div>

        {/* Scrollable content */}
        <div className="relative h-full overflow-y-auto p-6">
          <h1
            className="text-5xl font-serif text-center mb-8 text-gray-800 sticky top-0 bg-gradient-to-b from-[#faf9f7] via-[#faf9f7] to-transparent pb-4"
            style={{ fontFamily: "Crimson Text, serif" }}
          >
            Table of Contents
          </h1>

          <div className="space-y-6">
            {sortedDecades.map((decade) => (
              <div key={decade} className="space-y-3">
                <h3 className="text-sm tracking-tight font-semibold text-gray-700 uppercase">
                  {decade}
                </h3>
                <div className="space-y-2">
                  {decadeGroups[decade].map((story) => (
                    <div
                      key={story.id}
                      className="flex justify-between items-baseline text-base border-b border-gray-200 pb-2"
                    >
                      <span className="text-gray-700 flex-1 pr-3">
                        {story.title}
                      </span>
                      <span className="text-gray-500 text-sm whitespace-nowrap">
                        {story.storyYear}
                        {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inner edge shadow for book effect */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)",
          }}
        ></div>
      </div>
    </section>
  );
}
