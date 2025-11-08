"use client";
import React from "react";
import { Camera, FileText, Gem, Home, ChefHat, Award, Plus } from "lucide-react";
import { TreasureCard } from "./TreasureCard";

export type TreasureCategory = "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";

type Treasure = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: TreasureCategory;
  year?: number;
  isFavorite: boolean;
  linkedStoryId?: string;
};

type Props = {
  treasures: Treasure[];
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

  // Masonry Grid Layout
  // Using CSS columns for masonry effect (simpler than complex JS solutions)
  return (
    <div
      className="treasure-masonry-grid"
      style={{
        columnCount: 2,
        columnGap: "16px",
      }}
    >
      <style jsx>{`
        .treasure-masonry-grid {
          column-count: 2;
        }

        @media (min-width: 768px) {
          .treasure-masonry-grid {
            column-count: 3;
          }
        }

        @media (min-width: 1024px) {
          .treasure-masonry-grid {
            column-count: 4;
          }
        }

        @media (min-width: 1536px) {
          .treasure-masonry-grid {
            column-count: 5;
          }
        }

        .treasure-masonry-grid > * {
          break-inside: avoid;
          margin-bottom: 16px;
        }
      `}</style>

      {treasures.map((treasure) => (
        <TreasureCard
          key={treasure.id}
          id={treasure.id}
          title={treasure.title}
          description={treasure.description}
          imageUrl={treasure.imageUrl}
          category={treasure.category}
          year={treasure.year}
          isFavorite={treasure.isFavorite}
          linkedStoryId={treasure.linkedStoryId}
          onToggleFavorite={() => onToggleFavorite?.(treasure.id)}
          onLinkToStory={() => onLinkToStory?.(treasure.id)}
          onCreateStory={() => onCreateStory?.(treasure.id)}
          onEdit={() => onEdit?.(treasure.id)}
          onDownload={() => onDownload?.(treasure.id)}
          onDelete={() => onDelete?.(treasure.id)}
        />
      ))}
    </div>
  );
}
