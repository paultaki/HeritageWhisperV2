"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, ZoomIn, ZoomOut, RefreshCw, Trash2 } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { type PhotoTitleScreenProps } from "../types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import "../recording.css";

/**
 * PhotoTitleScreen - Collect optional photo before recording
 * Title is collected later on the review screen
 */
export function PhotoTitleScreen({
  draft,
  onChange,
  onBack,
  onContinue,
  onCancel,
}: PhotoTitleScreenProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom/Pan state
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [editTransform, setEditTransform] = useState({ zoom: 1, position: { x: 0, y: 0 } });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // Image dimensions for portrait detection
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // Continue button highlight state (after user adds photo)
  const [showContinueHighlight, setShowContinueHighlight] = useState(false);
  const [continueHighlightDismissed, setContinueHighlightDismissed] = useState(false);

  // Dismiss highlight handler
  const dismissContinueHighlight = useCallback(() => {
    if (showContinueHighlight) {
      setShowContinueHighlight(false);
      setContinueHighlightDismissed(true);
    }
  }, [showContinueHighlight]);

  // Measure image dimensions when photo URL changes and save to draft
  useEffect(() => {
    if (draft.photoUrl) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        // Save dimensions to draft if not already set
        if (!draft.photoWidth || !draft.photoHeight) {
          onChange({
            ...draft,
            photoWidth: img.width,
            photoHeight: img.height,
          });
        }
      };
      img.src = draft.photoUrl;
    } else {
      setImageDimensions(null);
    }
  }, [draft.photoUrl]);

  // Show Continue highlight after photo is added and editing is done
  useEffect(() => {
    if (draft.photoUrl && !isEditingPhoto && !continueHighlightDismissed) {
      // Small delay to let user see the saved photo first
      const timer = setTimeout(() => setShowContinueHighlight(true), 500);
      return () => clearTimeout(timer);
    }
  }, [draft.photoUrl, isEditingPhoto, continueHighlightDismissed]);

  // Auto-dismiss highlight after 5 seconds
  useEffect(() => {
    if (!showContinueHighlight) return;
    const timer = setTimeout(() => {
      setShowContinueHighlight(false);
      setContinueHighlightDismissed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showContinueHighlight]);

  // Always use contain to show full image - blur fills any empty space
  // This works for both portrait AND wide landscape images

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB");
      return;
    }

    const photoUrl = URL.createObjectURL(file);
    onChange({
      ...draft,
      photoUrl,
      photoFile: file,
    });
    
    // Enter editing mode after photo selection
    setIsEditingPhoto(true);
    setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please drop an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB");
      return;
    }

    const photoUrl = URL.createObjectURL(file);
    onChange({
      ...draft,
      photoUrl,
      photoFile: file,
    });

    // Enter editing mode after photo drop
    setIsEditingPhoto(true);
    setEditTransform({ zoom: 1, position: { x: 0, y: 0 } });
  };

  const handleContinue = () => {
    onContinue();
  };

  const handlePhotoClick = () => {
    if (draft.photoUrl && !isEditingPhoto) {
      // Load existing transform or start fresh
      setEditTransform(draft.photoTransform || { zoom: 1, position: { x: 0, y: 0 } });
      setIsEditingPhoto(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Zoom/Pan handlers
  const handleZoomChange = (value: number[]) => {
    setEditTransform(prev => ({ ...prev, zoom: value[0] }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditingPhoto) return;
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditingPhoto) return;
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

  const handleSaveEdit = () => {
    onChange({
      ...draft,
      photoTransform: editTransform,
    });
    setIsEditingPhoto(false);
  };

  const handleCancelEdit = () => {
    setEditTransform(draft.photoTransform || { zoom: 1, position: { x: 0, y: 0 } });
    setIsEditingPhoto(false);
  };

  const handleRemovePhoto = () => {
    onChange({
      ...draft,
      photoUrl: undefined,
      photoFile: undefined,
      photoTransform: undefined,
      photoWidth: undefined,
      photoHeight: undefined,
    });
    setImageDimensions(null);
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ backgroundColor: "#F5F1ED", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <div className="flex items-center gap-3">
          <img
            src="/final logo/logo hw.svg"
            alt="Heritage Whisper"
            className="w-12 h-12"
          />
        </div>
        <button
          onClick={() => {
            setShowCancelConfirm(true);
          }}
          className="text-base font-medium transition-colors hover:opacity-70"
          style={{ color: "#6B7280", marginRight: "-125px" }}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-24" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 className="font-serif font-semibold text-3xl mb-6 hw-text-center" style={{ color: "#2C3E50" }}>
          Add a Photo
        </h2>

        {/* Photo Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm mb-3 hw-text-center" style={{ color: "#6B7280" }}>
            Optional - you can skip this step
          </p>

          {draft.photoUrl ? (
            isEditingPhoto ? (
              <div className="space-y-4">
                <div
                  ref={imageRef}
                  className="relative rounded-xl overflow-hidden cursor-move touch-none"
                  style={{ aspectRatio: "4/3", backgroundColor: "#faf8f5" }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Blurred background layer - fills empty space for portrait images */}
                  <img
                    src={draft.photoUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70 z-0 pointer-events-none"
                    draggable={false}
                  />
                  {/* Foreground image with zoom/pan */}
                  <img
                    src={draft.photoUrl}
                    alt="Selected"
                    className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
                    style={{
                      transform: `scale(${editTransform.zoom}) translate(${editTransform.position.x}%, ${editTransform.position.y}%)`,
                      transformOrigin: 'center center',
                      objectFit: 'contain',
                      objectPosition: 'center center'
                    }}
                    draggable={false}
                  />
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-3 px-2">
                  <ZoomOut className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                  <Slider.Root
                    className="relative flex items-center select-none touch-none flex-1 h-5"
                    value={[editTransform.zoom]}
                    onValueChange={handleZoomChange}
                    min={1}
                    max={3}
                    step={0.1}
                  >
                    <Slider.Track className="relative grow rounded-full h-1" style={{ backgroundColor: "#E5E7EB" }}>
                      <Slider.Range className="absolute rounded-full h-full" style={{ backgroundColor: "#2C3E50" }} />
                    </Slider.Track>
                    <Slider.Thumb 
                      className="block w-5 h-5 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: "#2C3E50", cursor: "grab" }}
                    />
                  </Slider.Root>
                  <ZoomIn className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} />
                </div>

                <p className="text-sm text-center" style={{ color: "#6B7280" }}>
                  Pinch or drag to adjust the photo
                </p>

                {/* Edit Controls */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 py-2 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-2 rounded-lg font-medium text-sm text-white"
                    style={{ backgroundColor: "#2C3E50" }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "#faf8f5" }}>
                  {/* Blurred background layer - fills empty space for portrait images */}
                  <img
                    src={draft.photoUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70 z-0"
                  />
                  {/* Foreground image with saved transform */}
                  <img
                    src={draft.photoUrl}
                    alt="Selected"
                    className="absolute inset-0 w-full h-full z-10"
                    style={{
                      transform: draft.photoTransform
                        ? `scale(${draft.photoTransform.zoom}) translate(${draft.photoTransform.position.x}%, ${draft.photoTransform.position.y}%)`
                        : undefined,
                      transformOrigin: 'center center',
                      objectFit: 'contain',
                      objectPosition: 'center center'
                    }}
                  />
                  <button
                    onClick={handlePhotoClick}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20"
                  >
                    <span className="text-white font-medium">Tap to edit</span>
                  </button>
                </div>
                {/* Photo Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePhoto}
                    className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Change photo
                  </button>
                  <button
                    onClick={handleRemovePhoto}
                    className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#DC2626" }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            )
          ) : (
            <button
              onClick={handlePhotoClick}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-12 transition-all duration-200"
              style={{
                borderColor: isDragOver ? "#2C3E50" : "#D1D5DB",
                backgroundColor: isDragOver ? "#E8F4F8" : "#FAFAFA",
                transform: isDragOver ? "scale(1.02)" : "scale(1)"
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors duration-200"
                style={{ backgroundColor: isDragOver ? "#2C3E50" : "#E5E7EB" }}
              >
                <Plus className="w-8 h-8 transition-colors duration-200" style={{ color: isDragOver ? "#FFFFFF" : "#6B7280" }} />
              </div>
              <p className="text-base" style={{ color: isDragOver ? "#2C3E50" : "#6B7280" }}>
                {isDragOver ? "Drop your photo here" : "Tap to choose a photo"}
              </p>
              <p className="text-sm mt-1 hidden md:block" style={{ color: "#9CA3AF" }}>
                or drag and drop an image
              </p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-between gap-3" style={{ borderColor: "#E5E7EB", maxWidth: "650px", margin: "0 auto", width: "100%" }}>
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-base"
          style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
        >
          Back
        </button>
        <button
          onClick={() => {
            dismissContinueHighlight();
            handleContinue();
          }}
          className={`flex-1 px-4 py-3 rounded-xl font-medium text-base text-white ${
            showContinueHighlight && !continueHighlightDismissed ? "gentle-field-highlight" : ""
          }`}
          style={{ backgroundColor: "#2C3E50" }}
        >
          Continue
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Recording?"
        message="Are you sure you want to cancel? Your progress will be lost."
        confirmText="Yes, Cancel"
        cancelText="Keep Going"
        onConfirm={() => {
          setShowCancelConfirm(false);
          onCancel();
        }}
        onCancel={() => setShowCancelConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
