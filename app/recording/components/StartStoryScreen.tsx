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
          <h1 className="font-bold text-lg tracking-wide m-0" style={{ color: "#2C3E50", lineHeight: "1.2" }}>
            HERITAGE WHISPER
          </h1>
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
          className="font-serif font-semibold mb-6 text-center"
          style={{
            fontSize: "32px",
            lineHeight: "1.2",
            color: "#2C3E50"
          }}
        >
          Every memory matters.<br />Start with your voice.
        </h2>

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
              Choose a photo, then tell its story.
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
                Start recording
              </h3>
            </div>
            <p className="text-base hw-text-center" style={{ color: "#6B7280", margin: 0, width: "100%", display: "block" }}>
              Start now. Add photos any time.
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
