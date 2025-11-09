"use client";

import React, { useState } from "react";
import { Heart, MoreVertical, Link2, Mic, Edit3, Download, Trash2, Camera, FileText, Gem, Home, ChefHat, Award } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type TreasureCategory = "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";

const TREASURE_CATEGORIES = {
  photos: { icon: Camera, label: "Family Photos", color: "bg-blue-500" },
  documents: { icon: FileText, label: "Documents", color: "bg-gray-500" },
  heirlooms: { icon: Gem, label: "Heirlooms", color: "bg-purple-500" },
  keepsakes: { icon: Home, label: "Keepsakes", color: "bg-green-500" },
  recipes: { icon: ChefHat, label: "Recipes", color: "bg-orange-500" },
  memorabilia: { icon: Award, label: "Memorabilia", color: "bg-yellow-500" },
};

type Props = {
  id: string;
  title: string;
  description?: string;
  // NEW: Dual WebP URLs
  masterUrl?: string;
  displayUrl?: string;
  transform?: { zoom: number; position: { x: number; y: number } };
  // DEPRECATED (backward compatibility):
  imageUrl?: string;
  category: TreasureCategory;
  year?: number;
  isFavorite: boolean;
  linkedStoryId?: string;
  onToggleFavorite?: () => void;
  onLinkToStory?: () => void;
  onCreateStory?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
};

/**
 * TreasureCard - Photo-first card for visual keepsakes
 *
 * Design:
 * - 75% photo, 25% info section
 * - Category badge top-left, favorite button top-right
 * - Masonry-compatible (variable height based on image)
 * - Distinct from story cards (no audio)
 */
export function TreasureCard({
  id,
  title,
  description,
  masterUrl,
  displayUrl,
  transform,
  imageUrl,
  category,
  year,
  isFavorite,
  linkedStoryId,
  onToggleFavorite,
  onLinkToStory,
  onCreateStory,
  onEdit,
  onDownload,
  onDelete,
}: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const categoryConfig = TREASURE_CATEGORIES[category];
  const CategoryIcon = categoryConfig.icon;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavoriting) return;

    setIsFavoriting(true);
    onToggleFavorite?.();

    // Reset after animation
    setTimeout(() => setIsFavoriting(false), 600);
  };

  return (
    <article
      className="treasure-card group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer w-full"
      style={{ maxWidth: "480px" }}
      onClick={onEdit}
    >
      {/* Image Container - 75% of card height */}
      <div className="relative overflow-hidden" style={{ minHeight: "200px", aspectRatio: "16/10" }}>
        {!imageError ? (
          transform ? (
            // Use regular img with transform when zoom/pan is set
            <img
              src={displayUrl || imageUrl}
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              style={{
                transform: `scale(${transform.zoom}) translate(${transform.position.x}%, ${transform.position.y}%)`,
                transformOrigin: 'center center',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            // Use regular img without transform
            <img
              src={displayUrl || imageUrl}
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <CategoryIcon className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Skeleton loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {/* Category Badge - Top Left */}
        <div className="absolute top-2 left-2 z-10">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-white text-sm font-medium backdrop-blur-sm shadow-lg",
            categoryConfig.color
          )}>
            <CategoryIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{categoryConfig.label}</span>
          </div>
        </div>

        {/* Favorite Button - Top Right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all"
          style={{ minWidth: "44px", minHeight: "44px" }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-all",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600",
              isFavoriting && "animate-bounce"
            )}
          />
        </button>

        {/* Linked Story Indicator */}
        {linkedStoryId && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/75 backdrop-blur-sm text-white text-xs font-medium">
              <Link2 className="w-3 h-3" />
              <span>Linked to Story</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Info - 25% */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Title and metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-base text-gray-600">
              {categoryConfig.label}
              {year && <span className="text-gray-400"> • {year}</span>}
            </p>
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                style={{ minHeight: "44px", minWidth: "44px" }}
                aria-label="More actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Toggle Favorite */}
              {onToggleFavorite && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  className="cursor-pointer"
                >
                  <Heart
                    size={16}
                    className="mr-2"
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </DropdownMenuItem>
              )}

              {/* Link to Story */}
              {onLinkToStory && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onLinkToStory();
                  }}
                  className="cursor-pointer"
                >
                  <Link2 size={16} className="mr-2" />
                  {linkedStoryId ? "Change Linked Story" : "Link to Story"}
                </DropdownMenuItem>
              )}

              {/* Create Story About This */}
              {onCreateStory && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateStory();
                  }}
                  className="cursor-pointer"
                >
                  <Mic size={16} className="mr-2" />
                  Create Story About This
                </DropdownMenuItem>
              )}

              {/* Edit Details */}
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="cursor-pointer"
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit Details
                </DropdownMenuItem>
              )}

              {/* Download Photo */}
              {onDownload && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="cursor-pointer"
                >
                  <Download size={16} className="mr-2" />
                  Download Photo
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Delete */}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
