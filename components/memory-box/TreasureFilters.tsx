"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
 * Dropdown Filter for Treasures (Senior-Friendly)
 *
 * Filters treasures by category using a dropdown:
 * - All options visible when opened
 * - Large tap targets (48px+ height)
 * - Clear selection indicator
 * - No hidden scrolling
 */
export function TreasureFilters({
  activeFilter,
  onFilterChange,
  counts,
}: Props) {
  const filters: { key: TreasureFilterType; label: string; count: number }[] = [
    { key: "all", label: "All Treasures", count: counts.all },
    { key: "photos", label: "Photos", count: counts.photos },
    { key: "documents", label: "Documents", count: counts.documents },
    { key: "heirlooms", label: "Heirlooms", count: counts.heirlooms },
    { key: "keepsakes", label: "Keepsakes", count: counts.keepsakes },
    { key: "recipes", label: "Recipes", count: counts.recipes },
    { key: "memorabilia", label: "Memorabilia", count: counts.memorabilia },
  ];

  const activeLabel = filters.find((f) => f.key === activeFilter)?.label || "All Treasures";
  const activeCount = filters.find((f) => f.key === activeFilter)?.count || 0;

  return (
    <div className="mb-6">
      <Select value={activeFilter} onValueChange={(value) => onFilterChange(value as TreasureFilterType)}>
        <SelectTrigger
          className="w-full h-12 px-4 text-base font-medium border-2 border-gray-300 rounded-xl
                     bg-white hover:border-[#3E6A5A]/50 focus:border-[#3E6A5A] focus:ring-2 focus:ring-[#3E6A5A]/20
                     transition-all duration-200"
          aria-label="Filter treasures by category"
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
    </div>
  );
}
