"use client";

import React from "react";
import { Camera, FileText, Gem, Home, ChefHat, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TreasureCategory = "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";

const TREASURE_CATEGORIES = {
  photos: { icon: Camera, label: "Family Photos" },
  documents: { icon: FileText, label: "Documents" },
  heirlooms: { icon: Gem, label: "Heirlooms" },
  keepsakes: { icon: Home, label: "Keepsakes" },
  recipes: { icon: ChefHat, label: "Recipes" },
  memorabilia: { icon: Award, label: "Memorabilia" },
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{treasure.title}</h2>

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

          {/* Metadata Display - Clean inline format */}
          <div className="space-y-4">
            <div className="text-lg text-gray-800">
              <span className="font-medium">Category:</span> {categoryInfo.label}
              {treasure.year && (
                <>
                  <span className="mx-3 text-gray-400">•</span>
                  <span className="font-medium">Year:</span> {treasure.year}
                </>
              )}
            </div>

            {/* Description */}
            {treasure.description && (
              <div className="pt-2">
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {treasure.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={onClose}
            size="lg"
            className="w-full sm:w-auto min-w-[200px]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
