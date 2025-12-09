"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
 * Dropdown Filter for Stories (Senior-Friendly)
 *
 * Filters stories using a dropdown:
 * - All options visible when opened
 * - Large tap targets (48px+ height)
 * - Clear selection indicator
 * - Decade sub-selector when "By decade" is chosen
 */
export function StoryFilters({
  activeFilter,
  onFilterChange,
  counts,
  selectedDecade,
  availableDecades,
  onDecadeChange,
}: Props) {
  const filters: { key: StoryFilterType; label: string; count: number }[] = [
    { key: "all", label: "All Stories", count: counts.all },
    { key: "favorites", label: "Favorites", count: counts.favorites },
    { key: "decades", label: "By Decade", count: counts.decades },
    { key: "timeless", label: "Timeless", count: counts.timeless },
    { key: "shared", label: "Shared", count: counts.shared },
    { key: "private", label: "Private", count: counts.private },
  ];

  const activeLabel = filters.find((f) => f.key === activeFilter)?.label || "All Stories";
  const activeCount = filters.find((f) => f.key === activeFilter)?.count || 0;

  return (
    <div className="space-y-4 mb-6">
      <Select value={activeFilter} onValueChange={(value) => onFilterChange(value as StoryFilterType)}>
        <SelectTrigger
          className="w-full h-12 px-4 text-base font-medium border-2 border-gray-300 rounded-xl
                     bg-white hover:border-[#3E6A5A]/50 focus:border-[#3E6A5A] focus:ring-2 focus:ring-[#3E6A5A]/20
                     transition-all duration-200"
          aria-label="Filter stories"
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{activeLabel}</span>
              <span className="text-gray-500">({activeCount})</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden"
          position="popper"
          sideOffset={4}
        >
          {filters.map((filter) => (
            <SelectItem
              key={filter.key}
              value={filter.key}
              className="h-12 px-4 text-base cursor-pointer hover:bg-gray-50 focus:bg-gray-100
                         data-[state=checked]:bg-[#3E6A5A]/10 data-[state=checked]:text-[#3E6A5A]"
            >
              <span className="flex items-center justify-between w-full gap-4">
                <span>{filter.label}</span>
                <span className="text-gray-500 text-sm">({filter.count})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Decade Selector (shown when "By decade" is active) */}
      {activeFilter === "decades" && availableDecades.length > 0 && onDecadeChange && (
        <Select value={selectedDecade || ""} onValueChange={onDecadeChange}>
          <SelectTrigger
            className="w-full h-12 px-4 text-base font-medium border-2 border-gray-200 rounded-xl
                       bg-gray-50 hover:border-[#3E6A5A]/50 focus:border-[#3E6A5A] focus:ring-2 focus:ring-[#3E6A5A]/20
                       transition-all duration-200"
            aria-label="Choose a decade"
          >
            <SelectValue placeholder="Choose a decade..." />
          </SelectTrigger>
          <SelectContent
            className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden"
            position="popper"
            sideOffset={4}
          >
            {availableDecades.map((decade) => (
              <SelectItem
                key={decade}
                value={decade}
                className="h-12 px-4 text-base cursor-pointer hover:bg-gray-50 focus:bg-gray-100
                           data-[state=checked]:bg-[#3E6A5A]/10 data-[state=checked]:text-[#3E6A5A]"
              >
                {decade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
