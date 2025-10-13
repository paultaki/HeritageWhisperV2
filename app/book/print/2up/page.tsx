"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  paginateBook,
  getPageSpreads,
  type Story as PaginationStory,
  type BookPage,
  type DecadeGroup,
} from "@/lib/bookPagination";
import { DecadeIntroPage } from "@/components/BookDecadePages";

interface Story {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  transcription?: string;
  storyYear: number;
  storyDate?: string;
  lifeAge?: number;
  photoUrl?: string;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string;
    isHero?: boolean;
  }>;
  lessonLearned?: string; // Fixed: was wisdomClipText
  includeInBook?: boolean;
}

const convertToPaginationStory = (story: Story): PaginationStory => {
  const photos =
    story.photos?.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      isHero: p.isHero,
    })) ||
    (story.photoUrl
      ? [
          {
            id: "legacy",
            url: story.photoUrl,
            isHero: true,
          },
        ]
      : []);

  console.log("[Print 2up] Converting story:", {
    title: story.title,
    hasPhotosArray: !!story.photos,
    photosArrayLength: story.photos?.length || 0,
    hasPhotoUrl: !!story.photoUrl,
    convertedPhotosLength: photos.length,
    firstPhotoUrl: photos[0]?.url,
  });

  return {
    id: story.id,
    title: story.title,
    content: story.transcription || "",
    year: story.storyYear.toString(),
    date: story.storyDate,
    age: story.lifeAge,
    photos,
    lessonLearned: story.lessonLearned || undefined,
  };
};

