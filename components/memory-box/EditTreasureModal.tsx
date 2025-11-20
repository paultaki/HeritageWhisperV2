"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, FileText, Gem, Home, ChefHat, Award, ZoomIn, ZoomOut, Image as ImageIcon } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type EditTreasureModalProps = {
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
  onSave: (updates: {
    id: string;
    title: string;
    description?: string;
    category: TreasureCategory;
    year?: number;
    transform?: { zoom: number; position: { x: number; y: number } };
    imageFile?: File;
  }) => Promise<void>;
};

/**
 * EditTreasureModal - Edit treasure details with pan/zoom photo editing
 *
 * Features:
 * - Edit title, category, year, description
 * - Click photo to enter pan/zoom editor
 * - Mobile-first responsive design
 * - 16:10 aspect ratio photo display
 * - Preserves existing photo
 *
 * Based on: AddTreasureModal pattern
 */
export function EditTreasureModal({ isOpen, onClose, treasure, onSave }: EditTreasureModalProps) {
  const [title, setTitle] = useState(treasure.title);
  const [category, setCategory] = useState<TreasureCategory>(treasure.category);
  const [year, setYear] = useState(treasure.year?.toString() || "");
  const [description, setDescription] = useState(treasure.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pan/Zoom editor state
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [editTransform, setEditTransform] = useState(
    treasure.transform || { zoom: 1, position: { x: 0, y: 0 } }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // Photo replacement state
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();

  // Reset form when treasure changes
  useEffect(() => {
    if (treasure) {
      setTitle(treasure.title);
      setCategory(treasure.category);
      setYear(treasure.year?.toString() || "");
      setDescription(treasure.description || "");
      setEditTransform(treasure.transform || { zoom: 1, position: { x: 0, y: 0 } });
      setNewPhotoFile(null);
      setNewPhotoPreview(null);
    }
  }, [treasure]);

  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB");
      return;
    }

    setNewPhotoFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result as string);
      // Reset transform when new photo is selected
      setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
    };
    reader.readAsDataURL(file);
  };

  // Remove new photo
  const handleRemoveNewPhoto = () => {
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Zoom handlers
  const handleZoomChange = (value: number[]) => {
    setEditTransform(prev => ({ ...prev, zoom: value[0] }));
  };

  const handleZoomIn = () => {
    setEditTransform(prev => ({
      ...prev,
      zoom: Math.min(3, prev.zoom + 0.1)
    }));
  };

  const handleZoomOut = () => {
    setEditTransform(prev => ({
      ...prev,
      zoom: Math.max(1, prev.zoom - 0.1)
    }));
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditingPhoto) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

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
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditingPhoto) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !imageRef.current) return;

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
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category) {
      alert("Please enter a title and select a category");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        id: treasure.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        year: year ? parseInt(year) : undefined,
        transform: editTransform,
        imageFile: newPhotoFile || undefined,
      });

      onClose();
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsEditingPhoto(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Treasure</DialogTitle>
        </DialogHeader>

        {!isEditingPhoto ? (
          <div className="space-y-6">
            {/* Photo Display */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border-2 border-gray-300 cursor-pointer hover:border-heritage-coral transition-colors group"
                onClick={() => !newPhotoPreview && setIsEditingPhoto(true)}
              >
                <img
                  src={newPhotoPreview || treasure.imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                    transformOrigin: "center center",
                  }}
                />
                {/* Overlay hint */}
                {!newPhotoPreview && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-medium">Click to adjust photo</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Actions */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                  size="sm"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {newPhotoFile ? "Change Photo" : "Replace Photo"}
                </Button>
                {newPhotoFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveNewPhoto}
                    size="sm"
                  >
                    Cancel Replacement
                  </Button>
                )}
                {!newPhotoFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingPhoto(true)}
                    size="sm"
                  >
                    Adjust Position
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {newPhotoFile ? "New photo selected - will replace current photo when saved" : "Replace photo or click to zoom and reposition"}
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this treasure a title"
                className="text-base"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="year">Year (optional)</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 1975"
                min="1800"
                max={currentYear}
                className="text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, memories, or why this is special..."
                rows={4}
                className="text-base resize-none"
              />
            </div>
          </div>
        ) : (
          /* Pan/Zoom Editor */
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Adjust Photo</h3>
              <p className="text-sm text-gray-600 mb-4">Drag to reposition • Use slider to zoom</p>
            </div>

            {/* Photo Preview */}
            <div
              ref={imageRef}
              className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border-2 border-heritage-coral bg-gray-100"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <img
                src={newPhotoPreview || treasure.imageUrl}
                alt={title}
                className="w-full h-full object-cover select-none pointer-events-none"
                style={{
                  transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                  transformOrigin: "center center",
                }}
                draggable={false}
              />
            </div>

            {/* Zoom Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[editTransform.zoom]}
                    onValueChange={handleZoomChange}
                    max={3}
                    min={1}
                    step={0.1}
                  >
                    <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                      <Slider.Range className="absolute bg-heritage-coral rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-5 h-5 bg-white border-2 border-heritage-coral rounded-full hover:bg-heritage-coral/10 focus:outline-none focus:ring-2 focus:ring-heritage-coral"
                      aria-label="Zoom level"
                    />
                  </Slider.Root>
                </div>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center text-sm text-gray-600">
                Zoom: {editTransform.zoom.toFixed(1)}x
              </div>
            </div>

            {/* Done Button */}
            <Button
              onClick={() => setIsEditingPhoto(false)}
              className="w-full"
              size="lg"
            >
              Done Adjusting
            </Button>
          </div>
        )}

        {!isEditingPhoto && (
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
