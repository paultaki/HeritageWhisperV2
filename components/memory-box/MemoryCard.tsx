"use client";
import { memo, useState } from "react";
import Image from "next/image";
import { MoreVertical, Check, Volume2, Edit3, Star, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusIcons } from "./StatusIcons";
import { VisibilityModal } from "./VisibilityModal";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";

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
    thumbWidth?: number;
    thumbHeight?: number;
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
  onDuplicate?: (id: string) => void;
};

function secondsToMMSS(s?: number) {
  if (!s && s !== 0) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * MemoryCard V4 - Management-First Design
 *
 * Key changes from V3:
 * - Replaced Timeline/Book chips with subtle top-right StatusIcons
 * - Added visible Listen and Edit quick action buttons
 * - Redesigned dropdown: Toggle Favorite, Manage Visibility, Duplicate, Delete
 * - Integrated VisibilityModal for Timeline/Book management
 *
 * Design principles:
 * - Management interface (not display showcase)
 * - Minimize visual clutter with status icons
 * - Quick actions always visible for common tasks
 * - Dropdown for secondary actions
 * - 44x44px minimum touch targets (WCAG AAA)
 *
 * Performance:
 * - memo() prevents re-renders during sibling selection
 * - Next.js Image for lazy loading
 * - stopPropagation on all interactive elements
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
    onDuplicate,
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
      favorited = false,
      thumbUrl,
      thumbWidth,
      thumbHeight,
    } = memory;

    const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
    const isPrivate = !onTimeline && !inBook;

    const handleVisibilitySave = (settings: {
      onTimeline: boolean;
      inBook: boolean;
    }) => {
      if (settings.onTimeline !== onTimeline) {
        onToggleTimeline(id);
      }
      if (settings.inBook !== inBook) {
        onToggleBook(id);
      }
    };

    return (
      <>
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

          {/* Status Icons - Top right corner */}
          <div className="absolute right-3 top-3 z-10">
            <StatusIcons
              onTimeline={onTimeline}
              inBook={inBook}
              isFavorite={favorited}
              isPrivate={isPrivate}
            />
          </div>

          {/* Thumbnail - 16:9 aspect ratio - Now with blur-extend for portrait images */}
          <div className="relative w-full">
            <StoryPhotoWithBlurExtend
              src={thumbUrl}
              alt={title || "Memory"}
              width={thumbWidth || 640}
              height={thumbHeight || 360}
              aspectRatio={16 / 9}
              priority={false}
              className="rounded-xl bg-slate-200"
            />
            {/* Audio duration badge - Top left (below selection if present) */}
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

          {/* Quick Actions + Dropdown - All in one row */}
          <div className="mt-3 flex items-center gap-2">
            {/* Listen button - Quick action */}
            {onListen && hasAudio && (
              <button
                className="h-10 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm flex items-center gap-1.5 transition-colors"
                style={{ minHeight: "44px", minWidth: "44px" }}
                aria-label="Listen to audio"
                onClick={(e) => {
                  e.stopPropagation();
                  onListen(id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onListen(id);
                  }
                }}
              >
                <Volume2 size={16} />
                <span className="hidden sm:inline">Listen</span>
              </button>
            )}

            {/* Edit button - Quick action */}
            {onEdit && (
              <button
                className="h-10 px-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium text-sm flex items-center gap-1.5 transition-colors"
                style={{ minHeight: "44px", minWidth: "44px" }}
                aria-label="Edit memory"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(id);
                  }
                }}
              >
                <Edit3 size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Three-dot menu - Right-aligned */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-auto h-10 w-10 grid place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  aria-label="More actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Toggle Favorite */}
                {onFavorite && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite(id);
                    }}
                    className="cursor-pointer"
                  >
                    <Star
                      size={16}
                      className="mr-2"
                      fill={favorited ? "currentColor" : "none"}
                    />
                    {favorited ? "Remove from Favorites" : "Add to Favorites"}
                  </DropdownMenuItem>
                )}

                {/* Manage Visibility */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisibilityModalOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-base">👁️</span>
                  </div>
                  Manage Visibility
                </DropdownMenuItem>

                {/* Duplicate Memory */}
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(id);
                    }}
                    className="cursor-pointer"
                  >
                    <Copy size={16} className="mr-2" />
                    Duplicate Memory
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Delete */}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(id);
                    }}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
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

        {/* Visibility Modal */}
        <VisibilityModal
          isOpen={visibilityModalOpen}
          onClose={() => setVisibilityModalOpen(false)}
          onSave={handleVisibilitySave}
          story={{
            title,
            onTimeline,
            inBook,
          }}
        />
      </>
    );
  }
);

MemoryCard.displayName = "MemoryCard";

export default MemoryCard;
