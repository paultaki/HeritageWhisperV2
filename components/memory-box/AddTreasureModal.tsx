"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Camera, FileText, Gem, Home, ChefHat, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (treasure: {
    title: string;
    description?: string;
    category: TreasureCategory;
    year?: number;
    imageFile: File;
  }) => Promise<void>;
};

/**
 * AddTreasureModal - Upload flow for visual keepsakes
 *
 * Features:
 * - Drag & drop or click to upload
 * - Image preview
 * - Category selection with icons
 * - Optional year and description
 * - Save as draft or publish
 */
export function AddTreasureModal({ isOpen, onClose, onSave }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TreasureCategory | "">("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !title || !category) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        title,
        description: description || undefined,
        category: category as TreasureCategory,
        year: year ? parseInt(year) : undefined,
        imageFile,
      });

      // Reset form
      setImageFile(null);
      setImagePreview("");
      setTitle("");
      setCategory("");
      setYear("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to save treasure:", error);
      alert("Failed to save treasure. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    // Reset form
    setImageFile(null);
    setImagePreview("");
    setTitle("");
    setCategory("");
    setYear("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add to Treasure Chest</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Upload Area */}
          {!imagePreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-heritage-coral bg-heritage-coral/5"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop photos or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, WebP (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain bg-gray-100"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFile(null);
                  setImagePreview("");
                }}
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                aria-label="Remove image"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          {/* Quick Details Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Dad's War Medals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 text-lg font-medium border-2 border-gray-200 rounded-lg focus:border-heritage-coral focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(TREASURE_CATEGORIES).map(([key, { icon: Icon, label, color }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key as TreasureCategory)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                      category === key
                        ? "border-heritage-coral bg-heritage-coral/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year (optional)
              </label>
              <input
                id="year"
                type="number"
                placeholder="e.g., 1952"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="1800"
                max={currentYear}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-heritage-coral focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                placeholder="Add context, memories, or why this is special..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-heritage-coral focus:outline-none transition-colors resize-none"
              />
            </div>
          </form>
        </div>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!imageFile || !title || !category || isSubmitting}
            className="bg-heritage-coral hover:bg-heritage-coral/90"
          >
            {isSubmitting ? "Saving..." : "Save Treasure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
