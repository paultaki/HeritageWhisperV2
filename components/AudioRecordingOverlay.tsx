"use client";

import React, { useState, useCallback } from "react";
import { AudioRecordingScreen } from "@/app/recording/components/AudioRecordingScreen";
import { type StoryDraft } from "@/app/recording/types";
import { cn } from "@/lib/utils";

interface AudioRecordingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (
    audioBlob: Blob,
    duration: number,
    transcription?: string,
    lessonOptions?: {
      practical?: string;
      emotional?: string;
      character?: string;
    }
  ) => void;
  existingAudioUrl?: string;
}

/**
 * AudioRecordingOverlay - Modal wrapper for AudioRecordingScreen
 * Provides the same recording experience as /recording page in an overlay
 * 30-minute max duration, immediate transcription with loading animation
 */
export function AudioRecordingOverlay({
  isOpen,
  onClose,
  onContinue,
  existingAudioUrl,
}: AudioRecordingOverlayProps) {
  // Draft state for AudioRecordingScreen
  const [draft, setDraft] = useState<Partial<StoryDraft>>({
    title: "",
    recordingMode: "audio",
  });

  // Handle draft changes
  const handleDraftChange = useCallback((newDraft: Partial<StoryDraft>) => {
    setDraft((prev) => ({ ...prev, ...newDraft }));
  }, []);

  // Handle finish and extract data for parent
  const handleFinishAndReview = useCallback(
    (completedDraft: StoryDraft) => {
      if (completedDraft.audioBlob) {
        onContinue(
          completedDraft.audioBlob,
          completedDraft.durationSeconds || 0,
          completedDraft.transcription,
          completedDraft.lessonOptions
        );
      }
    },
    [onContinue]
  );

  // Handle cancel - just close the overlay
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Reset draft when overlay opens
  React.useEffect(() => {
    if (isOpen) {
      setDraft({
        title: "",
        recordingMode: "audio",
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Overlay Card */}
      <div className="fixed inset-x-4 md:inset-x-0 md:left-1/2 md:-translate-x-1/2 top-[5%] md:top-[8%] z-[70] md:mx-auto max-w-2xl">
        <div
          className={cn(
            "relative rounded-3xl border border-[#E8DDD3]",
            "bg-[#F5F1ED]",
            "shadow-2xl",
            "max-h-[90vh] overflow-y-auto",
            "overflow-hidden"
          )}
        >
          {/* Re-record indicator */}
          {existingAudioUrl && (
            <div className="absolute top-4 left-4 z-20 bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full font-medium">
              Re-recording
            </div>
          )}

          {/* AudioRecordingScreen in overlay mode */}
          <AudioRecordingScreen
            draft={draft}
            onChange={handleDraftChange}
            onBack={() => {}} // No back navigation in overlay
            onFinishAndReview={handleFinishAndReview}
            onSwitchToText={() => {}} // No text switch in overlay
            onCancel={handleCancel}
            isOverlayMode={true}
          />
        </div>
      </div>
    </>
  );
}

export default AudioRecordingOverlay;
