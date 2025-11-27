"use client";

import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Image as ImageIcon } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EditMemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  story: {
    id: string;
    title: string;
    storyYear?: number | null;
    transcription: string;
    photoUrl?: string;
    photoTransform?: { zoom: number; position: { x: number; y: number } };
    metadata?: {
      lessonsLearned?: string;
    };
  };
  onSave: (updates: {
    id: string;
    title: string;
    storyYear?: number | null;
    transcription: string;
    metadata?: { lessonsLearned?: string };
    photoTransform?: { zoom: number; position: { x: number; y: number } };
  }) => Promise<void>;
};

/**
 * EditMemoryModal - Edit story details with pan/zoom photo editing
 *
 * Features:
 * - Edit title, year, transcription, lessons learned
 * - Click photo to enter pan/zoom editor
 * - Mobile-first responsive design
 * - 4:3 aspect ratio photo display
 * - Preserves existing photo and audio
 *
 * Based on: AddTreasureModal pattern
 */
export function EditMemoryModal({ isOpen, onClose, story, onSave }: EditMemoryModalProps) {
  const [title, setTitle] = useState(story.title);
  const [year, setYear] = useState(story.storyYear?.toString() || "");
  const [transcription, setTranscription] = useState(story.transcription);
  const [lessonsLearned, setLessonsLearned] = useState(story.metadata?.lessonsLearned || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pan/Zoom editor state
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [editTransform, setEditTransform] = useState(
    story.photoTransform || { zoom: 1, position: { x: 0, y: 0 } }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  // Reset form when story changes
  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setYear(story.storyYear?.toString() || "");
      setTranscription(story.transcription);
      setLessonsLearned(story.metadata?.lessonsLearned || "");
      setEditTransform(story.photoTransform || { zoom: 1, position: { x: 0, y: 0 } });
    }
  }, [story]);

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
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        id: story.id,
        title: title.trim(),
        storyYear: year ? parseInt(year) : null,
        transcription: transcription.trim(),
        metadata: lessonsLearned.trim() ? { lessonsLearned: lessonsLearned.trim() } : undefined,
        photoTransform: editTransform,
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
          <DialogTitle className="text-2xl font-bold">Edit Memory</DialogTitle>
        </DialogHeader>

        {!isEditingPhoto ? (
          <div className="space-y-6">
            {/* Photo Display */}
            {story.photoUrl && (
              <div className="space-y-2">
                <Label>Photo</Label>
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-gray-300 cursor-pointer hover:border-heritage-coral transition-colors group"
                  onClick={() => setIsEditingPhoto(true)}
                >
                  <img
                    src={story.photoUrl}
                    alt={title}
                    className="w-full h-full"
                    style={{
                      transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                      transformOrigin: "center center",
                      objectFit: "contain",
                      objectPosition: "center center",
                    }}
                  />
                  {/* Overlay hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-medium">Click to adjust photo</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Click photo to zoom and reposition</p>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this memory a title"
                className="text-base"
                required
              />
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
                min="1900"
                max={currentYear}
                className="text-base"
              />
            </div>

            {/* Story Text */}
            <div className="space-y-2">
              <Label htmlFor="transcription">Story</Label>
              <Textarea
                id="transcription"
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="The full text of your story..."
                rows={8}
                className="text-base resize-none"
              />
            </div>

            {/* Lessons Learned */}
            <div className="space-y-2">
              <Label htmlFor="lessons">Lesson Learned (optional)</Label>
              <Textarea
                id="lessons"
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What wisdom or insight came from this experience?"
                rows={3}
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
              className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-heritage-coral bg-gray-100"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              {story.photoUrl && (
                <img
                  src={story.photoUrl}
                  alt={title}
                  className="w-full h-full select-none pointer-events-none"
                  style={{
                    transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                    transformOrigin: "center center",
                    objectFit: "contain",
                    objectPosition: "center center",
                  }}
                  draggable={false}
                />
              )}
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
