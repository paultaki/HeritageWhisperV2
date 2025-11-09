"use client";
import React, { useState } from "react";
import { Volume2, Edit3, MoreVertical, Star, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusIcons } from "./StatusIcons";
import { VisibilityModal } from "./VisibilityModal";

type Props = {
  id: string;
  title: string;
  preview: string; // Kept for backwards compatibility but not displayed
  imageUrl: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
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
 * StoryCard V5 - Management-First with Enhanced Typography
 *
 * Key changes:
 * - Replaced Timeline/Book badges with subtle top-right StatusIcons
 * - Added visible Listen and Edit quick action buttons at bottom
 * - Redesigned dropdown: Toggle Favorite, Manage Visibility, Duplicate, Delete
 * - Integrated VisibilityModal for Timeline/Book management
 * - 16:10 aspect ratio for consistent image sizing
 * - Larger fonts: title (18px), metadata (16px), buttons (16px)
 *
 * Design principles:
 * - Management interface (not display showcase)
 * - Minimize visual clutter with status icons
 * - Quick actions always visible for common tasks
 * - Dropdown for secondary actions
 * - 44x44px minimum touch targets (WCAG AAA)
 * - 2-column mobile layout (grid-cols-2)
 */
export function StoryCard({
  id,
  title,
  preview, // Not used but kept for compatibility
  imageUrl,
  photoTransform,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    onPlay?.();
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
      <article className="bg-white rounded-xl border-2 border-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col">
        {/* Thumbnail with 16:10 Aspect Ratio */}
        <div
          className="relative overflow-hidden cursor-pointer aspect-[16/10] w-full"
          onClick={onView}
        >
          <img
            className="w-full h-full object-cover"
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            style={
              photoTransform
                ? {
                    transform: `scale(${photoTransform.zoom}) translate(${photoTransform.position.x / photoTransform.zoom}px, ${photoTransform.position.y / photoTransform.zoom}px)`,
                    transformOrigin: "center center",
                  }
                : undefined
            }
          />

          {/* Duration Badge - Top left */}
          {durationSeconds > 0 && (
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
              <Volume2 className="w-4 h-4" />
              {formatDuration(durationSeconds)}
            </div>
          )}

          {/* Status Icons - Top right */}
          <div className="absolute top-3 right-3">
            <StatusIcons
              onTimeline={inTimeline}
              inBook={inBook}
              isFavorite={isFavorite}
              isPrivate={isPrivate}
            />
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title and Year - Compact */}
          <div className="mb-3 flex-1">
            <h3
              className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-heritage-coral transition-colors"
              onClick={onView}
            >
              {title}
            </h3>
            <div className="text-base text-gray-600 font-medium">
              {year ? (
                <>
                  {year}
                  {age && <span className="text-gray-400"> • Age {age}</span>}
                </>
              ) : (
                <span className="text-gray-400 flex items-center gap-1">
                  ☁️ Timeless
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions + Dropdown - All Visible */}
          <div className="flex items-center gap-2 mt-auto">
            {/* Listen button - Quick action */}
            {onPlay && durationSeconds > 0 && (
              <button
                onClick={handlePlayClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors font-medium text-base"
                style={{ minHeight: "44px" }}
                aria-label="Listen to story"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Listen</span>
              </button>
            )}

            {/* Edit button - Quick action */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors font-medium text-base"
                style={{ minHeight: "44px" }}
                aria-label="Edit story"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  aria-label="More actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Toggle Favorite */}
                {onToggleFavorite && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                    className="cursor-pointer"
                  >
                    <Star
                      size={16}
                      className="mr-2"
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
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
