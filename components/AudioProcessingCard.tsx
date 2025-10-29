"use client";

import React from "react";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { CustomAudioPlayer } from "@/components/CustomAudioPlayer";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioProcessingStatus = "idle" | "uploading" | "enhancing" | "complete" | "error";

interface AudioProcessingCardProps {
  status: AudioProcessingStatus;
  audioUrl?: string | null;
  audioSource?: "auphonic" | "original";
  error?: string | null;
  className?: string;
}

export function AudioProcessingCard({
  status,
  audioUrl,
  audioSource,
  error,
  className,
}: AudioProcessingCardProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className={cn("mb-6 space-y-3", className)}>
      <h3 className="text-lg font-semibold text-[#4A3428] flex items-center gap-2">
        🎵 Audio Recording
      </h3>

      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Audio processing failed</p>
            <p className="text-sm text-red-700 mt-1">
              {error || "An error occurred while processing your audio."}
            </p>
          </div>
        </div>
      )}

      {status !== "complete" && status !== "error" && (
        <ProcessingStatus status={status} type="audio" />
      )}

      {status === "complete" && audioUrl && (
        <div className="space-y-2">
          {audioSource === "original" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Using original recording (enhancement unavailable)
              </p>
            </div>
          )}
          <div className="p-4 bg-white border border-[#E8DDD3] rounded-lg">
            <CustomAudioPlayer src={audioUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
