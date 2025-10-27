"use client";
import React from "react";

type Props = {
  stats: { 
    total: number;
    timeline: number;
    book: number;
    private: number;
    undated: number;
    favorites: number;
  };
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  filter: string;
  setFilter: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  filterMode: string;
  setFilterMode: (mode: string) => void;
};

/**
 * Senior-Friendly Memory Toolbar
 * 
 * Design principles applied:
 * - Large, clear text (16px+ for body, 24px+ for numbers)
 * - High contrast colors
 * - Touch targets minimum 44x44px (WCAG AAA)
 * - Simplified, uncluttered layout
 * - Clear visual hierarchy
 * 
 * Research: Based on "Optimizing mobile app design for older adults" systematic review
 * Key findings: Simplified navigation, enlarged text/touch targets, reduced cognitive load
 */
export default function MemoryToolbarV2(p: Props) {
  const statCards = [
    { key: "all", label: "Memories", value: p.stats.total, color: "#3b82f6" },
    { key: "timeline", label: "Timeline", value: p.stats.timeline, color: "#8b5cf6" },
    { key: "book", label: "Book", value: p.stats.book, color: "#ec4899" },
    { key: "private", label: "Private", value: p.stats.private, color: "#ef4444" },
    { key: "undated", label: "No Date", value: p.stats.undated, color: "#f59e0b" },
    { key: "favorites", label: "Favorites", value: p.stats.favorites, color: "#eab308" },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Cards Grid - Senior Friendly */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <button
            key={stat.key}
            onClick={() => p.setFilterMode(stat.key)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-lg
              border-2 transition-all duration-200
              hover:scale-105 hover:shadow-lg
              ${p.filterMode === stat.key 
                ? 'border-current bg-white shadow-md' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
            style={{
              borderColor: p.filterMode === stat.key ? stat.color : undefined,
              minHeight: '88px', // Larger touch target for seniors (2x standard 44px)
            }}
            aria-label={`Filter by ${stat.label}: ${stat.value} items`}
            aria-pressed={p.filterMode === stat.key}
          >
            {/* Number - Large and prominent */}
            <div 
              className="text-3xl md:text-4xl font-bold mb-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            {/* Label - Clear and readable */}
            <div className="text-sm md:text-base font-medium text-gray-700 text-center">
              {stat.label}
            </div>
          </button>
        ))}
      </div>

      {/* Controls Row - Search, Sort, View Toggle */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input - Larger for seniors */}
        <input
          type="search"
          className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Search memories..."
          value={p.filter}
          onChange={(e) => p.setFilter(e.target.value)}
          style={{ minHeight: '48px' }} // WCAG AAA touch target
        />

        {/* Sort Dropdown - Larger for seniors */}
        <select
          className="px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white cursor-pointer"
          value={p.sort}
          onChange={(e) => p.setSort(e.target.value)}
          style={{ minHeight: '48px' }}
        >
          <option value="year-newest">Newest → Oldest</option>
          <option value="year-oldest">Oldest → Newest</option>
          <option value="added-newest">Recently Added</option>
          <option value="added-oldest">First Added</option>
          <option value="title">Title A-Z</option>
          <option value="duration">Longest First</option>
        </select>

        {/* View Toggle - Larger buttons for seniors */}
        <div className="flex rounded-lg border-2 border-gray-300 bg-white overflow-hidden">
          <button
            onClick={() => p.setView("list")}
            className={`
              px-6 py-3 text-base font-medium transition-colors
              ${p.view === "list" 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
            style={{ minHeight: '48px', minWidth: '80px' }}
            aria-label="List view"
            aria-pressed={p.view === "list"}
          >
            List
          </button>
          <button
            onClick={() => p.setView("grid")}
            className={`
              px-6 py-3 text-base font-medium transition-colors border-l-2 border-gray-300
              ${p.view === "grid" 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
            style={{ minHeight: '48px', minWidth: '80px' }}
            aria-label="Grid view"
            aria-pressed={p.view === "grid"}
          >
            Grid
          </button>
        </div>
      </div>
    </div>
  );
}
