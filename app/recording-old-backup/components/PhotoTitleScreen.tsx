"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { type PhotoTitleScreenProps } from "../types";
import "../recording.css";

/**
 * PhotoTitleScreen - Collect photo + title before recording
 * Matches heritage-whisper-recorder reference design exactly
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
    <div style={{ backgroundColor: "#F5F1ED", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" style={{ color: "#2C3E50" }} />
        </button>
        <div className="flex items-center gap-3">
          <img
            src="/final logo/logo hw.svg"
            alt="HW"
            className="w-12 h-12"
          />
          <div className="leading-tight">
            <h1 className="font-bold text-lg tracking-wide m-0" style={{ color: "#2C3E50", lineHeight: "1.2" }}>
              HERITAGE WHISPER
            </h1>
            <p className="text-sm m-0" style={{ color: "#6B7280", lineHeight: "1.3" }}>
              Start a new memory
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
          style={{ marginRight: "-20px" }}
          aria-label="Cancel"
        >
          <X className="w-5 h-5" style={{ color: "#2C3E50" }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-24" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 className="font-serif font-semibold text-3xl mb-2 hw-text-center" style={{ color: "#2C3E50" }}>
          Capture this memory
        </h2>

        <p className="text-lg mb-6 hw-text-center" style={{ color: "#6B7280" }}>
          Add a simple title and an optional photo to help you remember the details.
        </p>

        {/* Title Card */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <label className="block text-base font-semibold mb-3 hw-text-center" style={{ color: "#2C3E50" }}>
            Story title
          </label>
          <input
            type="text"
            value={draft.title || ""}
            onChange={handleTitleChange}
            placeholder="Grandma's first apartment"
            className="w-full px-4 py-3 rounded-xl text-base"
            style={{
              backgroundColor: "#F5F1ED",
              border: "none",
              color: "#2C3E50"
            }}
            maxLength={100}
            autoFocus
          />
          <p className="text-base mt-2 mb-0 hw-text-center" style={{ color: "#9CA3AF" }}>
            A simple title helps your family find this story later.
          </p>
          {titleError && (
            <p className="text-sm mt-2 hw-text-center" style={{ color: "#DC2626" }}>{titleError}</p>
          )}
        </div>

        {/* Photo Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-2 hw-text-center" style={{ color: "#2C3E50" }}>
            Add a photo (optional)
          </h3>
          <p className="text-base mb-3 hw-text-center" style={{ color: "#6B7280" }}>
            A photo can help you recall details while you talk.
          </p>

          {draft.photoUrl ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
              <img src={draft.photoUrl} alt="Selected" className="w-full h-full object-cover" />
              <button
                onClick={handlePhotoClick}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <span className="text-white font-medium">Edit photo</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handlePhotoClick}
              className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-12"
              style={{ borderColor: "#D1D5DB", backgroundColor: "#FAFAFA" }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#E5E7EB" }}>
                <Plus className="w-8 h-8" style={{ color: "#6B7280" }} />
              </div>
              <p className="text-base" style={{ color: "#6B7280" }}>
                Tap to choose a photo
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
          Save and continue later
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-base text-white"
          style={{ backgroundColor: "#2C3E50" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
