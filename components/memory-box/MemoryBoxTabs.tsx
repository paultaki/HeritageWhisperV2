"use client";
import React from "react";

type TabType = "stories" | "treasures";

type Props = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  storiesCount: number;
  treasuresCount: number;
  showStoriesTab?: boolean; // Hide Stories tab for viewers
};

/**
 * Senior-Friendly Tab Navigation for Memory Box
 *
 * Design principles:
 * - 60px tall buttons for easy tapping
 * - 20px font size for readability
 * - High contrast active states
 * - Clear visual feedback
 * - Emotional, non-technical language
 */
export function MemoryBoxTabs({ activeTab, onTabChange, storiesCount, treasuresCount, showStoriesTab = true }: Props) {
  return (
    <div className="flex gap-3 mb-6">
      {/* Only show Stories tab if showStoriesTab is true (owners only) */}
      {showStoriesTab && (
        <button
          onClick={() => onTabChange("stories")}
          className={`
            flex-1 rounded-xl transition-all duration-200
            ${activeTab === "stories"
              ? "bg-heritage-brown text-white shadow-lg scale-105"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-heritage-brown/30"
            }
          `}
          style={{ minHeight: "60px" }}
          aria-pressed={activeTab === "stories"}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">📖</span>
            <div className="text-left">
              <div className="text-lg md:text-xl font-semibold">Manage My Stories</div>
              <div className={`text-sm ${activeTab === "stories" ? "text-white/80" : "text-gray-500"}`}>
                {storiesCount} {storiesCount === 1 ? "memory" : "memories"}
              </div>
            </div>
          </div>
        </button>
      )}

      <button
        onClick={() => onTabChange("treasures")}
        className={`
          flex-1 rounded-xl transition-all duration-200
          ${activeTab === "treasures"
            ? "bg-heritage-brown text-white shadow-lg scale-105"
            : "bg-white text-gray-700 border-2 border-gray-200 hover:border-heritage-brown/30"
          }
        `}
        style={{ minHeight: "60px" }}
        aria-pressed={activeTab === "treasures"}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💎</span>
          <div className="text-left">
            <div className="text-lg md:text-xl font-semibold">My Treasures</div>
            <div className={`text-sm ${activeTab === "treasures" ? "text-white/80" : "text-gray-500"}`}>
              {treasuresCount} {treasuresCount === 1 ? "item" : "items"}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
