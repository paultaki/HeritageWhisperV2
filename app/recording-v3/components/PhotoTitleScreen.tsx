"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import { type PhotoTitleScreenProps } from "../types";
import "../recording-v3.css";

/**
 * PhotoTitleScreen - Collect photo + title before recording
 * Single photo MVP (multi-photo support planned for phase 2)
 * Based on heritage-whisper-recorder reference implementation
 */
export function PhotoTitleScreen({
  draft,
  onChange,
  onBack,
  onContinue,
}: PhotoTitleScreenProps) {
  const [titleError, setTitleError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    onChange({ ...draft, title });
    if (titleError && title.trim()) {
      setTitleError("");
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create blob URL for preview
    const photoUrl = URL.createObjectURL(file);
    onChange({
      ...draft,
      photoUrl,
      photoFile: file,
    });
  };

  const handleContinue = () => {
    if (!draft.title?.trim()) {
      setTitleError("Please enter a title for your story");
      return;
    }
    onContinue();
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="hw-screen-wrapper">
      {/* Header */}
      <div className="hw-screen-header">
        <button
          onClick={onBack}
          className="hw-btn-icon hw-btn-ghost"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-hw-charcoal rounded-full flex items-center justify-center">
            <span className="text-white font-serif text-sm font-semibold">HW</span>
          </div>
          <h1 className="hw-heading-md">Photo & Title</h1>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="hw-screen-content">
        <div className="hw-stack-lg">
          {/* Instructions */}
          <div className="hw-text-center">
            <p className="hw-body-base hw-text-muted">
              Give your story a title and add a photo to help you remember
            </p>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="story-title" className="hw-label">
              Story Title <span className="text-red-500">*</span>
            </label>
            <input
              id="story-title"
              type="text"
              value={draft.title || ""}
              onChange={handleTitleChange}
              placeholder="e.g., My first day of school"
              className="hw-input"
              maxLength={100}
              autoFocus
            />
            {titleError && (
              <p className="hw-text-error hw-body-sm mt-1">{titleError}</p>
            )}
            <p className="hw-body-sm hw-text-muted mt-1">
              {draft.title?.length || 0}/100 characters
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="hw-label">Photo (Optional)</label>

            {draft.photoUrl ? (
              // Photo Preview
              <div className="hw-photo-preview">
                <img src={draft.photoUrl} alt="Selected photo" />
                <div
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handlePhotoClick}
                >
                  <button className="hw-btn hw-btn-secondary bg-white">
                    <Camera className="w-5 h-5" />
                    Edit Photo
                  </button>
                </div>
              </div>
            ) : (
              // Photo Placeholder
              <div className="hw-photo-placeholder" onClick={handlePhotoClick}>
                <Upload className="w-12 h-12 hw-text-muted mb-2" />
                <p className="hw-body-base hw-text-muted">
                  Tap to add a photo
                </p>
                <p className="hw-body-sm hw-text-muted mt-1">
                  Or skip and add one later
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Helper Text */}
          <div className="hw-card">
            <p className="hw-body-sm hw-text-muted">
              💡 <strong>Tip:</strong> Photos help bring your stories to life. You
              can always add or change them later.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="hw-screen-footer">
        <button
          onClick={handleContinue}
          className="hw-btn hw-btn-primary hw-btn-lg w-full"
        >
          Continue to Recording
        </button>
      </div>
    </div>
  );
}
