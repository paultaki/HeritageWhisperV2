"use client";

import { useMemo } from "react";
import Image from "next/image";
import { BookOpen, X, Settings } from "lucide-react";
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
function groupStories(
  stories: BookTableOfContentsProps["stories"],
  viewMode: 'chronological' | 'chapters' = 'chronological',
  chapters?: Array<{ id: string; title: string; orderIndex: number }>
): { title: string; stories: typeof stories }[] {
  const groups: { [key: string]: { title: string; stories: typeof stories } } = {};
  const groupOrder: string[] = [];

  stories.forEach((story) => {
    let groupKey = '';
    let groupTitle = '';

    if (viewMode === 'chapters') {
      // Group by Chapter
      if (story.chapterId) {
        groupKey = story.chapterId;
        // Look up the chapter title from the chapters array
        const chapter = chapters?.find(c => c.id === story.chapterId);
        groupTitle = chapter?.title || 'Uncategorized';
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
  chapters,
  isOpen,
  onClose,
  onStorySelect,
  viewMode = 'chronological',
  onViewModeChange,
}: BookTableOfContentsProps) {
  // Group stories based on view mode
  const groups = useMemo(() => groupStories(stories, viewMode, chapters), [stories, viewMode, chapters]);

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
          <div className="px-4 py-4">
            {/* Title row */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold tracking-tight">Table of Contents</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center shadow-sm hover:bg-neutral-200 transition active:scale-95"
                style={{ marginRight: "-8px" }}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-neutral-700" />
              </button>
            </div>

            {/* View Mode Toggle - Full width below title */}
            {viewMode && onViewModeChange && (
              <div className="flex flex-col gap-3 w-full max-w-[240px] mx-auto">
                <div className="flex items-center justify-center bg-neutral-100 rounded-full p-1 border border-neutral-200 w-full">
                  <button
                    onClick={() => onViewModeChange('chronological')}
                    className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'chronological'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                  >
                    Time
                  </button>
                  <button
                    onClick={() => onViewModeChange('chapters')}
                    className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'chapters'
                      ? 'bg-[#d4af87] text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                  >
                    Chapters
                  </button>
                </div>

                {viewMode === 'chapters' && (
                  <a
                    href="/chapters-v2"
                    className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-500 hover:text-[#d4af87] transition-colors py-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage Chapters
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[70dvh] space-y-6 overflow-y-auto overscroll-contain px-4 pb-4">
            {groups.map((group) => (
              <section key={group.title} className="space-y-2">
                {/* Group header */}
                <h3 className="text-base font-bold tracking-tight text-neutral-700">
                  {group.title.toLowerCase()}
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
                        <h4 className="text-sm text-neutral-700 truncate">
                          {story.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-base font-medium text-neutral-900 mt-0.5">
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
