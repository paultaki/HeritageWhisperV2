"use client";

import { useState, useRef } from "react";
import { Keyboard, MessageCircle, Heart, Plus } from "lucide-react";
import { type StartStoryScreenProps } from "../types";
import "../recording.css";

/**
 * StartStoryScreen - Entry point for recording flow V3
 * Consolidated photo upload into first screen
 */
export function StartStoryScreen({
  draft,
  onChange,
  onSelectMode,
  onCancel,
  promptText,
  familyFrom,
  familyRelationship
}: StartStoryScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Photo upload handlers
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
  };

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
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    onChange({
      ...draft,
      photoUrl: undefined,
      photoFile: undefined,
    });
  };

  return (
    <div className="hw-screen-wrapper" style={{ backgroundColor: "#F5F1ED" }}>
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
          onClick={onCancel}
          className="text-base font-medium transition-colors hover:opacity-70"
          style={{ color: "#6B7280", marginRight: "-125px" }}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 pb-6" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Prompt Reference - shown when coming from prompts page */}
        {promptText && (
          <div
            className="mb-6 p-4 rounded-xl border-2"
            style={{
              backgroundColor: familyFrom ? "#FFFDF7" : "#EBF4FF",
              borderColor: familyFrom ? "#CBA46A" : "#2C5282",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: familyFrom ? "#CBA46A" : "#2C5282" }}
              >
                {familyFrom ? (
                  <Heart className="w-5 h-5 text-white fill-current" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: familyFrom ? "#92400E" : "#2C5282" }}>
                  {familyFrom
                    ? `Question from ${familyFrom}${familyRelationship ? ` • ${familyRelationship}` : ''}`
                    : 'Your prompt'
                  }
                </p>
                <p className="text-lg font-semibold" style={{ color: "#1A202C" }}>
                  "{promptText}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Heading - Centered */}
        <h2
          className="font-serif font-semibold mb-6 text-center"
          style={{
            fontSize: "32px",
            lineHeight: "1.2",
            color: "#2C3E50"
          }}
        >
          Every memory matters.<br />Start with your voice.
        </h2>

        {/* Photo Upload Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2" style={{ color: "#2C3E50" }}>
            Add a photo
          </h3>

          {draft.photoUrl ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ aspectRatio: "4/3" }}>
                <img
                  src={draft.photoUrl}
                  alt="Selected photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePhotoClick}
                  className="flex-1 py-2.5 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#2C3E50" }}
                >
                  Change photo
                </button>
                <button
                  onClick={handleRemovePhoto}
                  className="flex-1 py-2.5 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: "white", border: "2px solid #E5E7EB", color: "#DC2626" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePhotoClick}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="w-full bg-white rounded-2xl py-8 px-5 active:scale-[0.98] transition-all shadow-sm border-2 border-dashed"
              style={{
                borderColor: isDragOver ? "#2C3E50" : "#D1D5DB",
                backgroundColor: isDragOver ? "#E8F4F8" : "#FFFFFF",
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors duration-200"
                  style={{ backgroundColor: isDragOver ? "#2C3E50" : "#E5E7EB" }}
                >
                  <Plus className="w-6 h-6 transition-colors duration-200" style={{ color: isDragOver ? "#FFFFFF" : "#6B7280" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
                  Optional
                </p>
                <p className="text-base mt-1" style={{ color: isDragOver ? "#2C3E50" : "#6B7280" }}>
                  {isDragOver ? "Drop your photo here" : "Tap to choose a photo"}
                </p>
              </div>
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

        {/* Start Recording Button */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => onSelectMode("audio")}
            className="w-full bg-white rounded-2xl py-4 px-5 active:scale-[0.98] transition-transform shadow-sm"
          >
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E8E8E8" }}>
                <img src="/mic-icon.svg" alt="" className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg" style={{ color: "#2C3E50" }}>
                Start recording
              </h3>
            </div>
            <p className="text-base text-center" style={{ color: "#6B7280", margin: 0, width: "100%", display: "block" }}>
              {draft.photoUrl ? "Tell the story of your photo" : "Start now. Add photos any time."}
            </p>
          </button>
        </div>

        {/* Text Mode - De-emphasized */}
        <div className="text-center">
          <button
            onClick={() => onSelectMode("text")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mx-auto"
          >
            <Keyboard className="w-5 h-5" style={{ color: "#6B7280" }} />
            <span className="text-base font-medium" style={{ color: "#2C3E50" }}>
              Prefer to type instead?
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