// Print-optimized page renderer (no audio, no edit buttons)
const PrintPageRenderer = ({ page }: { page: BookPage }) => {
  // Intro page
  if (page.type === "intro") {
    return (
      <article
        className={`page ${page.isLeftPage ? "page--left" : "page--right"}`}
      >
        <div className="page-content px-8 py-16 flex flex-col items-center justify-center text-center h-full">
          <div className="space-y-8">
            <h1 className="text-5xl font-serif text-gray-800 mb-4">
              Family Memories
            </h1>
            <div className="w-24 h-1 bg-coral-600 mx-auto"></div>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto italic">
              A collection of cherished moments, stories, and lessons from a
              life well-lived.
            </p>
          </div>
        </div>
        <div className="page-number">{page.pageNumber}</div>
      </article>
    );
  }

  // Table of contents
  if (page.type === "table-of-contents") {
    return (
      <article
        className={`page ${page.isLeftPage ? "page--left" : "page--right"}`}
      >
        <div className="page-content px-8 py-12">
          <h1 className="text-4xl font-serif text-center mb-8 text-gray-800">
            Table of Contents
          </h1>
          <div className="space-y-6">
            {page.tocEntries?.map((entry) => (
              <div key={entry.decade} className="space-y-2">
                <h2 className="text-xl font-serif font-semibold text-gray-700 border-b border-gray-300 pb-1">
                  {entry.decadeTitle}
                </h2>
                <div className="space-y-1 pl-4">
                  {entry.stories.map((story, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-baseline text-sm"
                    >
                      <span className="text-gray-700 flex-1 pr-2">
                        {story.title}
                      </span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {story.year} • p.{story.pageNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="page-number">{page.pageNumber}</div>
      </article>
    );
  }

  // Decade marker
  if (page.type === "decade-marker") {
    return (
      <article
        className={`page ${page.isLeftPage ? "page--left" : "page--right"}`}
      >
        <DecadeIntroPage
          decade={page.decade || ""}
          title={page.decadeTitle || ""}
          storiesCount={page.storiesInDecade || 0}
        />
        <div className="page-number">{page.pageNumber}</div>
      </article>
    );
  }

  // Story pages
  return (
    <article
      className={`page ${page.isLeftPage ? "page--left" : "page--right"}`}
    >
      <div className="running-header">
        <span className={page.isLeftPage ? "header-left" : "header-right"}>
          {page.title && page.year ? (
            <>
              {page.title.toUpperCase()} • {page.year}
              {page.age !== null &&
                page.age !== undefined &&
                page.age >= 0 &&
                ` • AGE ${page.age}`}
            </>
          ) : page.isLeftPage ? (
            "Heritage Whisper"
          ) : (
            "Family Memories"
          )}
        </span>
      </div>

      <div className="page-content">
        {/* Photos - only on first page of story */}
        {(page.type === "story-start" || page.type === "story-complete") &&
          page.photos &&
          page.photos.length > 0 && (
            <div className="mb-4">
              <img
                src={page.photos[0].url}
                alt="Memory"
                className="w-full object-cover rounded-lg memory-photo"
                onError={(e) =>
                  console.error(
                    "[Print 2up] Image failed to load:",
                    page.photos[0].url,
                  )
                }
                onLoad={() =>
                  console.log("[Print 2up] Image loaded:", page.photos[0].url)
                }
              />
            </div>
          )}
        {/* Debug: log if photos should be here but aren't */}
        {(page.type === "story-start" || page.type === "story-complete") &&
          (!page.photos || page.photos.length === 0) && (
            <>
              {console.log("[Print 2up] Story page has NO photos:", {
                type: page.type,
                title: page.title,
              })}
            </>
          )}

        {/* Title only - year and age now in running header */}
        {(page.type === "story-start" || page.type === "story-complete") && (
          <div className="memory-header">
            <h2 className="memory-title">{page.title}</h2>
          </div>
        )}

        {/* Story text */}
        {page.text && (
          <div className="memory-body">
            <div className="prose prose-lg max-w-none">
              {page.text.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-4 last:mb-0 leading-relaxed text-justify"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Lesson learned - only on last page */}
        {(page.type === "story-end" || page.type === "story-complete") &&
          page.lessonLearned && (
            <div className="lesson-learned-box mt-6">
              <div className="lesson-learned-header">Lesson Learned</div>
              <blockquote className="lesson-learned-text">
                {page.lessonLearned}
              </blockquote>
            </div>
          )}
      </div>

      <div className="page-number">{page.pageNumber}</div>
    </article>
  );
};

function Print2UpPageContent() {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<BookPage[]>([]);
  const [spreads, setSpreads] = useState<BookPage[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from URL params or from session
  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    
    if (userIdFromUrl) {
      console.log("[Print 2up] Using userId from URL:", userIdFromUrl);
      setUserId(userIdFromUrl);
    } else {
      // Get from Supabase session
      console.log("[Print 2up] No userId in URL, checking session...");
      import("@supabase/supabase-js").then(({ createClient }) => {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        );
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id) {
            console.log("[Print 2up] Using userId from session:", session.user.id);
            setUserId(session.user.id);
          } else {
            setError("Not authenticated. Please sign in first.");
            setLoading(false);
          }
        });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!userId) {
      return; // Wait for userId to be set
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setError("Loading timed out. Please try again.");
        setLoading(false);
      }
    }, 30000); // 30 second timeout

    async function loadStories() {
      try {

        console.log("[Print 2up] Fetching stories for userId:", userId);

        // Fetch stories from server API (uses service role key to bypass auth)
        const response = await fetch(`/api/book-data?userId=${userId}`);
        if (!response.ok) {
          clearTimeout(loadingTimeout);
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const { stories } = await response.json();
        clearTimeout(loadingTimeout);
        console.log("[Print 2up] Received", stories?.length || 0, "stories");

        if (!stories || stories.length === 0) {
          console.error("[Print 2up] No stories found for user");
          setError("No stories found for this user. Please create some stories first.");
          setLoading(false);
          return;
        }

        // Group by decade
        const decadeMap = new Map<string, Story[]>();
        stories.forEach((story) => {
          const year = parseInt(story.storyYear?.toString() || "0");
          if (year > 0) {
            const decadeKey = `${Math.floor(year / 10) * 10}s`;
            if (!decadeMap.has(decadeKey)) {
              decadeMap.set(decadeKey, []);
            }
            decadeMap.get(decadeKey)!.push(story);
          }
        });

        const decadeGroups: DecadeGroup[] = Array.from(decadeMap.entries())
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([decade, storyList]) => ({
            decade,
            title: `The ${decade}`,
            stories: storyList
              .sort((a, b) => (a.storyYear || 0) - (b.storyYear || 0))
              .map(convertToPaginationStory),
          }));

        const bookPages = paginateBook(decadeGroups);
        const bookSpreads = getPageSpreads(bookPages);

        console.log(
          "[Print 2up] Generated",
          bookPages.length,
          "pages,",
          bookSpreads.length,
          "spreads",
        );

        // Log photo data for debugging
        const pagesWithPhotos = bookPages.filter(
          (p) => p.photos && p.photos.length > 0,
        );
        console.log("[Print 2up] Pages with photos:", pagesWithPhotos.length);
        if (pagesWithPhotos.length > 0) {
          console.log(
            "[Print 2up] Sample photo URL:",
            pagesWithPhotos[0].photos?.[0]?.url,
          );
        }

        setPages(bookPages);
        setSpreads(bookSpreads);
        setLoading(false);
      } catch (err) {
        clearTimeout(loadingTimeout);
        console.error("[Print 2up] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load stories");
        setLoading(false);
      }
    }

    loadStories();

    // Cleanup timeout on unmount
    return () => clearTimeout(loadingTimeout);
  }, [userId]);

  if (loading) {
    return <div className="p-8">Loading stories...</div>;
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>;
  }

  if (pages.length === 0 || spreads.length === 0) {
    return <div className="p-8">No stories found</div>;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: 11in 8.5in;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
        }

        /* Override root layout wrapper padding - all divs between body and print-2up */
        body > *,
        body > * > *,
        body > * > * > *,
        body > * > * > * > * {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
        }

        /* Reset the print container positioning */
        .print-2up {
          position: relative !important;
        }

        /* Hide all UI elements */
        .hw-hamburger-menu,
        [class*="hamburger"],
        [class*="navigation"],
        header,
        footer:not(.page-number),
        button:not(.page-content button),
        nav {
          display: none !important;
        }

        .print-2up {
          width: 11in !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .book-spread {
          width: 11in !important;
          height: 8.5in !important;
          margin: 0 !important;
          padding: 0.25in !important;
          box-sizing: border-box !important;
          page-break-after: always !important;
          display: block !important;
          background: white !important;
        }

        .book-spread:last-child {
          page-break-after: auto;
        }

        .spread-content {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          gap: 0 !important;
          background: white !important;
          border: 1px solid #ddd !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }

        .page {
          width: 5.25in !important;
          height: 8in !important;
          position: relative !important;
          box-sizing: border-box !important;
          padding: 0.5in 0.25in !important; /* Reduced horizontal padding from 0.5in to 0.25in */
          margin: 0 !important;
          overflow: hidden !important;
          flex-shrink: 0 !important;
        }

        .page-content {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .running-header {
          position: absolute;
          top: 0.25in;
          left: 0.25in;
          right: 0.25in;
          font-size: 9pt;
          color: #999;
          font-family: Georgia, serif;
          text-align: left;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          height: 0.3in;
        }
        
        .running-header .header-left,
        .running-header .header-right {
          display: block;
          width: 100%;
        }

        .page-number {
          position: absolute;
          bottom: 0.25in;
          font-size: 10pt;
          color: #666;
          font-family: Georgia, serif;
        }

        .page--left .page-number {
          left: 0.25in;
        }

        .page--right .page-number {
          right: 0.25in;
        }

        .memory-title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 0.1in;
          font-family: Georgia, serif;
        }

        .memory-year {
          font-size: 10pt;
          color: #666;
        }

        .memory-body {
          font-size: 11pt;
          line-height: 1.5;
        }
        
        .lesson-learned-box {
          margin-top: 1.5rem;
          padding-left: 1.5rem;
          border-left: 4px solid #D4A574;
        }
        
        .lesson-learned-header {
          font-size: 10pt;
          font-weight: 600;
          color: #8B6F47;
          margin-bottom: 0.5rem;
          font-family: Georgia, serif;
        }
        
        .lesson-learned-text {
          font-size: 11pt;
          font-style: italic;
          color: #374151;
          line-height: 1.6;
          margin: 0;
        }
      `,
        }}
      />
      <div className="print-2up">
        {spreads.map((spread, idx) => (
          <div key={idx} className="book-spread">
            <div className="spread-content">
              <PrintPageRenderer page={spread[0]} />
              {spread[1] && <PrintPageRenderer page={spread[1]} />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Print2UpPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <Print2UpPageContent />
    </Suspense>
  );
}
