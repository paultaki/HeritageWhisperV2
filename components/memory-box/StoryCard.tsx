"use client";
import React, { useState } from "react";
import { Heart, MoreVertical, Play, Edit3, Trash2, Copy, Volume2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { VisibilityModal } from "./VisibilityModal";
import { StoryPhotoWithBlurExtend } from "@/components/StoryPhotoWithBlurExtend";

type Props = {
  id: string;
  title: string;
  preview: string; // Kept for backwards compatibility but not displayed
  imageUrl: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  photoWidth?: number;
  photoHeight?: number;
  year?: number | null;
  age?: string;
  durationSeconds?: number;
  isFavorite: boolean;
  inTimeline: boolean;
  inBook: boolean;
  isPrivate: boolean;
  onView?: () => void; // NEW: Opens overlay
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleTimeline?: () => void;
  onToggleBook?: () => void;
  onDuplicate?: () => void;
};

/**
 * StoryCard V6 - Premium & Simple (Treasure-style)
 *
 * Changes:
 * - Removed bottom action bar (Listen/Edit buttons)
 * - Added large Play overlay on hover/idle
 * - Increased Title font size
 * - Moved Edit to dropdown
 * - Consistent 16:10 aspect ratio
 */
export function StoryCard({
  id,
  title,
  preview, // Not used but kept for compatibility
  imageUrl,
  photoTransform,
  photoWidth,
  photoHeight,
  year,
  age,
  durationSeconds = 0,
  isFavorite,
  inTimeline,
  inBook,
  isPrivate,
  onView, // NEW: Opens overlay
  onPlay,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleTimeline,
  onToggleBook,
  onDuplicate,
}: Props) {
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.();
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavoriting) return;

    setIsFavoriting(true);
    onToggleFavorite?.();

    // Reset after animation (120ms for micro-interaction)
    setTimeout(() => setIsFavoriting(false), 120);
  };

  const handleVisibilitySave = (settings: {
    onTimeline: boolean;
    inBook: boolean;
  }) => {
    if (settings.onTimeline !== inTimeline) {
      onToggleTimeline?.();
    }
    if (settings.inBook !== inBook) {
      onToggleBook?.();
    }
  };

  return (
    <>
      <article
        className="story-card group bg-white rounded-2xl overflow-hidden border border-black/8 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer w-full flex flex-col"
        style={{ maxWidth: "480px" }}
        onClick={onView}
      >
        {/* Image Container - 16:10 Aspect Ratio */}
        <div className="relative">
          <StoryPhotoWithBlurExtend
            src={imageUrl}
            alt={title}
            width={photoWidth}
            height={photoHeight}
            transform={photoTransform}
            aspectRatio={16 / 10}
            className="rounded-t-2xl overflow-hidden"
          />

          {/* Play Button Overlay - Center */}
          {durationSeconds > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
              <button
                onClick={handlePlayClick}
                className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110 active:scale-95 group-hover:bg-white"
                aria-label="Play story"
              >
                <Play className="w-6 h-6 text-heritage-coral ml-1" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Duration Badge - Bottom Left */}
          {durationSeconds > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              {formatDuration(durationSeconds)}
            </div>
          )}

          {/* Favorite Button - Top Right */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all"
            style={{ minWidth: "36px", minHeight: "36px" }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all duration-75",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600",
                isFavoriting && "scale-125"
              )}
            />
          </button>
        </div>

        {/* Card Content */}
        <div className="px-5 pt-4 pb-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            {/* Title and Metadata */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
                {title}
              </h3>
              <div className="text-base text-gray-500 font-medium">
                {year ? (
                  <>
                    {year}
                    {age && <span className="text-gray-400"> • Age {age}</span>}
                  </>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1">
                    Timeless
                  </span>
                )}
              </div>
            </div>

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors -mr-2"
                  style={{ minHeight: "40px", minWidth: "40px" }}
                  aria-label="More actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Play Option */}
                {onPlay && durationSeconds > 0 && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay();
                    }}
                    className="cursor-pointer"
                  >
                    <Play size={16} className="mr-2" />
                    Play Story
                  </DropdownMenuItem>
                )}

                {/* Edit Details */}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="cursor-pointer"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Edit Details
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
                  <span className="text-base mr-2">👁️</span>
                  Manage Visibility
                </DropdownMenuItem>

                {/* Duplicate Memory */}
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate();
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
                      onDelete();
                    }}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </article>

      {/* Visibility Modal */}
      <VisibilityModal
        isOpen={visibilityModalOpen}
        onClose={() => setVisibilityModalOpen(false)}
        onSave={handleVisibilitySave}
        story={{
          title,
          onTimeline: inTimeline,
          inBook: inBook,
        }}
      />
    </>
  );
}
