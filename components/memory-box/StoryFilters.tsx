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
 * Emotional, Visual Filter Categories for Stories
 *
 * Replaces technical filters with human-centered language:
 * - ⭐ Favorites (gold star icon)
 * - 📅 By Decade (1950s, 1960s, etc.)
 * - ☁️ Timeless (stories without dates)
 * - 🏠 Shared (in family book/timeline)
 * - 🔒 Private (just for me)
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
      icon: "📚",
      label: "All Stories",
      count: counts.all,
      color: "#8B4513",
    },
    {
      key: "favorites" as StoryFilterType,
      icon: "⭐",
      label: "Favorites",
      count: counts.favorites,
      color: "#F59E0B",
    },
    {
      key: "decades" as StoryFilterType,
      icon: "📅",
      label: "By Decade",
      count: counts.decades,
      color: "#8B5CF6",
    },
    {
      key: "timeless" as StoryFilterType,
      icon: "☁️",
      label: "Timeless",
      count: counts.timeless,
      color: "#60A5FA",
      description: "Stories without dates",
    },
    {
      key: "shared" as StoryFilterType,
      icon: "🏠",
      label: "Shared",
      count: counts.shared,
      color: "#10B981",
      description: "In your book or timeline",
    },
    {
      key: "private" as StoryFilterType,
      icon: "🔒",
      label: "Private",
      count: counts.private,
      color: "#EF4444",
      description: "Just for you",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-xl
              border-2 transition-all duration-200
              hover:scale-105 hover:shadow-md
              ${activeFilter === filter.key
                ? "border-current bg-white shadow-lg scale-105"
                : "border-gray-200 bg-white hover:border-gray-300"
              }
            `}
            style={{
              borderColor: activeFilter === filter.key ? filter.color : undefined,
              minHeight: "100px",
            }}
            aria-label={`Filter by ${filter.label}: ${filter.count} stories`}
            aria-pressed={activeFilter === filter.key}
            title={filter.description}
          >
            {/* Icon */}
            <div className="text-3xl mb-2">{filter.icon}</div>

            {/* Label */}
            <div
              className="text-base font-semibold mb-1 text-center"
              style={{ color: activeFilter === filter.key ? filter.color : "#374151" }}
            >
              {filter.label}
            </div>

            {/* Count */}
            <div className="text-sm text-gray-600">
              {filter.count}
            </div>
          </button>
        ))}
      </div>

      {/* Decade Selector (shown when "By Decade" is active) */}
      {activeFilter === "decades" && availableDecades.length > 0 && onDecadeChange && (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Choose a decade:</div>
          <div className="flex flex-wrap gap-2">
            {availableDecades.map((decade) => (
              <button
                key={decade}
                onClick={() => onDecadeChange(decade)}
                className={`
                  px-4 py-2 rounded-lg text-base font-semibold
                  transition-all duration-200
                  ${selectedDecade === decade
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                  }
                `}
                style={{ minHeight: "44px" }}
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
