"use client";

import { Story } from "@/shared/schema";
import { MemoryListItem } from "./MemoryListItem";

interface MemoryListProps {
  stories: Story[];
  onPlay: (id: string) => void;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleTimeline?: (id: string) => void;
  onToggleBook?: (id: string) => void;
  onDelete: (id: string) => void;
  density?: "comfortable" | "compact";
}

export function MemoryList({
  stories,
  onPlay,
  onOpen,
  onToggleFavorite,
  onToggleTimeline,
  onToggleBook,
  onDelete,
  density = "comfortable",
}: MemoryListProps) {
  const gapClass = density === "comfortable" ? "gap-4" : "gap-3";

  return (
    <div className={`memory-list grid grid-cols-1 md:grid-cols-2 ${gapClass}`} role="list">
      {stories.map((story) => (
        <MemoryListItem
          key={story.id}
          story={story}
          onPlay={onPlay}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          onToggleTimeline={onToggleTimeline}
          onToggleBook={onToggleBook}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
