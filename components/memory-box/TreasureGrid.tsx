"use client";
import React from "react";
import { Camera, FileText, Gem, Home, UtensilsCrossed } from "lucide-react";

export type TreasureType = "photo" | "document" | "heirloom" | "place" | "recipe";

type Treasure = {
  id: string;
  type: TreasureType;
  title: string;
  imageUrl: string;
  description?: string;
  date?: string;
};

type Props = {
  treasures: Treasure[];
  onTreasureClick?: (treasure: Treasure) => void;
};

/**
 * Treasure Grid for Photos, Heirlooms, Documents
 *
 * Categories:
 * - Family Photos 📷
 * - Documents 📄
 * - Heirlooms 💍
 * - Places 🏠
 * - Recipes 🍳
 *
 * This is a placeholder component for future treasure management.
 * Currently shows a beautiful empty state encouraging users to add treasures.
 */
export function TreasureGrid({ treasures, onTreasureClick }: Props) {
  const treasureIcons: Record<TreasureType, { icon: React.ReactNode; label: string; color: string }> = {
    photo: { icon: <Camera className="w-6 h-6" />, label: "Family Photos", color: "#3B82F6" },
    document: { icon: <FileText className="w-6 h-6" />, label: "Documents", color: "#8B5CF6" },
    heirloom: { icon: <Gem className="w-6 h-6" />, label: "Heirlooms", color: "#EC4899" },
    place: { icon: <Home className="w-6 h-6" />, label: "Places", color: "#10B981" },
    recipe: { icon: <UtensilsCrossed className="w-6 h-6" />, label: "Recipes", color: "#F59E0B" },
  };

  // Empty state - Coming Soon
  if (treasures.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-4">💎</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Your Treasure Chest
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            A special place for photos, documents, and heirlooms that aren't tied to specific stories yet.
            Perfect for organizing family recipes, old letters, or precious keepsakes.
          </p>

          {/* Category Preview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(treasureIcons).map(([type, { icon, label, color }]) => (
              <div
                key={type}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="mb-2" style={{ color }}>
                  {icon}
                </div>
                <div className="text-sm font-medium text-gray-700 text-center">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <div className="text-sm font-semibold text-blue-900 mb-2">✨ Coming Soon</div>
            <p className="text-sm text-blue-800">
              We're building a beautiful way for you to organize and cherish your precious keepsakes.
              For now, you can attach photos to your stories in the Stories section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Grid view for treasures (when feature is implemented)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {treasures.map((treasure) => {
        const { icon, label, color } = treasureIcons[treasure.type];

        return (
          <button
            key={treasure.id}
            onClick={() => onTreasureClick?.(treasure)}
            className="bg-white rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden text-left"
          >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ height: "160px" }}>
              <img
                src={treasure.imageUrl}
                alt={treasure.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Type Badge */}
              <div
                className="absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="text-xs font-semibold mb-1" style={{ color }}>
                {label}
              </div>
              <div className="text-sm font-bold text-gray-900 line-clamp-2">
                {treasure.title}
              </div>
              {treasure.date && (
                <div className="text-xs text-gray-500 mt-1">
                  {treasure.date}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
