"use client";
import React from "react";

export type TreasureFilterType = "all" | "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";

type Props = {
  activeFilter: TreasureFilterType;
  onFilterChange: (filter: TreasureFilterType) => void;
  counts: {
    all: number;
    photos: number;
    documents: number;
    heirlooms: number;
    keepsakes: number;
    recipes: number;
    memorabilia: number;
  };
};

/**
 * Minimal Filter Chips for Treasures
 *
 * Filters treasures by category without emojis:
 * - All, Photos, Documents, Heirlooms, Keepsakes, Recipes, Memorabilia
 * - Active: filled heritage-brown background
 * - Inactive: outline with transparent background
 * - Shows counts in parentheses
 */
export function TreasureFilters({
  activeFilter,
  onFilterChange,
  counts,
}: Props) {
  const filters = [
    {
      key: "all" as TreasureFilterType,
      label: "All",
      count: counts.all,
    },
    {
      key: "photos" as TreasureFilterType,
      label: "Photos",
      count: counts.photos,
    },
    {
      key: "documents" as TreasureFilterType,
      label: "Documents",
      count: counts.documents,
    },
    {
      key: "heirlooms" as TreasureFilterType,
      label: "Heirlooms",
      count: counts.heirlooms,
    },
    {
      key: "keepsakes" as TreasureFilterType,
      label: "Keepsakes",
      count: counts.keepsakes,
    },
    {
      key: "recipes" as TreasureFilterType,
      label: "Recipes",
      count: counts.recipes,
    },
    {
      key: "memorabilia" as TreasureFilterType,
      label: "Memorabilia",
      count: counts.memorabilia,
    },
  ];

  return (
    <div className="mb-6">
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
            aria-label={`Filter by ${filter.label}: ${filter.count} treasures`}
            aria-pressed={activeFilter === filter.key}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>
    </div>
  );
}
