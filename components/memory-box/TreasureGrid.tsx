"use client";
import React, { useMemo } from "react";
import { Camera, FileText, Gem, Home, ChefHat, Award, Plus } from "lucide-react";
import { TreasureCard } from "./TreasureCard";

export type TreasureCategory = "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";

type Treasure = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  displayUrl?: string;
  masterUrl?: string;
  transform?: { zoom: number; position: { x: number; y: number } };
  category: TreasureCategory;
  year?: number;
  isFavorite: boolean;
  linkedStoryId?: string;
};

type Props = {
  treasures: Treasure[];
  isLoading?: boolean;
  readOnly?: boolean;
  onAddTreasure?: () => void;
  onToggleFavorite?: (id: string) => void;
  onLinkToStory?: (id: string) => void;
  onCreateStory?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
};

/**
 * Treasure Grid - Masonry Layout for Visual Keepsakes
 *
 * Categories:
 * - Family Photos 📷
 * - Documents 📄
 * - Heirlooms 💎
 * - Keepsakes 🏠
 * - Recipes 👨‍🍳
 * - Memorabilia 🏆
 */
export function TreasureGrid({
  treasures,
  isLoading = false,
  readOnly = false,
  onAddTreasure,
  onToggleFavorite,
  onLinkToStory,
  onCreateStory,
  onEdit,
  onDownload,
  onDelete,
}: Props) {
  const treasureCategories = {
    photos: { icon: Camera, label: "Family Photos", color: "#3B82F6" },
    documents: { icon: FileText, label: "Documents", color: "#6B7280" },
    heirlooms: { icon: Gem, label: "Heirlooms", color: "#A855F7" },
    keepsakes: { icon: Home, label: "Keepsakes", color: "#10B981" },
    recipes: { icon: ChefHat, label: "Recipes", color: "#F97316" },
    memorabilia: { icon: Award, label: "Memorabilia", color: "#EAB308" },
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="treasure-grid">
        <style jsx>{`
          .treasure-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          @media (min-width: 768px) {
            .treasure-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1280px) {
            .treasure-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 animate-pulse rounded-2xl border border-gray-200"
            style={{ height: "320px", maxWidth: "480px" }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (treasures.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 md:p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <Gem className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Your Treasure Chest
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            A special place for photos, documents, and heirlooms that aren't tied to specific stories yet.
          </p>

          {/* Category Preview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Object.entries(treasureCategories).map(([category, { icon: Icon, label, color }]) => (
              <div
                key={category}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <Icon className="w-6 h-6 mb-2" style={{ color }} />
                <div className="text-sm font-medium text-gray-700 text-center">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {onAddTreasure && (
            <button
              onClick={onAddTreasure}
              className="inline-flex items-center gap-2 px-6 py-3 bg-heritage-coral text-white rounded-lg font-medium hover:bg-heritage-coral/90 transition-colors"
              style={{ minHeight: "44px" }}
            >
              <Plus className="w-5 h-5" />
              Add Your First Treasure
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sort treasures: favorites first, then maintain original order
  const sortedTreasures = useMemo(() => {
    return [...treasures].sort((a, b) => {
      // Favorites always come first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Within same favorite status, maintain original order
      return 0;
    });
  }, [treasures]);

  // Calculate favorites count for section headers
  const favoriteCount = sortedTreasures.filter(t => t.isFavorite).length;

  // Grid Layout - preserves array order while allowing variable heights
  return (
    <>
      <div className="treasure-grid">
        <style jsx>{`
          .treasure-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          @media (min-width: 768px) {
            .treasure-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1280px) {
            .treasure-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>

        {sortedTreasures.map((treasure, index) => (
          <React.Fragment key={treasure.id}>
            {/* Favorites Section Header */}
            {index === 0 && favoriteCount > 0 && (
              <div className="col-span-full mb-2 mt-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Favorites (auto-pinned) · {favoriteCount}
                </h3>
              </div>
            )}

            {/* All Treasures Section Header */}
            {index === favoriteCount && favoriteCount < sortedTreasures.length && (
              <div className="col-span-full mb-2 mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  All Treasures · {sortedTreasures.length - favoriteCount}
                </h3>
              </div>
            )}

            <div>
            <TreasureCard
              id={treasure.id}
            title={treasure.title}
            description={treasure.description}
            displayUrl={treasure.displayUrl}
            masterUrl={treasure.masterUrl}
            imageUrl={treasure.imageUrl}
            transform={treasure.transform}
            category={treasure.category}
            year={treasure.year}
            isFavorite={treasure.isFavorite}
            linkedStoryId={treasure.linkedStoryId}
            readOnly={readOnly}
            onToggleFavorite={() => onToggleFavorite?.(treasure.id)}
            onLinkToStory={() => onLinkToStory?.(treasure.id)}
            onCreateStory={() => onCreateStory?.(treasure.id)}
            onEdit={() => onEdit?.(treasure.id)}
            onDownload={() => onDownload?.(treasure.id)}
            onDelete={() => onDelete?.(treasure.id)}
            />
          </div>
          </React.Fragment>
        ))}
      </div>

      {/* Floating Add Button */}
      {onAddTreasure && (
        <div className="fixed bottom-24 right-6 z-40">
          <button
            onClick={onAddTreasure}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-heritage-coral text-white rounded-full font-semibold shadow-2xl hover:bg-heritage-coral/90 transition-all hover:scale-105 active:scale-95"
            style={{ minHeight: "56px", minWidth: "56px" }}
            aria-label="Add treasure"
          >
            <Plus className="w-6 h-6" />
            <span className="hidden sm:inline">Add Treasure</span>
          </button>
        </div>
      )}
    </>
  );
}
