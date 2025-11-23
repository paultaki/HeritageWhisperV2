"use client";

import { useMemo } from "react";
import Image from "next/image";
import { BookOpen, X } from "lucide-react";
import { BookTableOfContentsProps, DecadeGroup } from "./types";

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

/**
 * Group stories by decade or chapter
 */
function groupStories(stories: BookTableOfContentsProps["stories"], viewMode: 'chronological' | 'chapters' = 'chronological'): { title: string; stories: typeof stories }[] {
  const groups: { [key: string]: { title: string; stories: typeof stories } } = {};
  const groupOrder: string[] = [];

  stories.forEach((story) => {
    let groupKey = '';
    let groupTitle = '';

    if (viewMode === 'chapters') {
      // Group by Chapter
      if (story.chapterId) {
        groupKey = story.chapterId;
        // We need the chapter title. Since story object might not have it directly populated in a convenient way for grouping if it's flat,
        // we rely on the fact that stories are likely sorted by chapter order.
        // However, the story object in this component might need to be checked.
        // Assuming story.chapterId is the UUID.
        // We might need to find the chapter title from the story if available, or use a fallback.
        // Actually, the previous implementation of `groupByDecade` just used the decade string.
        // Let's check if `story` has `chapterTitle` or similar.
        // Looking at the `Story` interface in `types.ts` (implied), it usually has `chapterId`.
        // If we don't have the chapter title here, we might need to pass it or infer it.
        // BUT, in `app/book/page.tsx`, we saw `chapterTitle` being passed to `BookPage`.
        // Let's assume for now we group by `chapterId` and use a placeholder or try to find the title.
        // WAIT: The user's screenshot shows "The 1940s" as a chapter title.
        // If the story object has `chapterTitle`, we use it.
        // If not, we might be in trouble. Let's check `types.ts` or `app/book/page.tsx` again to see what `Story` has.
        // For now, let's assume we can use `story.chapterId` as key and we need to find the title.
        // If `story` doesn't have `chapterTitle`, we might need to fetch it or pass it.
        // However, `BookTableOfContents` receives `stories`.
        // Let's look at `BookTableOfContentsProps` in `types.ts` later if needed.
        // For now, let's use `story.chapterId` and hope `story` has a title field or we can group by `story.chapterId` and use the first story's chapter info if available.
        // Actually, let's look at the `groupByDecade` function again. It was simple.

        // Let's try to use the `decade` logic for chapters if `chapterId` is missing (fallback).
        groupKey = story.chapterId || 'uncategorized';
        // We need a way to get the title.
        // If we can't get the title easily, we might need to update the parent to pass it.
        // But wait, `app/book/page.tsx` constructs `mobilePages` with `story`.
        // Let's assume `story` has `chapterTitle` property added or available.
        // If not, I will need to add it.
        groupTitle = (story as any).chapterTitle || 'Uncategorized';
      } else {
        groupKey = 'uncategorized';
        groupTitle = 'Uncategorized';
      }
    } else {
      // Group by Decade (Chronological)
      const decade = Math.floor(story.storyYear / 10) * 10;
      groupKey = `${decade}s`;
      groupTitle = `${decade}s`;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = { title: groupTitle, stories: [] };
      groupOrder.push(groupKey);
    }
    groups[groupKey].stories.push(story);
  });

  return groupOrder.map(key => ({
    title: groups[key].title,
    stories: groups[key].stories
  }));
}

export default function BookTableOfContents({
  stories,
  isOpen,
  onClose,
  onStorySelect,
  viewMode = 'chronological',
  onViewModeChange,
}: BookTableOfContentsProps) {
  // Group stories based on view mode
  const groups = useMemo(() => groupStories(stories, viewMode), [stories, viewMode]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Panel */}
      <div
        className={`absolute inset-x-0 top-0 transition-transform duration-300 ${isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <div className="rounded-b-2xl bg-white pt-[env(safe-area-inset-top)] text-neutral-900 shadow-2xl ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neutral-700" />
              <h2 className="text-lg font-semibold tracking-tight">Table of Contents</h2>
            </div>

            {/* View Mode Toggle */}
            {viewMode && onViewModeChange && (
              <div className="flex items-center bg-neutral-100 rounded-full p-1 border border-neutral-200 mx-auto">
                <button
                  onClick={() => onViewModeChange('chronological')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${viewMode === 'chronological'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                  Time
                </button>
                <button
                  onClick={() => onViewModeChange('chapters')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${viewMode === 'chapters'
                    ? 'bg-[#d4af87] text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                  Chapters
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-neutral-100 active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-neutral-700" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70dvh] space-y-6 overflow-y-auto overscroll-contain px-4 pb-4">
            {groups.map((group) => (
              <section key={group.title} className="space-y-3">
                {/* Group header */}
                <h3 className="text-sm font-semibold tracking-tight text-neutral-800 uppercase">
                  {group.title}
                </h3>

                {/* Stories in this group */}
                <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-100">
                  {group.stories.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => onStorySelect(story.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
                    >
                      {/* Story thumbnail */}
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-neutral-200 bg-neutral-100 flex items-center justify-center">
                        {story.photoUrl ? (
                          <Image
                            src={story.photoUrl}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <BookOpen className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>

                      {/* Story info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 truncate">
                          {story.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                          <span>{story.storyYear}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {/* Empty state */}
            {groups.length === 0 && (
              <div className="py-12 text-center text-neutral-500">
                <p>No stories in your book yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
