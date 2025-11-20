"use client";
import React from "react";
import { QuickStatsBar } from "./QuickStatsBar";
import { MemoryBoxTabs } from "./MemoryBoxTabs";
import { StoryFilters, type StoryFilterType } from "./StoryFilters";
import { TreasureFilters, type TreasureFilterType } from "./TreasureFilters";

type TabType = "stories" | "treasures";

type Props = {
  // Tab state
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showStoriesTab?: boolean;

  // Stats
  stats: {
    storiesCount: number;
    totalHours: number;
    treasuresCount: number;
    // Story filter counts
    all: number;
    favorites: number;
    decades: number;
    timeless: number;
    shared: number;
    private: number;
  };
  treasureCounts: {
    all: number;
    photos: number;
    documents: number;
    heirlooms: number;
    keepsakes: number;
    recipes: number;
    memorabilia: number;
  };
  isOwnAccount?: boolean;
  storytellerName?: string;

  // Search state
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Story filters state
  storyFilter: StoryFilterType;
  onStoryFilterChange: (filter: StoryFilterType) => void;
  selectedDecade?: string;
  availableDecades: string[];
  onDecadeChange?: (decade: string) => void;

  // Treasure filters state
  treasureFilter: TreasureFilterType;
  onTreasureFilterChange: (filter: TreasureFilterType) => void;
};

/**
 * Memory Box Header - Minimal dashboard header
 *
 * Consolidates:
 * - Title (serif "Memory Box")
 * - Inline stats (stories • time • treasures)
 * - Segmented control (Stories | Treasures)
 * - Universal search bar
 * - Filter chips (context-aware for Stories or Treasures)
 *
 * Reduces header height from ~364px to ~200px
 */
export function MemoryBoxHeader({
  activeTab,
  onTabChange,
  showStoriesTab = true,
  stats,
  treasureCounts,
  isOwnAccount = true,
  storytellerName,
  searchQuery,
  onSearchChange,
  storyFilter,
  onStoryFilterChange,
  selectedDecade,
  availableDecades,
  onDecadeChange,
  treasureFilter,
  onTreasureFilterChange,
}: Props) {
  return (
    <div className="space-y-6 mb-6">
      {/* Title Section */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-2">
          Memory Box
        </h1>
        <QuickStatsBar
          storiesCount={stats.storiesCount}
          totalHours={stats.totalHours}
          treasuresCount={stats.treasuresCount}
          isOwnAccount={isOwnAccount}
          storytellerName={storytellerName}
        />
      </div>

      {/* Segmented Control */}
      <MemoryBoxTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        showStoriesTab={showStoriesTab}
      />

      {/* Search Bar */}
      <div>
        <input
          type="search"
          className="w-full px-5 py-3 text-base border-2 border-gray-300 rounded-xl
                     focus:border-[#203954] focus:ring-2 focus:ring-[#203954]/20 outline-none
                     transition-all duration-200"
          placeholder="Search by name, person, or place..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ minHeight: "48px" }}
        />
      </div>

      {/* Filter Chips - Context-aware based on active tab */}
      {activeTab === "stories" ? (
        <StoryFilters
          activeFilter={storyFilter}
          onFilterChange={onStoryFilterChange}
          counts={{
            all: stats.all,
            favorites: stats.favorites,
            decades: stats.decades,
            timeless: stats.timeless,
            shared: stats.shared,
            private: stats.private,
          }}
          selectedDecade={selectedDecade}
          availableDecades={availableDecades}
          onDecadeChange={onDecadeChange}
        />
      ) : (
        <TreasureFilters
          activeFilter={treasureFilter}
          onFilterChange={onTreasureFilterChange}
          counts={treasureCounts}
        />
      )}
    </div>
  );
}
