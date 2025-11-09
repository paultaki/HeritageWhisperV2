"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Camera, FileText, Gem, Home, ChefHat, Award, ZoomIn, ZoomOut } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
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
    transform?: { zoom: number; position: { x: number; y: number } };
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

  // Zoom/Pan state
  const [isEditing, setIsEditing] = useState(false);
  const [editTransform, setEditTransform] = useState({ zoom: 1, position: { x: 0, y: 0 } });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

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
      setIsEditing(true); // Enter editing mode after file selection
    };
    reader.readAsDataURL(file);
  };

  // Zoom/Pan handlers
  const handleZoomChange = (value: number[]) => {
    setEditTransform(prev => ({ ...prev, zoom: value[0] }));
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage || !imageRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const rect = imageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    // Calculate max offset based on zoom
    const maxPercent = (editTransform.zoom - 1) * 50;

    setEditTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDraggingImage(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingImage || !imageRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    const rect = imageRef.current.getBoundingClientRect();
    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    // Calculate max offset based on zoom
    const maxPercent = (editTransform.zoom - 1) * 50;

    setEditTransform(prev => ({
      ...prev,
      position: {
        x: Math.max(-maxPercent, Math.min(maxPercent, prev.position.x + percentX)),
        y: Math.max(-maxPercent, Math.min(maxPercent, prev.position.y + percentY))
      }
    }));

    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDraggingImage(false);
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
        transform: editTransform,
      });

      // Reset form
      setImageFile(null);
      setImagePreview("");
      setTitle("");
      setCategory("");
      setYear("");
      setDescription("");
      setIsEditing(false);
      setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
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
    setIsEditing(false);
    setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add to Treasure Chest</DialogTitle>
        </DialogHeader>

        {!isEditing ? (
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
            ) : null}

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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-heritage-coral focus:outline-none transition-colors resize-none"
              />
            </div>
          </form>
          </div>
        ) : (
          /* Photo editing screen with zoom/pan */
          <div className="space-y-6">
            {/* Header with instructions */}
            <div className="text-center">
              <p className="text-gray-700 text-base">
                Drag to reposition • Zoom slider to adjust size
              </p>
            </div>

            {/* 16:10 aspect ratio editing frame */}
            <div
              className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-gray-300"
              style={{ aspectRatio: '16/10' }}
            >
              <div
                ref={imageRef}
                className="absolute inset-0 touch-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  cursor: isDraggingImage ? 'grabbing' : 'grab',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={imagePreview}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                    transformOrigin: 'center center',
                  }}
                  alt="Editing"
                  draggable={false}
                />
              </div>
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-4">
              <ZoomOut className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <Slider.Root
                className="relative flex items-center select-none touch-none flex-1 h-5"
                value={[editTransform.zoom]}
                onValueChange={handleZoomChange}
                min={1}
                max={3}
                step={0.1}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                  <Slider.Range className="absolute bg-heritage-coral rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-6 h-6 bg-heritage-coral rounded-full hover:bg-heritage-coral/90 focus:outline-none focus:ring-2 focus:ring-heritage-coral shadow-md"
                  aria-label="Zoom"
                />
              </Slider.Root>
              <ZoomIn className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                  setIsEditing(false);
                  setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
                }}
                className="h-[50px] rounded-xl"
              >
                Choose Different Photo
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                className="h-[50px] rounded-xl bg-heritage-coral hover:bg-heritage-coral/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {!isEditing && (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
