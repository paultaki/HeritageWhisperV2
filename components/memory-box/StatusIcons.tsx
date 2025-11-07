"use client";

import { Calendar, BookOpen, Star, Lock } from "lucide-react";

type StatusIconsProps = {
  onTimeline: boolean;
  inBook: boolean;
  isFavorite: boolean;
  isPrivate: boolean; // True when BOTH timeline AND book are false
};

/**
 * StatusIcons - Subtle top-right corner indicators
 *
 * Design principles:
 * - Icons gray when excluded, accent color when included
 * - Favorite star only shows when favorited
 * - Private lock only shows when fully private (no timeline, no book)
 * - 20x20px icons (subtle but recognizable)
 * - Horizontal row with 4px gap
 *
 * Color strategy:
 * - Timeline: Purple (#8B5CF6) when active
 * - Book: Pink (#EC4899) when active
 * - Favorite: Amber (#F59E0B) always
 * - Private: Red (#EF4444) always
 * - Inactive: Gray (#9CA3AF)
 */
export function StatusIcons({
  onTimeline,
  inBook,
  isFavorite,
  isPrivate,
}: StatusIconsProps) {
  return (
    <div className="flex items-center gap-1" aria-label="Memory status">
      {/* Timeline icon */}
      <div
        className={`${
          onTimeline ? "text-purple-600" : "text-gray-400"
        } transition-colors`}
        title={onTimeline ? "In Timeline" : "Not in Timeline"}
        aria-label={onTimeline ? "In Timeline" : "Not in Timeline"}
      >
        <Calendar size={20} strokeWidth={2} aria-hidden="true" />
      </div>

      {/* Book icon */}
      <div
        className={`${
          inBook ? "text-pink-600" : "text-gray-400"
        } transition-colors`}
        title={inBook ? "In Book" : "Not in Book"}
        aria-label={inBook ? "In Book" : "Not in Book"}
      >
        <BookOpen size={20} strokeWidth={2} aria-hidden="true" />
      </div>

      {/* Favorite star - Only visible when favorited */}
      {isFavorite && (
        <div
          className="text-amber-500"
          title="Favorited"
          aria-label="Favorited"
        >
          <Star size={20} fill="currentColor" strokeWidth={2} aria-hidden="true" />
        </div>
      )}

      {/* Private lock - Only visible when fully private */}
      {isPrivate && (
        <div
          className="text-red-600"
          title="Private (not in Timeline or Book)"
          aria-label="Private memory"
        >
          <Lock size={20} strokeWidth={2} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
