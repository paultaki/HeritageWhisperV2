"use client";

import React from "react";
import { Camera, FileText, Gem, Home, ChefHat, Award, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TreasureCategory = "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";

const TREASURE_CATEGORIES = {
  photos: { icon: Camera, label: "Family Photos", color: "text-blue-500 bg-blue-50" },
  documents: { icon: FileText, label: "Documents", color: "text-gray-500 bg-gray-50" },
  heirlooms: { icon: Gem, label: "Heirlooms", color: "text-purple-500 bg-purple-50" },
  keepsakes: { icon: Home, label: "Keepsakes", color: "text-green-500 bg-green-50" },
  recipes: { icon: ChefHat, label: "Recipes", color: "text-orange-500 bg-orange-50" },
  memorabilia: { icon: Award, label: "Memorabilia", color: "text-yellow-500 bg-yellow-50" },
};

type TreasureViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  treasure: {
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
    category: TreasureCategory;
    year?: number;
    transform?: { zoom: number; position: { x: number; y: number } };
  };
};

/**
 * TreasureViewModal - View-only treasure display for family viewers
 *
 * Features:
 * - View full-size image with zoom/pan transform
 * - Display title, category, year, description
 * - No edit controls
 * - Simple close button
 */
export function TreasureViewModal({ isOpen, onClose, treasure }: TreasureViewModalProps) {
  const categoryInfo = TREASURE_CATEGORIES[treasure.category];
  const CategoryIcon = categoryInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{treasure.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Display - Full size with transform */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
            <img
              src={treasure.imageUrl}
              alt={treasure.title}
              className="w-full h-full object-cover"
              style={{
                transform: treasure.transform
                  ? `scale(${treasure.transform.zoom}) translate(${treasure.transform.position.x}%, ${treasure.transform.position.y}%)`
                  : undefined,
                transformOrigin: "center center",
              }}
            />
          </div>

          {/* Metadata Display */}
          <div className="space-y-4">
            {/* Category */}
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", categoryInfo.color)}>
                <CategoryIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-900">{categoryInfo.label}</p>
              </div>
            </div>

            {/* Year */}
            {treasure.year && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Year</p>
                <p className="font-medium text-gray-900">{treasure.year}</p>
              </div>
            )}

            {/* Description */}
            {treasure.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {treasure.description}
                </p>
              </div>
            )}

            {/* View-only notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                You're viewing this treasure in read-only mode.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
