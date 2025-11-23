"use client";

import { Camera, Mic, Keyboard, X } from "lucide-react";
import { type StartStoryScreenProps } from "../types";
import "../recording.css";

/**
 * StartStoryScreen - Entry point for recording flow V3
 * Matches heritage-whisper-recorder reference design exactly
 */
export function StartStoryScreen({ onSelectMode, onCancel }: StartStoryScreenProps) {
  return (
    <div className="hw-screen-wrapper bg-[#F7F2EC] flex flex-col min-h-screen">
      {/* Header - Clean Logo Only */}
      <div className="flex items-center justify-center pt-12 pb-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/final logo/logo-new.svg"
            alt="Heritage Whisper"
            className="h-16 w-auto"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-12 max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Main Heading */}
        <div className="mt-4 mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-[#203954] mb-4 leading-tight">
            Every memory matters.<br />
            <span className="text-[#3E6A5A]">Start with your voice.</span>
          </h2>
          <p className="text-lg text-[#4A4A4A] leading-relaxed mx-auto max-w-xs">
            Capture a story in your own words. You can always add photos or edit the text later.
          </p>
        </div>

        {/* Primary Options */}
        <div className="space-y-4 mb-8">
          {/* Record with photo */}
          <button
            onClick={() => onSelectMode("photo_audio")}
            className="w-full bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-[#EFE6DA] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#E0E5ED] flex items-center justify-center flex-shrink-0 group-hover:bg-[#D1D9E4] transition-colors">
                <Camera className="w-5 h-5 text-[#203954]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-[#203954] mb-0.5">
                  Record with photo
                </h3>
                <p className="text-sm text-[#6B7280] leading-tight">
                  Choose a photo first, then tell the story behind it.
                </p>
              </div>
            </div>
          </button>

          {/* Start recording (no photo) */}
          <button
            onClick={() => onSelectMode("audio")}
            className="w-full bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-[#EFE6DA] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#E0E5ED] flex items-center justify-center flex-shrink-0 group-hover:bg-[#D1D9E4] transition-colors">
                <Mic className="w-5 h-5 text-[#203954]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-[#203954] mb-0.5">
                  Start recording
                </h3>
                <p className="text-sm text-[#6B7280] leading-tight">
                  Just start talking. We'll transcribe it for you.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Text Mode */}
        <div className="text-center mb-12 flex justify-center">
          <button
            onClick={() => onSelectMode("text")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[#6B7280] hover:text-[#203954] hover:bg-[#EFE6DA]/50 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
            <span className="text-sm font-medium">
              Prefer to type instead?
            </span>
          </button>
        </div>

        {/* Cancel Button at Bottom */}
        <div className="mt-auto flex flex-col items-center justify-center pb-6">
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#D2C9BD] text-[#203954] shadow-sm hover:bg-gray-50 transition-colors mb-2"
            aria-label="Cancel"
          >
            <X className="w-6 h-6" />
          </button>
          <p className="text-xs text-[#8A8378] font-medium uppercase tracking-wider">Cancel</p>
        </div>
      </div>
    </div>
  );
}
