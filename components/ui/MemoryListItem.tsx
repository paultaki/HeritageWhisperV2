"use client";

import { Story } from "@/shared/schema";
import { formatYear, getAge } from "@/lib/utils";
import { useState } from "react";

// Local type for narrowing
type StoryLite = {
  id: string;
  title?: string;
  audio_duration?: number | null;
  year_of_event?: number | null;
  user_birth_year?: number | null;
  cover_photo_url?: string | null;
  show_in_timeline?: boolean;
  include_in_book?: boolean;
  is_favorite?: boolean;
};

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Narrow story type - id is always present
  const s = story as StoryLite;

  // Format duration (assuming audio_duration is in seconds)
  const formatDuration = (seconds?: number | null): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const duration = formatDuration(s.audio_duration ?? null);
  const age =
    s.year_of_event && s.user_birth_year
      ? getAge(s.year_of_event, s.user_birth_year)
      : null;

  // Get cover image URL
  const coverUrl = s.cover_photo_url ?? "/placeholder-memory.jpg";

  return (
    <div
      className={`memory-row group rounded-2xl bg-white/90 hover:bg-white shadow-sm hover:shadow
                 ring-1 ring-black/5 px-4 py-3 md:py-4 transition-all duration-200 relative
                 ${isMenuOpen ? 'z-50' : 'z-0'}`}
      role="article"
      aria-label={s.title ?? "Untitled memory"}
    >
      {/* Title - Full Width */}
      <button
        onClick={() => onOpen(s.id)}
        className="text-left w-full mb-3 focus:outline-none focus:ring-2 focus:ring-[#D7794F]
                   focus:ring-offset-2 rounded-lg px-2 -mx-2 py-1 -my-1"
      >
        <div
          className="title text-[17px] md:text-[18px] font-semibold tracking-tight
                        text-[#2C1F1A] line-clamp-2 leading-snug"
        >
          {s.title ?? "Untitled Memory"}
        </div>
      </button>

      {/* Bottom Row: Thumbnail, Metadata, Actions */}
      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
        {/* Thumbnail */}
        <button
          onClick={() => onOpen(s.id)}
          className="thumb relative overflow-hidden rounded-xl
                     w-24 md:w-28 aspect-[4/3] ring-1 ring-black/5
                     focus:outline-none focus:ring-2 focus:ring-[#D7794F] focus:ring-offset-2
                     transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label={`View ${s.title ?? "memory"}`}
        >
          <img
            src={coverUrl}
            alt={s.title ?? "Memory cover"}
            className="h-full w-full object-cover"
          />
        </button>

        {/* Metadata */}
        <button
          onClick={() => onOpen(s.id)}
          className="text-left min-w-0 focus:outline-none focus:ring-2 focus:ring-[#D7794F]
                     focus:ring-offset-2 rounded-lg px-2 -mx-2 py-1 -my-1"
        >
          <div className="meta text-[13px] text-black/50 flex items-center gap-2 flex-wrap">
            {s.year_of_event && (
              <span>{formatYear(s.year_of_event)}</span>
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
            {s.show_in_timeline && (
              <span
                className="pill text-[11px] px-2 py-0.5 rounded-full
                             bg-[#D7794F]/10 text-[#D7794F] font-medium"
              >
                Timeline
              </span>
            )}
            {s.include_in_book && (
              <span
                className="pill text-[11px] px-2 py-0.5 rounded-full
                             bg-[#8B4513]/10 text-[#8B4513] font-medium"
              >
                Book
              </span>
            )}
            {s.is_favorite && (
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
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onPlay(s.id);
          }}
          className="play-btn flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full
                     bg-gray-500/40 backdrop-blur-sm hover:bg-gray-500/60
                     shadow-lg hover:shadow-xl cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-[#D7794F] focus:ring-offset-2
                     transition-all duration-200 hover:scale-110 active:scale-95
                     translate-y-[27px] md:translate-y-0"
          style={{ pointerEvents: 'auto' }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ pointerEvents: 'none' }}>
            <circle cx="14" cy="14" r="13" fill="white" fillOpacity="0.9" />
            <polygon points="11,9 11,19 19,14" fill="#fb923c" />
          </svg>
        </button>

        <div 
          className="relative translate-y-[27px] md:translate-y-0"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
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
            className={`absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl
                          shadow-xl ring-1 ring-black/10 transition-all duration-200 z-[100]
                          ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          >
            <button
              onClick={() => onOpen(s.id)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50
                         transition-colors duration-150"
            >
              Edit
            </button>
            <button
              onClick={() => onToggleFavorite(s.id)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50
                         transition-colors duration-150"
            >
              {s.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
            </button>
            <button
              onClick={() => onDelete(s.id)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50
                         transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
