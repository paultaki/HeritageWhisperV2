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
          {/* Page background - styled like a book page */}
          <div
            className="relative w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(to bottom, #faf9f7, #f5f3f0)",
            }}
          >
            {/* DecadeIntroPage component fills the container */}
            <DecadeIntroPage
              decade={page.decade}
              title={page.title}
              storiesCount={page.count}
              isChapter={page.isChapter}
            />

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

    case "story":
      return (
        <BookPageCard
          story={page.story}
          isActive={isActive}
          caveatFont={caveatFont}
        />
      );

    default:
      // TypeScript exhaustiveness check - should never happen
      const _exhaustive: never = page;
      return null;
  }
}
