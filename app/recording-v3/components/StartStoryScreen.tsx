"use client";

import { Camera, Mic, Keyboard, X } from "lucide-react";
import { type StartStoryScreenProps } from "../types";
import "../recording-v3.css";

/**
 * StartStoryScreen - Entry point for recording flow V3
 * Offers 3 recording modes: Photo+Audio, Audio Only, or Text
 * Based on heritage-whisper-recorder reference implementation
 */
export function StartStoryScreen({ onSelectMode, onCancel }: StartStoryScreenProps) {
  return (
    <div className="hw-screen-wrapper">
      {/* Header */}
      <div className="hw-screen-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-hw-charcoal rounded-full flex items-center justify-center">
            <span className="text-white font-serif text-sm font-semibold">HW</span>
          </div>
          <h1 className="hw-heading-md">New Story</h1>
        </div>
        <button
          onClick={onCancel}
          className="hw-btn-icon hw-btn-ghost"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="hw-screen-content">
        <div className="hw-stack-lg">
          <div className="hw-text-center mb-4">
            <h2 className="hw-heading-lg mb-2">Share Your Story</h2>
            <p className="hw-body-base hw-text-muted">
              Choose how you'd like to capture this memory
            </p>
          </div>

          {/* Option 1: Photo + Audio (Primary) */}
          <button
            onClick={() => onSelectMode("photo_audio")}
            className="hw-card hw-card-interactive"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--hw-charcoal)" }}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="hw-heading-md mb-1">Record with Photo</h3>
                <p className="hw-body-sm">
                  Add a photo and tell the story behind it
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Audio Only */}
          <button
            onClick={() => onSelectMode("audio")}
            className="hw-card hw-card-interactive"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--hw-rose-gold)" }}
              >
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="hw-heading-md mb-1">Record without Photo</h3>
                <p className="hw-body-sm">
                  Jump right into recording your story
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: Text Mode */}
          <button
            onClick={() => onSelectMode("text")}
            className="hw-card hw-card-interactive"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--hw-forest-green)" }}
              >
                <Keyboard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="hw-heading-md mb-1">Write Your Story</h3>
                <p className="hw-body-sm">
                  Type your memory instead of recording
                </p>
              </div>
            </div>
          </button>

          {/* Helper Text */}
          <div className="mt-4 text-center">
            <p className="hw-body-sm hw-text-muted">
              You can pause and resume at any time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
