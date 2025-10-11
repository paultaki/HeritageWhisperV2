"use client";

import { Story } from "@/shared/schema";
import { formatYear, getAge } from "@/lib/utils";

interface MemoryListItemProps {
  story: Story;
  onPlay: (id: string) => void;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MemoryListItem({
  story,
  onPlay,
  onOpen,
  onToggleFavorite,
  onDelete,
}: MemoryListItemProps) {
  // Format duration (assuming audio_duration is in seconds)
  const formatDuration = (seconds?: number | null): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const duration = formatDuration(story.audio_duration);
  const age =
    story.year_of_event && story.user_birth_year
      ? getAge(story.year_of_event, story.user_birth_year)
      : null;

  // Get cover image URL
  const coverUrl = story.cover_photo_url || "/placeholder-memory.jpg";

  return (
    <div
      className="memory-row group grid grid-cols-[auto,1fr,auto] items-center gap-4
                 rounded-2xl bg-white/90 hover:bg-white shadow-sm hover:shadow
                 ring-1 ring-black/5 px-4 py-3 md:py-4 transition-all duration-200"
      role="article"
      aria-label={story.title || "Untitled memory"}
    >
      {/* Thumbnail */}
      <button
        onClick={() => onOpen(story.id)}
        className="thumb relative overflow-hidden rounded-xl
                   w-24 md:w-28 aspect-[4/3] ring-1 ring-black/5
                   focus:outline-none focus:ring-2 focus:ring-[#D7794F] focus:ring-offset-2
                   transition-transform hover:scale-[1.02] active:scale-[0.98]"
        aria-label={`View ${story.title || "memory"}`}
      >
        <img
          src={coverUrl}
          alt={story.title || "Memory cover"}
          className="h-full w-full object-cover"
        />
      </button>

      {/* Content */}
      <button
        onClick={() => onOpen(story.id)}
        className="text-left min-w-0 focus:outline-none focus:ring-2 focus:ring-[#D7794F]
                   focus:ring-offset-2 rounded-lg px-2 -mx-2 py-1 -my-1"
      >
        <div
          className="title text-[17px] md:text-[18px] font-semibold tracking-tight
                        text-[#2C1F1A] truncate leading-snug"
        >
          {story.title || "Untitled Memory"}
        </div>
        <div className="meta mt-0.5 text-[13px] text-black/50 flex items-center gap-2 flex-wrap">
          {story.year_of_event && (
            <span>{formatYear(story.year_of_event)}</span>
          )}
          {typeof age === "number" && (
            <>
              <span className="hidden sm:inline">•</span>
              <span>
                {age > 0 ? `Age ${age}` : age === 0 ? "Birth" : "Before birth"}
              </span>
            </>
          )}
          {duration && (
            <>
              <span className="hidden sm:inline">•</span>
              <span>{duration}</span>
            </>
          )}
        </div>
        <div className="badges mt-1.5 hidden sm:flex items-center gap-2">
          {story.show_in_timeline && (
            <span
              className="pill text-[11px] px-2 py-0.5 rounded-full
                           bg-[#D7794F]/10 text-[#D7794F] font-medium"
            >
              Timeline
            </span>
          )}
          {story.include_in_book && (
            <span
              className="pill text-[11px] px-2 py-0.5 rounded-full
                           bg-[#8B4513]/10 text-[#8B4513] font-medium"
            >
              Book
            </span>
          )}
          {story.is_favorite && (
            <span
              className="star text-[#D7794F]"
              aria-label="Favorite"
              role="img"
            >
              ⭐
            </span>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="actions flex items-center gap-2">
        <button
          aria-label="Play memory"
          onClick={() => onPlay(story.id)}
          className="play-btn grid place-items-center w-11 h-11 md:w-12 md:h-12 rounded-full
                     bg-[#D7794F] text-white shadow-md hover:shadow-lg active:opacity-90
                     focus:outline-none focus:ring-2 focus:ring-[#D7794F] focus:ring-offset-2
                     transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <svg
            className="w-4 h-4 md:w-5 md:h-5 ml-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <div className="relative group/menu">
          <button
            aria-label="More options"
            className="more grid place-items-center w-10 h-10 md:w-11 md:h-11 rounded-full
                       bg-black/[.04] hover:bg-black/[.07] text-black/70
                       focus:outline-none focus:ring-2 focus:ring-[#D7794F] focus:ring-offset-2
                       transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <div
            className="absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl
                          shadow-lg ring-1 ring-black/5 opacity-0 invisible
                          group-hover/menu:opacity-100 group-hover/menu:visible
                          transition-all duration-200 z-50"
          >
            <button
              onClick={() => onOpen(story.id)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50
                         transition-colors duration-150"
            >
              Edit
            </button>
            <button
              onClick={() => onToggleFavorite(story.id)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50
                         transition-colors duration-150"
            >
              {story.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
            </button>
            <button
              onClick={() => onDelete(story.id)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50
                         transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
