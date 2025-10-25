"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  paginateBook,
  type Story as PaginationStory,
  type BookPage,
  type DecadeGroup,
} from "@/lib/bookPagination";
import { DecadeIntroPage } from "@/components/BookDecadePages";
import "../print-trim.css";

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

// Print-optimized page renderer
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
              />
            </div>
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

function PrintTrimPageContent() {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from URL params, print token, or session
  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    const printToken = searchParams.get("printToken");

    // Priority 1: Use userId from URL if provided (fastest, for PDFShift with token)
    if (userIdFromUrl) {
      setUserId(userIdFromUrl);
      return;
    }

    // Priority 2: Try to validate print token (for token-only access)
    if (printToken) {
      fetch(`/api/print-token/validate?token=${printToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.userId) {
            setUserId(data.userId);
          } else {
            setError("Invalid or expired print token.");
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("[Print Trim] Token validation error:", err);
          setError("Failed to validate print token.");
          setLoading(false);
        });
      return;
    }

    // Priority 3: Get from Supabase session (for direct user access)
    import("@supabase/supabase-js").then(({ createClient }) => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          setUserId(session.user.id);
        } else {
          setError("Not authenticated. Please sign in first.");
          setLoading(false);
        }
      });
    });
  }, [searchParams]);

  useEffect(() => {
    if (!userId) {
      return; // Wait for userId to be set
    }

    async function loadStories() {
      try {
        // Fetch stories from server API (uses service role key to bypass auth)
        const response = await fetch(`/api/book-data?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const { stories } = await response.json();

        if (!stories || stories.length === 0) {
          setError("No stories found");
          setLoading(false);
          return;
        }

        // Group by decade
        const decadeMap = new Map<string, Story[]>();
        stories.forEach((story: Story) => {
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

        setPages(bookPages);
        setLoading(false);
      } catch (err) {
        console.error("[Print Trim] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load stories");
        setLoading(false);
      }
    }

    loadStories();
  }, [userId]);

  if (loading) {
    return <div className="p-8">Loading stories...</div>;
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>;
  }

  if (pages.length === 0) {
    return <div className="p-8">No stories found</div>;
  }

  return (
    <div className="print-trim">
      {pages.map((page, idx) => (
        <PrintPageRenderer key={idx} page={page} />
      ))}
    </div>
  );
}

export default function PrintTrimPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <PrintTrimPageContent />
    </Suspense>
  );
}
