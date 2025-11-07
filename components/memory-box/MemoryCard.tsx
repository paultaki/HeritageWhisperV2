"use client";
import { memo } from "react";
import Image from "next/image";
import { MoreVertical, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MemoryCardProps = {
  memory: {
    id: string;
    title: string;
    year: number;
    age?: number;
    durationSec?: number;
    hasAudio?: boolean;
    onTimeline: boolean;
    inBook: boolean;
    favorited?: boolean;
    thumbUrl: string;
  };
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleTimeline: (id: string) => void;
  onToggleBook: (id: string) => void;
  onOpen: (id: string) => void;
  onListen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function secondsToMMSS(s?: number) {
  if (!s && s !== 0) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Compact Memory Card - Senior-Friendly Design
 *
 * Key decisions:
 * - 16:9 thumbnail (universal, predictable)
 * - Title + year only (no preview = faster scanning)
 * - Inline chips with visual state (green = active)
 * - Long-press 350ms (iOS Photos app standard)
 * - Touch targets 44x44px minimum (WCAG AAA)
 *
 * Performance:
 * - memo() prevents re-renders during sibling selection
 * - Next.js Image for lazy loading
 * - stopPropagation on chips to prevent card click bubbling
 */
const MemoryCard = memo(
  ({
    memory,
    selected,
    onToggleSelect,
    onToggleTimeline,
    onToggleBook,
    onOpen,
    onListen,
    onEdit,
    onFavorite,
    onDelete,
  }: MemoryCardProps) => {
    const {
      id,
      title,
      year,
      age,
      durationSec,
      hasAudio,
      onTimeline,
      inBook,
      thumbUrl,
    } = memory;

    return (
      <div
        className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-3 md:p-4 relative cursor-pointer hover:shadow-md transition-shadow"
        role="listitem"
        aria-label={title}
        onClick={() => onOpen(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen(id);
          if (e.key === "Escape" && selected) onToggleSelect(id);
        }}
        tabIndex={0}
      >
        {/* Selection check - Top left for thumb reach */}
        {selected && (
          <div className="absolute left-3 top-3 z-10 h-6 w-6 rounded-full bg-blue-600 text-white grid place-items-center shadow-lg">
            <Check size={16} aria-hidden="true" />
          </div>
        )}

        {/* Thumbnail - 16:9 aspect ratio for consistency */}
        <div className="relative w-full overflow-hidden rounded-xl bg-slate-200">
          <Image
            src={thumbUrl}
            alt=""
            width={640}
            height={360}
            className="aspect-video w-full object-cover"
            priority={false}
            loading="lazy"
          />
          {/* Audio duration badge - Top left */}
          {hasAudio && durationSec && (
            <div className="absolute left-2 top-2 rounded-full bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-medium shadow-sm">
              🔊 {secondsToMMSS(durationSec)}
            </div>
          )}
        </div>

        {/* Title + meta - Compact but readable */}
        <div className="mt-3">
          <h3 className="text-base font-semibold leading-tight line-clamp-1 text-gray-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {year}
            {age !== undefined ? ` • Age ${age}` : ""}
          </p>
        </div>

        {/* Chips + overflow - Inline for quick triage */}
        <div className="mt-3 flex items-center gap-2">
          {/* Timeline chip - Green when active */}
          <button
            className={`h-8 rounded-full px-3 text-sm font-medium transition-all ${
              onTimeline
                ? "bg-green-100 text-green-800 ring-1 ring-green-600"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            style={{ minHeight: "44px", minWidth: "44px" }}
            aria-pressed={onTimeline}
            aria-label={onTimeline ? "Remove from Timeline" : "Add to Timeline"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTimeline(id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onToggleTimeline(id);
              }
            }}
          >
            {onTimeline ? "Timeline ✓" : "Timeline"}
          </button>

          {/* Book chip - Green when active */}
          <button
            className={`h-8 rounded-full px-3 text-sm font-medium transition-all ${
              inBook
                ? "bg-green-100 text-green-800 ring-1 ring-green-600"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            style={{ minHeight: "44px", minWidth: "44px" }}
            aria-pressed={inBook}
            aria-label={inBook ? "Remove from Book" : "Add to Book"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBook(id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onToggleBook(id);
              }
            }}
          >
            {inBook ? "Book ✓" : "Book"}
          </button>

          {/* Overflow menu - Right-aligned */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-auto h-10 w-10 grid place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                aria-label="More actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onListen && (
                <DropdownMenuItem onClick={() => onListen(id)}>
                  🔊 Listen
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  ✏️ Edit
                </DropdownMenuItem>
              )}
              {onFavorite && (
                <DropdownMenuItem onClick={() => onFavorite(id)}>
                  ⭐ Favorite
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(id)}
                >
                  🗑️ Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Long-press layer - Touch selection */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ zIndex: 1 }}
          onPointerDown={(e) => {
            // Long-press detection: 350ms (iOS standard)
            const timer = setTimeout(() => {
              onToggleSelect(id);
              // Haptic feedback if available
              if (navigator.vibrate) {
                navigator.vibrate(50);
              }
            }, 350);

            const clearTimer = () => clearTimeout(timer);
            e.currentTarget.addEventListener("pointerup", clearTimer, {
              once: true,
            });
            e.currentTarget.addEventListener("pointercancel", clearTimer, {
              once: true,
            });
          }}
          aria-hidden
        />
      </div>
    );
  }
);

MemoryCard.displayName = "MemoryCard";

export default MemoryCard;
