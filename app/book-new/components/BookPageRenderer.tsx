"use client";

import { BookPageRendererProps } from "./types";
import BookPageCard from "./BookPageCard";
import CoverPage from "./CoverPage";
import IntroPage from "./IntroPage";
import TocPage from "./TocPage";
import { DecadeIntroPage } from "@/components/BookDecadePages";

/**
 * BookPageRenderer - Routes to appropriate page component based on page type
 */
export default function BookPageRenderer({
  page,
  isActive,
  caveatFont,
  pageNumber,
}: BookPageRendererProps) {
  switch (page.type) {
    case "cover":
      return <CoverPage userName={page.userName} storyCount={page.storyCount} />;

    case "intro":
      return <IntroPage />;

    case "toc":
      return <TocPage stories={page.stories} />;

    case "decade":
      return (
        <section
          className="relative h-[100dvh] w-screen flex-shrink-0 snap-start flex items-center justify-center px-4"
          style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
        >
          {/* Premium book page - cream paper with bound-page styling */}
          <div
            className="relative w-full max-w-2xl h-[85vh] shadow-2xl overflow-hidden ring-1 ring-black/5"
            style={{
              backgroundColor: '#FFFDF8', // Cream paper
              borderRadius: '2px 12px 12px 2px', // Asymmetric: sharp on left (spine), rounded on right
              boxShadow: `
                inset -4px 0 8px -4px rgba(0,0,0,0.08),
                inset 4px 0 12px -4px rgba(0,0,0,0.12),
                0 10px 40px -10px rgba(0,0,0,0.5)
              `,
            }}
          >
            {/* Subtle paper texture overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: '2px 12px 12px 2px',
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: 0.035,
              }}
            />

            {/* DecadeIntroPage component fills the container */}
            <DecadeIntroPage
              decade={page.decade}
              title={page.title}
              storiesCount={page.count}
              isChapter={page.isChapter}
            />

            {/* Inner edge shadow for book effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: '2px 12px 12px 2px',
                boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.02), inset 0 -1px 0 rgba(0,0,0,0.02)',
              }}
            ></div>

            {/* Page number */}
            {pageNumber && (
              <div className="absolute bottom-4 right-5 pointer-events-none">
                <span className="text-xs font-medium text-stone-400 tabular-nums tracking-wide">
                  {pageNumber}
                </span>
              </div>
            )}
          </div>
        </section>
      );

    case "story":
      return (
        <BookPageCard
          story={page.story}
          isActive={isActive}
          caveatFont={caveatFont}
          pageNumber={pageNumber}
        />
      );

    default:
      // TypeScript exhaustiveness check - should never happen
      const _exhaustive: never = page;
      return null;
  }
}
