"use client";
import React, { useState } from "react";
import { Volume2, Heart, Edit3, Trash2, BookOpen, CalendarDays } from "lucide-react";

type Props = {
  id: string;
  title: string;
  preview: string; // First 50 words
  imageUrl: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  year?: number | null;
  age?: string;
  durationSeconds?: number;
  isFavorite: boolean;
  inTimeline: boolean;
  inBook: boolean;
  isPrivate: boolean;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleTimeline?: () => void;
  onToggleBook?: () => void;
};

/**
 * Senior-Friendly Story Card - Large Format
 *
 * Design principles:
 * - Large thumbnail for visual recognition
 * - 18px minimum font for title
 * - Preview text for context (first 50 words)
 * - Duration badge: "3 min listen" 🔊
 * - Visual status badges (not text)
 * - All buttons visible (no dropdowns)
 * - 44x44px minimum touch targets
 */
export function StoryCard({
  id,
  title,
  preview,
  imageUrl,
  photoTransform,
  year,
  age,
  durationSeconds = 0,
  isFavorite,
  inTimeline,
  inBook,
  isPrivate,
  onPlay,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleTimeline,
  onToggleBook,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min listen`;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    onPlay?.();
  };

  return (
    <article className="bg-white rounded-xl border-2 border-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden">
      {/* Compact Thumbnail */}
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{ height: "140px" }}
        onClick={onEdit}
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

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {/* Duration Badge */}
          <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
            <Volume2 className="w-4 h-4" />
            {formatDuration(durationSeconds)}
          </div>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          {/* Favorite Star */}
          {isFavorite && (
            <div className="bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg">
              ⭐
            </div>
          )}
        </div>

        {/* Status Badges - Bottom */}
        {!isPrivate && (
          <div className="absolute bottom-3 left-3 flex gap-2">
            {inTimeline && (
              <div className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                Timeline
              </div>
            )}
            {inBook && (
              <div className="bg-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Book
              </div>
            )}
          </div>
        )}

        {isPrivate && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
              🔒 Private
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title and Year - Compact */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
            {title}
          </h3>
          <div className="text-sm text-gray-600 font-medium">
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

        {/* Action Buttons - All Visible */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handlePlayClick}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
            style={{ minHeight: "44px" }}
            aria-label="Listen to story"
          >
            <Volume2 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Listen</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            style={{ minHeight: "44px" }}
            aria-label="Edit story"
          >
            <Edit3 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Edit</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isFavorite
                ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
            }`}
            style={{ minHeight: "44px" }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-5 h-5 mb-1 ${isFavorite ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Favorite</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
            style={{ minHeight: "44px" }}
            aria-label="Delete story"
          >
            <Trash2 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
