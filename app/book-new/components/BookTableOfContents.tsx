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
 * Group stories by decade (e.g., "1940s", "1950s")
 */
function groupByDecade(stories: BookTableOfContentsProps["stories"]): DecadeGroup[] {
  const groups: { [key: string]: typeof stories } = {};

  stories.forEach((story) => {
    const decade = Math.floor(story.storyYear / 10) * 10;
    const decadeKey = `${decade}s`;

    if (!groups[decadeKey]) {
      groups[decadeKey] = [];
    }
    groups[decadeKey].push(story);
  });

  // Convert to array and sort by decade
  return Object.keys(groups)
    .sort()
    .map((decade) => ({
      decade,
      stories: groups[decade],
    }));
}

export default function BookTableOfContents({
  stories,
  isOpen,
  onClose,
  onStorySelect,
}: BookTableOfContentsProps) {
  // Group stories by decade
  const decadeGroups = useMemo(() => groupByDecade(stories), [stories]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Panel */}
      <div
        className={`absolute inset-x-0 top-0 transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="rounded-b-2xl bg-white pt-[env(safe-area-inset-top)] text-neutral-900 shadow-2xl ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neutral-700" />
              <h2 className="text-lg font-semibold tracking-tight">Table of Contents</h2>
            </div>
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
            {decadeGroups.map((group) => (
              <section key={group.decade} className="space-y-3">
                {/* Decade header */}
                <h3 className="text-sm font-semibold tracking-tight text-neutral-800">
                  {group.decade}
                </h3>

                {/* Stories in this decade */}
                <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-100">
                  {group.stories.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => onStorySelect(story.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
                    >
                      {/* Story thumbnail */}
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-neutral-200">
                        {story.photoUrl ? (
                          <Image
                            src={story.photoUrl}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <span className="text-xs">📖</span>
                          </div>
                        )}
                      </div>

                      {/* Story info */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-medium tracking-tight text-neutral-900">
                          {story.title}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {story.lifeAge && `Age ${story.lifeAge}`}
                          {story.lifeAge && story.storyDate && " • "}
                          {story.storyDate ? formatDate(typeof story.storyDate === 'string' ? story.storyDate : story.storyDate.toISOString()) : story.storyYear}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {/* Empty state */}
            {decadeGroups.length === 0 && (
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
