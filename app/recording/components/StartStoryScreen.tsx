"use client";

import { Camera, Mic, Keyboard, X, MessageCircle } from "lucide-react";
import { type StartStoryScreenProps } from "../types";
import "../recording.css";

/**
 * StartStoryScreen - Entry point for recording flow V3
 * Matches heritage-whisper-recorder reference design exactly
 */
export function StartStoryScreen({ onSelectMode, onCancel, promptText }: StartStoryScreenProps) {
  return (
    <div className="hw-screen-wrapper" style={{ backgroundColor: "#F5F1ED" }}>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
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
              Record a new memory
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
          style={{ marginRight: "-20px" }}
          aria-label="Cancel"
        >
          <X className="w-5 h-5" style={{ color: "#2C3E50" }} />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 pb-6" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Prompt Reference - shown when coming from prompts page */}
        {promptText && (
          <div
            className="mb-6 p-4 rounded-xl border-2"
            style={{
              backgroundColor: "#EBF4FF",
              borderColor: "#2C5282",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#2C5282" }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "#2C5282" }}>
                  Your prompt
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
          className="font-serif font-semibold mb-3 text-center"
          style={{
            fontSize: "32px",
            lineHeight: "1.2",
            color: "#2C3E50"
          }}
        >
          Every memory matters.<br />Start with your voice.
        </h2>

        <p className="text-lg mb-6 hw-text-center" style={{ color: "#6B7280", margin: "0 0 1.5rem 0", width: "100%" }}>
          Capture a story in your own words. Add photos now or later.
        </p>

        {/* Primary Options */}
        <div className="space-y-4 mb-8">
          {/* Record with photo */}
          <button
            onClick={() => onSelectMode("photo_audio")}
            className="w-full bg-white rounded-2xl py-4 px-5 active:scale-[0.98] transition-transform shadow-sm"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E8E8E8" }}>
                <Camera className="w-6 h-6" style={{ color: "#2C3E50" }} />
              </div>
              <h3 className="font-semibold text-lg flex-1 text-left" style={{ color: "#2C3E50" }}>
                Record with photo
              </h3>
            </div>
            <p className="text-base hw-text-center" style={{ color: "#6B7280", margin: 0, width: "100%", display: "block" }}>
              Choose a photo, then tell the story behind it.
            </p>
          </button>

          {/* Start recording (no photo) */}
          <button
            onClick={() => onSelectMode("audio")}
            className="w-full bg-white rounded-2xl py-4 px-5 active:scale-[0.98] transition-transform shadow-sm"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E8E8E8" }}>
                <Mic className="w-6 h-6" style={{ color: "#2C3E50" }} />
              </div>
              <h3 className="font-semibold text-lg flex-1 text-left" style={{ color: "#2C3E50" }}>
                Start recording (no photo)
              </h3>
            </div>
            <p className="text-base hw-text-center" style={{ color: "#6B7280", margin: 0, width: "100%", display: "block" }}>
              Record now, add photos anytime later.
            </p>
          </button>
        </div>

        {/* Text Mode - De-emphasized */}
        <div className="hw-text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            onClick={() => onSelectMode("text")}
            className="inline-flex items-center gap-2 px-4 py-2"
          >
            <Keyboard className="w-5 h-5" style={{ color: "#6B7280" }} />
            <span className="text-base font-medium" style={{ color: "#2C3E50" }}>
              Prefer to type instead?
            </span>
          </button>
          <p className="text-sm mt-1 hw-text-center" style={{ color: "#9CA3AF", margin: "0.25rem 0 0 0" }}>
            Audio is best, but you can always type if you prefer.
          </p>
        </div>
      </div>
    </div>
  );
}
