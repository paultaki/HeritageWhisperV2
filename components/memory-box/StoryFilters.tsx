"use client";
import React from "react";

export type StoryFilterType = "all" | "favorites" | "decades" | "timeless" | "shared" | "private";

type Props = {
  activeFilter: StoryFilterType;
  onFilterChange: (filter: StoryFilterType) => void;
  counts: {
    all: number;
    favorites: number;
    decades: number;
    timeless: number;
    shared: number;
    private: number;
  };
  selectedDecade?: string;
  availableDecades: string[];
  onDecadeChange?: (decade: string) => void;
};

/**
 * Minimal Filter Chips for Stories
 *
 * Compact pill-style filters without emojis:
 * - All, Favorites, By decade, Timeless, Shared, Private
 * - Active: filled heritage-brown background
 * - Inactive: outline with transparent background
 * - Shows counts in parentheses
 */
export function StoryFilters({
  activeFilter,
  onFilterChange,
  counts,
  selectedDecade,
  availableDecades,
  onDecadeChange,
}: Props) {
  const filters = [
    {
      key: "all" as StoryFilterType,
      label: "All",
      count: counts.all,
    },
    {
      key: "favorites" as StoryFilterType,
      label: "Favorites",
      count: counts.favorites,
    },
    {
      key: "decades" as StoryFilterType,
      label: "By decade",
      count: counts.decades,
    },
    {
      key: "timeless" as StoryFilterType,
      label: "Timeless",
      count: counts.timeless,
    },
    {
      key: "shared" as StoryFilterType,
      label: "Shared",
      count: counts.shared,
    },
    {
      key: "private" as StoryFilterType,
      label: "Private",
      count: counts.private,
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Filter Chips - Horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${activeFilter === filter.key
                ? "bg-heritage-brown text-white"
                : "border border-gray-300 bg-transparent text-gray-700 hover:border-heritage-brown/30"
              }
            `}
            aria-label={`Filter by ${filter.label}: ${filter.count} stories`}
            aria-pressed={activeFilter === filter.key}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Decade Selector (shown when "By decade" is active) */}
      {activeFilter === "decades" && availableDecades.length > 0 && onDecadeChange && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Choose a decade:</div>
          <div className="flex flex-wrap gap-2">
            {availableDecades.map((decade) => (
              <button
                key={decade}
                onClick={() => onDecadeChange(decade)}
                className={`
                  px-4 py-2 rounded-full text-sm font-semibold
                  transition-all duration-200
                  ${selectedDecade === decade
                    ? "bg-heritage-brown text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-heritage-brown/30"
                  }
                `}
                style={{ minHeight: "36px" }}
              >
                {decade}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
