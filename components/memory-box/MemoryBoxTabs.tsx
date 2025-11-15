"use client";
import React from "react";

type TabType = "stories" | "treasures";

type Props = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showStoriesTab?: boolean; // Hide Stories tab for viewers
};

/**
 * Minimal Segmented Control for Memory Box Tabs
 *
 * Design principles:
 * - Compact horizontal pill layout
 * - 48px height (senior-friendly touch target)
 * - Active: filled heritage-brown background
 * - Inactive: outline with transparent background
 * - No emojis, clean text-only labels
 * - Clean "Stories | Treasures" segmentation
 */
export function MemoryBoxTabs({ activeTab, onTabChange, showStoriesTab = true }: Props) {
  return (
    <div className="flex gap-2 mb-6">
      {/* Only show Stories tab if showStoriesTab is true (owners only) */}
      {showStoriesTab && (
        <button
          onClick={() => onTabChange("stories")}
          className={`
            flex-1 rounded-lg px-6 py-3 text-base font-semibold
            transition-all duration-200
            ${activeTab === "stories"
              ? "bg-heritage-brown text-white"
              : "border-2 border-gray-300 bg-transparent text-gray-700 hover:border-heritage-brown/30"
            }
          `}
          style={{ minHeight: "48px" }}
          aria-pressed={activeTab === "stories"}
        >
          Stories
        </button>
      )}

      <button
        onClick={() => onTabChange("treasures")}
        className={`
          flex-1 rounded-lg px-6 py-3 text-base font-semibold
          transition-all duration-200
          ${activeTab === "treasures"
            ? "bg-heritage-brown text-white"
            : "border-2 border-gray-300 bg-transparent text-gray-700 hover:border-heritage-brown/30"
          }
        `}
        style={{ minHeight: "48px" }}
        aria-pressed={activeTab === "treasures"}
      >
        Treasures
      </button>
    </div>
  );
}
